import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const CONFIG_PATH = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"../src/config.ts",
);
const OUTPUT_FILE = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"../src/data/douban-data.json",
);

const IMAGE_PROXY = "https://images.weserv.nl/?url=";

async function getDoubanUidFromConfig() {
	try {
		const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
		const match = configContent.match(
			/douban:\s*\{[\s\S]*?uid:\s*["']([^"']+)["']/,
		);
		if (match && match[1]) {
			const uid = match[1];
			if (!uid || uid === "your-douban-id") {
				console.warn(
					"Warning: douban.uid in src/config.ts appears to be a default value.",
				);
			}
			return uid;
		}
		throw new Error("Could not find douban.uid in config.ts");
	} catch (error) {
		console.error("✘ Failed to read Douban UID from config.ts");
		throw error;
	}
}

async function getUseWebpFromConfig() {
	try {
		const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
		const match = configContent.match(/douban:\s*\{[\s\S]*?useWebp:\s*(true|false)/);
		return match ? match[1] === "true" : true;
	} catch {
		return true;
	}
}

async function getCoverMirrorFromConfig() {
	try {
		const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
		const match = configContent.match(/douban:\s*\{[\s\S]*?coverMirror:\s*["']([^"']*)["']/);
		return match ? match[1] : "";
	} catch {
		return "";
	}
}

async function getEnableImageRepairFromConfig() {
	try {
		const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
		const match = configContent.match(/douban:\s*\{[\s\S]*?enableImageRepair:\s*(true|false)/);
		return match ? match[1] === "true" : false;
	} catch {
		return false;
	}
}

async function getAnimeModeFromConfig() {
	try {
		const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
		const match = configContent.match(
			/anime:\s*\{[\s\S]*?mode:\s*["']([^"']+)["']/,
		);
		if (match && match[1]) {
			return match[1];
		}
		return "bangumi";
	} catch {
		return "bangumi";
	}
}

/**
 * 从 HTML 片段中提取第一个 img 标签的 src
 */
function extractImageUrl(html) {
	const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
	return match ? match[1] : "";
}

/**
 * 计算两个字符串的相似度 (Jaccard 相似度)
 */
function getStringSimilarity(str1, str2) {
	if (!str1 || !str2) return 0;
	// 归一化处理：去除所有非字母数字和非中文字符，并将所有形式的罗马数字统一
	const normalize = (s) => {
		let res = s.toLowerCase()
			.replace(/[\s\(\)（）:：-]/g, "");
		
		// 处理罗马数字 (包括 1-12 的特殊符号及组合)
		const romanMap = {
			'ⅻ': '12', 'ⅹⅰ': '11', 'ⅹ': '10', 'ⅸ': '9', 'ⅷ': '8', 'ⅶ': '7', 'ⅵ': '6', 'ⅴ': '5', 'ⅳ': '4', 'ⅲ': '3', 'ⅱ': '2', 'ⅰ': '1',
			'xii': '12', 'xi': '11', 'x': '10', 'ix': '9', 'viii': '8', 'vii': '7', 'vi': '6', 'v': '5', 'iv': '4', 'iii': '3', 'ii': '2', 'i': '1'
		};
		// 先替换长的，再替换短的
		for (const [rom, val] of Object.entries(romanMap)) {
			res = res.replace(new RegExp(rom, 'g'), val);
		}
		return res;
	};
	const s1 = normalize(str1);
	const s2 = normalize(str2);
	if (s1 === s2) return 1;

	const set1 = new Set(s1);
	const set2 = new Set(s2);
	const intersection = new Set([...set1].filter((x) => set2.has(x)));
	const union = new Set([...set1, ...set2]);
	return intersection.size / union.size;
}

/**
 * 从豆瓣剧集页面提取英文原名（用于提升 Bangumi 搜索精准度）
 */
async function getDoubanEnglishTitle(link) {
	try {
		const resp = await fetch(link, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; blog-sync/1.0)",
				"Accept-Language": "zh-CN,zh;q=0.9",
			},
			signal: AbortSignal.timeout(4000),
		});
		if (!resp.ok) return null;
		const html = await resp.text();
		
		// 增强匹配：提取括号内的非纯数字字符串（排除年份 (2024)）
		// 豆瓣标题通常是：中文名 (原名)
		const match = html.match(/<title>[^<]*\(([^0-9][^)]{1,100})\)[^<]*<\/title>/);
		if (match) {
			const original = match[1].trim();
			// 排除一些特定的无效原名（如“电影”）
			if (original !== "电影" && original !== "电视剧") {
				return original;
			}
		}

		// 备选方案：抓取页面中的 info 栏中的 "又名" 或 "原名" 
		const infoMatch = html.match(/<span class="pl">又名:<\/span>([^<]+)/);
		if (infoMatch) return infoMatch[1].trim().split("/")[0].trim();

		return null;
	} catch (e) {
		return null;
	}
}

/**
 * 尝试从 Bangumi 搜索并获取封面（作为修复源）
 * 修改为：搜索前 5 个结果，找出相似度最高的一个（解决搜索偏移问题）
 */
async function searchBangumiCover(queryTitle, referenceTitles = []) {
	if (!queryTitle) return null;
	try {
		// 每次搜索抓取前 5 个结果进行比对
		const searchUrl = `https://api.bgm.tv/search/subject/${encodeURIComponent(queryTitle)}?responseGroup=small&max_results=5`;
		const resp = await fetch(searchUrl, {
			headers: { "User-Agent": "Mozilla/5.0 (compatible; blog-sync/1.0)" },
			signal: AbortSignal.timeout(4000),
		});
		if (!resp.ok) return null;
		const data = await resp.json();
		
		if (data && data.list && data.list.length > 0) {
			let bestHit = null;
			let maxScore = 0;

			// 候选比对词：查询词本身，以及调用者传入的其他参考词（如译名/原名）
			const targetRefs = [queryTitle, ...referenceTitles].filter(Boolean);

			for (const item of data.list) {
				// 计算当前结果与所有参考标题的最大相似度
				const scores = targetRefs.flatMap(ref => [
					getStringSimilarity(ref, item.name),
					getStringSimilarity(ref, item.name_cn),
				]);
				const currentMax = Math.max(...scores);
				
				if (currentMax > maxScore) {
					maxScore = currentMax;
					bestHit = {
						cover: item.images?.large || item.images?.common || item.images?.medium || null,
						name: item.name,
						name_cn: item.name_cn,
						score: currentMax,
					};
				}
			}
			return bestHit;
		}
	} catch (e) {
		// 忽略单次搜索错误
	}
	return null;
}

/**
 * 尝试通过 Bing 图片搜索获取封面（作为全网搜索修复源）
 */
async function searchBingCover(title, typeLabel = "海报") {
	try {
		// 根据条目类型自动调整关键词：电影用“海报”，剧集用“剧集封面”
		const query = `${title} ${typeLabel} poster`;
		const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
		const resp = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
			},
		});
		if (!resp.ok) return null;
		const html = await resp.text();
		
		// 增强正则：尝试抓取更多结果并进行简单验证
		const matches = html.matchAll(/murl&quot;:&quot;(.*?)&quot;/g);
		if (matches) {
			const urls = Array.from(matches).map(m => m[1]);
			// 尝试前 3 个结果，确保图片链接有效且未失效
			for (let i = 0; i < Math.min(urls.length, 3); i++) {
				const imgUrl = urls[i];
				if (imgUrl.startsWith("http")) {
					try {
						// 简单校验链接是否连通
						const controller = new AbortController();
						const timeout = setTimeout(() => controller.abort(), 2000);
						const check = await fetch(imgUrl, { method: "HEAD", signal: controller.signal });
						clearTimeout(timeout);
						if (check.ok) return imgUrl;
					} catch (e) {
						continue;
					}
				}
			}
		}
		return null;
	} catch (e) {
		return null;
	}
}

