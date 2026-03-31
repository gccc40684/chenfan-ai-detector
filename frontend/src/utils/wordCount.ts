/**
 * 计算文本字数
 * 中文按字符计算，英文按单词计算
 * 混合文本时，中文字符数 + 英文单词数
 */
export function countWords(text: string): number {
  if (!text.trim()) return 0;

  // 移除首尾空白
  const trimmed = text.trim();

  // 匹配中文字符
  const chineseChars = trimmed.match(/[\u4e00-\u9fa5]/g) || [];
  const chineseCount = chineseChars.length;

  // 移除中文字符后，按空白分割计算英文单词
  const nonChineseText = trimmed.replace(/[\u4e00-\u9fa5]/g, ' ');
  const englishWords = nonChineseText
    .split(/\s+/)
    .filter(word => word.length > 0 && /[a-zA-Z]/.test(word));
  const englishCount = englishWords.length;

  return chineseCount + englishCount;
}
