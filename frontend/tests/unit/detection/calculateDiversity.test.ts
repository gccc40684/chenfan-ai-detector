import { describe, it, expect } from 'vitest';
import {
  calculateTTR,
  calculateRTTR,
  calculateCTTR,
  calculateMTLD,
  calculateRepetitionRate,
  calculateHapaxRatio,
  analyzeDiversity,
} from '../../../src/utils/detection/calculateDiversity';

describe('calculateTTR', () => {
  it('should return 0 for empty string', () => {
    expect(calculateTTR('')).toBe(0);
  });

  it('should return 1 for all unique words', () => {
    expect(calculateTTR('a b c d e')).toBe(1);
  });

  it('should return 0.5 for half unique words', () => {
    expect(calculateTTR('a a b b')).toBe(0.5);
  });

  it('should handle Chinese text', () => {
    // 你好你好世界 = 6 chars: 你, 好, 你, 好, 世, 界
    // Unique: 你, 好, 世, 界 = 4
    const ttr = calculateTTR('你好你好世界');
    expect(ttr).toBeCloseTo(0.667, 2); // 4 unique / 6 total
  });
});

describe('calculateRTTR', () => {
  it('should return 0 for empty string', () => {
    expect(calculateRTTR('')).toBe(0);
  });

  it('should calculate root TTR', () => {
    const rttr = calculateRTTR('a b c d');
    expect(rttr).toBe(2); // 4 / sqrt(4) = 4 / 2 = 2
  });
});

describe('calculateCTTR', () => {
  it('should return 0 for empty string', () => {
    expect(calculateCTTR('')).toBe(0);
  });

  it('should calculate corrected TTR', () => {
    const cttr = calculateCTTR('a b c d');
    expect(cttr).toBeCloseTo(1.414, 2); // 4 / sqrt(8) ≈ 1.414
  });
});

describe('calculateMTLD', () => {
  it('should return 0 for short text', () => {
    expect(calculateMTLD('a b c')).toBe(0);
  });

  it('should calculate MTLD for longer text', () => {
    const text =
      'The quick brown fox jumps over the lazy dog. ' +
      'A quick brown dog jumps over the lazy fox. ' +
      'The lazy fox sleeps under the quick brown tree.';
    const mtld = calculateMTLD(text);
    expect(mtld).toBeGreaterThan(0);
  });

  it('should have lower MTLD for repetitive text', () => {
    const repetitive = 'the the the the the the the the the the the the the the the';
    const diverse = 'a b c d e f g h i j k l m n o p q r s t u v w x y z';
    expect(calculateMTLD(repetitive)).toBeLessThan(calculateMTLD(diverse));
  });
});

describe('calculateRepetitionRate', () => {
  it('should return 0 for empty string', () => {
    expect(calculateRepetitionRate('')).toBe(0);
  });

  it('should return 1 for all same words', () => {
    expect(calculateRepetitionRate('a a a a')).toBe(1);
  });

  it('should calculate correct repetition rate', () => {
    // "the" appears 3 times out of 7 words (the, cat, and, the, dog, and, the)
    const rate = calculateRepetitionRate('the cat and the dog and the');
    expect(rate).toBeCloseTo(0.429, 2); // 3/7
  });
});

describe('calculateHapaxRatio', () => {
  it('should return 0 for empty string', () => {
    expect(calculateHapaxRatio('')).toBe(0);
  });

  it('should return 1 for all unique words', () => {
    expect(calculateHapaxRatio('a b c d e')).toBe(1);
  });

  it('should calculate hapax ratio correctly', () => {
    // a(2), b(2), c(1), d(1) -> hapax = 2/4 = 0.5
    const ratio = calculateHapaxRatio('a a b b c d');
    expect(ratio).toBe(0.5);
  });
});

describe('analyzeDiversity', () => {
  it('should return complete analysis', () => {
    const result = analyzeDiversity('a b c d e');

    expect(result).toHaveProperty('ttr');
    expect(result).toHaveProperty('rttr');
    expect(result).toHaveProperty('cttr');
    expect(result).toHaveProperty('mtld');
    expect(result).toHaveProperty('repetitionRate');
    expect(result).toHaveProperty('hapaxRatio');
    expect(result).toHaveProperty('totalWords');
    expect(result).toHaveProperty('uniqueWords');
  });

  it('should count words correctly', () => {
    const result = analyzeDiversity('a b a c');
    expect(result.totalWords).toBe(4);
    expect(result.uniqueWords).toBe(3);
  });

  it('should have lower TTR for repetitive text (AI-like)', () => {
    const aiLike = '人工智能是技术。人工智能是科学。人工智能是未来。';
    const humanLike = '我喜欢在周末去公园散步，看着孩子们玩耍，感觉生活很美好。';

    const aiTTR = calculateTTR(aiLike);
    const humanTTR = calculateTTR(humanLike);

    expect(aiTTR).toBeLessThan(humanTTR);
  });
});
