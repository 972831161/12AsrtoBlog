# 新 Session 启动 Prompt

直接把下面这段贴进新对话框。

---

## 背景

我们在做一套围绕宇宙 E-BIKE 的产品认知系统，目标是把老板（程总）对产品的真实理解，沉淀成可以服务销售、内容、市场的核心资产，并同步写入飞书知识库。

---

## 本地文件系统

路径：`/Users/hongningcheng/Downloads/老板产品认知系统/`

当前只有两个核心文件：

- `02-提取理解/宇宙E-BIKE_产品知识库.md` — 产品事实层（三条产品线参数、价格、供应链风险、内容规则、市场口径）
- `02-提取理解/待回答问题清单.md` — 14个待回答问题（产品 / 销售 / 内容流量三类）

---

## 飞书知识库

空间名：**MOVE FAST 2026**（space_id: `7624487678540598500`）

已知结构：
- 首页（node: `NNlUw15cYigibZkQ0tMcVzvEnde`）
  - 宇宙E-BIKE 产品知识库（飞书入口）
  - PRODUCT 模块｜产品总览（有子节点）
  - CONTENT 模块｜品牌表达总览（有子节点）
  - MKTG 模块｜市场内容总览（有子节点）
  - 库存仪表盘入口｜电助力库存面板
  - FOUNDER_IP 模块｜创始人IP总览（有子节点）
- FOUNDER_IP｜Bilibili 渠道档案（obj_token: `T1qodYxgWoVCpoxJJI3cXGaSnRb`）

飞书 CLI 调用方式（nvm 环境需要先 source）：
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
lark-cli wiki nodes list --as user --params '{"space_id":"7624487678540598500","parent_node_token":"NNlUw15cYigibZkQ0tMcVzvEnde"}'
lark-cli docs +fetch --doc <obj_token> --as user
```

---

## 产品核心知识（快速上下文）

**三条产品线：**

| 产品 | 材质 | 价格 | 当前状态 |
|------|------|------|---------|
| VAPOR（铝合金电助力） | 铝合金 | 平把¥17,900 / 弯把¥25,900 | 正常在售 |
| VAPOR SuperLight | 碳纤维 T800+T1000 | ¥29,999起，最高¥79,999 | 在售，**滞销压力重** |
| Oi!（全碳纤维，不带电） | 碳纤维 T800/T1000 | ¥9,999起，车架¥6,999起 | 在售，有赛场背书 |

**内容禁忌词：** 极致 / 颠覆 / 革命性 / 前所未有 / 惊艳

---

## 当前任务

我们正在通过对话，把程总对产品的真实判断提炼出来，按 **PRODUCT / CONTENT / MKTG / FOUNDER_IP** 四层结构整理，然后写进飞书知识库对应页面。

问题清单在本地文件里，14个问题都还未回答。

**你的工作方式：**
1. 从问题清单里选问题问程总
2. 收到回答后提炼成结构化内容
3. 写入本地文件 `02-提取理解/` 并同步更新飞书知识库

**注意：** 程总的新回答优先级高于一切旧资料，不要用旧知识库压制新判断。
