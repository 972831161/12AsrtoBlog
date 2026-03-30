---
title: 宇宙 Planet Between · 极客骑行小程序设计
published: 2026-03-29
description: 基于 Uni-app + Vue3 构建的 E-Bike 智慧骑行app，包含仪表盘、AR彩蛋、社区路书。
tags: [Uni-app, 极客体验, AR, 智慧骑行]
category: 项目
draft: false
pinned: true
---

## 🚴 宇宙骑行数字化体验 (Planet Between)

调研目前的移动应用市场发现，大部分“骑行 App”如“黑鸟单车”或“际刻骑行”，虽有不错的 UI 设计，但定位更接近于记录工具（类似于“骑行版的 Keep”），缺乏与单车品牌硬件的深度耦合与品牌情感连结。即便是一些传统头部的专属 App（如捷安特），虽然功能扎实，但设计语言往往偏向传统工业感，未能充分释放电助力自行车（**E**-bike）应有的未来科技属性。

鉴于 Planet Between 品牌目前尚未建立官方移动生态，我意识到一套极具辨识度的数字化交互方案将是品牌差异化竞争的关键。于是，我基于自己的产品理念并借助 Gemini 开发了这套**Planet Between（宇宙骑行）** 数字化解决方案。

> **核心设计理念**：Cyber-Noir 硬核、骑行乐趣

### 1. ⚡️ VAPOR 全息仪表盘与控制中枢
采用定制化“全息幻彩（Hologram）”滤镜特效，概念单车在暗色主题下呈现极具未来感的发光轮廓。支持 **START RIDING** 状态切换，精准掌控电机状态、电池续航、速度与骑行时长，极致简化数字灵魂交互。

![VAPOR 仪表盘](/images/planet-app/dashboard.webp)

### 2. 🗺️ 行星路书与骑会社区
告别生硬的传统骑行。在**探索**模块沉浸于沿途风光的骑行社区；在**路书**模块，全新纵向大图布局提供直观的数据与文字指引，支持离线下载，覆盖“玄武湖”、“秦淮河”及“紫金山越野”等多层级路线。

![社区与路书](/images/planet-app/community.webp)

### 3. 🛸 宇宙雷达与 AR 战术引导
**聆听宇宙的声音**
### 3.4 智能座舱：Pro 骑行 HUD 与竞技数据
针对核心骑行场景，我们重构了原有的仪表盘。开启“开始骑行”后，App将自动切换为高集成的 Pro HUD 界面。

![Pro 骑行 HUD：实时数据监控与补给同步](/images/planet-app/dashboard_pro_actual.webp)

- **实时参数**：通过大数据同步，实时呈现速度、心率（动态搏动）、功率（Watts）以及踏频。
- **环境解算**：集成海拔、坡度、累计爬升等环境参数，为复杂地貌骑行提供决策依据。
- **补水提醒**：首创**智能补水进度条**，模拟骑行过程中的水分消耗，支持一键点击补满，确保持续的运动输出。

### 3.5 宇宙坐标：战术地图雷达
在此功能下，所有用户可以在目标位置安置能量舱（即彩蛋，调用gps和手机AR功能），能量舱类型不限，比如一个浮动的文字气泡，一个虚拟AR物品，或者是留下一张彼时彼刻的全景美照。

![战术坐标雷达：彩蛋定位与路线高亮指引](/images/planet-app/radar_tactical_actual.webp)

- **数字化地形**：雷达背景集成了城市道路网格与地形板块（如玄武湖），支持 N 极方位对齐。
- **点位预检**：地图上清晰标注了三类能量舱的具体坐标及预设路径。
- **高亮引导**：锁定目标后，系统会生成一条**霓虹蓝发光路径**，引导用户跟随雷达波段寻找最佳路线。

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
