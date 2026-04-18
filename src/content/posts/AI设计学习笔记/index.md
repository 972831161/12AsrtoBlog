---
title: AI 设计全攻略：从算法学习到实战输出
published: 2026-04-15
description: “从 0 到 0.8 的跃迁，最后比拼的是工程思维。”——这是一份涵盖 Stable Diffusion 学习笔记与小红书实战复盘的综合指南。
image: "./sd_concept.webp"
tags: [AI 设计, Stable Diffusion, 工程思维, 小红书, LoRA]
category: AI 实战
draft: false
pinned: true
---

## 🧭 导读

在 AI 时代，设计不再仅仅是像素的堆砌，而是“预期控制”与“工程思维”的交织。为了方便阅读，我将内容拆解为**学习笔记**与**实战输出**两个板块，点击下方标题即可展开查看详情。

---

# 📐 板块一：Stable Diffusion & LoRA


## ☁️ 新时代的设计：从 0 到 0.8 的跃迁

新时代的设计早已不再需要设计师们 from 0 to 1 亲力亲为。AI 已经能够胜任 0 到 0.8 的搭建环节，剩下的部分则需要设计师根据需求、遵循审美原则去精雕细琢。这种变革不仅节省了大量的基础重复劳动，也极大地降低了设计的行业门槛。  

甚至像我这样“学遥感”的门外汉，也能深度参与到设计环节中（虽然目前主要是无偿为导师制作各种 PPT 和地理概念图）。那么，如何驾驭 AI 做好设计？我将其拆解为两个核心环节：

1. **预期控制**：如何通过指令和模型，让 AI 生成最接近脑中构思的画面？
2. **本地编辑**：如何将 AI 的半成品进行精细的后期处理与再创作？

![AI 设计概念图](./sd_concept.webp)

---

## 🛠️ 深度核心：Stable Diffusion 与它的生态

在探索过程中，我发现像 Gemini 这种在线工具虽然方便，但上下文长度瓶颈使其难以实现精准风格把控。于是，我转向了更具生命力的本地生态：**Stable Diffusion (SD)**。

### 什么是 Stable Diffusion？
Stable Diffusion 是一种基于**潜空间扩散 (Latent Diffusion)** 技术的文本生成图像模型。简单来说，它不是在画布上涂抹，而是在“数字噪声”中提取符合你描述的形状。相比 Midjourney 的封闭性，SD 的魅力在于其完全开源的插件化生态。

### 秋叶 WebUI：设计师的操作台
对于非程序员来说，命令行可能是一道高墙。而 **秋叶 (Akiba) WebUI** 就像是给这台复杂的引擎安装了一个精美的仪表盘。通过它，我们可以轻松调节采样方法、提示词权重以及迭代步数。

---

## 🧪 实践：训练一个属于自己的 LoRA 模型

为了让 AI 认识我手边的物品，我决定训练一个 **LoRA (Low-Rank Adaptation)** 模型。LoRA 就像是大模型的一个“轻量化补丁”，能让模型瞬间学会某个特定的角色或画风。

- **克隆对象**：陪伴我的 **萨拉赫 (Mohamed Salah) 积木小人**。
- **数据集**：准备了约 50 张 iPhone 16 Pro 拍摄的不同角度实拍图，触发词 `salah toy`。

![萨拉赫原始主角](./萨拉赫主角.webp)
![训练集准备过程](./训练集准备.webp)

---

## 🎶 插曲：Img2Img 的逼真“还愿”

在中途尝试 **img2img (图生图)** 工具时，其还原度让我目瞪口呆。它能基于我粗糙的摄影底图，保留构图的同时将其彻底重绘为电影级光影。

![图生图惊艳效果](./萨拉赫_img2img.webp)

---

## 📊 实验与复盘：逻辑的胜利还是数据的冗余？

