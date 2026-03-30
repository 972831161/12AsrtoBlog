---
title: 宇宙 Planet Between · 极客骑行小程序设计
published: 2026-03-29
description: 基于 Uni-app + Vue3 构建的 E-Bike 智慧骑行app，包含仪表盘、AR彩蛋、社区路书。
tags: [Uni-app, 极客体验, AR, 智慧骑行]
category: 项目
draft: false
pinned: true
---

## 🚴 宇宙骑行数字化体验 (App MVP)

当我在app市场里搜索“骑行app”，给我的结果大都像是“黑鸟单车”、“际刻骑行”（设计很好看）这种大一号的Keep软件，提供一般的骑行记录功能，并没有和品牌牢牢绑定。一些品牌推出了自己的专属app比如捷安特，虽然功能十分丰富，但是设计比较传统，没有体现出电助力自行车的科技感和未来感，信息也比较冗余。正好宇宙ebike目前并没有推出自己的app，既然是**e**-bike，有自己专属的app能提升用户吸引力，也是胜出其他品牌的一大亮点。  
于是基于我的想法，借助Gemini开发了这套 **Planet Between（宇宙骑行）** 数字化解决方案。

> **核心设计理念**：Cyber-Noir 赛博黑、霓虹蓝、玻璃拟态 UI。

### 1. ⚡️ VAPOR 全息仪表盘与控制中枢
采用定制化“全息幻彩（Hologram）”滤镜特效，概念单车在暗色主题下呈现极具未来感的发光轮廓。支持 **START RIDING** 状态切换，精准掌控电机状态、电池续航、速度与骑行时长，极致简化数字灵魂交互。

![VAPOR 仪表盘](/images/planet-app/dashboard.webp)

### 2. 🗺️ 行星路书与骑会社区
告别生硬的传统骑行。在**探索**模块沉浸于沿途风光的骑行社区；在**路书**模块，全新纵向大图布局提供直观的数据与文字指引，支持离线下载，覆盖“玄武湖”、“秦淮河”及“紫金山越野”等多层级路线。

![社区与路书](/images/planet-app/community.webp)

### 3. 🛸 宇宙雷达与 AR 战术引导
不仅是寻宝，更是导航：
- **实时战术 HUD**：选中目标后，雷达会展示动态导航光标，并在中控台展示目标距离。
- **空间锚定引擎**：启动极客级别的 AR 探测，通过解算三轴姿态在物理世界捕捉虚拟“能量舱”、跨时空“留言气泡”以及 360° “全景影集”。

![战术雷达与 AR](/images/planet-app/radar_nav.webp)

### 4. 📊 硬核行程数据与个人中心
行程记录卡告别千篇一律的风景图，取而代之的是硬核高科技感的 **GPS 轨迹回放图**（Hologram 科技感风格）。在全新模块化的个人中心，你可以浏览“我的车库”爱车状态，或细致观赏拟态玻璃风格的“成就勋章”。

![硬核行程记录](/images/planet-app/ride_record.webp)

---

## 🕹️ 立即体验互动原型

我已将该应用编译为 **H5 网页版**（推荐使用手机浏览器或开启浏览器手机模式观看）。

<a href="/planet-app/index.html" target="_blank" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#00f0ff,#7300ff);color:white;border-radius:12px;text-decoration:none;font-weight:900;font-size:16px;box-shadow: 0 4px 15px rgba(0, 240, 255, 0.4);">
  🌌 进入宇宙探索 (AR 原型)
</a>

---

### 技术架构
- **前端枢纽**：Uni-app (Vue3 + Vite + SCSS)
- **视觉层**：Custom Glassmorphism Design System
- **核心组件**：LBS Radar Engine, WebCamera AR Simulation, Custom TabBar Logic

> **求职自白**：
> 这个项目不仅是我对硬件联动的技术尝试，更是对“探索型生活方式”的产品理解。我致力于打造能让用户在每一次蹬踏中都能感受到数字温度的产品。
