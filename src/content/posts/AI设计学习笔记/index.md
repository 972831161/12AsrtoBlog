---
title: AI 设计全攻略：从算法学习到实战输出
published: 2026-04-15
description: “从 0 到 0.8 的跃迁，比拼的是工程思维。” 一份硬核的 Stable Diffusion 学习笔记与小红书实战复盘手册。
image: "./sd_concept.webp"
tags: [AI 设计, Stable Diffusion, 工程思维, 小红书, LoRA]
category: AI 实战
draft: false
pinned: true
---

<div class="formula-container">
  <h2 id="core-formula" class="artistic-formula">
    <span class="seg human">既有经验</span>
    <span class="op plus">+</span>
    <span class="seg tech">AI</span>
    <span class="op equal">=</span>
    <span class="seg power">竞争力</span>
  </h2>
</div>

---

## 📐 板块一：Stable Diffusion & LoRA


### ☁️ 新时代的设计：从 0 到 0.8 的跃迁

现在做设计，已经不需要从 0 到 1 凡事亲力亲为了。0 到 0.8 的活儿 AI 都能帮你搞定，剩下的 0.2 才是设计师施展审美、精雕细琢的“胜负手”。这种变革省去了大量的重复劳动，设计的门槛也跟着降了下来。

甚至像我这样“学遥感”的门外汉，也能深度参与进来（虽说目前只是在帮导师做 PPT 和地理概念图）。那么，怎么才能驾驭好 AI？我觉得核心就两点：

1. **预期控制**：用指令和模型，让 AI 吐出来的画尽量贴合脑子里的构思。
2. **本地编辑**：给 AI 的“半成品”做精细化的后期处理。

![AI 设计概念图](./sd_concept.webp)

---

### 🖥️ 工具选择：Stable Diffusion 与它的生态

折腾一圈下来，我发现像 Gemini 这种在线工具虽然方便，但风格精准度很难把控。最后还是回到了更有生命力的本地生态：**Stable Diffusion (SD)**。

#### 什么是 Stable Diffusion？
简单说，它不是在画布上涂抹，而是在“数字噪声”中提取符合你描述的形状。相比 Midjourney 的封闭，SD 的魅力在于它完全开源的插件生态。

#### 秋叶 WebUI：设计师的操作台
命令行对非程序员来说还是太硬了。**秋叶 (Akiba) WebUI** 就像是给复杂的引擎装上了一个直观的仪表盘，采样方法、提示词权重、迭代步数，点点鼠标就能调。

---

### 🧪 实测：练一个属于自己的 LoRA 模型

为了让 AI 认出我桌上的东西，我决定练一个 **LoRA (Low-Rank Adaptation)** 模型。它就像是大模型的一个“轻量补丁”，能让模型瞬间学会某个特定的角色或画风。

- **克隆对象**：陪我办公的 **萨拉赫 (Mohamed Salah) 积木小人**。
- **数据集准备**：
    - **实物摄影**：为了让模型能“全方位无死角”地认出这个积木人，我用 iPhone 16 Pro 拍摄了约 **50 张** 涵盖俯视、侧视、仰视以及特写角度的实操图。
    - **逻辑关联**：在打标签（Captioning）时，触发词设为 `salah toy`。
    - **实测痛点**：因为积木本身的质感跟“真人”有次元差，如何平衡这种反差成了训练的关键。

![萨拉赫原始主角](./萨拉赫主角.webp)
![训练集准备过程](./训练集准备.webp)

### 🖼️ 实验进阶：多模型对比与“提示词博弈”

在有了 LoRA 这个“专属外挂”后，我尝试了不同底模和提示词组合，发现了一些非常有意思的逻辑细节：

#### 1. 默认模型 vs 高级模型
起初我直接用了 SD 1.5 的默认底核，出图质感中规中矩，只能算是“画得像”。随后我从 C 站下载了更高级的 **Realistic** 和 **JuggernautXL** 写实类模型进行实验。

<div class="comparison-grid">
  <div class="comparison-card">
    <div class="card-label">SD 1.5 默认底模 (中规中矩)</div>

![SD 1.5 默认输出](./萨拉赫_sd1.5_1.webp)

  </div>
  <div class="comparison-card">
    <div class="card-label">高级写实模型 (光影/质感飞跃)</div>

![Realistic 模型输出](./salah_realistic.webp)

  </div>
</div>

- **对比发现**：高级模型对光影映射（如金属积木的反光）处理得远比默认模型细腻，质感得到了飞跃式的提升。

