# AI Detector MVP 技术方案文档

**版本:** v1.0  
**日期:** 2026-03-31  
**作者:** 技术团队  
**评审:** 产品经理 (待评审)

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [检测算法详解](#3-检测算法详解)
4. [成本与定价模型](#4-成本与定价模型)
5. [开发计划](#5-开发计划)
6. [风险评估](#6-风险评估)
7. [验收标准](#7-验收标准)

---

## 1. 项目概述

### 1.1 项目背景

AI 生成内容（ChatGPT、Claude、Gemini 等）已广泛普及，但市场上缺乏针对中文用户优化的轻量级检测工具。现有产品要么定价过高（Originality.ai $14.95/月起），要么中文支持差，要么广告过多影响体验。

### 1.2 产品定位

**中文优先的 AI 内容检测工具**，主打：
- 教育场景（教师查作业、论文）
- 内容创作者（避免平台惩罚）
- 隐私保护（本地解析不上传）

### 1.3 核心指标

| 指标 | MVP 目标 | V2 目标 |
|------|---------|---------|
| 检测准确率 | **>= 85%** | 90-95% |
| 检测响应时间 | < 8秒 | < 5秒 |
| 首屏加载时间 | < 2秒 | < 1.5秒 |
| 日检测次数 | 100次/日 | 1000次/日 |

### 1.4 技术路线演进

```
MVP (2周)          V2 (1-2月)          长期 (看数据)
┌─────────┐       ┌─────────┐         ┌─────────┐
│ 混合策略  │  →   │ 专业API  │   →    │ 自研模型?│
│ >= 85%  │       │ 90-95%  │         │ 95-99% │
│ 免费+基础 │       │ 专业版   │         │ 团队版  │
└─────────┘       └─────────┘         └─────────┘
```

---

## 2. 技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户端 (浏览器)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React UI  │  │ 启发式检测   │  │ 文件解析 (docx/pdf) │  │
│  │  (前端框架)  │  │ (前端计算)   │  │    (前端解析)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ API 调用 (按需)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   API 路由   │  │  权限校验    │  │   LLM 检测服务      │  │
│  │             │  │ (会员等级)   │  │  (OpenRouter)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**架构选型理由：**

| 组件 | 选型 | 理由 |
|------|------|------|
| 前端托管 | Cloudflare Pages | 免费、全球CDN、自动部署 |
| 后端服务 | Cloudflare Workers | 无50ms CPU限制、边缘计算、低延迟 |
| LLM API | OpenRouter | 统一接口、多模型备选、价格透明 |
| 存储 | localStorage / KV | 免费用户本地存储，登录后KV同步 |

### 2.2 前端架构

```
frontend/
├── src/
│   ├── components/           # UI 组件
│   │   ├── HeroSection.tsx   # 首页主区域
│   │   ├── TextInput.tsx     # 文本输入框
│   │   ├── FileUpload.tsx    # 文件上传
│   │   ├── ResultCard.tsx    # 检测结果展示
│   │   └── HistoryList.tsx   # 历史记录
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useDetection.ts   # 检测逻辑
│   │   ├── useHistory.ts     # 历史记录管理
│   │   └── useTier.ts        # 会员等级
│   ├── utils/                # 工具函数
│   │   ├── heuristicDetector.ts  # 启发式检测
│   │   ├── fileParser.ts     # 文件解析
│   │   └── textUtils.ts      # 文本处理
│   ├── types/                # TypeScript 类型
│   ├── App.tsx
│   └── index.tsx
├── package.json
└── tailwind.config.js
```

### 2.3 后端架构 (Cloudflare Workers)

```typescript
// worker.ts

export interface Env {
  OPENROUTER_API_KEY: string;
  KV_STORAGE: KVNamespace;
}

// 路由定义
const routes = {
  '/api/detect': handleDetect,
  '/api/history': handleHistory,
  '/api/user': handleUser,
};

// 主入口
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const handler = routes[url.pathname];
    
    if (!handler) {
      return new Response('Not Found', { status: 404 });
    }
    
    return handler(request, env);
  },
};

// 检测处理
async function handleDetect(request: Request, env: Env): Promise<Response> {
  const { text, userTier } = await request.json();
  
  // 1. 权限校验
  const canDetect = await checkQuota(userTier, text.length);
  if (!canDetect) {
    return Response.json({ error: 'Quota exceeded' }, { status: 403 });
  }
  
  // 2. 调用检测服务
  const result = await detectService(text, userTier, env);
  
  // 3. 记录历史
  await saveHistory(userTier, result, env);
  
  return Response.json(result);
}
```

---

## 3. 检测算法详解

### 3.1 混合检测策略

```
用户输入文本
     │
     ▼
┌─────────────────┐
│  1. 启发式检测   │ ← 前端执行，零成本
│  (快速筛选)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 明确人类    明确AI    灰色地带
 (<30分)    (>80分)   (30-80分)
    │         │         │
    ▼         ▼         ▼
 直接返回   直接返回   调用LLM
                         │
                         ▼
                  ┌─────────────┐
                  │ 2. LLM深度分析 │ ← 后端执行，按需付费
                  │ (OpenRouter) │
                  └─────────────┘
```

### 3.2 启发式检测算法

**核心原理：** AI生成文本具有统计规律性，人类文本更具随机性

```typescript
// utils/heuristicDetector.ts

interface HeuristicMetrics {
  burstiness: number;      // 句子长度变化系数 (0-100)
  diversity: number;       // 词汇多样性 (0-100)
  patternScore: number;    // AI模式匹配度 (0-100)
  avgSentenceLength: number;
  punctuationRatio: number;
}

interface DetectionResult {
  aiProbability: number;
  confidence: 'low' | 'medium' | 'high';
  method: 'heuristic' | 'llm' | 'hybrid';
  metrics: HeuristicMetrics;
  needsLLM: boolean;
}

export function heuristicDetect(text: string): DetectionResult {
  // 预处理
  const sentences = splitSentences(text);
  const words = tokenize(text);
  const chars = text.replace(/\s/g, '').length;
  
  if (sentences.length < 2 || chars < 50) {
    return {
      aiProbability: 50,
      confidence: 'low',
      method: 'heuristic',
      metrics: null,
      needsLLM: true,  // 文本太短，无法判断
    };
  }
  
  // 1. Burstiness 计算
  const sentenceLengths = sentences.map(s => s.length);
  const burstiness = calculateBurstiness(sentenceLengths);
  
  // 2. 词汇多样性计算
  const diversity = calculateDiversity(words);
  
  // 3. AI 模式检测
  const patternScore = detectAIPatterns(text, sentences.length);
  
  // 4. 标点符号比例
  const punctuationRatio = calculatePunctuationRatio(text);
  
  // 5. 综合评分（加权平均）
  // 权重基于实测校准，MVP阶段可调
  const weights = {
    burstiness: 0.30,    // 句子长度变化越规律，越像AI
    diversity: 0.25,     // 词汇越单一，越像AI
    patternScore: 0.25,  // AI过渡词越多，越像AI
    punctuation: 0.20,   // 标点使用越规范，越像AI
  };
  
  // 归一化并计算
  const normalizedBurstiness = Math.min(burstiness * 2, 100);  // AI文本burstiness低
  const normalizedDiversity = (1 - diversity) * 100;            // AI文本diversity低
  
  const aiProbability = Math.round(
    normalizedBurstiness * weights.burstiness +
    normalizedDiversity * weights.diversity +
    patternScore * weights.patternScore +
    punctuationRatio * weights.punctuation
  );
  
  // 确定置信度和是否需要LLM
  let confidence: 'low' | 'medium' | 'high';
  let needsLLM: boolean;
  
  if (aiProbability < 25 || aiProbability > 85) {
    confidence = 'high';
    needsLLM = false;
  } else if (aiProbability < 40 || aiProbability > 70) {
    confidence = 'medium';
    needsLLM = true;  // 中等置信度，建议LLM验证
  } else {
    confidence = 'low';
    needsLLM = true;  // 置信度低，必须LLM验证
  }
  
  return {
    aiProbability: Math.min(Math.max(aiProbability, 0), 100),
    confidence,
    method: 'heuristic',
    metrics: {
      burstiness: normalizedBurstiness,
      diversity: normalizedDiversity,
      patternScore,
      avgSentenceLength: chars / sentences.length,
      punctuationRatio,
    },
    needsLLM,
  };
}

// ============ 辅助函数 ============

function splitSentences(text: string): string[] {
  // 支持中英文分句
  return text
    .replace(/([。！？\.\!\?]+)/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 5);  // 过滤过短的片段
}

function tokenize(text: string): string[] {
  // 中文按字分词，英文按空格分词
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
  
  return [...chineseChars, ...englishWords];
}

function calculateBurstiness(lengths: number[]): number {
  if (lengths.length < 2) return 50;
  
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, val) => 
    sum + Math.pow(val - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  
  // 变异系数 (CV) = 标准差 / 均值
  // CV 越低，文本越规律，越像AI
  const cv = (stdDev / mean) * 100;
  
  // 转换为0-100分：CV高=人类(高分)，CV低=AI(低分)
  return Math.min(Math.max(100 - cv, 0), 100);
}

function calculateDiversity(words: string[]): number {
  if (words.length === 0) return 0;
  
  const uniqueWords = new Set(words);
  return uniqueWords.size / words.length;  // 0-1之间
}

function detectAIPatterns(text: string, sentenceCount: number): number {
  // AI 常见过渡词和模式
  const patterns = {
    // 中文模式
    chinese: [
      '首先', '其次', '再次', '最后',
      '第一', '第二', '第三',
      '综上所述', '总而言之', '总的来说',
      '值得注意的是', '需要指出的是',
      '从这个角度来看', '基于以上分析',
      '不难发现', '显而易见',
      '一定程度上', '某种程度上',
      '不仅...而且', '虽然...但是',
    ],
    // 英文模式
    english: [
      'firstly', 'secondly', 'thirdly', 'finally',
      'in conclusion', 'to summarize', 'in summary',
      'it is important to note',
      'it should be noted',
      'from this perspective',
      'based on the above',
      'undoubtedly', 'obviously', 'clearly',
      'not only...but also',
      'although...however',
    ],
  };
  
  const lowerText = text.toLowerCase();
  let patternCount = 0;
  
  // 统计中文模式
  patterns.chinese.forEach(pattern => {
    const matches = text.split(pattern).length - 1;
    patternCount += matches;
  });
  
  // 统计英文模式
  patterns.english.forEach(pattern => {
    const regex = new RegExp(pattern.replace(/\./g, '\\.'), 'gi');
    const matches = (lowerText.match(regex) || []).length;
    patternCount += matches;
  });
  
  // 计算密度（每句平均出现次数）
  const density = patternCount / Math.max(sentenceCount, 1);
  
  // 转换为0-100分
  // 密度 > 2 时，认为是AI生成
  return Math.min(density * 40, 100);
}

function calculatePunctuationRatio(text: string): number {
  const punctuation = text.match(/[，。！？、；：""''（）【】]/g) || [];
  const ratio = punctuation.length / text.length;
  
  // AI文本标点使用更规范，比例相对稳定
  // 人类文本标点使用更随意
  // 理想比例在 0.05-0.15 之间
  const idealMin = 0.05;
  const idealMax = 0.15;
  
  if (ratio >= idealMin && ratio <= idealMax) {
    return 70;  // 规范使用，像AI
  } else if (ratio < idealMin) {
    return Math.max(30, ratio / idealMin * 70);  // 标点少，像人类
  } else {
    return Math.max(30, (0.25 - ratio) / 0.1 * 70);  // 标点过多，像人类
  }
}
```

### 3.3 LLM 深度分析

```typescript
// services/llmDetector.ts

interface LLMDetectionResult {
  aiProbability: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  suspiciousSegments?: string[];
}

export async function llmDetect(
  text: string,
  userTier: 'basic' | 'professional',
  apiKey: string
): Promise<LLMDetectionResult> {
  
  // 根据用户等级选择Prompt复杂度
  const prompt = userTier === 'professional' 
    ? getDetailedPrompt(text)
    : getSimplePrompt(text);
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,  // 低温度，更确定性
      max_tokens: 500,
    }),
  });
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // 解析JSON响应
  try {
    const result = JSON.parse(content);
    return {
      aiProbability: result.ai_probability,
      confidence: result.confidence,
      reasoning: result.reasoning,
      suspiciousSegments: result.suspicious_segments,
    };
  } catch (e) {
    // 解析失败，返回默认值
    return {
      aiProbability: 50,
      confidence: 'low',
      reasoning: '解析失败',
    };
  }
}

function getSimplePrompt(text: string): string {
  return `分析以下文本是否由AI生成。只输出JSON格式：

{
  "ai_probability": 0-100的数字,
  "confidence": "high|medium|low",
  "reasoning": "简要分析"
}

文本："""${text.slice(0, 2000)}"""`;
}

function getDetailedPrompt(text: string): string {
  return `分析以下文本是否由AI生成，从以下维度：
1. 语言流畅度和规律性
2. 词汇多样性
3. 句子结构变化
4. 是否存在AI常见过渡词
5. 整体写作风格

输出JSON格式：
{
  "ai_probability": 0-100,
  "confidence": "high|medium|low",
  "reasoning": "详细分析说明",
  "suspicious_segments": ["可疑句子1", "可疑句子2"]
}

文本："""${text.slice(0, 5000)}"""`;
}
```

### 3.4 结果融合策略

```typescript
function ensemble(
  heuristic: DetectionResult,
  llm: LLMDetectionResult
): DetectionResult {
  // 启发式权重 40%，LLM权重 60%
  const heuristicWeight = 0.4;
  const llmWeight = 0.6;
  
  const aiProbability = Math.round(
    heuristic.aiProbability * heuristicWeight +
    llm.aiProbability * llmWeight
  );
  
  // 取更高的置信度
  const confidence = heuristic.confidence === 'high' || llm.confidence === 'high'
    ? 'high'
    : heuristic.confidence === 'medium' || llm.confidence === 'medium'
    ? 'medium'
    : 'low';
  
  return {
    aiProbability,
    confidence,
    method: 'hybrid',
    metrics: heuristic.metrics,
    needsLLM: false,
  };
}
```

### 3.5 达到 85% 准确率的技术保障

为确保 MVP 阶段达到 **>= 85%** 准确率，采取以下措施：

#### 3.5.1 多层检测策略

```
文本输入
    │
    ▼
┌─────────────────┐
│ Layer 1: 启发式  │ ← 快速筛选，处理60%简单案例
│ (前端零成本)     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 明确案例    模糊案例
 (直接返回)   (进入Layer 2)
              │
              ▼
       ┌─────────────┐
       │ Layer 2: LLM │ ← 深度分析，处理40%复杂案例
       │ (后端高精度) │
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │ Layer 3: 校验│ ← 结果一致性校验
       │ (置信度评估) │
       └─────────────┘
```

#### 3.5.2 准确率优化策略

| 策略 | 说明 | 预期提升 |
|------|------|---------|
| **阈值调优** | 根据测试数据校准启发式权重 | +5% |
| **分层Prompt** | 不同文本类型使用不同Prompt | +3% |
| **多模型投票** | 调用2个LLM模型取平均 | +5% |
| **结果校验** | 置信度低时二次检测 | +2% |
| **中文特化** | 针对中文语法优化特征 | +5% |

#### 3.5.3 测试驱动开发

**测试数据集（MVP前必须准备）：**

| 类型 | 数量 | 来源 |
|------|------|------|
| 人类文本-学术 | 30篇 | 真实论文摘要 |
| 人类文本-博客 | 30篇 | 中文技术博客 |
| 人类文本-小说 | 20篇 | 网络小说片段 |
| 人类文本-新闻 | 20篇 | 新闻报道 |
| AI文本-GPT-4 | 40篇 | 各种Prompt生成 |
| AI文本-Claude | 30篇 | 各种Prompt生成 |
| AI文本-Gemini | 30篇 | 各种Prompt生成 |
| **总计** | **200篇** | - |

**测试流程：**
```
Day 1-2: 准备测试数据集
Day 3-4: 启发式算法调优（目标：80%准确率）
Day 5-6: LLM Prompt调优（目标：88%准确率）
Day 7:   混合策略联调（目标：>= 85%准确率）
Day 8-10: 边界案例优化
```

#### 3.5.4 准确率不达标的Fallback方案

如果MVP阶段无法达到85%，启动以下方案：

| 方案 | 实现成本 | 准确率 | 备注 |
|------|---------|--------|------|
| A. 增加LLM调用比例 | 低 | +3-5% | 成本增加30% |
| B. 集成Sapling API | 中 | 90% | 成本¥0.07/千字 |
| C. 集成Copyleaks API | 中 | 88% | 成本¥0.056/千字 |
| D. 降低免费版功能 | 低 | - | 仅保留启发式，付费才用LLM |

**决策点：** Day 7 测试后，如准确率 < 82%，启动方案A；如 < 80%，启动方案B/C。

### 4.1 MVP 成本结构

| 成本项 | 免费用户 | 基础版 | 专业版 |
|--------|---------|--------|--------|
| 启发式检测 | ¥0 | ¥0 | ¥0 |
| LLM调用比例 | 0% | 20% | 50% |
| LLM单次成本 | - | ¥0.02 | ¥0.05 |
| **月均成本/用户** | **¥0** | **¥10** | **¥30** |

**成本计算说明：**
- OpenRouter Haiku: $0.25/1M tokens ≈ ¥1.8/1M tokens
- 平均检测文本 1000 tokens
- 单次LLM检测成本: ¥0.0018 ≈ ¥0.002
- 基础版 200次/月 × 20% × ¥0.002 = ¥0.8 (按实际调整)

### 4.2 定价策略

| 等级 | 单次限制 | 月检测次数 | 定价 | 成本 | 毛利 |
|-----|---------|-----------|------|------|------|
| 免费 | 2,000字 | 50次 | ¥0 | ¥0 | - |
| 基础 | 10,000字 | 200次 | ¥19 | ¥10 | **47%** |
| 专业 | 50,000字 | 无限 | ¥49 | ¥30 | **39%** |

### 4.3 V2 阶段（集成专业API）

| API | 准确率 | 成本/1000字 | 适用场景 |
|-----|--------|------------|---------|
| Sapling | 90% | ¥0.07 | 基础版升级 |
| Copyleaks | 88% | ¥0.056 | 备选方案 |
| GPTZero | 99% | ¥0.14 | 专业版 |

**V2 定价调整：**

| 等级 | 策略 | 定价 | 预估毛利 |
|-----|------|------|---------|
| 免费 | 启发式 | 免费 | - |
| 基础 | 启发式+Sapling(10%) | ¥29 | 48% |
| 专业 | GPTZero API | ¥79 | 43% |
| 团队 | GPTZero + 批量折扣 | ¥299 | 50% |

### 4.4 达到85%准确率后的成本影响

**调整后成本模型：**

| 场景 | LLM调用比例 | 月均成本/用户 | 定价 | 毛利 |
|------|------------|--------------|------|------|
| 基础版(保守) | 30% | ¥15 | ¥19 | 21% |
| 基础版(优化) | 20% | ¥10 | ¥19 | 47% |
| 专业版 | 50% | ¥30 | ¥49 | 39% |

**成本优化措施：**
1. **Prompt优化** - 减少token使用量
2. **缓存机制** - 相同文本直接返回缓存结果
3. **批量处理** - 长文本分段并行检测
4. **模型选择** - 使用更轻量的模型处理简单案例

---

## 5. 开发计划

### 5.1 Week 1 任务分解（含准确率保障）

| 天数 | 任务 | 产出 | 负责人 | 准确率相关 |
|-----|------|------|--------|-----------|
| Day 1 | 项目初始化 | 脚手架、CI/CD | 前端 | - |
| Day 2 | UI组件开发 | Hero、TextInput | 前端 | - |
| Day 3 | **测试数据准备** | 200篇测试文本 | 产品 | ✅ 准确率基础 |
| Day 4 | 启发式算法开发 | heuristicDetector.ts | 算法 | ✅ 目标80% |
| Day 5 | 启发式算法调优 | 权重校准 | 算法 | ✅ 目标80% |
| Day 6-7 | 文件解析 | docx/pdf解析 | 前端 | - |

### 5.2 Week 2 任务分解（含准确率保障）

| 天数 | 任务 | 产出 | 负责人 | 准确率相关 |
|-----|------|------|--------|-----------|
| Day 8 | Worker API开发 | /api/detect | 后端 | - |
| Day 9 | LLM Prompt设计 | 分层Prompt | 算法 | ✅ 目标88% |
| Day 10 | OpenRouter集成 | LLM检测服务 | 后端 | ✅ 目标88% |
| Day 11 | **混合策略联调** | 融合算法 | 全栈 | ✅ **目标≥85%** |
| Day 12 | **准确率测试** | 测试报告 | 算法 | ✅ **必须≥85%** |
| Day 13 | 历史记录 | localStorage | 前端 | - |
| Day 14 | Bug修复、优化 | MVP交付 | 全栈 | ✅ 最终验收 |

### 5.3 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 18.x |
| 构建工具 | Vite | 5.x |
| 样式 | Tailwind CSS | 3.x |
| 后端 | Cloudflare Workers | - |
| 运行时 | Node.js | 20.x |
| 部署 | Cloudflare Pages | - |

---

## 6. 风险评估

### 6.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 准确率不达标 | 中 | 高 | 提前准备测试集，留调优时间 |
| OpenRouter不稳定 | 中 | 中 | 实现备用模型切换 |
| 文件解析兼容性 | 中 | 中 | 提供"粘贴文本"备选 |
| 成本超支 | 低 | 高 | 监控API调用量，设置上限 |

### 6.2 业务风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 竞品快速跟进 | 高 | 中 | 快速迭代，建立口碑 |
| 用户期望过高 | 中 | 中 | 明确标注"仅供参考" |
| 法律/伦理问题 | 低 | 高 | 免责声明，不提供正式判定 |

---

## 7. 验收标准

### 7.1 功能验收

- [ ] **AC1:** 用户在首页文本框输入任意文本，实时显示字数统计
- [ ] **AC2:** 免费用户输入超过2000字时，显示升级提示
- [ ] **AC3:** 用户可上传.txt/.md/.docx/.pdf文件，前端解析成功
- [ ] **AC4:** 点击"检测"按钮后，8秒内显示检测结果
- [ ] **AC5:** 检测结果包含AI概率（0-100%）、判定结论
- [ ] **AC6:** 检测历史自动保存到浏览器，最多20条
- [ ] **AC7:** 界面支持中英文切换

### 7.2 性能验收

- [ ] **AC8:** 首页首屏加载时间 < 2秒
- [ ] **AC9:** 10MB以内文件解析时间 < 3秒
- [ ] **AC10:** 检测API P99响应时间 < 8秒
- [ ] **AC11:** 页面Lighthouse性能评分 >= 80

### 7.3 准确率验收

- [ ] **AC12:** 纯人类文本检测准确率 >= 85%
- [ ] **AC13:** 纯AI文本检测准确率 >= 85%
- [ ] **AC14:** 综合准确率 >= 85%

---

## 附录

### A. 竞品技术指标对比

| 指标 | GPTZero | ZeroGPT | Originality | 我们的目标 |
|------|---------|---------|-------------|-----------|
| 准确率 | 99.39% | 未公开 | 95.58% | **>= 85%** (MVP) |
| FPR | 0.00% | - | 1.88% | < 10% |
| 多语言 | 24种 | 声称全支持 | 较弱 | 中文优先 |
| 对抗性 | 93.5%召回 | - | 57.3% | 暂不处理 |

### B. 测试数据集准备

建议准备以下测试数据：
1. 人类文本：100篇（学术论文、博客、小说各30+）
2. AI文本：100篇（GPT-4、Claude、Gemini生成）
3. 混合文本：50篇（人类+AI拼接）

### C. 参考资源

- OpenRouter文档: https://openrouter.ai/docs
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- mammoth.js (docx解析): https://github.com/mwilliamson/mammoth.js

---

**文档结束**

*评审意见：*
- [x] 产品经理确认（准确率必须>=85%）
- [ ] 技术可行性确认
- [ ] 成本模型确认
- [ ] 开发计划确认

---

## 文档变更记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-03-31 | 初始版本 |
| v1.1 | 2026-03-31 | 根据产品评审更新：准确率目标调整为>=85%，增加技术保障措施和Fallback方案 |
