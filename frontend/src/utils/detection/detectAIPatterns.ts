/**
 * AI 模式检测模块
 * 检测文本中常见的 AI 生成特征
 * 包括过渡词、句式模式、结构特征等
 */

import { splitSentences } from './splitSentences';

/**
 * AI 常见过渡词和短语（中文）
 */
const CHINESE_PATTERNS = {
  // 列举型过渡词
  enumeration: ['首先', '其次', '再次', '最后', '第一', '第二', '第三', '第四', '第五'],

  // 总结型过渡词
  summary: ['综上所述', '总而言之', '总的来说', '总之', '归纳起来', '总体来看'],

  // 强调型过渡词
  emphasis: ['值得注意的是', '需要指出的是', '特别重要的是', '关键在于', '尤其是'],

  // 转折型过渡词
  contrast: ['然而', '但是', '不过', '尽管如此', '虽然', '尽管'],

  // 因果型过渡词
  causation: ['因此', '所以', '由此可见', '基于此', '由此可知', '导致', '使得'],

  // 解释型过渡词
  explanation: ['换句话说', '也就是说', '具体来说', '具体而言', '简而言之'],

  // 递进型过渡词
  progression: ['不仅如此', '更重要的是', '进一步说', '此外', '另外', '而且'],

  // 视角型短语
  perspective: ['从这个角度来看', '基于以上分析', '从某种程度上说', '在一定程度上'],

  // 判断型短语
  judgment: ['不难发现', '显而易见', ' Clearly', '显然', '毫无疑问'],

  // 程度修饰
  degree: ['一定程度上', '某种程度上', '相当', '比较', '相对'],
};

/**
 * AI 常见过渡词和短语（英文）
 */
const ENGLISH_PATTERNS = {
  enumeration: ['firstly', 'secondly', 'thirdly', 'finally', 'first', 'second', 'third'],

  summary: ['in conclusion', 'to summarize', 'in summary', 'to sum up', 'overall', 'all in all'],

  emphasis: ['it is important to note', 'it should be noted', 'it is worth noting', 'notably'],

  contrast: ['however', 'nevertheless', 'nonetheless', 'on the other hand', 'conversely'],

  causation: ['therefore', 'thus', 'consequently', 'as a result', 'hence', 'accordingly'],

  explanation: ['in other words', 'that is to say', 'to put it another way', 'specifically'],

  progression: ['furthermore', 'moreover', 'additionally', 'in addition', 'besides'],

  perspective: ['from this perspective', 'from this angle', 'in this context'],

  judgment: ['undoubtedly', 'obviously', 'clearly', 'evidently', 'apparently', 'certainly'],

  degree: ['to some extent', 'to a certain degree', 'relatively', 'fairly', 'quite'],
};

/**
 * AI 句式模式（正则表达式）
 */
const SENTENCE_PATTERNS = [
  // 中文句式
  /不仅[^，]+而且/g, // 不仅...而且
  /虽然[^，]+但是/g, // 虽然...但是
  /因为[^，]+所以/g, // 因为...所以
  /如果[^，]+那么/g, // 如果...那么
  /既[^，]+又/g, // 既...又
  /一方面[^，]+另一方面/g, // 一方面...另一方面
  /首先[^，]+然后/g, // 首先...然后
  /从[^，]+来看/g, // 从...来看
  /在[^，]+方面/g, // 在...方面
  /通过[^，]+可以/g, // 通过...可以
  /有助于[^，]+/g, // 有助于...
  /旨在[^，]+/g, // 旨在...
  /旨在[^。]+/g, // 旨在...
  /体现了[^，]+/g, // 体现了...
  /反映了[^，]+/g, // 反映了...
  /说明了[^，]+/g, // 说明了...

  // 英文句式
  /not only[^,]+but also/gi,
  /although[^,]+however/gi,
  /because[^,]+therefore/gi,
  /if[^,]+then/gi,
  /both[^,]+and/gi,
  /on the one hand[^,]+on the other hand/gi,
  /first[^,]+then/gi,
  /from[^,]+perspective/gi,
  /in terms of[^,]+/gi,
  /helps to[^,]+/gi,
  /aims to[^,]+/gi,
  /reflects[^,]+/gi,
  /demonstrates[^,]+/gi,
  /indicates[^,]+/gi,
];

