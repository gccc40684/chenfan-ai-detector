# 测试数据集

本目录包含用于测试 AI 检测器的样本数据。

## 目录结构

```
tests/data/
├── human/          # 人类写作样本
│   ├── tech_blog_01.md
│   ├── academic_abstract_01.md
│   └── novel_01.md
└── ai/             # AI 生成样本
    ├── tech_article_01.md
    ├── product_description_01.md
    └── education_01.md
```

## 样本说明

### 人类写作样本 (human/)

| 文件 | 类型 | 特点 |
|------|------|------|
| tech_blog_01.md | 技术博客 | 口语化表达、个人经历、情感色彩 |
| academic_abstract_01.md | 学术论文摘要 | 正式但有人类学者的局限性和谦逊表达 |
| novel_01.md | 小说片段 | 对话为主、方言、情感细腻 |

### AI 生成样本 (ai/)

| 文件 | 类型 | 特点 |
|------|------|------|
| tech_article_01.md | 技术文章 | 结构清晰、过渡词多、总结性强 |
| product_description_01.md | 产品描述 | 功能罗列、模板化结构 |
| education_01.md | 教育内容 | 层次分明、建议系统化 |

## 扩展计划

根据 TECH_SPEC.md，MVP 阶段需要准备 200 篇测试文本：

- 人类文本-学术：30篇
- 人类文本-博客：30篇
- 人类文本-小说：20篇
- 人类文本-新闻：20篇
- AI文本-GPT-4：40篇
- AI文本-Claude：30篇
- AI文本-Gemini：30篇

## 使用方式

```typescript
import { detectAI, batchDetect } from '../frontend/src/utils/detection';
import fs from 'fs';

// 读取测试文件
const humanText = fs.readFileSync('./human/tech_blog_01.md', 'utf-8');
const aiText = fs.readFileSync('./ai/tech_article_01.md', 'utf-8');

// 单条检测
const result1 = detectAI(humanText);
const result2 = detectAI(aiText);

// 批量检测
const results = batchDetect([humanText, aiText]);
```