/**
 * 解析豆瓣 RSS XML，提取 item 数组
 */
function parseRssItems(xmlText, useWebp = true, coverMirror = "") {
	const items = [];
	const itemRegex = /<item>([\s\S]*?)<\/item>/g;
	let itemMatch;

	while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
		const itemXml = itemMatch[1];

		const title = (itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
			itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim() || "";

		const link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1]?.trim() || "";

		const descRaw = (
			itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
			itemXml.match(/<description>([\s\S]*?)<\/description>/) || []
		)[1] || "";

		// 提取分类标签（可能有多个 <category>）
		const categories = [];
		const catRegex = /<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>|<category>([\s\S]*?)<\/category>/g;
		let catMatch;
		while ((catMatch = catRegex.exec(itemXml)) !== null) {
			categories.push((catMatch[1] || catMatch[2] || "").trim());
		}

		const pubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]?.trim() || "";

		// 从描述 HTML 中抽取封面 src，使用图片代理
		const rawImageUrl = extractImageUrl(descRaw);
		let cover = rawImageUrl || "/assets/anime/default.webp";

		if (rawImageUrl && coverMirror) {
			let processedUrl = rawImageUrl;
			// 对于 WordPress Jetpack 代理 (wp.com) 和 Staticaly，需要去掉协议部分
			if (coverMirror.includes("wp.com") || coverMirror.includes("staticaly.com")) {
				processedUrl = rawImageUrl.replace(/^https?:\/\//, "");
			} else if (coverMirror.includes("?url=")) {
				// 对于 Weserv 等使用 ?url= 参数的镜像，需要进行 URL 编码
				processedUrl = encodeURIComponent(rawImageUrl);
			}
			cover = `${coverMirror}${processedUrl}`;
		}

		if (rawImageUrl && useWebp) {
			// 如果用了镜像源且它支持 &output=webp (如 weserv.nl)
			if (coverMirror.includes("weserv.nl")) {
				cover += "&output=webp";
			} else if (!coverMirror) {
				// 如果没有镜像源，直接追加 ?webp 可能会破坏豆瓣直连，所以最好在 ImageWrapper 开启 no-referrer
			}
		}

		items.push({ title, link, description: descRaw, categories, pubDate, cover });
	}

	return items;
}