/**
 * 模式检测结果
 */
export interface PatternResult {
  totalScore: number; // 0-100
  chineseMatches: PatternMatch[];
  englishMatches: PatternMatch[];
  sentenceMatches: PatternMatch[];
  density: number; // 每句平均匹配数
}

/**
 * 单个模式匹配结果
 */
export interface PatternMatch {
  pattern: string;
  category: string;
  count: number;
  positions: number[];
}

/**
 * 检测 AI 模式
 * @param text 输入文本
 * @returns 模式检测结果
 */
export function detectAIPatterns(text: string): PatternResult {
  const sentences = splitSentences(text);
  const sentenceCount = Math.max(sentences.length, 1);

  // 检测中文模式
  const chineseMatches = detectChinesePatterns(text);

  // 检测英文模式
  const englishMatches = detectEnglishPatterns(text);

  // 检测句式模式
  const sentenceMatches = detectSentencePatterns(text);

  // 计算总匹配数
  const totalMatches =
    chineseMatches.reduce((sum, m) => sum + m.count, 0) +
    englishMatches.reduce((sum, m) => sum + m.count, 0) +
    sentenceMatches.reduce((sum, m) => sum + m.count, 0);

  // 计算密度（每句平均匹配数）
  const density = totalMatches / sentenceCount;

  // 计算分数
  // 密度 > 2 时，认为是高度 AI 特征
  // 密度 < 0.5 时，认为是人类特征
  let score = 0;
  if (density <= 0.5) {
    score = density * 40; // 0-20 分
  } else if (density <= 1.5) {
    score = 20 + (density - 0.5) * 40; // 20-60 分
  } else {
    score = Math.min(60 + (density - 1.5) * 40, 100); // 60-100 分
  }

  return {
    totalScore: Math.round(score),
    chineseMatches,
    englishMatches,
    sentenceMatches,
    density: Math.round(density * 100) / 100,
  };
}

/**
 * 检测中文模式
 */
function detectChinesePatterns(text: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  for (const [category, patterns] of Object.entries(CHINESE_PATTERNS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'g');
      const occurrences: number[] = [];
      let match;

      while ((match = regex.exec(text)) !== null) {
        occurrences.push(match.index);
      }

      if (occurrences.length > 0) {
        matches.push({
          pattern,
          category,
          count: occurrences.length,
          positions: occurrences,
        });
      }
    }
  }

  return matches;
}

/**
 * 检测英文模式
 */
function detectEnglishPatterns(text: string): PatternMatch[] {
  const matches: PatternMatch[] = [];
  const lowerText = text.toLowerCase();

  for (const [category, patterns] of Object.entries(ENGLISH_PATTERNS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.replace(/\./g, '\\.'), 'gi');
      const occurrences: number[] = [];
      let match;

      while ((match = regex.exec(lowerText)) !== null) {
        occurrences.push(match.index);
      }

      if (occurrences.length > 0) {
        matches.push({
          pattern,
          category,
          count: occurrences.length,
          positions: occurrences,
        });
      }
    }
  }

  return matches;
}

/**
 * 检测句式模式
 */
function detectSentencePatterns(text: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  for (const pattern of SENTENCE_PATTERNS) {
    const occurrences: number[] = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      occurrences.push(match.index);
    }

    if (occurrences.length > 0) {
      matches.push({
        pattern: pattern.source.substring(0, 30) + '...',
        category: 'sentence_pattern',
        count: occurrences.length,
        positions: occurrences,
      });
    }
  }

  return matches;
}

/**
 * 获取模式统计摘要
 */
export function getPatternSummary(result: PatternResult): string {
  const totalMatches =
    result.chineseMatches.reduce((sum, m) => sum + m.count, 0) +
    result.englishMatches.reduce((sum, m) => sum + m.count, 0) +
    result.sentenceMatches.reduce((sum, m) => sum + m.count, 0);

  const topChinese = result.chineseMatches
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(m => `${m.pattern}(${m.count})`)
    .join(', ');

  const topEnglish = result.englishMatches
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(m => `${m.pattern}(${m.count})`)
    .join(', ');

  return `AI模式检测: 共发现 ${totalMatches} 个匹配，密度 ${result.density}/句。`;
}
