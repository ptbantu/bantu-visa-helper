import * as pdf2pic from 'pdf2pic';
import * as fs from 'fs';
import * as path from 'path';

// 使用固定的 /tmp 目录
const TEMP_DIR = '/tmp/bantu-visa-temp';

/**
 * 清空临时目录
 */
export function cleanupTempDirectory(): void {
  try {
    if (fs.existsSync(TEMP_DIR)) {
      const files = fs.readdirSync(TEMP_DIR);
      for (const file of files) {
        const filePath = path.join(TEMP_DIR, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          // 递归删除目录
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
      console.log(`✓ 临时目录已清空: ${TEMP_DIR}`);
    }
  } catch (error) {
    console.warn(`⚠ 清空临时目录失败: ${error}`);
  }
}

/**
 * 确保临时目录存在
 */
function ensureTempDirectory(): void {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * 将 PDF 转换为图片
 * @param pdfBuffer PDF 文件内容
 * @param filename PDF 文件名
 * @returns 图片 Buffer 数组
 */
export async function convertPdfToImages(
  pdfBuffer: Buffer,
  filename: string
): Promise<Buffer[]> {
  ensureTempDirectory();

  const timestamp = Date.now();
  const tempPdfPath = path.join(TEMP_DIR, `temp_${timestamp}_${filename}`);
  const outputDir = path.join(TEMP_DIR, `pdf_images_${timestamp}`);

  try {
    // 创建临时目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 写入临时 PDF 文件
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    console.log(`  [3.1] 临时 PDF 文件已创建: ${tempPdfPath}`);

    // 配置 pdf2pic
    const options = {
      density: 200, // DPI
      saveFilename: 'page',
      savePath: outputDir,
      format: 'png',
      width: 1024,
      height: 1024,
    };

    // 转换 PDF 为图片（-1 表示转换所有页面）
    console.log('  [3.2] 开始转换 PDF 为图片...');
    const converter = pdf2pic.fromPath(tempPdfPath, options);
    await converter.bulk(-1);

    // 读取生成的图片文件
    const files = fs.readdirSync(outputDir).sort();
    const imageBuffers: Buffer[] = [];

    for (const file of files) {
      if (file.endsWith('.png')) {
        const imagePath = path.join(outputDir, file);
        const imageBuffer = fs.readFileSync(imagePath);
        imageBuffers.push(imageBuffer);
      }
    }

    if (imageBuffers.length === 0) {
      throw new Error('PDF 转换后没有生成任何图片');
    }

    console.log(`  ✓ PDF 转换成功: ${imageBuffers.length} 张图片`);
    return imageBuffers;
  } catch (error) {
    console.error('  ✗ PDF 转图片失败:', error);
    throw error;
  } finally {
    // 清理临时文件
    try {
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.warn('  ⚠ 清理临时文件失败:', cleanupError);
    }
  }
}

/**
 * 将图片转换为 Base64
 * @param imageBuffer 图片 Buffer
 * @returns Base64 字符串
 */
export function imageToBase64(imageBuffer: Buffer): string {
  return imageBuffer.toString('base64');
}

/**
 * 将图片 Buffer 转换为 Qwen 可用的格式
 * @param imageBuffers 图片 Buffer 或 Buffer 数组
 * @returns Qwen 图片格式对象或对象数组
 */
export function imageToQwenFormat(
  imageBuffers: Buffer | Buffer[]
): { type: 'image'; image: string } | { type: 'image'; image: string }[] {
  if (Array.isArray(imageBuffers)) {
    return imageBuffers.map((buffer) => ({
      type: 'image' as const,
      image: imageToBase64(buffer),
    }));
  }

  return {
    type: 'image',
    image: imageToBase64(imageBuffers),
  };
}
