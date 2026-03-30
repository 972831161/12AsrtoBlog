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

为了探索“电助力自行车”不仅仅是交通工具，更是数字生活触点的可能性，我开发了这套 **Planet Between（宇宙骑行）** 数字化解决方案。

> **核心设计理念**：Cyber-Noir 赛博黑、霓虹蓝、玻璃拟态 UI。

### 1. ⚡️ VAPOR 智能中控仪表盘
实时监控电机状态、电池续航、速度与骑行时长。内置的一键电子锁和助力模式调节，极致简化了从物理躯壳到数字灵魂的交互。

![仪表盘](/images/planet-app/dashboard.png)

### 2. 🗺️ 行星路书与社交社区
告别生硬的传统骑行 APP。在这里，你可以下载官方精选的“补给路线”，沉浸于基于瀑布流的“探索记录”，找到属于你的骑行部落。

![社区与路书](/images/planet-app/community.png)

### 3. 🛸 宇宙坐标 (AR Easter Eggs)
这是本应用最核心的“彩蛋”系统。骑士可以在地图任何一点投放“虚拟能量舱”。通过雷达探测坐标，并开启实景 AR 寻宝，让骑行变成一场基于 LBS 的大型社交寻宝游戏。

![AR 寻宝](/images/planet-app/ar.png)

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
