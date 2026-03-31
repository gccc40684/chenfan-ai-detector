/**
 * Burstiness 计算模块
 * 计算句子长度的变异系数（Coefficient of Variation）
 * AI 生成的文本通常具有更均匀的句子长度
 */

import { getSentenceLengths } from './splitSentences';

/**
 * 计算数组的标准差
 * @param values 数值数组
 * @returns 标准差
 */
function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * 计算数组的平均值
 * @param values 数值数组
 * @returns 平均值
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * 计算 Burstiness（变异系数）
 * CV = 标准差 / 平均值
 * 值越小表示句子长度越均匀（AI 特征）
 * 值越大表示句子长度变化越大（人类特征）
 *
 * @param text 输入文本
 * @returns Burstiness 值（0-∞，通常 0-2）
 */
export function calculateBurstiness(text: string): number {
  const lengths = getSentenceLengths(text);

  if (lengths.length < 2) {
    return 0;
  }

  const mean = calculateMean(lengths);

  if (mean === 0) {
    return 0;
  }

  const stdDev = calculateStdDev(lengths);
  const cv = stdDev / mean;

  return cv;
}

/**
 * Burstiness 分析结果
 */
export interface BurstinessResult {
  burstiness: number;
  sentenceCount: number;
  avgLength: number;
  stdDev: number;
  minLength: number;
  maxLength: number;
  isUniform: boolean;
}

/**
 * 详细的 Burstiness 分析
 * @param text 输入文本
 * @returns 详细分析结果
 */
export function analyzeBurstiness(text: string): BurstinessResult {
  const lengths = getSentenceLengths(text);

  if (lengths.length === 0) {
    return {
      burstiness: 0,
      sentenceCount: 0,
      avgLength: 0,
      stdDev: 0,
      minLength: 0,
      maxLength: 0,
      isUniform: false,
    };
  }

  const mean = calculateMean(lengths);
  const stdDev = calculateStdDev(lengths);
  const cv = mean > 0 ? stdDev / mean : 0;

  // 判断句子长度是否均匀（AI 特征）
  // CV < 0.3 认为是非常均匀的
  const isUniform = cv < 0.3;

  return {
    burstiness: cv,
    sentenceCount: lengths.length,
    avgLength: mean,
    stdDev,
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    isUniform,
  };
}
