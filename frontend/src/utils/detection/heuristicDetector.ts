/**
 * 启发式 AI 文本检测器
 * 基于多种语言特征进行综合分析
 * 准确率目标：>= 85%
 */

import { analyzeBurstiness } from './calculateBurstiness';
import { analyzeDiversity } from './calculateDiversity';
import { splitSentences } from './splitSentences';
import { getAllWords } from './tokenize';

/**
 * 检测结果
 */
export interface DetectionResult {
  isAI: boolean;
  confidence: number;
  score: number;
  features: FeatureScores;
  details: {
    sentenceCount: number;
    wordCount: number;
    burstiness: number;
    ttr: number;
    mtld: number;
  };
}

/**
 * 特征分数
 */
export interface FeatureScores {
  burstiness: number;
  diversity: number;
  repetition: number;
  sentenceVariation: number;
}

/**
 * 启发式检测配置
 */
export interface DetectorConfig {
  // 权重配置
  weights: {
    burstiness: number;
    diversity: number;
    repetition: number;
    sentenceVariation: number;
  };
  // 阈值配置
  thresholds: {
    aiScore: number;
    highConfidence: number;
  };
}

// 默认配置
const DEFAULT_CONFIG: DetectorConfig = {
  weights: {
    burstiness: 0.25,
    diversity: 0.30,
    repetition: 0.25,
    sentenceVariation: 0.20,
  },
  thresholds: {
    aiScore: 0.5,
    highConfidence: 0.7,
  },
};

/**
 * 启发式 AI 检测主函数
 * @param text 输入文本
 * @param config 可选配置
 * @returns 检测结果
 */
export function detectAI(text: string, config: Partial<DetectorConfig> = {}): DetectionResult {
  const finalConfig = mergeConfig(config);

  // 基本检查
  if (!text || text.trim().length === 0) {
    return createEmptyResult();
  }

  const sentences = splitSentences(text);
  const words = getAllWords(text);

  if (sentences.length < 2 || words.length < 10) {
    return createEmptyResult();
  }

  // 计算各项特征
  const burstinessResult = analyzeBurstiness(text);
  const diversityResult = analyzeDiversity(text);

  // 计算特征分数（0-1，越高越像 AI）
  const features: FeatureScores = {
    // Burstiness：CV 越低越像 AI
    burstiness: calculateBurstinessScore(burstinessResult.burstiness),
    // Diversity：TTR 越低越像 AI
    diversity: calculateDiversityScore(diversityResult.ttr, diversityResult.mtld),
    // Repetition：重复率越高越像 AI
    repetition: Math.min(diversityResult.repetitionRate * 5, 1),
    // Sentence Variation：句子长度范围越小越像 AI
    sentenceVariation: calculateSentenceVariationScore(
      burstinessResult.maxLength - burstinessResult.minLength,
      burstinessResult.avgLength
    ),
  };

  // 计算综合得分
  const score = calculateWeightedScore(features, finalConfig.weights);

  // 判断结果
  const isAI = score >= finalConfig.thresholds.aiScore;
  const confidence = calculateConfidence(score, features);

  return {
    isAI,
    confidence,
    score,
    features,
    details: {
      sentenceCount: sentences.length,
      wordCount: words.length,
      burstiness: burstinessResult.burstiness,
      ttr: diversityResult.ttr,
      mtld: diversityResult.mtld,
    },
  };
}

/**
 * 计算 Burstiness 分数
 * CV < 0.3: 非常均匀 (AI 特征明显) -> 高分
 * CV > 0.8: 变化很大 (人类特征) -> 低分
 */
function calculateBurstinessScore(cv: number): number {
  if (cv < 0.3) return 1.0;
  if (cv < 0.5) return 0.8;
  if (cv < 0.8) return 0.5;
  return 0.2;
}

/**
 * 计算多样性分数
 * TTR 越低越像 AI
 */
function calculateDiversityScore(ttr: number, mtld: number): number {
  // TTR 分数
  let ttrScore: number;
  if (ttr < 0.4) ttrScore = 1.0;
  else if (ttr < 0.5) ttrScore = 0.8;
  else if (ttr < 0.6) ttrScore = 0.6;
  else if (ttr < 0.7) ttrScore = 0.4;
  else ttrScore = 0.2;

  // MTLD 分数（MTLD 越低多样性越低）
  let mtldScore: number;
  if (mtld < 50) mtldScore = 1.0;
  else if (mtld < 80) mtldScore = 0.7;
  else if (mtld < 120) mtldScore = 0.4;
  else mtldScore = 0.2;

  // 综合
  return (ttrScore + mtldScore) / 2;
}

/**
 * 计算句子变化分数
 */
function calculateSentenceVariationScore(range: number, avgLength: number): number {
  if (avgLength === 0) return 0.5;

  const relativeRange = range / avgLength;

  // 相对范围越小越像 AI
  if (relativeRange < 0.5) return 1.0;
  if (relativeRange < 1.0) return 0.7;
  if (relativeRange < 1.5) return 0.4;
  return 0.2;
}

/**
 * 计算加权得分
 */
function calculateWeightedScore(features: FeatureScores, weights: DetectorConfig['weights']): number {
  const totalWeight = weights.burstiness + weights.diversity + weights.repetition + weights.sentenceVariation;

  const weightedSum =
    features.burstiness * weights.burstiness +
    features.diversity * weights.diversity +
    features.repetition * weights.repetition +
    features.sentenceVariation * weights.sentenceVariation;

  return weightedSum / totalWeight;
}

/**
 * 计算置信度
 */
function calculateConfidence(score: number, features: FeatureScores): number {
  // 基于分数距离 0.5 的距离和特征方差计算置信度
  const distanceFromCenter = Math.abs(score - 0.5) * 2; // 0-1

  // 计算特征方差
  const featureValues = Object.values(features);
  const mean = featureValues.reduce((a, b) => a + b, 0) / featureValues.length;
  const variance = featureValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / featureValues.length;
  const consistency = 1 - Math.sqrt(variance); // 特征一致性

  // 综合置信度
  return Math.min((distanceFromCenter * 0.6 + consistency * 0.4) * 1.2, 1);
}

/**
 * 合并配置
 */
function mergeConfig(config: Partial<DetectorConfig>): DetectorConfig {
  return {
    weights: { ...DEFAULT_CONFIG.weights, ...config.weights },
    thresholds: { ...DEFAULT_CONFIG.thresholds, ...config.thresholds },
  };
}

/**
 * 创建空结果
 */
function createEmptyResult(): DetectionResult {
  return {
    isAI: false,
    confidence: 0,
    score: 0.5,
    features: {
      burstiness: 0.5,
      diversity: 0.5,
      repetition: 0.5,
      sentenceVariation: 0.5,
    },
    details: {
      sentenceCount: 0,
      wordCount: 0,
      burstiness: 0,
      ttr: 0,
      mtld: 0,
    },
  };
}

/**
 * 批量检测
 * @param texts 文本数组
 * @returns 检测结果数组
 */
export function batchDetect(texts: string[]): DetectionResult[] {
  return texts.map(text => detectAI(text));
}

/**
 * 获取检测统计
 * @param results 检测结果数组
 * @returns 统计数据
 */
export function getDetectionStats(results: DetectionResult[]) {
  const total = results.length;
  const aiCount = results.filter(r => r.isAI).length;
  const humanCount = total - aiCount;

  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / total;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / total;

  return {
    total,
    aiCount,
    humanCount,
    aiRatio: aiCount / total,
    avgScore,
    avgConfidence,
  };
}
