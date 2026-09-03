# 架构设计

> 知源 AI 内容工作台：从品牌事实到效果经验的内容学习闭环。

## 1. 原型边界

当前版本是一个无构建步骤、无后端依赖的浏览器端 Prototype。它验证的是产品工作流和数据分层，不代表真实大模型生成、平台发布或账号数据同步已经接通。

```text
index.html
  ├── assets/styles.css
  ├── assets/app.js
  ├── data/brand_knowledge.json
  ├── data/channel_profiles.json
  ├── data/experience_memory.json
  └── data/performance_demo.json
```

运行时以 JavaScript 内置安全演示数据启动，并用 localStorage 保存用户修改。静态 JSON 是数据契约与演示数据的可检查版本，便于后续迁移到 API。

## 2. 七层结构

### Brand Knowledge Layer

保存长期稳定、需要被核验的事实：

- 品牌介绍、定位、表达风格、目标消费者、核心价值、禁止表达；
- 产品名称、类别、介绍、卖点、规格、食用方式、场景；
- 可使用事实与禁止推断。

它回答：**这个品牌和产品是什么？**

### Channel Profile Layer

平台逻辑不散落在各个生成函数中，而是由统一 Profile 描述：

```js
{
  id,
  name,
  contentType,
  tone,
  structure,
  outputFields,
  formatRule,
  rules,
  availableMetrics,
  goalMetrics
}
```

MVP UI 只展示小红书、抖音、微信公众号。生成层通过 `CHANNEL_ADAPTERS` 集中管理三个原生适配器；新增 Profile 时，标准字段可使用通用生成回退，平台特有表达再补一个适配器。字段渲染、格式规则、可用指标和 Goal 指标都继续读取同一 Profile，不把平台判断散落到页面逻辑中。

### Experience Memory Layer

只保存由历史表现支持、且经过人工确认的创作经验：

```js
{
  id,
  platform,
  product_category,
  campaign_goal,
  content_pattern,
  insight,
  source_content_id,
  source_campaign,
  metric_name,
  metric_value,
  baseline_value,
  lift,
  baseline_count,
  learned_at
}
```

它回答：**过去什么创作方式表现较好？**

Performance 不能直接回写 Brand Knowledge。只有内容被判为 Winner，且用户在详情中点击“加入创作经验”后，Pattern 才进入 Experience Memory。

### Generation Layer

```text
Campaign Brief
     +
Brand Knowledge
     +
Product Facts
     +
Channel Profile
     +
Relevant Experience（利用轮次）
        ↓
Prompt Context（内部概念）
        ↓
LLM / 当前模板模拟
        ↓
Platform-native Content
```

当前生成器为前端模板模拟，但不同平台返回不同 Schema：

- 小红书：标题、正文、话题、配图建议；
- 抖音：Video Hook、时间段脚本、发布文案、话题、拍摄建议；
- 微信公众号：标题、摘要、正文结构、完整正文、CTA、封面建议。

相关经验按平台、产品类别、Campaign Goal、主题关键词加权匹配。`EXPLORATION_RATE = 0.2`：

- 约 80% 为利用轮次：检索最多 3 条相关 Experience；
- 约 20% 为探索轮次：**完全不引用 Experience Memory**，只使用 Brand Knowledge、Product Facts 与 Channel Profile。

探索的目的是避免系统只复制旧 Winner。这是产品层的生成策略，不是模型权重训练，也不声称实现了在线强化学习。

### Quality Check Layer

底层检查包括：

- Product Fact Check；
- Brand Tone Check；
- Food Marketing Compliance Check；
- Channel Format Check；
- Unsupported Claim Detection。

Unsupported Claim 采用四类语义：

| 类别 | 含义 | 原型处理 |
| --- | --- | --- |
| Supported | 有品牌或产品资料支持 | 通过 |
| Subjective | 主观口味、感受或场景表达 | 允许，保持克制 |
| Unsupported | 客观产品事实，但在当前资料中找不到可核验依据 | 提醒补资料或替换 |
| Risky | 食品功效、绝对化或高风险表达 | 必须确认处理 |

Prototype 使用规则 + 可解释的 claim-level 模拟分类：

1. 高风险词优先进入 Risky；
2. 数字、规格、产地、认证等具体事实必须能在产品 Evidence Pool 中找到依据，否则进入 Unsupported；
3. “产品/本品/豆腐花/豆腐/腐竹……”等主语触发的客观产品断言，需要能匹配 `usableFacts / sellingPoints / description / specification / serving / scenarios` 中的事实；
4. 明显的个人感受、风味、生活场景表达可进入 Subjective；
5. 当前仍是 Prototype 级启发式检查，不宣称等同于生产级 NLI / Fact Grounding 模型。

UI 只显示“发布前检查”和可执行建议，不向普通用户暴露技术分数。

### Performance Layer

