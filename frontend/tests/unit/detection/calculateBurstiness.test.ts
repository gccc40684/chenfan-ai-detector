import { describe, it, expect } from 'vitest';
import {
  calculateBurstiness,
  analyzeBurstiness,
} from '../../../src/utils/detection/calculateBurstiness';

describe('calculateBurstiness', () => {
  describe('basic functionality', () => {
    it('should return 0 for empty string', () => {
      expect(calculateBurstiness('')).toBe(0);
    });

    it('should return 0 for single sentence', () => {
      expect(calculateBurstiness('这是一个句子。')).toBe(0);
    });

    it('should calculate CV for multiple sentences', () => {
      const text = '短句。这是一个比较长的句子。';
      const cv = calculateBurstiness(text);
      expect(cv).toBeGreaterThan(0);
    });
  });

  describe('uniform sentences (AI-like)', () => {
    it('should have low CV for uniform length sentences', () => {
      // AI 生成的文本通常句子长度均匀
      const text = '人工智能是计算机科学。机器学习是核心技术。深度学习是子领域。';
      const cv = calculateBurstiness(text);
      expect(cv).toBeLessThan(0.5);
    });
  });

  describe('variable sentences (human-like)', () => {
    it('should have high CV for variable length sentences', () => {
      // 人类文本通常句子长度变化大
      const text = '短。这是一个中等长度的句子。这是一个非常非常非常非常长的句子，包含很多内容。';
      const cv = calculateBurstiness(text);
      expect(cv).toBeGreaterThan(0.3);
    });
  });

  describe('English text', () => {
    it('should handle English sentences', () => {
      const text =
        'Short. This is a medium sentence. This is a very long sentence with many words in it.';
      const cv = calculateBurstiness(text);
      expect(cv).toBeGreaterThan(0);
    });
  });
});

describe('analyzeBurstiness', () => {
  it('should return detailed analysis', () => {
    const text = '第一句。第二句比较长。第三句。';
    const result = analyzeBurstiness(text);

    expect(result).toHaveProperty('burstiness');
    expect(result).toHaveProperty('sentenceCount');
    expect(result).toHaveProperty('avgLength');
    expect(result).toHaveProperty('stdDev');
    expect(result).toHaveProperty('minLength');
    expect(result).toHaveProperty('maxLength');
    expect(result).toHaveProperty('isUniform');
  });

  it('should count sentences correctly', () => {
    const text = '第一句。第二句。第三句。';
    const result = analyzeBurstiness(text);
    expect(result.sentenceCount).toBe(3);
  });

  it('should calculate min and max length', () => {
    const text = '短。这是一个长句子。';
    const result = analyzeBurstiness(text);
    expect(result.minLength).toBe(1);
    expect(result.maxLength).toBe(7);
  });

  it('should identify uniform text', () => {
    // 非常均匀的句子
    const text = '这是第一句。这是第二句。这是第三句。这是第四句。';
    const result = analyzeBurstiness(text);
    expect(result.isUniform).toBe(true);
  });

  it('should identify non-uniform text', () => {
    // 变化很大的句子
    const text = '短。这是一个非常非常非常非常长的句子。';
    const result = analyzeBurstiness(text);
    expect(result.isUniform).toBe(false);
  });

  it('should handle empty text', () => {
    const result = analyzeBurstiness('');
    expect(result.sentenceCount).toBe(0);
    expect(result.burstiness).toBe(0);
  });
});
