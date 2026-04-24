---
name: xhs-article-slides
description: 将深度长文转化为适合小红书发布的 3:4 比例极简杂志风幻灯片 HTML，并自动集成到博客作品集中。
---

# 小红书版文章生成 Skill (xhs-article-slides)

此 Skill 用于将任何长篇文章内容转化为具备高度审美、适合小红书滑动的 3:4 比例 HTML 演示页面。

## 🛠️ 执行流程

### 1. 内容解析与摘要建议
- 读取输入（Markdown 文件、URL 或 文本）。
- 提取核心金句、段落逻辑和关键数据。

### 2. 3:4 切片规划 (Slide Breakdown)
- **强制约束**：将内容拆分为 5-9 个 3:4 比例的模块。
- **确认机制**：在执行代码前，必须列出每一张 Slide 的文字大纲供用户确认。

### 3. 提供视觉风格预设
- **方案 A (极简杂志风)**：使用 Playfair Display + Inter 字体，大面积留白，精致排版。
- **方案 B (科技代码风)**：使用 Monospace 字体，加入终端/Git 视觉元素，适合技术复盘。
- **方案 C (科幻深空风)**：使用 Orbitron + JetBrains Mono，星球 CSS 渐变背景，加入 HUD/扫描线等沉浸式元素。

### 4. 自动化部署与集成
- 在 `public/ai-design/` (或类似目录) 生成 `[title]-slides.html`。
- 在博客入口文件 `src/content/posts/AI设计实战博客.md` 的 `## 📱 小红书版文章输出` 标题下，自动追加如下格式的链接：
  ` - [🔍 主题名称]([超链接地址])`

## 🎨 审美标准 (方案 A: 极简杂志)
- **背景**：`#fcfbf7` (奶白)。
- **字体装饰**：使用 `.highlight-text` 类（淡棕色/金色半透明底纹）强调重点。
- **页码**：底部强制显示 `Slide X / Total` 及来源标识。

## 🪐 审美标准 (方案 C: 科幻深空)
- **配色**：背景 `#010103`，主色 `#00f3ff` (青蓝)，辅助色 `#7000ff` (极光紫)。
- **背景系统**：
    - 使用 CSS `radial-gradient` 模拟静态星球（Sun, Mars, Jupiter 等）。
    - 动态生成星星背景。
- **UI 装饰**：
    - **Corner Brackets**：四个角落的 L 型切边。
    - **Scanning Line**：周期性扫描线。
    - **Coordinates**：页面侧边显示 16 进制坐标或版本号。
- **字体**：`Orbitron` (Header), `JetBrains Mono` (Data), `Noto Serif SC` (Body)。

## ⚠️ 静态资源加载注意事项 (Best Practices)

为确保内嵌 HTML 在不同部署环境下（特别是 Vercel/GitHub Pages）通过子目录访问时样式不丢失，必须遵循：

### 1. 路径基准锁定 (强制)
在 HTML 的 `<head>` 顶部必须添加 `<base href>` 标签。
- **示例**：如果文件位于 `public/custom-slides/index.html`，则添加：
  ```html
  <base href="/custom-slides/">
  ```
- **目的**：防止用户由于访问 URL 缺少尾部斜杠（`/custom-slides` 而非 `/custom-slides/`）导致相对路径（如 `assets/style.css`）解析到错误的根目录。

### 2. 国内字体加载优化
禁止直接引用 `fonts.googleapis.com`，应统一使用国内镜像以提升访问速度。
- **替换方案**：将 `googleapis.com` 改为 `font.im`。
- **示例**：`@import url('https://fonts.font.im/css2?family=Inter:wght@400;700&display=swap');`

### 3. CSS 兜底显示
为防止 JavaScript 加载失败导致幻灯片初始化异常（全黑/全透明），在 `<head>` 中内联一段兜底 CSS：
```html
<style>
  /* 兜底：不依赖 JS 强制显示首张 active slide */
  .slide.is-active { opacity: 1 !important; visibility: visible !important; }
</style>
```

## 💡 使用示例
- "帮我把这篇文章转成小红书版本，内容切片要深度一些。"
- "按照 xhs-article-slides 流程，把最新的 AI 研究笔记做成幻灯片。"