#### 2. “幼年萨拉赫”之谜：提示词的权重博弈
在实验过程中出现了一个有趣的插曲：由于我在提示词里加入了 `toy`（为了触发我的 LoRA 特征），AI 居然固执地生成了一个“幼年版”萨拉赫，这大概是因为 AI 的逻辑里，“玩具”往往和“童年”是强关联的。

- **意外结局**：没设置反向提示词前，萨拉赫看起来只有 10 岁。
- **纠偏方案**：通过在 **Negative Prompt (反向提示词)** 明确排除 `child, kid, young` 后，终于得到了那个英气飒爽的利物浦核心。

<div class="comparison-grid">
  <div class="comparison-card">
    <div class="card-label">反向提示词设置前</div>

![反向提示词设置前](./salah_before_neg.webp)

  </div>
  <div class="comparison-card">
    <div class="card-label">设置后（锁定年龄段）</div>

![设置后效果](./salah_jugger_after_neg.webp)

  </div>
</div>

#### 3. 场景拓展与后期微调
我还尝试把萨拉赫丢到了各种离谱的场景里，比如漫天大雪的极地。同时，为了修正一些细节偏差（如积木边缘的毛刺），我配合使用了 **img2img (图生图)** 进行局部重绘。

<div class="comparison-grid">
  <div class="comparison-card">
    <div class="card-label">LoRA 权重触发测试</div>

![LoRA 触发效果](./salah_toy.webp)

  </div>
  <div class="comparison-card">
    <div class="card-label">img2img 局部重绘后期</div>

![图生图后期处理](./萨拉赫_img2img.webp)

  </div>
</div>

![极地雪景实验](./salah_jugger_snow.webp)

---

### 📊 总结复盘：数据和逻辑的博弈

我对比了动漫风 (JANKU) 和写实风 (JuggernautXL) 模型后发现：
- **风格覆盖**：只要加上 LoRA，动漫模型也能准确画出萨拉赫的脸。
- **结论**：大模型的通识能力极强，LoRA 的作用是**引导和具象化**，把特定的特征和通用概念结合起来。

![萨拉赫_二次元雪地实验](./salah_anime_snow.webp)

### 📝 阶段总结&&未来计划

前期训练集准备是至关重要的，决定了最后输出模型的基本质量。其中LoRA模型训练时的提示词一定要小心设置，尽量设计成没有实际意义的，比如说将提示词设计为salah，其大模型里很有可能已经学习了萨拉赫的有关先验知识，这就让LoRA模型的实际作用很难评估。未来我计划继续探索不同模型和参数的组合，尝试训练更多不同类型的LoRA模型，并探索如何将AI生成的内容与实际工作流更紧密地结合起来。设计出能应用于e-bike上的一套完整自动化工作流。


## 🚀 板块二：AI 文本排版

### 🔧 实战思考：AI Native 的工作流

这部分记录了我对 **AI Native** 的深度思考：别只把 AI 当成“高级搜索引擎”，要把它真正嵌入到工作流里。

#### 核心能力：最后拼的是工程思维
- **拆解问题**：给出系统化的处理方案，而不仅仅是问一句答一句。
- **闭环输出**：生成的目的是为了完成，而非仅仅是产生内容。

---

### 实战成果1：文章转幻灯片

