import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import OSS from 'ali-oss';
import pdfParse from 'pdf-parse';
import prisma from '@/src/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// 类型定义
// ============================================================================

interface ParsedVisaData {
  customer_name: string;
  passport_no: string;
  visa_type: string;
  expiry_date: string; // YYYY-MM-DD
  entry_date: string | null; // YYYY-MM-DD or null
}

interface PDFAttachment {
  filename: string;
  content: Buffer;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 初始化 OSS 客户端
 */
function initOSSClient(): OSS {
  return new OSS({
    region: process.env.OSS_REGION || 'oss-ap-southeast-5',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BUCKET_NAME || 'bantuqifu-dev',
  });
}

/**
 * 上传 PDF 到 OSS
 */
async function uploadPdfToOSS(pdfBuffer: Buffer, filename: string): Promise<string> {
  try {
    const oss = initOSSClient();

    // 生成 OSS 路径：visas/YYYYMMDD/UUID.pdf
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const uuid = uuidv4();
    const ossPath = `visas/${dateStr}/${uuid}.pdf`;

    // 上传到 OSS
    const result = await oss.put(ossPath, pdfBuffer);

    console.log(`✓ PDF 上传成功: ${ossPath}`);

    // 返回 OSS URL
    return result.url || `https://${process.env.OSS_BUCKET_NAME}.${process.env.OSS_REGION}.aliyuncs.com/${ossPath}`;
  } catch (error) {
    console.error('上传 PDF 到 OSS 失败:', error);
    throw error;
  }
}

/**
 * 从 PDF 中提取文本
 */
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('提取 PDF 文本失败:', error);
    throw error;
  }
}

/**
 * 清洗 JSON 字符串：移除 markdown 代码块
 */
function cleanJsonString(str: string): string {
  let cleaned = str.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  cleaned = cleaned.trim();
  return cleaned;
}

/**
 * 验证解析的签证数据
 */
function validateVisaData(data: any): data is ParsedVisaData {
  return (
    typeof data.customer_name === 'string' &&
    typeof data.passport_no === 'string' &&
    typeof data.visa_type === 'string' &&
    typeof data.expiry_date === 'string' &&
    (data.entry_date === null || typeof data.entry_date === 'string')
  );
}

/**
 * 调用阿里云 Qwen 模型进行数据提取
 */
async function parseWithQwen(pdfText: string): Promise<ParsedVisaData | null> {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      console.error('DASHSCOPE_API_KEY 未配置');
      return null;
    }

    const systemPrompt = `你是一个印尼签证解析专家。请从以下 PDF 文本中提取：
- customer_name: 客户姓名
- passport_no: 护照号码
- visa_type: 签证类型
- expiry_date: 到期日期（格式：YYYY-MM-DD）
- entry_date: 入境日期（格式：YYYY-MM-DD，如果没有则为 null）

必须且仅输出纯净的 JSON 字符串，不要带有 markdown 标记（如 \`\`\`json）。`;

    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-max',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: pdfText,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      console.error(`Qwen API 错误: ${response.status} ${response.statusText}`);
      return null;
    }

    const result = await response.json();

    if (result.choices?.[0]?.message?.content) {
      const content = result.choices[0].message.content;

      // 清洗 JSON 字符串
      const cleanedJson = cleanJsonString(content);

      // 解析 JSON
      const parsedData = JSON.parse(cleanedJson);

      // 验证数据
      if (validateVisaData(parsedData)) {
        return parsedData;
      } else {
        console.error('解析的数据格式不符合要求:', parsedData);
        return null;
      }
    }

    console.error('Qwen API 返回格式异常:', result);
    return null;
  } catch (error) {
    console.error('调用 Qwen API 失败:', error);
    return null;
  }
}

/**
 * 从邮件中提取 PDF 附件
 */
async function extractPDFAttachments(email: any): Promise<PDFAttachment[]> {
  const attachments: PDFAttachment[] = [];

  if (email.attachments && Array.isArray(email.attachments)) {
    for (const attachment of email.attachments) {
      // 检查是否为 PDF
      const isPDF =
        attachment.contentType === 'application/pdf' ||
        (attachment.filename && attachment.filename.toLowerCase().endsWith('.pdf'));

      if (isPDF) {
        try {
          const content = await attachment.content.buffer();
          attachments.push({
            filename: attachment.filename || 'unknown.pdf',
            content,
          });
        } catch (error) {
          console.error(`提取 PDF 附件 ${attachment.filename} 失败:`, error);
        }
      }
    }
  }

  return attachments;
}

