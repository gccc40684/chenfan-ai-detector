import { describe, it, expect } from 'vitest';
import {
  tokenize,
  tokenizeChinese,
  tokenizeEnglish,
  getAllWords,
  getWordFrequency,
  getUniqueWordCount,
  getTotalWordCount,
} from '../../../src/utils/detection/tokenize';

describe('tokenize', () => {
  describe('basic functionality', () => {
    it('should return empty array for empty string', () => {
      expect(tokenize('')).toEqual([]);
    });

    it('should tokenize Chinese characters', () => {
      const result = tokenize('你好世界');
      expect(result.map(t => t.text)).toEqual(['你', '好', '世', '界']);
      expect(result.every(t => t.type === 'chinese')).toBe(true);
    });

    it('should tokenize English words', () => {
      const result = tokenize('hello world');
      const words = result.filter(t => t.type === 'english');
      expect(words.map(t => t.text)).toEqual(['hello', 'world']);
    });
  });

  describe('token types', () => {
    it('should identify Chinese characters', () => {
      const result = tokenize('中');
      expect(result[0].type).toBe('chinese');
    });

    it('should identify English words', () => {
      const result = tokenize('test');
      expect(result[0].type).toBe('english');
    });

    it('should identify numbers', () => {
      const result = tokenize('123');
      expect(result[0].type).toBe('number');
    });

    it('should identify punctuation', () => {
      const result = tokenize('。');
      expect(result[0].type).toBe('punctuation');
    });

    it('should skip whitespace', () => {
      const result = tokenize('  hello  ');
      expect(result.map(t => t.text)).toEqual(['hello']);
    });
  });

  describe('mixed content', () => {
    it('should handle mixed Chinese and English', () => {
      const result = tokenize('Hello你好World世界');
      expect(result.map(t => t.text)).toEqual(['Hello', '你', '好', 'World', '世', '界']);
    });

    it('should handle English contractions', () => {
      const result = tokenize("don't can't");
      expect(result.map(t => t.text)).toEqual(["don't", "can't"]);
    });

    it('should handle hyphenated words', () => {
      const result = tokenize('well-known state-of-the-art');
      expect(result.map(t => t.text)).toEqual(['well-known', 'state-of-the-art']);
    });
  });

  describe('position tracking', () => {
    it('should track correct positions', () => {
      const result = tokenize('Hello world');
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(6);
    });
  });
});

describe('tokenizeChinese', () => {
  it('should extract only Chinese characters', () => {
    expect(tokenizeChinese('Hello你好World世界')).toEqual(['你', '好', '世', '界']);
  });

  it('should return empty array for no Chinese', () => {
    expect(tokenizeChinese('Hello World')).toEqual([]);
  });
});

describe('tokenizeEnglish', () => {
  it('should extract only English words in lowercase', () => {
    expect(tokenizeEnglish('Hello你好World')).toEqual(['hello', 'world']);
  });

  it('should return empty array for no English', () => {
    expect(tokenizeEnglish('你好世界')).toEqual([]);
  });
});

describe('getAllWords', () => {
  it('should return both Chinese and English words', () => {
    const result = getAllWords('Hello你好World世界');
    expect(result).toEqual(['hello', '你', '好', 'world', '世', '界']);
  });

  it('should normalize English to lowercase', () => {
    const result = getAllWords('HELLO World');
    expect(result).toEqual(['hello', 'world']);
  });
});

describe('getWordFrequency', () => {
  it('should count word frequencies', () => {
    const words = ['a', 'b', 'a', 'c', 'a', 'b'];
    const freq = getWordFrequency(words);
    expect(freq.get('a')).toBe(3);
    expect(freq.get('b')).toBe(2);
    expect(freq.get('c')).toBe(1);
  });

  it('should return empty map for empty array', () => {
    expect(getWordFrequency([]).size).toBe(0);
  });
});

describe('getUniqueWordCount', () => {
  it('should count unique words', () => {
    expect(getUniqueWordCount('a b a c')).toBe(3);
  });

  it('should handle Chinese text', () => {
    // 你好你好世界 = 6 chars: 你, 好, 你, 好, 世, 界
    // Unique: 你, 好, 世, 界 = 4
    expect(getUniqueWordCount('你好你好世界')).toBe(4);
  });
});

describe('getTotalWordCount', () => {
  it('should count total words', () => {
    expect(getTotalWordCount('a b c')).toBe(3);
  });

  it('should handle Chinese text', () => {
    expect(getTotalWordCount('你好世界')).toBe(4);
  });
});
