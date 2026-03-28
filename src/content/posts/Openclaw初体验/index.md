---
title: Openclaw初学
published: 2026-03-16
description: 对Openclaw的尝试和理解
tags: [AI, Openclaw]
category: AI
draft: false
pinned: true
author: 十二
image: "./cover.webp"
---
##  初印象：
首先知道有openclaw这个东西，是在王师傅和ccgg的视频里。了解到其简单来说就是支持修改、查看、创建**本地文件**的AI。一开始确实没感觉“咱们人类又步入到了一个新时代”，以至于各种养虾老师各处**收费**提供小龙虾安装服务，毕竟之前的课题在本地部署过大模型，也利用AI进行了本地数据的批量处理，小龙虾在我这里就是用户给他提供了管理员权限，让原本的流程：AI创建代码 —> ide运行 ->本地文件得到修改，优化了中间步骤，即AI修改本地文件。我并不认为其相对于之前有翻天覆地的提升。再加上每日高强度交替使用GPT、Gemini，之前也尝试过Cursor，AI agent、万能tab给我的震撼远大得多。所以安装、学习Openclaw在当时优先级并不高。

##  学习动机
制作个人博客的时候，需要设置桌面端和网页端的背景图片。当然从网络上下载的文件名并不具有一定逻辑性，那么如果我不想手动进行文件名的更改，创建一个简单的文件名批处理代码是个好的选择，那么这时我会告诉gemini我的要求->gemini创建相应的代码->粘贴进vs里运行。如果我想一步到位，那么利用openclaw就是最好的选择。因此就有了openclaw学习任务1

1. 学习任务1: 安装配置openclaw，实现文件批处理。openclaw tui
    - openclaw tui进行呼唤
2. 学习任务2: 配置gemini接口的vibe code
3. 学习任务3: 做个刀盾看板娘

### 一些链接
openclaw官方安装：https://docs.openclaw.ai/zh-CN/start/getting-started 