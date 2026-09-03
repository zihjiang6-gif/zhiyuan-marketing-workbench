# 知源 AI 内容工作台

> 让品牌内容从真实表现中持续学习。

面向食品品牌内容运营人员的浏览器端高保真 Prototype。它围绕一个清晰闭环展开：**Create → Publish → Measure → Learn → Create Better**。

## Problem

食品品牌内容运营每天需要：

- 为多个平台重复创作内容；
- 保证品牌表达与产品事实一致；
- 避免食品宣传中的不当或无依据表述；
- 发布后判断什么内容真正有效；
- 把历史有效经验用于下一次创作。

现实中，最后一步往往没有发生。表现数据留在零散报表里，创作经验留在人脑里，下一次内容仍然从零开始。

## Solution

```text
Brand Memory
     +
Channel Profiles
     +
Experience Memory
     ↓
Multi-channel Generation
     ↓
Performance Feedback
     ↓
Learning
```

知源将稳定事实和历史经验分开管理：

- **Brand Knowledge** 回答“品牌和产品是什么”；
- **Channel Profile** 回答“这个平台应该怎样写、可以观察哪些指标”；
- **Experience Memory** 回答“过去什么创作方式表现较好”。

## 体验完整 Demo

1. 打开“内容创作”，使用默认的夏日冰豆腐花 Brief；
2. 选择小红书与抖音，点击“生成内容”；
3. 查看创作参考、两个平台的原生内容与发布前检查；
4. 编辑任意内容并保存，查看新增版本；
5. 确认定稿，再标记已发布；
6. 在“效果复盘”中看到刚发布的内容显示“等待数据”；
7. 打开一条历史 Winner，查看指标、历史中位数、Lift、比较口径与 AI 复盘；
8. 点击“加入创作经验”；
9. 在“品牌记忆 → 创作经验”查看新经验；
10. 回到内容创作，再次生成相似 Campaign，查看该经验已进入创作参考。

## 当前已实现

- 品牌资料与四个食品产品资料；
- 数据驱动的 Channel Profile；
- 小红书、抖音、微信公众号原生内容生成模拟；
- 根据用户选择动态显示平台内容；
- 内容编辑、复制、单平台重新生成与轻量版本记录；
- 发布前产品事实、品牌表达、食品宣传合规、平台格式检查；
- Supported / Subjective / Unsupported / Risky 宣称分类思路；
- 对客观产品宣称要求可核验产品资料，无法找到依据时进入 Unsupported；
- 草稿 → 已定稿 → 已发布状态；
- Markdown 内容导出；
- 发布记录与“等待数据”状态；
- 已发布内容的手动表现录入与 CSV 批量补数；
- 12 条跨平台历史 Performance 演示数据；
- 由 Campaign Goal 和 Channel Profile 选择核心指标；
- 同平台、相同 Goal 下的历史中位数与高表现判断；
- Winner 基线明确排除当前内容本身，避免自包含基线；
- 可比历史不足 3 条时显示“样本不足”，不判 Winner、不沉淀经验；
- Winner 详情、内容规律提炼、人工加入创作经验；
- 按平台、产品类别、Campaign Goal 和文本关键词检索经验；
- 下一轮生成明确展示所引用的历史经验；
- 约 20% 生成轮次进入探索模式：完全不引用 Experience Memory，只使用品牌、产品与平台规则；
- 手动输入、粘贴文本、上传 JSON / CSV；
- 新版 `zhiyuan_*` localStorage Key 与旧 Key 安全迁移备份；
- 刷新后保留 Brief、生成内容、版本、发布内容和经验。

## 当前未实现

- 真实 LLM API；
- 真实小红书、抖音或微信公众号 API；
- 真实自动发布；
- 真实线上 Performance Sync；
- Vector DB；
- 模型 Fine-tuning；
- 真实账号同步与 API Sync。

“持续学习”当前采用 **Experience Memory + Retrieval + In-context Learning** 思路，而不是重新训练大模型权重。生成采用可操作的前端模板模拟；经验检索采用可解释的匹配模拟，不声称已上线向量检索。

