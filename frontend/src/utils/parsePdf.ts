import * as pdfjsLib from 'pdfjs-dist';

// 设置 PDF.js worker
// 使用 CDN worker 路径
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * 解析 PDF 文件，提取文字内容
 * @param file PDF 文件
 * @returns 提取的文本内容
 */
export async function parsePdf(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          reject(new Error('文件读取失败：无法获取文件内容'));
          return;
        }

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        // 检查页数
        const numPages = pdf.numPages;
        if (numPages === 0) {
          reject(new Error('PDF 文件为空'));
          return;
        }

        let fullText = '';
        let hasText = false;

        // 遍历所有页面提取文本
        for (let i = 1; i <= numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // 检查是否有文本内容
            if (textContent.items.length === 0) {
              continue;
            }

            const pageText = textContent.items
              .map((item: any) => item.str || '')
              .join(' ');

            if (pageText.trim()) {
              hasText = true;
              fullText += pageText + '\n\n';
            }
          } catch (pageError) {
            console.warn(`第 ${i} 页解析失败:`, pageError);
          }
        }

        if (!hasText) {
          reject(
            new Error(
              '无法从 PDF 中提取文字内容。这可能是一个扫描版 PDF（图片格式），请尝试使用 OCR 工具转换后再上传。'
            )
          );
          return;
        }

        resolve(fullText.trim());
      } catch (error) {
        console.error('PDF 解析错误:', error);
        reject(
          new Error(
            'PDF 解析失败：' +
              (error instanceof Error ? error.message : '未知错误')
          )
        );
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsArrayBuffer(file);
  });
}
