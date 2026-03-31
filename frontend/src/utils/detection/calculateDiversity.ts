/**
 * 词汇多样性计算模块
 * 使用 TTR (Type-Token Ratio) 和 MTLD (Measure of Textual Lexical Diversity)
 * AI 生成的文本通常词汇多样性较低
 */

import { getAllWords, getWordFrequency } from './tokenize';

/**
 * 计算 TTR (Type-Token Ratio)
 * TTR = 唯一词汇数 / 总词汇数
 * 值越小表示词汇重复度越高（AI 特征）
 * 值越大表示词汇越丰富（人类特征）
 *
 * @param text 输入文本
 * @returns TTR 值（0-1）
 */
export function calculateTTR(text: string): number {
  const words = getAllWords(text);

  if (words.length === 0) {
    return 0;
  }

  const uniqueWords = new Set(words);
  return uniqueWords.size / words.length;
}

/**
 * 计算 RTTR (Root TTR)
 * RTTR = 唯一词汇数 / sqrt(总词汇数)
 * 对文本长度更不敏感
 *
 * @param text 输入文本
 * @returns RTTR 值
 */
export function calculateRTTR(text: string): number {
  const words = getAllWords(text);

  if (words.length === 0) {
    return 0;
  }

  const uniqueWords = new Set(words);
  return uniqueWords.size / Math.sqrt(words.length);
}

/**
 * 计算 CTTR (Corrected TTR)
 * CTTR = 唯一词汇数 / sqrt(2 * 总词汇数)
 *
 * @param text 输入文本
 * @returns CTTR 值
 */
export function calculateCTTR(text: string): number {
  const words = getAllWords(text);

  if (words.length === 0) {
    return 0;
  }

  const uniqueWords = new Set(words);
  return uniqueWords.size / Math.sqrt(2 * words.length);
}

/**
 * 计算 MTLD (Measure of Textual Lexical Diversity)
 * 使用因子计算，对文本长度不敏感
 * 值越小表示词汇多样性越低（AI 特征）
 *
 * @param text 输入文本
 * @param factor 因子阈值（默认 0.72）
 * @returns MTLD 值
 */
export function calculateMTLD(text: string, factor: number = 0.72): number {
  const words = getAllWords(text);

  if (words.length < 10) {
    return 0;
  }

  // 正向计算
  const forwardFactors = countFactors(words, factor);

  // 反向计算
  const reversedWords = [...words].reverse();
  const backwardFactors = countFactors(reversedWords, factor);

  // 取平均值
  const totalFactors = (forwardFactors + backwardFactors) / 2;

  if (totalFactors === 0) {
    return words.length;
  }

  return words.length / totalFactors;
}

/**
 * 计算因子数量
 */
function countFactors(words: string[], factor: number): number {
  let factors = 0;
  let currentTypes = new Set<string>();
  let currentTokens = 0;

  for (const word of words) {
    currentTypes.add(word);
    currentTokens++;

    const currentTTR = currentTypes.size / currentTokens;

    if (currentTTR <= factor) {
      factors++;
      currentTypes = new Set<string>();
      currentTokens = 0;
    }
  }

  // 处理剩余部分
  if (currentTokens > 0) {
    const remainingTTR = currentTypes.size / currentTokens;
    factors += remainingTTR / factor;
  }

  return factors;
}

/**
 * 计算重复词比例
 * 统计出现频率最高的词的比例
 * AI 文本往往有更高的重复词比例
 *
 * @param text 输入文本
 * @returns 重复词比例（0-1）
 */
export function calculateRepetitionRate(text: string): number {
  const words = getAllWords(text);

  if (words.length === 0) {
    return 0;
  }

  const freq = getWordFrequency(words);

  if (freq.size === 0) {
    return 0;
  }

  // 找出最高频的词
  let maxFreq = 0;
  for (const count of freq.values()) {
    if (count > maxFreq) {
      maxFreq = count;
    }
  }

  return maxFreq / words.length;
}

/**
 * 计算 Hapax 比例（只出现一次的词）
 * 人类文本通常有更多独特表达
 *
 * @param text 输入文本
 * @returns Hapax 比例（0-1）
 */
export function calculateHapaxRatio(text: string): number {
  const words = getAllWords(text);

  if (words.length === 0) {
    return 0;
  }

  const freq = getWordFrequency(words);
  let hapaxCount = 0;

  for (const count of freq.values()) {
    if (count === 1) {
      hapaxCount++;
    }
  }

  return hapaxCount / freq.size;
}

/**
 * 多样性分析结果
 */
export interface DiversityResult {
  ttr: number;
  rttr: number;
  cttr: number;
  mtld: number;
  repetitionRate: number;
  hapaxRatio: number;
  totalWords: number;
  uniqueWords: number;
}

/**
 * 完整的多样性分析
 * @param text 输入文本
 * @returns 多样性分析结果
 */
export function analyzeDiversity(text: string): DiversityResult {
  const words = getAllWords(text);
  const uniqueWords = new Set(words);

  return {
    ttr: calculateTTR(text),
    rttr: calculateRTTR(text),
    cttr: calculateCTTR(text),
    mtld: calculateMTLD(text),
    repetitionRate: calculateRepetitionRate(text),
    hapaxRatio: calculateHapaxRatio(text),
    totalWords: words.length,
    uniqueWords: uniqueWords.size,
  };
}
