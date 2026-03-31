/**
 * 中英文分句函数
 * 支持中文句号、问号、感叹号、分号
 * 支持英文句号、问号、感叹号
 * 处理引号、括号等边界情况
 */

/**
 * 分句函数 - 支持中英文混合文本
 * @param text 输入文本
 * @returns 句子数组
 */
export function splitSentences(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // 清理文本：统一换行符为空格
  const cleaned = text.replace(/[\n\r]+/g, ' ').trim();

  // 定义句子结束标记
  // 中文：。！？；
  // 英文：.!?
  // 注意：处理缩写如 Dr. Mr. Mrs. 等
  const sentenceEndRegex = /([。！？；.!?])(?=\s*[""''】\]\)|\s|$)|([。！？；.!?])(?=[""''】\]\)]*\s*)/g;

  // 先保护常见的缩写
  const protectedText = protectAbbreviations(cleaned);

  // 分割句子
  const parts = protectedText.split(sentenceEndRegex).filter(Boolean);

  // 重建句子
  const sentences: string[] = [];
  let currentSentence = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    currentSentence += part;

    // 检查是否是结束标记
    if (/^[。！？；.!?]$/.test(part)) {
      const restored = restoreAbbreviations(currentSentence.trim());
      if (restored.length > 0) {
        sentences.push(restored);
      }
      currentSentence = '';
    }
  }

  // 处理最后可能剩余的文本
  if (currentSentence.trim()) {
    const restored = restoreAbbreviations(currentSentence.trim());
    if (restored.length > 0) {
      sentences.push(restored);
    }
  }

  // 过滤空句子和清理
  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * 保护缩写 - 将缩写中的句点替换为占位符
 */
function protectAbbreviations(text: string): string {
  const abbreviations = [
    'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.',
    'Jr.', 'Sr.', 'St.',
    'vs.', 'etc.', 'i.e.', 'e.g.',
    'a.m.', 'p.m.', 'A.M.', 'P.M.',
    'Inc.', 'Ltd.', 'Corp.',
    'Jan.', 'Feb.', 'Mar.', 'Apr.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
  ];

  let protectedText = text;
  abbreviations.forEach((abbr, index) => {
    const placeholder = `__ABBR_${index}__`;
    protectedText = protectedText.replace(new RegExp(abbr.replace('.', '\\.'), 'g'), placeholder);
  });

  return protectedText;
}

/**
 * 恢复缩写 - 将占位符替换回缩写
 */
function restoreAbbreviations(text: string): string {
  const abbreviations = [
    'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.',
    'Jr.', 'Sr.', 'St.',
    'vs.', 'etc.', 'i.e.', 'e.g.',
    'a.m.', 'p.m.', 'A.M.', 'P.M.',
    'Inc.', 'Ltd.', 'Corp.',
    'Jan.', 'Feb.', 'Mar.', 'Apr.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
  ];

  let restoredText = text;
  abbreviations.forEach((abbr, index) => {
    const placeholder = `__ABBR_${index}__`;
    restoredText = restoredText.replace(new RegExp(placeholder, 'g'), abbr);
  });

  return restoredText;
}

/**
 * 获取句子长度（字符数）
 * @param sentence 句子
 * @returns 字符数
 */
export function getSentenceLength(sentence: string): number {
  // 移除标点符号后计算有效字符数
  const cleanSentence = sentence.replace(/[\s\n\r。！？；.!?,，、""''（）()【】\[\]]/g, '');
  return cleanSentence.length;
}

/**
 * 获取句子长度数组
 * @param text 输入文本
 * @returns 句子长度数组
 */
export function getSentenceLengths(text: string): number[] {
  const sentences = splitSentences(text);
  return sentences.map(getSentenceLength);
}
