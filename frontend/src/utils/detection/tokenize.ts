/**
 * 分词/分字函数
 * 中文按字符分词
 * 英文按单词分词
 */

/**
 * Token 类型
 */
export interface Token {
  text: string;
  type: 'chinese' | 'english' | 'number' | 'punctuation' | 'other';
  position: number;
}

/**
 * 分词函数 - 中英文混合分词
 * @param text 输入文本
 * @returns Token 数组
 */
export function tokenize(text: string): Token[] {
  if (!text || text.length === 0) {
    return [];
  }

  const tokens: Token[] = [];
  let position = 0;

  // 使用正则表达式匹配不同类型的 token
  const regex =
    /[\u4e00-\u9fa5]|[a-zA-Z]+(?:[''-][a-zA-Z]+)*|\d+(?:\.\d+)?|[\s\n\r]+|[。！？；.!?,:，、""''（）()【】\[\]]|./g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const tokenText = match[0];
    const type = getTokenType(tokenText);

    // 跳过空白字符
    if (type === 'whitespace') {
      position += tokenText.length;
      continue;
    }

    tokens.push({
      text: tokenText,
      type: type === 'whitespace' ? 'other' : type,
      position,
    });

    position += tokenText.length;
  }

  return tokens;
}

/**
 * 获取 token 类型
 */
function getTokenType(text: string): Token['type'] | 'whitespace' {
  // 中文汉字
  if (/^[\u4e00-\u9fa5]$/.test(text)) {
    return 'chinese';
  }

  // 英文单词（包含连字符和撇号）
  if (/^[a-zA-Z]+(?:[''-][a-zA-Z]+)*$/.test(text)) {
    return 'english';
  }

  // 数字
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    return 'number';
  }

  // 空白字符
  if (/^[\s\n\r]+$/.test(text)) {
    return 'whitespace';
  }

  // 标点符号
  if (/^[。！？；.!?,:，、""''（）()【】\[\]]$/.test(text)) {
    return 'punctuation';
  }

  return 'other';
}

/**
 * 获取中文分字结果
 * @param text 输入文本
 * @returns 中文字符数组
 */
export function tokenizeChinese(text: string): string[] {
  const tokens = tokenize(text);
  return tokens.filter(t => t.type === 'chinese').map(t => t.text);
}

/**
 * 获取英文分词结果
 * @param text 输入文本
 * @returns 英文单词数组（小写）
 */
export function tokenizeEnglish(text: string): string[] {
  const tokens = tokenize(text);
  return tokens.filter(t => t.type === 'english').map(t => t.text.toLowerCase());
}

/**
 * 获取所有有效词汇（中文字符 + 英文单词）
 * @param text 输入文本
 * @returns 词汇数组
 */
export function getAllWords(text: string): string[] {
  const tokens = tokenize(text);
  return tokens
    .filter(t => t.type === 'chinese' || t.type === 'english')
    .map(t => (t.type === 'english' ? t.text.toLowerCase() : t.text));
}

/**
 * 统计词频
 * @param words 词汇数组
 * @returns 词频映射
 */
export function getWordFrequency(words: string[]): Map<string, number> {
  const freq = new Map<string, number>();

  for (const word of words) {
    const count = freq.get(word) || 0;
    freq.set(word, count + 1);
  }

  return freq;
}

/**
 * 获取唯一词汇数
 * @param text 输入文本
 * @returns 唯一词汇数
 */
export function getUniqueWordCount(text: string): number {
  const words = getAllWords(text);
  const uniqueWords = new Set(words);
  return uniqueWords.size;
}

/**
 * 获取总词汇数
 * @param text 输入文本
 * @returns 总词汇数
 */
export function getTotalWordCount(text: string): number {
  return getAllWords(text).length;
}