Performance 记录按平台保留原始指标；不存在的字段必须为 `null`，不补零、不推算：

```js
{
  id,
  platform,
  goal,
  product_category,
  source,        // demo | manual | csv | api
  metrics,
  published_at
}
```

核心指标由 `ChannelProfile.goalMetrics[goal]` 决定。例如小红书 Consideration 使用收藏率，抖音 Awareness 使用播放量，微信公众号 Engagement 使用分享率。

Winner 判定在“同品牌 + 同平台 + 相同 Goal”范围内完成，但每条内容的对照集必须满足：

```text
peer.platform === current.platform
peer.goal === current.goal
peer.id !== current.id
```

也就是说，**当前内容绝不能参与自己的 baseline**。

当前 Prototype 对“其他历史内容”计算：

- 历史中位数；
- Top 20% 位置；
- 当前内容相对历史中位数的 Lift。

同时设置 `MIN_BASELINE_PEERS = 3`。如果除当前内容之外的可比历史少于 3 条，则状态为“样本不足”，只展示事实指标，不判 Winner，也不允许沉淀 Experience。

当前 Winner 启发式：

```text
Lift >= 20%
OR
达到其他历史内容的 Top 20% 且 Lift > 0
```

负向 Lift < -10% 标为 Needs Review，其余为 Normal。

这一层只回答：**这条内容相对可比历史是否表现突出？**

它不是因果实验，不能回答：**某个 Hook 是否导致了指标上涨？**

### Learning Layer

```text
Published Content
        ↓
Performance
        ↓
Peer-only Baseline / Lift
        ↓
Winner / Sample Check
        ↓
Pattern Analysis
        ↓
Human confirms “加入创作经验”
        ↓
Experience Memory
        ↓
Relevant Experience Retrieval
        ↓
Next Generation
```

所谓“持续学习”是 Experience Memory + Retrieval + In-context Learning，不是更新模型权重。

## 3. 状态与交互

Campaign 只有三个业务状态：

```text
草稿（Draft） → 已定稿（Final） → 已发布（Published）
```

“生成与检查”只是页面内的工作流阶段，不会写入新的业务状态。产品没有审核负责人、独立审批页、通过/驳回或多级角色。

每个平台独立维护轻量版本：

- v1 AI 初稿；
- v2 用户修改或 AI 重新生成；
- v3 最终定稿。

用户修改和采纳检查建议都会产生版本；刷新后继续保留。

## 4. localStorage

| Key | 内容 |
| --- | --- |
| `zhiyuan_brand_memory` | 品牌资料、产品资料和用户导入事实 |
| `zhiyuan_experience_memory` | 人工确认的创作经验 |
| `zhiyuan_campaigns` | 当前 Campaign Brief、输出、状态与检查 |
| `zhiyuan_performance` | 演示、手动或导入的发布表现 |
| `zhiyuan_versions` | 各平台轻量版本记录 |

旧版 `ai_mops_*` Key 会被识别并保存兼容备份，但不会直接合并到新版 Truth / Experience 层，避免旧模型中的混合数据和过期演示内容污染新工作台。迁移失败不会阻止页面启动。

## 5. 数据来源

生产方向支持：

```text
API Sync
Account Sync
CSV Import
Manual Entry
```

Prototype 实际使用 `demo` 与 `manual`，CSV 用于本地导入。`api` 只是数据契约中的未来枚举，不代表当前已获得任何平台 API。

## 6. 生产演进

| 能力 | 当前 Prototype | 生产方向 |
| --- | --- | --- |
| 存储 | localStorage + JSON | PostgreSQL / 对象存储 |
| 生成 | 平台模板模拟 | 服务端 LLM API + 结构化输出 |
| 经验检索 | 关键词与字段加权 | 混合检索，可选 pgvector |
| 质量检查 | 规则 + claim-level 模拟分类 | 规则引擎 + 模型判定 + Evidence Grounding + 审计日志 |
| 发布 | 人工发布后记录 | 视平台能力接入 API 或账号同步 |
| 表现数据 | Demo / Manual / CSV | API / Account Sync / CSV / Manual |

服务端实现时，应保持七层边界不变：事实层不接受表现洞察，Experience 必须保留来源与基线，Performance 保留原始数据来源，生成只接收经过授权的上下文。

## 7. 安全与可靠性

- 用户导入与编辑内容在进入 HTML 前统一转义；
- 不在前端保存 API 密钥；
- 不自动构造缺失 Performance；
- 食品事实缺失时显示“待补充”，不做功效推断；
- 当前内容不参与自己的历史 baseline；
- 可比样本不足时不判 Winner、不写入 Experience；
- 探索轮次不读取历史 Experience；
- 用户忽略检查项时保留 `ignored` 状态与时间；
- 生产版本需增加认证、租户隔离、审计日志、速率限制和服务端输入验证。