为了让思考更直观，我手搓了一个 **Agent Skill: [xhs-article-slides](https://github.com/972831161/12AsrtoBlog/blob/main/.agents/skills/xhs-article-slides/SKILL.md)**。

它能自动拆解长文逻辑，生成 **3:4 比例的极简风幻灯片**（也可以选宇宙科幻风）。这种形式更适合移动端的沉浸式阅读，也更对 Z 世代碎片化阅读的胃口。以下是一些具体案例：

- <a href="/ai-design/index.html" data-astro-reload>🔧 最后拼的是工程思维</a>。 （内容来源：小红书博主 [不好惹的娃娃脸 Guxi](https://www.xiaohongshu.com/user/profile/5b2f04e511be105be812f722)）
- **项目：宇宙电动公众号内容“视频化”活化** （利用 [html-ppt-skill](https://github.com/lewislulu/html-ppt-skill) 实现的多风格一键转化。）
    - <a href="/universe-ebike-cyber-slides/index.html" data-astro-reload>🚀 宇宙电动：悬崖边的三年</a>。（科幻版）
    - <a href="/universe-ebike-full/index.html" data-astro-reload>📈 宇宙电动：品牌发展全史</a>。（全量版）
    - <a href="/universe-ebike-pitch/index.html" data-astro-reload>🎯 宇宙电动：VAPOR 产品路演</a>。（商务版）
    - <a href="/universe-ebike-xhs/index.html" data-astro-reload>📱 宇宙电动：小红书内容复用示例</a>。（适配移动端）

> [!NOTE]
> **关于 `html-ppt-skill` (by lewislulu)**：
> 这是我在项目中引入的一款非常硬核的开源工具，可以极大地提升内容转化的效率。
> - **基本功能**：支持将 Markdown 或 HTML 内容一键导出为具备高度交互性的幻灯片，内置多种专业皮肤。
> - **快捷操作**：通过键盘⬅️  ➡️播放页面，生成的页面支持 `Space / Enter` 下一页，`N` 键切换演讲者模式，以及 `F` 键全屏。

---

## 💼 板块三：工作任务

同步老程和昊禹哥布置的工作任务：

- [🔍 宇宙电动：舆情内容核查网站](/ebike-review/index.html)。 （逐条审查各平台账号内容、评论是否有潜在风险）
- [📊 宇宙电动：官方号内容升级建议](/universe-ebike/mission-archive.html)。 （评估老板个人账号内容是否有迁移到官号下的价值）

<style>
/* 导航栏完整显示：解决文字截断问题 */
table-of-contents a {
    height: auto !important;
    min-height: 2.25rem;
}

table-of-contents a div:last-child {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: unset !important;
    word-break: break-word !important;
    line-height: 1.4 !important;
    display: block !important;
}

#toc-wrapper, .toc-wrapper, #toc-container {
    overflow-x: visible !important;
}

/* Comparison Grid Styles */
.comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin: 2rem 0;
}

.comparison-card {
    background: rgba(var(--primary-rgb), 0.03);
    border: 1px solid rgba(var(--primary-rgb), 0.1);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.card-label {
    padding: 0.75rem;
    text-align: center;
    font-weight: 600;
    font-size: 0.9rem;
    background: rgba(var(--primary-rgb), 0.05);
    border-bottom: 1px solid rgba(var(--primary-rgb), 0.1);
}

.comparison-card img {
    width: 100% !important;
    height: auto !important;
    aspect-ratio: 1/1;
    object-fit: cover;
    margin: 0 !important;
    transition: transform 0.3s ease;
}

.comparison-card:hover img {
    transform: scale(1.02);
}

@media (max-width: 640px) {
    .comparison-grid {
        grid-template-columns: 1fr;
    }
}

.premium-accordion {
    border: 1px solid rgba(var(--primary-rgb), 0.2);
    border-radius: 12px;
    margin: 1.5rem 0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--card-bg);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.premium-accordion:hover {
    border-color: var(--primary);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.accordion-header {
    padding: 1rem 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(var(--primary-rgb), 0.03);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--primary);
    user-select: none;
    transition: background 0.2s ease;
    margin: 0 !important;
}

.accordion-header:hover {
    background: rgba(var(--primary-rgb), 0.08);
}

.accordion-header::before {
    content: "→";
    display: inline-block;
    transition: transform 0.3s ease;
    font-family: serif;
    font-size: 1.2rem;
}

.premium-accordion.is-open .accordion-header::before {
    transform: rotate(90deg);
}

.premium-accordion.is-open .accordion-header {
    border-bottom: 1px solid rgba(var(--primary-rgb), 0.1);
    background: rgba(var(--primary-rgb), 0.05);
}

.accordion-content {
    display: none;
    padding: 0 1.5rem 1.5rem 1.5rem;
}

.premium-accordion.is-open .accordion-content {
    display: block;
    animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Artistic Formula Styles */
.formula-container {
    padding: 3.5rem 0;
    margin: 1rem 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: radial-gradient(circle at center, rgba(var(--primary-rgb), 0.08) 0%, transparent 75%);
    border-radius: 24px;
}

.artistic-formula {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1.2;
}

.artistic-formula .seg {
    font-size: 2.6rem;
    font-weight: 900;
    letter-spacing: -0.04em;
    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));
}

.artistic-formula .human {
    color: var(--primary);
    position: relative;
}

.artistic-formula .tech {
    background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'JetBrains Mono', monospace;
    padding: 0 0.4rem;
}

.artistic-formula .power {
    background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    position: relative;
    text-shadow: 0 0 30px rgba(244, 114, 182, 0.2);
}

.artistic-formula .op {
    font-size: 2.4rem;
    font-weight: 100;
    margin: 0 0.5rem;
    font-family: "Inter", system-ui, -apple-system, sans-serif;
    color: var(--primary);
    opacity: 0.7;
    transition: all 0.4s ease;
    display: inline-block;
    vertical-align: middle;
}

.artistic-formula .plus {
    text-shadow: 0 0 20px rgba(var(--primary-rgb), 0.4);
}

.artistic-formula .equal {
    background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 300;
}

.artistic-formula .op:hover {
    opacity: 1;
    transform: scale(1.2);
    filter: brightness(1.2);
}

@media (max-width: 768px) {
    .artistic-formula .seg { font-size: 1.6rem; }
    .artistic-formula .op { font-size: 1.2rem; }
    .formula-container { padding: 2rem 0; }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', () => {
    // 1. 找到所有以 "板块" 开头的二级标题
    const headers = Array.from(document.querySelectorAll('h2')).filter(h => h.textContent.includes('板块'));
    
    headers.forEach(header => {
        // 创建折叠容器
        const accordion = document.createElement('div');
        accordion.className = 'premium-accordion';
        // 保留原标题的 ID，使得右侧跳转目录（TOC）对应的主节点不失效
        if (header.id) {
            accordion.id = header.id;
        }
        
        // 创建可点击的头部
        const accordionHeader = document.createElement('div');
        accordionHeader.className = 'accordion-header';
        accordionHeader.textContent = header.textContent;
        
        // 创建内容容器
        const accordionContent = document.createElement('div');
        accordionContent.className = 'accordion-content';
        
        // 收集跟在这个标题后面的所有内容，直到遇到下一个“板块”标题
        let currentElement = header.nextElementSibling;
        const elementsToMove = [];
        
        while (currentElement) {
            // 如果遇到下一个 H2 且包含“板块”字样，停止收集
            if (currentElement.tagName === 'H2' && currentElement.textContent.includes('板块')) {
                break;
            }
            // 如果遇到 style 或 script 标签，也停止收集（避免把脚本抽走）
            if (currentElement.tagName === 'STYLE' || currentElement.tagName === 'SCRIPT') {
                break;
            }
            elementsToMove.push(currentElement);
            currentElement = currentElement.nextElementSibling;
        }
        
        // 构建 DOM 结构
        header.parentNode.insertBefore(accordion, header);
        accordion.appendChild(accordionHeader);
        accordion.appendChild(accordionContent);
        
        // 默认打开所有板块
        accordion.classList.add('is-open');
        
        // 移除原始标题
        header.remove();
        
        // 将内容移入折叠容器
        elementsToMove.forEach(el => accordionContent.appendChild(el));
        
        // 添加点击事件
        accordionHeader.addEventListener('click', () => {
            accordion.classList.toggle('is-open');
        });
    });

    // 2. 强制侧边导航栏（TOC）在初始状态也保持可见
    const forceShowTOC = () => {
        document.querySelectorAll('#toc-wrapper, .toc-wrapper, #toc-container').forEach(el => {
            el.classList.remove('toc-hide');
            el.style.opacity = '1';
            el.style.visibility = 'visible';
        });
    };
    forceShowTOC();
    setTimeout(forceShowTOC, 500); // 确保在某些动态主题加载后再次执行

    // 3. 监听 TOC 导航点击，自动展开被折叠的面板 (保持原有逻辑兼容性)
    const checkAndExpandHash = () => {
        if (window.location.hash) {
            try {
                // 转义 hash 避免非法字符导致 querySelector 报错
                const targetId = decodeURIComponent(window.location.hash);
                const target = document.querySelector(targetId) || document.getElementById(targetId.substring(1));
                if (target) {
                    // 如果目标是大板块自身或者子级被包裹的内容
                    const accordion = target.closest('.premium-accordion') || (target.classList.contains('premium-accordion') ? target : null);
                    if (accordion && !accordion.classList.contains('is-open')) {
                        accordion.classList.add('is-open');
                    }
                    // 给予面板展开动画的缓冲时间后完成平滑滚动
                    setTimeout(() => {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            } catch (e) {
                console.warn("Invalid hash targeting: ", e);
            }
        }
    };
    
    // 初始化检查与挂载监听
    checkAndExpandHash();
    window.addEventListener('hashchange', checkAndExpandHash);
});
</script>