## How it works

```text
Campaign Brief
  + Brand Knowledge
  + Product Facts
  + Channel Profile
  + Relevant Experience（利用轮次）
        ↓
  Generation Simulation
        ↓
  Quality Check
        ↓
  Human Finalization
        ↓
  Publish Record
        ↓
  Performance Comparison
        ↓
  Pattern Extraction
        ↓
  Experience Memory
```

生成策略保留约 20% 的探索空间：约 80% 的轮次正常检索相关 Experience；约 20% 的轮次完全不引用历史 Experience，只使用 Brand Knowledge、Product Facts 与 Channel Profile，避免系统只会复制旧 Winner。这里的探索/利用只是生成策略，不代表模型训练或在线强化学习。

## Performance 与 Winner

不同平台只展示自身可获得的指标；不存在的字段保持 `null` 并在 UI 显示 `—`。

| 平台 | 可用演示指标 | 不同 Goal 的优先示例 |
| --- | --- | --- |
| 小红书 | 曝光、点赞、收藏、评论、分享 | Awareness 看曝光；Consideration 看收藏率 |
| 抖音 | 播放、点赞、评论、分享、完播率 | Awareness 看播放；Consideration 看完播率 |
| 微信公众号 | 阅读、分享、完读率 | Awareness 看阅读；Engagement 看分享率 |

Winner 不使用固定绝对阈值。当前 Prototype 对每条内容使用“同平台 + 相同 Goal”的**其他历史内容**作为对照集，明确排除当前内容本身，再计算历史中位数、Top 20% 位置和 Lift。可比历史少于 3 条时只展示“样本不足”，不会判定 Winner，也不会允许写入 Experience Memory。

这套逻辑仍是作品集 Prototype 的相对比较启发式，而不是因果实验结论。它回答“这条内容相对可比历史表现是否突出”，不回答“某个内容元素是否导致了表现提升”。

手动录入只展示对应平台可用指标，并额外展示当前 Goal 所需的核心指标（例如 Traffic 的 CTR、Conversion 的转化率）。CSV 可通过 `id` 匹配记录，或用 `title` + `platform` 匹配；指标列使用 Profile 中的英文键名，空白字段保持 `null`。

## 数据与真实性声明

**为了演示产品闭环，历史内容和表现数据为模拟数据，不代表企业真实经营数据。**

产品资料中无法确认的规格统一标记为“待补充”，所有食品功效、营养、减肥、养生表述都不会被补写。生产版本可采用 API / Account Sync / CSV / Manual；当前 Prototype 主要使用 Demo / Manual，不假装已连接平台 API。

## 运行

```bash
cd "/Users/jzh/Desktop/知源营销工作台/v2"
python3 -m http.server 8000
```

然后打开 `http://localhost:8000/index.html`。

也可以直接打开 `index.html`。核心逻辑有内置安全数据，不依赖构建工具或后端。

## 文件结构

```text
index.html                       三个核心页面与对话框结构
assets/styles.css                克制的响应式工作台视觉
assets/app.js                    状态、生成、检查、复盘和学习闭环
data/brand_knowledge.json        品牌与产品稳定事实
data/channel_profiles.json       可扩展平台 Profile
data/experience_memory.json      创作经验
data/performance_demo.json       12 条演示表现数据
data/knowledge_base.json         旧路径兼容说明与最小事实集
dashboard-zh.html                兼容跳转至效果复盘
import.html                      兼容跳转至品牌记忆
```

## 技术范围

- 原生 HTML / CSS / JavaScript；
- 无框架、无构建步骤；
- localStorage 本地持久化；
- 静态 JSON 作为可检查的数据结构参考；
- 所有用户输入进入 HTML 前进行转义；
- 单用户内容运营场景，不包含多级审批、角色权限、CRM、排期、财务或素材中心。

更完整的数据层和演进路径见 [ARCHITECTURE.md](ARCHITECTURE.md)，产品取舍与项目叙事见 [CASE_STUDY.md](CASE_STUDY.md)。