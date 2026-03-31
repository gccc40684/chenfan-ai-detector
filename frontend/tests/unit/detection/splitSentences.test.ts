import { describe, it, expect } from 'vitest';
import {
  splitSentences,
  getSentenceLength,
  getSentenceLengths,
} from '../../../src/utils/detection/splitSentences';

describe('splitSentences', () => {
  describe('basic functionality', () => {
    it('should return empty array for empty string', () => {
      expect(splitSentences('')).toEqual([]);
    });

    it('should return empty array for whitespace only', () => {
      expect(splitSentences('   ')).toEqual([]);
    });

    it('should handle single sentence', () => {
      const text = '这是一个句子。';
      expect(splitSentences(text)).toEqual(['这是一个句子。']);
    });
  });

  describe('Chinese sentences', () => {
    it('should split Chinese sentences by 。', () => {
      const text = '这是第一句。这是第二句。这是第三句。';
      expect(splitSentences(text)).toEqual(['这是第一句。', '这是第二句。', '这是第三句。']);
    });

    it('should split by multiple Chinese punctuation marks', () => {
      const text = '你好吗？我很好！我们走吧。';
      expect(splitSentences(text)).toEqual(['你好吗？', '我很好！', '我们走吧。']);
    });

    it('should handle ；as sentence separator', () => {
      const text = '第一分句；第二分句；第三分句。';
      expect(splitSentences(text)).toEqual(['第一分句；', '第二分句；', '第三分句。']);
    });
  });

  describe('English sentences', () => {
    it('should split English sentences by period', () => {
      const text = 'This is sentence one. This is sentence two.';
      expect(splitSentences(text)).toEqual(['This is sentence one.', 'This is sentence two.']);
    });

    it('should split by multiple punctuation marks', () => {
      const text = "How are you? I am fine! Let's go.";
      expect(splitSentences(text)).toEqual(['How are you?', 'I am fine!', "Let's go."]);
    });
  });

  describe('mixed Chinese and English', () => {
    it('should handle mixed text', () => {
      const text = 'Hello world. 这是一个中文句子。This is English.';
      expect(splitSentences(text)).toEqual([
        'Hello world.',
        '这是一个中文句子。',
        'This is English.',
      ]);
    });
  });

  describe('abbreviations handling', () => {
    it('should not split on Mr.', () => {
      const text = 'Mr. Smith went to Washington.';
      expect(splitSentences(text)).toEqual(['Mr. Smith went to Washington.']);
    });

    it('should not split on Dr.', () => {
      const text = 'Dr. Johnson is a doctor.';
      expect(splitSentences(text)).toEqual(['Dr. Johnson is a doctor.']);
    });

    it('should handle multiple abbreviations', () => {
      const text = 'Mr. and Mrs. Smith live on St. James St.';
      expect(splitSentences(text)).toEqual(['Mr. and Mrs. Smith live on St. James St.']);
    });

    it('should handle i.e. and e.g.', () => {
      const text = 'Use examples, i.e. samples, or e.g. demonstrations.';
      expect(splitSentences(text)).toEqual(['Use examples, i.e. samples, or e.g. demonstrations.']);
    });
  });

  describe('quotes and brackets', () => {
    it('should handle sentences in quotes', () => {
      const text = 'He said "Hello." Then he left.';
      const result = splitSentences(text);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle parentheses', () => {
      const text = 'This is a sentence (with parentheses). Next sentence.';
      const result = splitSentences(text);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('newlines handling', () => {
    it('should treat newlines as spaces', () => {
      const text = 'Line one.\nLine two.\n\nLine three.';
      expect(splitSentences(text)).toEqual(['Line one.', 'Line two.', 'Line three.']);
    });
  });
});

describe('getSentenceLength', () => {
  it('should return 0 for empty sentence', () => {
    expect(getSentenceLength('')).toBe(0);
  });

  it('should count Chinese characters', () => {
    expect(getSentenceLength('这是一个句子。')).toBe(6);
  });

  it('should count English words', () => {
    expect(getSentenceLength('Hello world!')).toBe(10);
  });

  it('should ignore punctuation', () => {
    expect(getSentenceLength('Hello, world!!!')).toBe(10);
  });
});

describe('getSentenceLengths', () => {
  it('should return lengths for all sentences', () => {
    const text = '短句。这是一个比较长的句子。';
    expect(getSentenceLengths(text)).toEqual([2, 10]);
  });

  it('should return empty array for empty text', () => {
    expect(getSentenceLengths('')).toEqual([]);
  });
});
