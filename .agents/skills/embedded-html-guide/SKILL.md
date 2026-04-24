---
name: embedded-html-guide
description: 博客独立 HTML 页面开发规范，解决子目录路径偏移、国内字体加载、JS 失败黑屏等生产环境常见病。
---

# 博客独立 HTML 页面开发规范 (embedded-html-guide)

此 Skill 是一套用于在 Astro/Vercel 博客中快速开发并部署独立子页面（如 PPT 幻灯片、实验室项目）的**强制性**技术标准。

## 🛡️ 核心三大准则

### 1. 路径基准锁定 (Base Identity)
**场景**：当通过 `/project-name`（无斜杠）访问时，浏览器会错误地解析 assets 路径。
**规范**：必须在 `<head>` 设置 `<base>` 标签，其值必须与部署的子目录名一致。

```html
<head>
  <meta charset="UTF-8">
  <!-- 必须是第一个子元素 -->
  <base href="/your-folder-name/"> 
  ...
</head>
```

### 2. 网络资源避坑 (Network Resilience)
**场景**：Google Fonts, CDNJS 在国内不稳定，直接导致 CSS 阻塞或渲染失败。
**规范**：
- **字体镜像**：将 `fonts.googleapis.com` 替换为 `fonts.font.im`。
- **CDN 备选**：优先使用 `unpkg.zhimg.com` 或内联关键逻辑。

```html
<!-- 规范示例 -->
<link rel="stylesheet" href="https://fonts.font.im/css2?family=Inter&display=swap">
```

### 3. 无 JS 渲染透明度 (Zero-JS Fallback)
**场景**：页面高度依赖 JS 初始化（如 `opacity: 0` 开始），若 JS 延迟或报错，用户会看到白屏。
**规范**：通过内联 CSS 强制显示初始状态。

```html
<style>
  /* 兜底：不依赖 JS 尝试显示初始状态 */
  .slide.is-active, .page-ready {
    opacity: 1;
    visibility: visible;
  }
</style>
```

## 🛠️ 执行流程检查表
- [ ] HTML 文件名是否为 `index.html`（方便 URL 访问）。
- [ ] 是否添加了正确的 `base href`。
- [ ] 是否检查并替换了所有 Google 字体链接。
- [ ] 关键样式（首屏显示相关）是否具备不依赖 JS 的 `!important` 覆盖。

## 💡 应用指令
- "参考 embedded-html-guide 规范，帮我优化这个子目录下的 index.html。"
- "按照内嵌 HTML 开发规范，生成一个科技风的项目展示页。"
