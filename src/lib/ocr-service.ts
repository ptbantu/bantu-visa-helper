import Tesseract from 'tesseract.js';
import { convertPdfToImages } from './pdf-to-image';

/**
 * 使用 Tesseract.js 从 PDF 提取文本
 */
export async function extractTextFromPdfWithTesseract(pdfBuffer: Buffer, filename: string): Promise<string> {
  try {
    console.log('  [OCR] 使用 Tesseract.js 进行 OCR 识别...');

    // 首先将 PDF 转换为图片
    const images = await convertPdfToImages(pdfBuffer, filename);

    if (images.length === 0) {
      throw new Error('无法从 PDF 提取图片');
    }

    console.log(`  [OCR] 开始识别 ${images.length} 张图片...`);

    let fullText = '';

    // 对每张图片进行 OCR
    for (let i = 0; i < images.length; i++) {
      try {
        console.log(`  [OCR] 识别第 ${i + 1}/${images.length} 张图片...`);

        const result = await Tesseract.recognize(images[i], ['eng', 'ind'] as any, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`    进度: ${Math.round(m.progress * 100)}%`);
            }
          },
        });

        fullText += result.data.text + '\n';
        console.log(`  ✓ 第 ${i + 1} 张图片识别完成`);
      } catch (error) {
        console.warn(`  ⚠ 第 ${i + 1} 张图片识别失败:`, error);
        // 继续处理下一张图片
      }
    }

    if (!fullText.trim()) {
      throw new Error('OCR 识别未获得任何文本');
    }

    console.log(`  ✓ OCR 识别完成，共提取 ${fullText.length} 个字符`);
    return fullText;
  } catch (error) {
    console.error('  ✗ Tesseract.js OCR 失败:', error);
    throw error;
  }
}

/**
 * 使用 Tesseract.js 从图片提取文本
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    console.log('  [OCR] 使用 Tesseract.js 进行图片 OCR...');

    const result = await Tesseract.recognize(imageBuffer, ['eng', 'ind'] as any, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`    进度: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const text = result.data.text;

    if (!text.trim()) {
      throw new Error('OCR 识别未获得任何文本');
    }

    console.log(`  ✓ 图片 OCR 完成，共提取 ${text.length} 个字符`);
    return text;
  } catch (error) {
    console.error('  ✗ 图片 OCR 失败:', error);
    throw error;
  }
}