/**
 * 豆瓣 RSS 标题前缀 → status 映射
 */
const DOUBAN_STATUS_MAP = {
	看过: "completed",
	读过: "completed",
	想看: "planned",
	想读: "planned",
	在看: "watching",
	在读: "watching",
	搁置: "onhold",
	抛弃: "dropped",
};

/**
 * 从豆瓣 RSS 标题提取真实影片名和观看状态
 */
function parseDoubanTitle(rawTitle) {
	for (const [prefix, status] of Object.entries(DOUBAN_STATUS_MAP)) {
		if (rawTitle.startsWith(prefix)) {
			return { title: rawTitle.slice(prefix.length).trim(), status };
		}
	}
	return { title: rawTitle, status: "completed" };
}

/**
 * 判断是否为影视条目（跳过书籍和音乐）
 * 豆瓣 RSS 的条目链接/分类可区分类型
 */
function isValidDoubanItem(item) {
	const link = item.link.toLowerCase();
	const catStr = item.categories.join(" ").toLowerCase();
	
	// 允许电影、剧集和书籍
	if (link.includes("movie.douban.com") || link.includes("book.douban.com") || 
		catStr.includes("movie") || catStr.includes("tv") || catStr.includes("电影") || 
		catStr.includes("电视") || catStr.includes("剧") || catStr.includes("book") || catStr.includes("书")) {
		return true;
	}
	
	// 排除音乐记录
	if (link.includes("music.douban.com")) return false;
	
	return link.includes("subject.douban.com") || link.includes("/subject/");
}

/**
 * 从标题中提取评分（格式如 "推荐: 力荐" 或实际星号被转义，以描述中关键词匹配）
 */
function extractRating(item) {
	// 豆瓣 RSS 中不直接提供数字评分，只有"力荐/推荐/还行/较差/很差"等
	const ratingMap = {
		力荐: 5, 推荐: 4, 还行: 3, 较差: 2, 很差: 1,
	};
	for (const [key, val] of Object.entries(ratingMap)) {
		if (item.description.includes(key) || item.title.includes(key)) {
			return val;
		}
	}
	return 0;
}

/**
 * 从 pubDate 提取年份
 */
function extractYear(pubDate) {
	if (!pubDate) return "";
	const match = pubDate.match(/\d{4}/);
	return match ? match[0] : "";
}

/**
 * 从描述 HTML 中提取纯文本
 */
function stripHtml(html) {
	return html
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 200);
}

