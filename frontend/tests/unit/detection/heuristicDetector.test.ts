import { describe, it, expect } from 'vitest';
import {
  detectAI,
  batchDetect,
  getDetectionStats,
} from '../../../src/utils/detection/heuristicDetector';

describe('detectAI', () => {
  describe('basic functionality', () => {
    it('should handle empty string', () => {
      const result = detectAI('');
      expect(result.confidence).toBe(0);
    });

    it('should handle short text', () => {
      const result = detectAI('hi');
      expect(result.confidence).toBe(0);
    });

    it('should return result with all properties', () => {
      const result = detectAI('This is a test sentence with enough words for analysis.');
      expect(result).toHaveProperty('isAI');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('details');
    });
  });

  describe('AI text detection', () => {
    it('should detect AI-like text with uniform sentences', () => {
      // AI 生成的文本特征：句子长度均匀，词汇重复
      const aiText =
        '人工智能是计算机科学。机器学习是核心技术。深度学习是子领域。' +
        '神经网络是基础架构。自然语言处理是应用领域。';
      const result = detectAI(aiText);
      // AI 文本应该有较高分数（相对于人类文本）
      expect(result.score).toBeGreaterThan(0.35);
    });

    it('should detect AI-like English text', () => {
      const aiText =
        'Artificial intelligence is computer science. ' +
        'Machine learning is core technology. ' +
        'Deep learning is a subfield. ' +
        'Neural networks are foundational.';
      const result = detectAI(aiText);
      // AI 文本应该有较高分数（相对于人类文本）
      expect(result.score).toBeGreaterThan(0.35);
    });
  });

  describe('Human text detection', () => {
    it('should detect human-like text with variable sentences', () => {
      // 人类文本特征：句子长度变化大，词汇多样
      const humanText =
        '嘿！最近怎么样？我昨天去了一个超棒的地方，真的特别有意思。' +
        '你想听听吗？就是那家新开的咖啡馆，环境特别好，咖啡也很香。';
      const result = detectAI(humanText);
      // 人类文本应该有较低分数
      expect(result.score).toBeLessThan(0.7);
    });

    it('should detect human-like English text', () => {
      const humanText =
        'Hey! So I was thinking... maybe we should grab coffee sometime? ' +
        "I mean, if you're free. No pressure though! Just thought it'd be nice to catch up.";
      const result = detectAI(humanText);
      expect(result.score).toBeLessThan(0.7);
    });
  });

  describe('feature scores', () => {
    it('should calculate all feature scores', () => {
      const result = detectAI('This is a test with multiple sentences for analysis.');
      expect(result.features).toHaveProperty('burstiness');
      expect(result.features).toHaveProperty('diversity');
      expect(result.features).toHaveProperty('repetition');
      expect(result.features).toHaveProperty('sentenceVariation');
    });

    it('should have scores between 0 and 1', () => {
      const result = detectAI('This is a test with multiple sentences for analysis purpose.');
      Object.values(result.features).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('confidence calculation', () => {
    it('should have confidence between 0 and 1', () => {
      const result = detectAI('This is a test with multiple sentences for analysis.');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should have higher confidence for clear AI text', () => {
      const aiText = 'AI is technology. AI is science. AI is future. AI is important.';
      const result = detectAI(aiText);
      expect(result.confidence).toBeGreaterThan(0.3);
    });
  });

  describe('custom config', () => {
    it('should accept custom weights', () => {
      const result = detectAI('Test text with some content here.', {
        weights: {
          burstiness: 0.4,
          diversity: 0.3,
          repetition: 0.2,
          sentenceVariation: 0.1,
        },
      });
      expect(result.isAI).toBeDefined();
    });

    it('should accept custom thresholds', () => {
      const result = detectAI('Test text with some content here for analysis.', {
        thresholds: {
          aiScore: 0.3,
          highConfidence: 0.6,
        },
      });
      expect(result.isAI).toBeDefined();
    });
  });
});

describe('batchDetect', () => {
  it('should detect multiple texts', () => {
    const texts = ['First test text with enough words.', 'Second test text with enough words.'];
    const results = batchDetect(texts);
    expect(results).toHaveLength(2);
  });

  it('should return empty array for empty input', () => {
    const results = batchDetect([]);
    expect(results).toHaveLength(0);
  });
});

describe('getDetectionStats', () => {
  it('should calculate stats correctly', () => {
    const results = [
      { isAI: true, score: 0.8, confidence: 0.9, features: {} as any, details: {} as any },
      { isAI: true, score: 0.7, confidence: 0.8, features: {} as any, details: {} as any },
      { isAI: false, score: 0.3, confidence: 0.7, features: {} as any, details: {} as any },
    ];
    const stats = getDetectionStats(results);

    expect(stats.total).toBe(3);
    expect(stats.aiCount).toBe(2);
    expect(stats.humanCount).toBe(1);
    expect(stats.aiRatio).toBe(2 / 3);
    expect(stats.avgScore).toBe((0.8 + 0.7 + 0.3) / 3);
    expect(stats.avgConfidence).toBe((0.9 + 0.8 + 0.7) / 3);
  });

  it('should handle empty results', () => {
    const stats = getDetectionStats([]);
    expect(stats.total).toBe(0);
    expect(stats.aiCount).toBe(0);
    expect(stats.humanCount).toBe(0);
  });
});
