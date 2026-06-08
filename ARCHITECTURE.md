# 架构设计

> 知源营销工作台技术架构 — 从原型到生产。

---

## 当前原型架构

原型是一个**仅浏览器端单页应用**，无构建步骤：

```
┌──────────────────────────────────────────────────────────┐
│                    浏览器（客户端）                        │
│                                                          │
│  index.html          import.html                         │
│  （活动工作区）        （知识库管理中心）                    │
│       │                    │                             │
│       └────────┬───────────┘                             │
│                ▼                                         │
│     ┌──────────────────────┐                             │
│     │   应用状态             │                             │
│     │   （JavaScript 对象）  │                             │
│     └──────────┬───────────┘                             │
│                │                                         │
│     ┌──────────▼───────────┐                             │
│     │   数据层               │                             │
│     │   · localStorage      │ ← 用户导入的知识库           │
│     │   · JSON fetch        │ ← data/knowledge_base.json │
│     │   · 兜底记录           │ ← 硬编码演示数据            │
│     └──────────────────────┘                             │
│                                                          │
│  可选: Express 服务 (server.js)                           │
│  · 知识库检索与内容生成的 REST API                         │
│  · RAG 引擎（关键词 + 权重匹配）                           │
│  · 兜底生成的模板引擎                                      │
│  · OpenAI API 集成（可选）                                │
└──────────────────────────────────────────────────────────┘
```

**原型关键设计决策:**
- 零构建步骤 — 直接打开 index.html
- 无框架 — 原生 HTML/CSS/JS，最大化可移植性
- localStorage 作为主数据存储 — 页面刷新后数据保留
- 优雅降级 — 无服务器可运行，有服务器体验更佳

---

## 生产架构

### 系统总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端层                                  │
│  React / Next.js SPA                                            │
│  · 活动工作区  · 知识库管理中心                                    │
│  · 审核队列    · 效果仪表盘                                       │
│  · 导出管理    · 设置                                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / REST API
┌───────────────────────────▼─────────────────────────────────────┐
│                       API 网关 (Node.js / FastAPI)               │
│  · 认证 (JWT / OAuth)                                           │
│  · 限流                                                         │
│  · 请求验证                                                     │
└───────┬───────────────────┬──────────────────┬──────────────────┘
        │                   │                  │
        ▼                   ▼                  ▼
┌───────────────┐  ┌────────────────┐  ┌──────────────────┐
│  PostgreSQL    │  │  向量存储       │  │  对象存储         │
│                │  │                 │  │                   │
│ · 用户         │  │ · KB 嵌入向量   │  │ · 活动素材        │
│ · 活动         │  │ · 语义搜索      │  │ · 导出文件        │
│ · 版本         │  │ · 相似度评分    │  │ · 图片            │
│ · 审核         │  │                 │  │                   │
│ · 分析         │  │                 │  │                   │
└───────────────┘  └────────────────┘  └──────────────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       大模型 / AI 层                              │
│  · OpenAI GPT-4o / Claude（文本生成）                            │
│  · SDXL / DALL-E（图片生成）                                     │
│  · ControlNet（图片中产品一致性）                                 │
│  · AI Guardrails 质检模型（合规、语调）                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 数据流

### 完整请求生命周期

```
1. 导入知识
   用户上传 JSON/CSV → 模式验证 → 去重检查
   → 存储至 PostgreSQL（结构化）+ 向量库（嵌入向量）
   → 返回导入摘要

2. 创建活动
   用户填写活动简报表单 → 验证必填字段
   → 在 PostgreSQL 中创建活动记录（状态: 草稿）
   → 记录时间线事件: "活动已创建"

3. 生成依据
   标准化活动简报 → 生成搜索查询
   → 关键词搜索（PostgreSQL）+ 语义搜索（向量库）
   → 合并去重结果 → 评分排序
   → 冲突检测（相同分类+键，不同值）
   → 缺失字段检测
   → 返回前 8-12 条记录（含检索评分）

4. 构建提示词
   系统角色 + 产品信息 + 品牌规则 + 平台规则
   + 合规规则 + 受众背景 + 历史案例
   → 最终结构化提示词

5. 生成内容
   将提示词发送至大模型 API → 解析结构化响应
   → 平台特定后处理（hashtag、格式）
   → 存储生成内容及版本元数据
   → 返回平台输出 + 来源引用

6. 运行 AI Guardrails（内容质检机制）
   事实准确性检查 → 品牌调性偏移检测 → 平台适配检查
   → 夸大/未证实表达检测 → 合规风险评估
   → 生成质量评分 → 标记提醒
   → 记录质检结果

7. 人工审核
   展示输出 + 质检结果 + 质量评分
   → 用户操作: 通过 / 驳回 / 编辑 / 重新生成
   → 每次操作记录至时间线
   → 状态更新: 草稿 → 待审核 → 已通过 / 已驳回

8. 导出
   打包活动包: 简报 + 证据 + 提示词 + 输出
   + 质检 + 评分 + 审核状态 + 版本历史
   → 生成 JSON + Markdown 文件
   → 下载或保存至对象存储
   → 记录时间线: "活动包已导出"

9. 追踪效果
   （发布后）从平台导入效果数据
   → 存储至分析表
   → 与质量预测对比
   → 标记高表现内容

10. 学习回写
    运营人员审核高表现内容
    → 作为历史活动案例添加至知识库
    → 更新贡献知识记录的 used_count
    → 未来生成将检索这些案例
```

---

## RAG 设计

### 检索增强生成架构

系统采用**混合检索**方式，结合结构化搜索与语义搜索：

