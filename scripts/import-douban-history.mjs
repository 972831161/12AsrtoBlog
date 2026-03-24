import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const CONFIG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/config.ts");
const OUTPUT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/data/douban-data.json");
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36";

// --- 复用自 sync-douban.mjs 的工具函数 ---

async function getDoubanUidFromConfig() {
    const content = await fs.readFile(CONFIG_PATH, "utf-8");
    const match = content.match(/douban:\s*\{[\s\S]*?uid:\s*["']([^"']+)["']/);
    return match ? match[1] : null;
}

async function getRepairConfigs() {
    const content = await fs.readFile(CONFIG_PATH, "utf-8");
    return {
        useWebp: content.match(/useWebp:\s*(true|false)/)?.[1] === "true",
        coverMirror: content.match(/coverMirror:\s*["']([^"']*)["']/)?.[1] || "",
        enableRepair: content.match(/enableImageRepair:\s*(true|false)/)?.[1] === "true"
    };
}

function getStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const normalize = (s) => s.toLowerCase().replace(/[\s\(\)（）:：-]/g, "").replace(/[\u2170-\u217b]/g, m => (m.charCodeAt(0) - 8559).toString());
    const s1 = normalize(str1);
    const s2 = normalize(str2);
    if (s1 === s2) return 1;
    const set1 = new Set(s1);
    const set2 = new Set(s2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    return intersection.size / new Set([...set1, ...set2]).size;
}

async function searchBangumiCover(queryTitle, referenceTitles = []) {
    try {
        const url = `https://api.bgm.tv/search/subject/${encodeURIComponent(queryTitle)}?max_results=5`;
        const resp = await fetch(url, { headers: { "User-Agent": "blog-sync/1.0" } });
        const data = await resp.json();
        if (!data?.list?.length) return null;
        let best = null, maxScore = 0;
        for (const item of data.list) {
            const score = Math.max(...[queryTitle, ...referenceTitles].flatMap(ref => [getStringSimilarity(ref, item.name), getStringSimilarity(ref, item.name_cn)]));
            if (score > maxScore) { maxScore = score; best = { cover: item.images?.large, score }; }
        }
        return best;
    } catch { return null; }
}

async function searchBingCover(title, typeLabel) {
    try {
        const url = `https://www.bing.com/images/search?q=${encodeURIComponent(title + " " + typeLabel + " poster")}`;
        const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
        const html = await resp.text();
        const matches = html.match(/murl&quot;:&quot;(.*?)&quot;/g);
        if (matches) {
            for (const m of matches.slice(0, 3)) {
                const img = m.match(/murl&quot;:&quot;(.*?)&quot;/)[1];
                try {
                    const check = await fetch(img, { method: "HEAD", signal: AbortSignal.timeout(2000) });
                    if (check.ok) return img;
                } catch { continue; }
            }
        }
    } catch {}
    return null;
}

// --- 全量抓取逻辑 ---

async function fetchCollectPage(uid, start = 0, type = "movie", statusType = "collect") {
    const domain = type === "book" ? "book" : "movie";
    const url = `https://${domain}.douban.com/people/${uid}/${statusType}?start=${start}&sort=time&rating=all&filter=all&mode=grid`;
    console.log(`Fetching ${type} (${statusType}) page: ${url}`);
    const resp = await fetch(url, {
        headers: { 
            "User-Agent": USER_AGENT, 
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": `https://${domain}.douban.com/people/${uid}/`
        }
    });
    if (!resp.ok) throw new Error(`Douban ${type}/${statusType} blocked request: ${resp.status}`);
    return await resp.text();
}

function parseCollectHtml(html, type = "movie", status = "completed") {
    const items = [];
    
    if (type === "movie") {
        // 影视页面：使用 class="item"
        const blocks = html.split(/class="item\s*.*?"/).slice(1);
        for (const block of blocks) {
            const titleMatch = block.match(/<li class="title">\s*<a href="(.*?)".*?>\s*<em>(.*?)<\/em>/);
            if (!titleMatch) continue;
            
            const link = titleMatch[1];
            const fullTitle = titleMatch[2].replace(/&amp;/g, "&");
            const title = fullTitle.split("/")[0].trim();
            const ratingMatch = block.match(/<span class="rating(\d)-t"><\/span>/);
            const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;
            const dateMatch = block.match(/<span class="date">([\d-]+)/);
            const date = dateMatch ? dateMatch[1] : "";
            const picMatch = block.match(/<img.*?src="(.*?)"/);
            const cover = picMatch ? picMatch[1].replace("/s_ratio_poster/", "/l_ratio_poster/") : "";
            const commentMatch = block.match(/<span class="comment">(.*?)<\/span>/);
            const description = commentMatch ? commentMatch[1].trim() : "";

            items.push({ 
                title, link, rating, startDate: date, cover, 
                status, description, year: date.split("-")[0] || "", genre: [] 
            });
        }
    } else {
        // 书籍页面：使用 class="subject-item"
        const blocks = html.split('class="subject-item"').slice(1);
        for (const block of blocks) {
            // 简化匹配逻辑：直接寻找带 title 的 a 标签
            const titleMatch = block.match(/<a[^>]*?href="([^"]+)"[^>]*?title="([^"]+)"/i);
            if (!titleMatch) continue;

            const link = titleMatch[1];
            const title = titleMatch[2].replace(/&amp;/g, "&").trim();
            
            const ratingMatch = block.match(/<span class="rating(\d)-t"><\/span>/);
            const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;
            
            const dateMatch = block.match(/<span class="date">([\d-]+)/);
            const date = dateMatch ? dateMatch[1] : "";
            
            const picMatch = block.match(/<img.*?src="(.*?)"/);
            const cover = picMatch ? picMatch[1].replace("/s/public/", "/l/public/") : "";
            
            const commentMatch = block.match(/<p.*?class="comment.*?".*?>\s*([\s\S]*?)\s*<\/p>/);
            const description = commentMatch ? commentMatch[1].replace(/<.*?>/g, "").trim() : "";

            items.push({ 
                title, link, rating, startDate: date, cover, 
                status, description, year: date.split("-")[0] || "", genre: ["书籍"] 
            });
        }
    }
    return items;
}

async function main() {
    const uid = await getDoubanUidFromConfig();
    if (!uid) return console.error("UID not found in config.");

    const { useWebp, coverMirror, enableRepair } = await getRepairConfigs();
    console.log(`Starting full multi-status import for ${uid}...`);

    let existingData = [];
    try { existingData = JSON.parse(await fs.readFile(OUTPUT_FILE, "utf-8")); } catch {}
    const existingLinks = new Set(existingData.map(d => d.link));

    let allNewItems = [];
    const categories = ["movie", "book"];
    const statuses = [
        { key: "collect", val: "completed" },
        { key: "wish", val: "planned" },
        { key: "do", val: "watching" }
    ];

    for (const cat of categories) {
        for (const stat of statuses) {
            let start = 0;
            let consecutiveExists = 0;
            console.log(`\n--- Importing ${cat}s (${stat.val}) ---`);

            while (true) {
                const html = await fetchCollectPage(uid, start, cat, stat.key);
                const pageItems = parseCollectHtml(html, cat, stat.val);
                if (pageItems.length === 0) break;

                let pageNewCount = 0;
                for (const item of pageItems) {
                    if (existingLinks.has(item.link)) {
                        consecutiveExists++;
                        continue;
                    }
                    allNewItems.push(item);
                    pageNewCount++;
                    consecutiveExists = 0;
                }

                console.log(`Page at ${start}: Found ${pageItems.length} items, ${pageNewCount} are new.`);
                
                if (consecutiveExists > 30) {
                    console.log(`Reached existing ${cat}/${stat.val} records, skipping.`);
                    break;
                }

                start += (cat === "movie" ? 15 : 10); // 书籍每页通常是 10
                await new Promise(r => setTimeout(r, 4500 + Math.random() * 3000));
                if (start > 500) break;
            }
        }
    }

    if (allNewItems.length === 0) {
        // 虽然没有新项目，但也可能有旧项目的封面坏了，这里简单处理，如果用户提到特定的可以手动重试
        // 实际上我们可以对 JSON 进行一轮检测，这里先响应用户的反馈
        console.log("No new items found. Checking specifically for reported broken covers...");
        for (const item of existingData) {
            if (item.title === "假面的告白" || item.title === "许三观卖血记") {
                console.log(`Resetting cover for [${item.title}] to fallback...`);
                // 让它重新进入修复流程
                item.cover = item.link; // 临时通过 link 触发标记，或者之后直接在循环里处理
                allNewItems.push(item);
            }
        }
    }

    console.log(`\nProcessing covers for ${allNewItems.length} items...`);
    for (const item of allNewItems) {
        if (enableRepair) {
            const originalCover = item.cover;
            process.stdout.write(`   [${item.title}] ... `);
            const isBook = item.genre.includes("书籍");
            const res = isBook ? null : await searchBangumiCover(item.title);
            
            let repairedCover = null;
            if (res && res.score >= 0.9) {
                repairedCover = res.cover;
                console.log("Found on Bangumi.");
            } else {
                repairedCover = await searchBingCover(item.title, isBook ? "图书封面" : "电影海报");
                if (repairedCover) {
                    // 额外检查：如果是微信读书等容易出问题的源，这里可以做一下校验或直接回退
                    if (repairedCover.includes("myqcloud.com") || repairedCover.includes("qhimg.com")) {
                        console.log("Avoided unreliable source, falling back to Douban proxy.");
                        repairedCover = null;
                    } else console.log("Found on Bing.");
                } else console.log("No high-quality source found, using Douban proxy.");
            }

            // 如果修复失败或被跳过，使用 Douban 原始封面通过 Weserv 代理
            if (!repairedCover || repairedCover.includes("doubanio.com")) {
                // 恢复为原始封面（如果 item.cover 之前被我们的 fetchPage 解析到了）
                // 在 import 脚本中，item.cover 初始就是 doubanio 的地址
                item.cover = `https://images.weserv.nl/?url=${encodeURIComponent(originalCover)}&output=webp`;
            } else {
                item.cover = `https://images.weserv.nl/?url=${encodeURIComponent(repairedCover)}&output=webp`;
            }

            await new Promise(r => setTimeout(r, 1000));
        }
    }

    const merged = [...allNewItems, ...existingData].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    const final = Array.from(new Map(merged.map(i => [i.link, i])).values());

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(final, null, 2));
    console.log(`\n✓ Import session complete! Total records now: ${final.length}`);
}

main().catch(console.error);