/**
 * 处理单个 PDF 附件的完整流程
 */
async function processPDFAttachment(
  pdfAttachment: PDFAttachment,
  uid: number
): Promise<boolean> {
  try {
    console.log(`处理 PDF 附件: ${pdfAttachment.filename} (UID: ${uid})`);

    // 步骤 A: 上传 PDF 到 OSS
    console.log('  [A] 上传 PDF 到 OSS...');
    const ossUrl = await uploadPdfToOSS(pdfAttachment.content, pdfAttachment.filename);
    console.log(`  ✓ OSS URL: ${ossUrl}`);

    // 步骤 B: 提取 PDF 文本
    console.log('  [B] 提取 PDF 文本...');
    const pdfText = await extractTextFromPDF(pdfAttachment.content);
    console.log(`  ✓ 提取文本长度: ${pdfText.length} 字符`);

    // 步骤 C: 调用 Qwen 进行 AI 解析
    console.log('  [C] 调用 Qwen 进行数据提取...');
    const visaData = await parseWithQwen(pdfText);

    if (!visaData) {
      console.error('  ✗ Qwen 解析失败');
      return false;
    }

    console.log(`  ✓ 解析成功: ${visaData.customer_name} (${visaData.passport_no})`);

    // 步骤 D: 数据清洗（已在 parseWithQwen 中完成）

    // 步骤 E: 复合防重入库
    console.log('  [E] 检查数据库中是否已存在...');

    const existingRecord = await prisma.visaRecord.findFirst({
      where: {
        passport_no: visaData.passport_no,
        expiry_date: new Date(visaData.expiry_date),
      },
    });

    if (existingRecord) {
      console.log(
        `  ⚠ 记录已存在 (passport_no: ${visaData.passport_no}, expiry_date: ${visaData.expiry_date})，跳过`
      );
      return true;
    }

    // Step 1: Upsert customer
    console.log('  创建或更新客户信息...');
    const customer = await prisma.customer.upsert({
      where: { passport_no: visaData.passport_no },
      update: {
        name: visaData.customer_name,
      },
      create: {
        passport_no: visaData.passport_no,
        name: visaData.customer_name,
      },
    });

    // Step 2: Create visa record with relationships
    console.log('  创建签证记录...');
    await prisma.visaRecord.create({
      data: {
        customerId: customer.id,
        visaTypeCode: 'UNKNOWN', // Will be mapped from visa_type later
        passport_no: visaData.passport_no,
        expiry_date: new Date(visaData.expiry_date),
        entry_date: visaData.entry_date ? new Date(visaData.entry_date) : null,
        is_urgent: false,
        reminder_enabled: true,
        file_url: ossUrl,
      },
    });

    console.log(`  ✓ 签证记录创建成功`);
    return true;
  } catch (error) {
    console.error(`处理 PDF 附件 ${pdfAttachment.filename} 失败:`, error);
    return false;
  }
}

/**
 * 处理单封邮件
 */