```
活动简报
     │
     ▼
┌─────────────────┐
│ 查询标准化器      │  → 提取: 产品名、关键词、受众、平台
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ 关键词搜索       │    │ 语义搜索         │
│ (PostgreSQL)    │    │ (向量库)         │
│ · 精确匹配      │    │ · 嵌入相似度     │
│ · 模糊匹配      │    │ · 上下文感知     │
│ · 标签匹配      │    │ · 跨语言         │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
         ┌─────────────────────┐
         │  合并排序             │
         │  · 评分聚合          │
         │  · 多样性增强        │
         │  · 冲突检测          │
         │  · 缺失检测          │
         └──────────┬──────────┘
                    ▼
         ┌─────────────────────┐
         │  前 8-12 条记录      │
         │  （含可追溯性）       │
         └─────────────────────┘
```

### 检索评分公式

```
retrieval_score = (
    关键词匹配分 * 0.35 +
    分类相关度 * 0.15 +
    平台匹配 * 0.15 +
    产品名匹配 * 0.10 +
    标签匹配 * 0.10 +
    可信度 * 0.05 +
    权重 * 0.05 +
    时效性加成 * 0.05
)
```

### 来源引用

每条生成输出都包含**本次引用来源**区域:
- 列出引用了哪些知识记录
- 显示记录 ID、键和值
- 标明输出的哪个部分使用了哪个来源
- 实现从输出到知识库的完整可追溯性

### 冲突检测

当两条记录共享相同的 `category + key` 但具有不同 `value` 时:
1. 比较 `weight` 和 `confidence`（可信度）分数
2. 选择综合得分更高的记录
3. 记录警告: `冲突检测: {category}.{key} 存在多个值，已选择 "{value}"（基于最高权重/可信度）`
4. 在质检面板显示警告

### 缺失信息检查

生成所需的必要字段:
- `product.name`、`product.color`、`product.fabric`、`product.fit`
- `brand.tone`、`brand.no_go`
- `audience.demographic`
- `platform.{platform}_style`
- `compliance.*`（任意合规规则）

如有必要字段缺失，记录: `缺失信息: {field_path} 在知识库中未找到，使用默认值。`

---

## AI Guardrails（内容质检机制）

### 质检层级

```
┌──────────────────────────────────────────┐
│           第 1 层: 硬规则                  │
│  · 禁止医疗/健康功效宣称                   │
│  · 禁止贬低竞品                           │
│  · 禁止折扣紧迫感用语                     │
│  · 禁止夸大效果宣称                       │
│  → 触发即自动拒绝                         │
└──────────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────┐
│           第 2 层: 软检查                  │
│  · 品牌调性偏移检测                       │
│  · 平台适配检查                           │
│  · 与知识库的事实准确性                    │
│  · 缺失信息检查                           │
│  → 提醒 + 质量评分扣减                    │
└──────────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────┐
│           第 3 层: 人工审核                │
│  · 所有输出标记为待审核                    │
│  · 质检结果对审核者可见                    │
│  · 通过 / 驳回 / 编辑 / 重新生成           │
│  → 导出前的最终关卡                       │
└──────────────────────────────────────────┘
```

### 合规风险评估

```
compliance_risk = 100 - (
    硬规则违规 * 20 +
    软检查提醒 * 5 +
    缺失信息 * 3
)
// 风险越低 = 分数越高
// 95+ = 低风险
// 80-94 = 中风险
// <80 = 高风险（需要审核）
```

---

## 数据库模式（生产环境）

### PostgreSQL 表

```sql
-- 知识记录
CREATE TABLE knowledge_records (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    source VARCHAR(200),
    confidence DECIMAL(3,2) DEFAULT 0.85,
    weight INTEGER DEFAULT 5,
    tags TEXT[],
    used_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 活动
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(200) NOT NULL,
    raw_brief TEXT,
    target_audience TEXT,
    brand_tone VARCHAR(200),
    target_platforms TEXT[],
    campaign_goal TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 生成内容
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    platform VARCHAR(20) NOT NULL,
    version INTEGER DEFAULT 1,
    title TEXT,
    body TEXT,
    visual_prompt TEXT,
    quality_score INTEGER,
    review_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 活动时间线
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 效果数据
CREATE TABLE performance_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    platform VARCHAR(20) NOT NULL,
    ctr DECIMAL(5,2),
    engagement_rate DECIMAL(5,2),
    conversion_rate DECIMAL(5,2),
    brand_score INTEGER,
    recorded_at TIMESTAMP DEFAULT NOW()
);
```

---

## 可扩展性考量

### 从原型到生产

| 组件 | 原型 | 生产 |
|------|------|------|
| **数据存储** | localStorage + JSON | PostgreSQL + 向量库 |
| **检索** | 关键词 + 权重评分 | 混合（关键词 + 嵌入向量） |
| **生成** | 模板模拟 | OpenAI/Claude API |
| **认证** | 无 | JWT + OAuth |
| **状态** | 内存 JS 对象 | 数据库 + API |
| **图片** | CSS 占位符 | SDXL/DALL-E API |
| **导出** | 客户端 Blob 下载 | 服务端文件生成 |
| **分析** | 模拟数据 | 真实平台 API 集成 |

### 迁移策略
1. 保持相同数据模型（记录模式）
2. 将 localStorage 读取替换为 API 调用
3. 将 JavaScript 检索替换为服务端向量搜索
4. 在 API 端点前添加认证层
5. 将模拟效果数据迁移至真实分析管道

---

## 安全考量（生产环境）

- **API 认证:** 所有端点使用 JWT/OAuth 保护
- **数据隔离:** 数据库级别的多租户数据分离
- **提示词注入防护:** 大模型调用前进行输入净化
- **限流:** 按用户、按端点的速率限制
- **内容审计追踪:** 所有生成记录包含用户 ID 和时间戳
- **API 密钥管理:** 大模型 API 密钥存储在密钥库，绝不暴露给客户端