我对比了二次元向 (JANKU) 与写实向 (JuggernautXL) 模型，发现：
- **风格覆盖**：开启 LoRA 并在二次元模型中输入 `salah toy` 时，AI 成功地给模型换上了一个动漫版的萨拉赫面孔。
- **实验结论**：大模型本身具备极强的通识能力，LoRA 更多是起到**引导和具象化**的作用，将“萨拉赫”的特征与“积木人”结合。

![萨拉赫二次元效果](./萨拉赫_二次元.webp)

## 📝 阶段总结

这次学习让我意识到，AI 设计的终点不是取代设计师，而是要求设计师从“画匠”变身为“导演”。YNWA!

# 🚀 板块二：AI文本排版



## 🚀 AI 设计实战

这篇博文记录了我关于 **AI Native** 核心能力的深度思考：在 AI 时代，我们不要仅仅把 AI 当作“搜索引擎”，而应该将其视为“工作流”的一部分。

### 🔧 核心能力：最后比拼的是工程思维
- **定义问题/拆解问题**：给出系统化解决方案。
- **闭环输出**：不仅是生成，而是完成。

---

## 📱 小红书版文章输出

为了更好呈现思考，我开发了 **Agent Skill: [xhs-article-slides](https://github.com/972831161/12AsrtoBlog/blob/main/.agents/skills/xhs-article-slides/SKILL.md)**。

这个 Skill 可以自动将长文逻辑拆解并转化为符合 **3:4 比例的极简风格幻灯片**，且可以选择极简风格或者是宇宙科幻风。这种方式既适合移动端沉浸式阅读，也契合 Z 世代的碎片化阅读偏好。


- [🔧 最后比拼的是工程思维](/ai-design/index.html). (极简风；内容来自小红书博主 [不好惹的娃娃脸 Guxi](https://www.xiaohongshu.com/user/profile/5b2f04e511be105be812f722?xsec_token=YBpI79WtRsIs_Hhvh7dWpn6N9NEG6Nvqk7OrYLgBXCWkU=&xsec_source=app_share&xhsshare=CopyLink&shareRedId=ODY5NTdJOT82NzUyOTgwNjY0OTc4Nj5A&apptime=1776260779&share_id=2ac5c7b4c32f4680abe6575fa25b0823))
- **项目：宇宙电动内容资产活化** (利用 [html-ppt-skill](https://github.com/lewislulu/html-ppt-skill) 实现的多风格一键转化案例)
    - [🚀 宇宙电动：悬崖边的三年](/universe-ebike-cyber-slides/index.html). (科幻极简风)
    - [📈 宇宙电动：品牌发展全史](/universe-ebike-full/index.html). (全量沉浸风)
    - [🎯 宇宙电动：VAPOR 产品路演](/universe-ebike-pitch/index.html). (商务路演风)
    - [📱 宇宙电动：小红书内容复用示例](/universe-ebike-xhs/index.html). (移动端适配)
- [📊 宇宙电动：官方号内容升级建议](/universe-ebike/mission-archive.html). (集成方案；包含 66 条记录的全量资产审计与 12 条黄金资产重构手册)


---

> **YNWA!** 信仰与科技的碰撞，让设计的边界变得模糊。

<style>
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
        
        // 收集跟在这个标题后面的所有内容，直到遇到下一个 h2 标题或 hr 分隔线
        let currentElement = header.nextElementSibling;
        const elementsToMove = [];
        
        while (currentElement && currentElement.tagName !== 'H2' && currentElement.tagName !== 'HR') {
            elementsToMove.push(currentElement);
            currentElement = currentElement.nextElementSibling;
        }
        
        // 构建 DOM 结构
        header.parentNode.insertBefore(accordion, header);
        accordion.appendChild(accordionHeader);
        accordion.appendChild(accordionContent);
        
        // 将内容移入折叠容器
        elementsToMove.forEach(el => accordionContent.appendChild(el));
        
        // 移除原始标题
        header.remove();
        
        // 添加点击事件
        accordionHeader.addEventListener('click', () => {
            accordion.classList.toggle('is-open');
        });
    });

    // 2. 监听 TOC 导航点击，自动展开被折叠的面板
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
