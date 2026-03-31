/**
 * AI 文本检测工具库
 * 提供启发式检测功能
 */

export { splitSentences, getSentenceLengths, getSentenceLength } from './splitSentences';
export {
  tokenize,
  tokenizeChinese,
  tokenizeEnglish,
  getAllWords,
  getWordFrequency,
  getUniqueWordCount,
  getTotalWordCount,
  type Token,
} from './tokenize';
export { calculateBurstiness, analyzeBurstiness, type BurstinessResult } from './calculateBurstiness';
export {
  calculateTTR,
  calculateRTTR,
  calculateCTTR,
  calculateMTLD,
  calculateRepetitionRate,
  calculateHapaxRatio,
  analyzeDiversity,
  type DiversityResult,
} from './calculateDiversity';
export {
  detectAI,
  batchDetect,
  getDetectionStats,
  type DetectionResult,
  type FeatureScores,
  type DetectorConfig,
} from './heuristicDetector';
