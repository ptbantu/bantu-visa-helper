import { convertPdfToImages } from '@/src/lib/pdf-to-image';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 测试 PDF 转图片功能
 */
async function testPdfToImage() {
  try {
    console.log('=== 开始测试 PDF 转图片功能 ===\n');

    // 创建一个简单的测试 PDF（使用 Buffer）
    // 这里使用一个最小的 PDF 内容作为示例
    const minimalPdf = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj\n' +
      '<< /Type /Catalog /Pages 2 0 R >>\n' +
      'endobj\n' +
      '2 0 obj\n' +
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n' +
      'endobj\n' +
      '3 0 obj\n' +
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\n' +
      'endobj\n' +
      '4 0 obj\n' +
      '<< >>\n' +
      'stream\n' +
      'BT\n' +
      '/F1 12 Tf\n' +
      '100 700 Td\n' +
      '(Test PDF) Tj\n' +
      'ET\n' +
      'endstream\n' +
      'endobj\n' +
      '5 0 obj\n' +
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n' +
      'endobj\n' +
      'xref\n' +
      '0 6\n' +
      '0000000000 65535 f\n' +
      '0000000009 00000 n\n' +
      '0000000058 00000 n\n' +
      '0000000115 00000 n\n' +
      '0000000244 00000 n\n' +
      '0000000352 00000 n\n' +
      'trailer\n' +
      '<< /Size 6 /Root 1 0 R >>\n' +
      'startxref\n' +
      '430\n' +
      '%%EOF'
    );

    console.log('测试 1: 转换测试 PDF 为图片');
    console.log(`PDF 大小: ${minimalPdf.length} 字节\n`);

    try {
      const imageBuffers = await convertPdfToImages(minimalPdf, 'test.pdf');
      console.log(`✓ 成功转换为 ${imageBuffers.length} 张图片`);

      // 保存第一张图片用于验证
      if (imageBuffers.length > 0) {
        const outputPath = path.join(process.cwd(), 'test-output.png');
        fs.writeFileSync(outputPath, imageBuffers[0]);
        console.log(`✓ 第一张图片已保存到: ${outputPath}`);
        console.log(`  图片大小: ${imageBuffers[0].length} 字节`);
      }
    } catch (error) {
      console.error('✗ PDF 转图片失败:', error);
      console.log('\n注意: 此测试需要系统安装 ImageMagick 或 Ghostscript');
      console.log('请运行: apt-get install imagemagick ghostscript');
    }

    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('测试过程中出错:', error);
    process.exit(1);
  }
}

testPdfToImage();
