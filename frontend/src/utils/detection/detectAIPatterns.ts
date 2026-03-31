/**
 * AI 文本模式检测
 * 检测常见的 AI 生成文本特征
 */

import { splitSentences } from './splitSentences';
import { getAllWords, getWordFrequency } from './tokenize';

/**
 * 模式匹配
 */
export interface PatternMatch {
  pattern: string;
  count: number;
  position: number[];
}

/**
 * AI 模式检测结果
 */
export interface PatternResult {
  density: number;
  patterns: string[];
  score: number;
}

// AI 常见模式 - 按类别分组
const AI_PATTERNS = {
  // 中文 AI 常用开头
  chineseOpeners: [
    '首先，',
    '其次，',
    '最后，',
    '总之，',
    '综上所述，',
    '因此，',
    '所以，',
    '此外，',
    '另外，',
    '同时，',
    '然而，',
    '但是，',
    '尽管',
    '虽然',
    '值得注意的是，',
    '需要指出的是，',
    '不可否认的是，',
    '换句话说，',
  ],
  // 英文 AI 常用开头
  englishOpeners: [
    'Firstly,',
    'Secondly,',
    'Finally,',
    'In conclusion,',
    'Therefore,',
    'However,',
    'Moreover,',
    'Furthermore,',
    'Additionally,',
    'Nevertheless,',
    'In summary,',
    'To summarize,',
    'It is important to note that',
    'It should be noted that',
    'In other words,',
    'As a result,',
  ],
  // 中文 AI 常用词汇
  chineseFormal: [
    '具有重要意义',
    '发挥着重要作用',
    '不容忽视',
    '显而易见',
    '至关重要',
    '不可或缺',
    '必不可少',
    '显而易见',
    '有目共睹',
    '毫无疑问',
    '不可否认',
    '显而易见',
    '值得注意的是',
    '需要指出的是',
    '必须承认',
  ],
  // 英文 AI 常用词汇
  englishFormal: [
    'significant',
    'important',
    'crucial',
    'essential',
    'vital',
    'undoubtedly',
    'certainly',
    'obviously',
    'clearly',
    'it is evident that',
    'it is clear that',
    'it is obvious that',
    'plays a crucial role',
    'of great importance',
  ],
  // 结构模式
  structural: [
    '一方面',
    '另一方面',
    '首先',
    '然后',
    '接着',
    '最后',
    'on one hand',
    'on the other hand',
    'not only',
    'but also',
  ],
};

/**
 * 检测 AI 模式
 * @param text 输入文本
 * @returns 模式检测结果
 */
export function detectAIPatterns(text: string): PatternResult {
  const sentences = splitSentences(text);
  const words = getAllWords(text);
  const detectedPatterns: string[] = [];
  let totalScore = 0;

  const lowerText = text.toLowerCase();

  // 1. 检测开头模式
  for (const pattern of [...AI_PATTERNS.chineseOpeners, ...AI_PATTERNS.englishOpeners]) {
    const regex = new RegExp(`[。！？.!?]\\s*${pattern}`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      detectedPatterns.push(pattern);
      totalScore += matches.length * 0.5;
    }
  }

  // 2. 检测正式词汇
  for (const pattern of [...AI_PATTERNS.chineseFormal, ...AI_PATTERNS.englishFormal]) {
    const count = (lowerText.match(new RegExp(pattern, 'gi')) || []).length;
    if (count > 0) {
      detectedPatterns.push(pattern);
      totalScore += count * 0.3;
    }
  }

  // 3. 检测结构模式
  for (const pattern of AI_PATTERNS.structural) {
    const count = (lowerText.match(new RegExp(pattern, 'gi')) || []).length;
    if (count > 0) {
      detectedPatterns.push(pattern);
      totalScore += count * 0.4;
    }
  }

  // 4. 检测重复开头模式
  const startPatterns = new Map<string, number>();
  for (const sentence of sentences) {
    const start = sentence.slice(0, 3).trim();
    if (start) {
      startPatterns.set(start, (startPatterns.get(start) || 0) + 1);
    }
  }
  for (const [, count] of startPatterns) {
    if (count >= 2) {
      totalScore += count * 0.3;
    }
  }

  // 5. 检测过度使用连接词
  const freq = getWordFrequency(words);
  const connectorWords = [
    '和',
    '与',
    '或',
    '以及',
    '还有',
    '并且',
    '而且',
    '但是',
    '然而',
    'and',
    'or',
    'but',
    'however',
  ];
  let connectorCount = 0;
  for (const word of connectorWords) {
    connectorCount += freq.get(word) || 0;
  }
  const connectorRatio = words.length > 0 ? connectorCount / words.length : 0;
  if (connectorRatio > 0.15) {
    totalScore += connectorRatio * 2;
  }

  // 6. 检测重复句式结构（AI 常见特征）
  const structureScore = detectRepetitiveStructure(sentences);
  totalScore += structureScore;

  // 7. 检测重复开头词
  const repetitiveStartScore = detectRepetitiveStart(sentences);
  totalScore += repetitiveStartScore;

  // 计算密度（每句平均匹配数）
  const density = sentences.length > 0 ? totalScore / sentences.length : 0;

  return {
    density,
    patterns: [...new Set(detectedPatterns)],
    score: totalScore,
  };
}

/**
 * 检测重复句式结构
 * AI 文本常有相似的句子结构，如"X是Y。X是Z。"
 */
function detectRepetitiveStructure(sentences: string[]): number {
  if (sentences.length < 3) return 0;

  // 提取每个句子的开头模式（前几个字）
  const startPatterns: string[] = [];
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    // 提取前 4-6 个字符作为结构模式
    const start = trimmed.slice(0, Math.min(6, trimmed.length));
    if (start.length >= 3) {
      startPatterns.push(start);
    }
  }

  // 统计相似开头的数量
  let repetitiveCount = 0;
  const patternCounts = new Map<string, number>();

  for (const pattern of startPatterns) {
    // 简化模式：只保留前 3 个字符
    const simplified = pattern.slice(0, 3);
    patternCounts.set(simplified, (patternCounts.get(simplified) || 0) + 1);
  }

  for (const [, count] of patternCounts) {
    if (count >= 2) {
      repetitiveCount += count - 1; // 重复次数
    }
  }

  // 返回分数
  return repetitiveCount * 0.4;
}

/**
 * 检测重复开头词
 * AI 文本常有重复的主语或开头词
 */
function detectRepetitiveStart(sentences: string[]): number {
  if (sentences.length < 3) return 0;

  // 提取每个句子的第一个词
  const firstWords: string[] = [];
  for (const sentence of sentences) {
    const match = sentence.trim().match(/^[\u4e00-\u9fa5]+|[a-zA-Z]+/);
    if (match) {
      firstWords.push(match[0].toLowerCase());
    }
  }

  // 统计重复
  const wordCounts = new Map<string, number>();
  for (const word of firstWords) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }

  let score = 0;
  for (const [word, count] of wordCounts) {
    if (count >= 2 && word.length >= 2) {
      score += (count - 1) * 0.5;
    }
  }

  return score;
}

/**
 * 获取模式摘要
 * @param result 模式检测结果
 * @returns 摘要字符串
 */
export function getPatternSummary(result: PatternResult): string {
  if (result.patterns.length === 0) {
    return 'No AI patterns detected';
  }

  const topPatterns = result.patterns.slice(0, 5);
  return `Detected ${result.patterns.length} patterns: ${topPatterns.join(', ')}${result.patterns.length > 5 ? '...' : ''}`;
}