async function main() {
	// 缓存判定逻辑：如果离上次同步不足 24 小时，且没有 --force 参数，则跳过
	const FORCE_SYNC = process.argv.includes("--force");
	try {
		const stats = await fs.stat(OUTPUT_FILE);
		const lastModified = stats.mtimeMs;
		const now = Date.now();
		const hoursSinceUpdate = (now - lastModified) / (1000 * 60 * 60);

		if (!FORCE_SYNC && hoursSinceUpdate < 24) {
			console.log(`✓ Douban sync skipped (updated ${Math.round(hoursSinceUpdate)} hours ago). Use --force to sync anyway.`);
			return;
		}
	} catch (e) {
		// 文件不存在，继续执行同步
	}

	console.log("Initializing Douban data sync script...");

	const animeMode = await getAnimeModeFromConfig();
	if (animeMode !== "douban") {
		console.log(
			`Detected current anime mode is "${animeMode}", skipping Douban data sync.`,
		);
		return;
	}

	const uid = await getDoubanUidFromConfig();
	console.log(`Read Douban UID: ${uid}`);

	const rssUrl = `https://www.douban.com/feed/people/${uid}/interests`;
	console.log(`Fetching RSS: ${rssUrl}`);

	let xmlText;
	try {
		const resp = await fetch(rssUrl, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; blog-sync/1.0)",
			},
		});
		if (!resp.ok) {
			throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
		}
		xmlText = await resp.text();
	} catch (err) {
		console.error("✘ Failed to fetch Douban RSS:", err.message);
		process.exit(1);
	}

	const useWebp = await getUseWebpFromConfig();
	const coverMirror = await getCoverMirrorFromConfig();
	const enableRepair = await getEnableImageRepairFromConfig();
	console.log(`Use WebP: ${useWebp}`);
	console.log(`Cover Mirror: ${coverMirror}`);
	console.log(`Enable Image Repair: ${enableRepair}`);

	const items = parseRssItems(xmlText, useWebp, coverMirror);
	console.log(`Parsed ${items.length} items from RSS`);

	// 提前读取现有数据用于去重和性能检测
	let existingData = [];
	try {
		const existing = await fs.readFile(OUTPUT_FILE, "utf-8");
		existingData = JSON.parse(existing);
	} catch (e) {}
	const existingByLink = new Map(existingData.map((item) => [item.link, item]));

	// 过滤保留有效条目 (影视/书籍)
	const validItems = items.filter(isValidDoubanItem);
	console.log(`After filtering valid items: ${validItems.length} items`);

	const result = [];
	for (const item of validItems) {
		const { title, status } = parseDoubanTitle(item.title);
		let finalCover = item.cover;

		// 检查该条目是否已经存在于本地库中，且是否已经修复过封面
		const existingItem = existingByLink.get(item.link);
		const alreadyRepaired =
			existingItem &&
			existingItem.cover &&
			(existingItem.cover.includes("weserv.nl") ||
				existingItem.cover.includes("bgm.tv"));

		if (enableRepair && !alreadyRepaired) {
			const searchTitle = title.replace(/\s*第一季\s*$/, "").trim() || title;
			process.stdout.write(`   Repairing cover for "${title}"... `);

			const englishTitle = await getDoubanEnglishTitle(item.link);
			let repairedCover = null;

			// --- 阶梯式探测 ---

			// 第一阶梯：Bangumi (原名/英文名优先)
			if (englishTitle) {
				const res = await searchBangumiCover(englishTitle, [searchTitle, title]);
				if (res && res.score >= 0.9) {
					console.log(`Found on Bangumi! (English Match: ${res.score.toFixed(2)})`);
					repairedCover = res.cover;
				} else if (res) {
					process.stdout.write(`[Bgm Original match low: ${res.score.toFixed(2)} vs "${res.name_cn || res.name}"] `);
				}
			}

			// 第二阶梯：Bangumi (译名/中文名)
			if (!repairedCover) {
				const res = await searchBangumiCover(searchTitle, [englishTitle, title]);
				if (res && res.score >= 0.9) {
					console.log(`Found on Bangumi! (Chinese Match: ${res.score.toFixed(2)})`);
					repairedCover = res.cover;
				} else if (res) {
					process.stdout.write(`[Bgm Chinese match low: ${res.score.toFixed(2)} vs "${res.name_cn || res.name}"] `);
				}
			}

			// 附加策略：如果关键词带有数字/罗马数字，尝试搜索前缀名（解决 Bangumi 搜索排序问题）
			if (!repairedCover && (title.match(/[0-9ⅢⅡⅠ]/) || searchTitle !== title)) {
				const baseName = title.split(/\s+/)[0]; // 提取第一个词
				if (baseName && baseName !== title) {
					const res = await searchBangumiCover(baseName, [englishTitle, searchTitle, title]);
					if (res && res.score >= 0.85) { // 前缀匹配稍微放宽一点
						console.log(`Found on Bangumi! (Base-Name Match: ${res.score.toFixed(2)} via "${res.name_cn || res.name}")`);
						repairedCover = res.cover;
					}
				}
			}

			// 第三阶梯：Bing 全网搜索
			if (!repairedCover) {
				const isBook = item.link.includes("book.douban.com") || item.categories.join(" ").includes("书");
				const typeLabel = isBook ? "图书封面" : 
								((item.categories.join(" ").includes("电影") || item.link.includes("movie.douban.com")) ? "电影海报" : "剧集封面");
				process.stdout.write(`Trying Bing (${searchTitle} ${typeLabel})... `);
				repairedCover = await searchBingCover(searchTitle, typeLabel);
				if (repairedCover) {
					// 额外检查：如果是微信读书等容易出问题的源，则回退到豆瓣原始封面代理
					if (repairedCover.includes("myqcloud.com") || repairedCover.includes("qhimg.com") || repairedCover.includes("baidu.com")) {
						console.log("Avoided unreliable source, falling back to Douban proxy.");
						repairedCover = null;
					} else {
						console.log("Found on Bing Images (fallback)!");
					}
				} else {
					console.log("Not found.");
				}
			}
			
			if (repairedCover) {
				finalCover = repairedCover;
				
				// 核心改进：如果开启了使用 WebP，利用 Weserv 代理将外部图源(Bing/Bangumi)转成 WebP
				if (useWebp && finalCover.startsWith("http")) {
					// 仅对非豆瓣域名（即修复后的图源）应用代理转换
					if (!finalCover.includes("doubanio.com")) {
						finalCover = `https://images.weserv.nl/?url=${encodeURIComponent(finalCover)}&output=webp`;
					}
				}

				// 如果有镜像源配置，则应用镜像源
				if (coverMirror && !finalCover.includes("weserv.nl")) {
					let processedUrl = finalCover;
					if (coverMirror.includes("wp.com") || coverMirror.includes("staticaly.com")) {
						processedUrl = finalCover.replace(/^https?:\/\//, "");
					} else if (coverMirror.includes("?url=")) {
						processedUrl = encodeURIComponent(finalCover);
					}
					finalCover = `${coverMirror}${processedUrl}`;
				}
			} else {
				// 修复失败或被跳过，使用 Douban 原始封面通过 Weserv 代理（确保 WebP 及稳定性）
				const originalCover = extractImageUrl(item.description);
				finalCover = `https://images.weserv.nl/?url=${encodeURIComponent(originalCover)}&output=webp`;
				console.log("Using Douban original via proxy.");
			}
			// 避免请求太快
			await new Promise(r => setTimeout(r, 600));
		} else if (alreadyRepaired) {
			finalCover = existingItem.cover;
		}

		result.push({
			title,
			status,
			rating: extractRating(item),
			cover: finalCover,
			description: stripHtml(item.description),
			episodes: "0 episodes",
			year: extractYear(item.pubDate),
			genre: item.link.includes("book.douban.com") ? ["书籍"] : item.categories.slice(0, 3).filter(c => c !== "电影" && c !== "剧集"),
			link: item.link,
			progress: 0,
			totalEpisodes: 0,
			startDate: item.pubDate || "",
			endDate: item.pubDate || "",
		});
	}


	// === 合并模式：将新数据与现有数据合并（保留完整历史记录）===
	for (const newItem of result) {
		// 新条目覆盖旧条目（更新封面等字段），或插入全新条目
		existingByLink.set(newItem.link, newItem);
	}

	// 按照 startDate 降序排列（最新的排最前面）
	const merged = Array.from(existingByLink.values()).sort((a, b) => {
		const dateA = new Date(a.startDate || 0).getTime();
		const dateB = new Date(b.startDate || 0).getTime();
		return dateB - dateA;
	});

	// 写入输出文件
	const dir = path.dirname(OUTPUT_FILE);
	try {
		await fs.access(dir);
	} catch {
		await fs.mkdir(dir, { recursive: true });
	}

	await fs.writeFile(OUTPUT_FILE, JSON.stringify(merged, null, 2));
	console.log(`\n✓ Sync complete! Data saved to: ${OUTPUT_FILE}`);
	console.log(`Total records: ${merged.length} (${result.length} new/updated from RSS)`);
}

main().catch((err) => {
	console.error("\n✘ Script execution error:");
	console.error(err);
	process.exit(1);
});
