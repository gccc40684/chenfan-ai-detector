import { parseDocx } from './parseDocx';
import { parseTextFile } from './parseTextFile';
import { parsePdf } from './parsePdf';

/**
 * 支持的文件类型
 */
export type SupportedFileType = '.txt' | '.md' | '.docx' | '.pdf';

/**
 * 文件解析结果
 */
export interface ParseResult {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * 支持的 MIME 类型映射
 */
const SUPPORTED_MIME_TYPES: Record<string, SupportedFileType> = {
  'text/plain': '.txt',
  'text/markdown': '.md',
  'text/x-markdown': '.md',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/pdf': '.pdf',
};

/**
 * 支持的文件扩展名
 */
const SUPPORTED_EXTENSIONS: string[] = ['.txt', '.md', '.docx', '.pdf'];

/**
 * 检查文件类型是否支持
 * @param file 文件对象
 * @returns 是否支持
 */
export function isSupportedFile(file: File): boolean {
  const ext = getFileExtension(file.name).toLowerCase();
  // 检查扩展名或 MIME 类型
  return SUPPORTED_EXTENSIONS.includes(ext) || file.type in SUPPORTED_MIME_TYPES;
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 扩展名（包含点）
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot);
}

/**
 * 获取支持的文件类型列表（用于显示）
 * @returns 文件类型描述字符串
 */
export function getSupportedFileTypes(): string {
  return '.txt, .md, .docx, .pdf';
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 根据文件类型调用相应的解析器
 * @param file 文件对象
 * @returns 解析结果
 */
export async function parseFile(file: File): Promise<ParseResult> {
  // 检查文件大小（限制 10MB）
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return {
      success: false,
      text: '',
      error: '文件大小超过限制（最大 10MB）',
    };
  }

  // 检查文件类型
  if (!isSupportedFile(file)) {
    return {
      success: false,
      text: '',
      error: `不支持的文件类型。支持的类型：${getSupportedFileTypes()}`,
    };
  }

  const ext = getFileExtension(file.name).toLowerCase() as SupportedFileType;

  try {
    let text: string;

    switch (ext) {
      case '.txt':
      case '.md':
        text = await parseTextFile(file);
        break;
      case '.docx':
        text = await parseDocx(file);
        break;
      case '.pdf':
        text = await parsePdf(file);
        break;
      default:
        return {
          success: false,
          text: '',
          error: `不支持的文件类型: ${ext}`,
        };
    }

    // 清理文本内容
    const cleanedText = text
      .replace(/\r\n/g, '\n') // 统一换行符
      .replace(/\n{3,}/g, '\n\n') // 合并多余空行
      .trim();

    if (!cleanedText) {
      return {
        success: false,
        text: '',
        error: '文件内容为空',
      };
    }

    return {
      success: true,
      text: cleanedText,
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : '文件解析失败',
    };
  }
}