async function processEmail(imap: ImapFlow, uid: number): Promise<boolean> {
  let isEmailFullyProcessed = true;

  try {
    console.log(`\n处理邮件 UID: ${uid}`);

    // 获取邮件内容
    const message = await imap.fetchOne(uid, { source: true });

    if (!message) {
      console.error(`无法获取邮件 UID ${uid}`);
      return false;
    }

    // 解析邮件
    const parsed = await simpleParser(message.source);

    // 提取 PDF 附件
    const pdfAttachments = await extractPDFAttachments(parsed);

    if (pdfAttachments.length === 0) {
      console.log(`邮件 UID ${uid} 没有 PDF 附件，跳过`);
      return true;
    }

    console.log(`找到 ${pdfAttachments.length} 个 PDF 附件`);

    // 遍历每个 PDF 附件
    for (const pdfAttachment of pdfAttachments) {
      try {
        const success = await processPDFAttachment(pdfAttachment, uid);

        if (!success) {
          console.error(`PDF 附件 ${pdfAttachment.filename} 处理失败，中止该邮件的后续处理`);
          isEmailFullyProcessed = false;
          break; // 中止当前邮件的剩余附件处理
        }
      } catch (error) {
        console.error(`处理 PDF 附件 ${pdfAttachment.filename} 异常:`, error);
        isEmailFullyProcessed = false;
        break; // 中止当前邮件的剩余附件处理
      }
    }

    // 邮件状态收尾：若全部成功且包含 PDF，则标记为已读
    if (isEmailFullyProcessed && pdfAttachments.length > 0) {
      try {
        console.log(`标记邮件 UID ${uid} 为已读...`);
        await imap.messageFlagsSet(uid, ['\\Seen']);
        console.log(`✓ 邮件 UID ${uid} 已标记为已读`);
      } catch (error) {
        console.error(`标记邮件 UID ${uid} 为已读失败:`, error);
        // 即使标记失败也不影响整体流程
      }
    } else if (!isEmailFullyProcessed) {
      console.warn(`邮件 UID ${uid} 处理失败，保持未读状态`);
    }

    return isEmailFullyProcessed;
  } catch (error) {
    console.error(`处理邮件 UID ${uid} 异常:`, error);
    return false;
  }
}

/**
 * 连接 IMAP 并处理未读邮件
 */
async function fetchEmailsFromImap(): Promise<{ processedCount: number; successCount: number }> {
  const imapConfig = {
    host: process.env.IMAP_HOST || 'imap.qq.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    secure: true,
    auth: {
      user: process.env.EMAIL_ACCOUNT || 'admin@bantuqifu.com',
      pass: process.env.EMAIL_PASSWORD || '',
    },
  };

  if (!imapConfig.auth.pass) {
    console.error('EMAIL_PASSWORD 未配置');
    return { processedCount: 0, successCount: 0 };
  }

  const imap = new ImapFlow(imapConfig);
  let processedCount = 0;
  let successCount = 0;

  try {
    // 连接到 IMAP 服务器
    console.log('连接到 IMAP 服务器...');
    await imap.connect();
    console.log('✓ IMAP 连接成功');

    // 打开收件箱
    console.log('打开收件箱...');
    const mailbox = await imap.mailboxOpen('INBOX');
    console.log(`✓ 收件箱打开成功，共 ${mailbox.exists} 封邮件`);

    // 搜索未读邮件
    console.log('搜索未读邮件...');
    const searchResults = await imap.search({ seen: false });

    if (!searchResults || searchResults.length === 0) {
      console.log('没有未读邮件');
      await imap.logout();
      return { processedCount: 0, successCount: 0 };
    }

    console.log(`找到 ${searchResults.length} 封未读邮件`);

    // 处理每封邮件
    for (const uid of searchResults) {
      try {
        processedCount++;
        const success = await processEmail(imap, uid);

        if (success) {
          successCount++;
        }
      } catch (error) {
        console.error(`处理邮件 UID ${uid} 异常:`, error);
        // 继续处理下一封邮件，不阻塞整个流程
        continue;
      }
    }

    // 关闭连接
    await imap.logout();
    console.log('✓ IMAP 连接已关闭');

    return { processedCount, successCount };
  } catch (error) {
    console.error('IMAP 处理过程中出错:', error);
    try {
      await imap.logout();
    } catch (logoutError) {
      console.error('关闭 IMAP 连接失败:', logoutError);
    }
    return { processedCount, successCount };
  }
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function GET(request: Request) {
  try {
    console.log('\n=== 开始执行邮件抓取 Cron Job ===');
    console.log(`时间: ${new Date().toISOString()}`);

    // 验证 Cron 密钥（可选但推荐）
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      console.warn('Cron 密钥验证失败');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 执行邮件抓取
    const { processedCount, successCount } = await fetchEmailsFromImap();

    console.log(`\n=== 邮件抓取完成 ===`);
    console.log(`处理邮件数: ${processedCount}`);
    console.log(`成功邮件数: ${successCount}`);

    return NextResponse.json({
      success: true,
      message: `成功处理 ${successCount}/${processedCount} 封邮件`,
      processedCount,
      successCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron Job 执行失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 支持 POST 请求（用于手动触发）
export async function POST(request: Request) {
  return GET(request);
}
