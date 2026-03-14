import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import prisma from '@/src/lib/prisma';
import { uploadPdfToOSS } from '@/src/lib/oss';
import { convertPdfToImages, imageToQwenFormat } from '@/src/lib/pdf-to-image';
import { v4 as uuidv4 } from 'uuid';

// pdf-parse 导入
const pdfParse = require('pdf-parse');

// ============================================================================
// 类型定义
// ============================================================================

interface ParsedVisaData {
  customer_name: string;
  passport_no: string;
  visa_type: string;
  expiry_date: string;
  entry_date: string | null;
}

interface PDFAttachment {
  filename: string;
  content: Buffer;
}

// ============================================================================
// 工具函数
// ============================================================================

async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('提取 PDF 文本失败:', error);
    throw error;
  }
}

function cleanJsonString(str: string): string {
  let cleaned = str.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  cleaned = cleaned.trim();
  return cleaned;
}

function validateVisaData(data: any): data is ParsedVisaData {
  return (
    typeof data.customer_name === 'string' &&
    typeof data.passport_no === 'string' &&
    typeof data.visa_type === 'string' &&
    typeof data.expiry_date === 'string' &&
    (data.entry_date === null || typeof data.entry_date === 'string')
  );
}

async function parseWithQwen(pdfText: string): Promise<ParsedVisaData | null> {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY 未配置');
    }

    const systemPrompt = `你是一个印尼签证解析专家。请从以下图片中提取：
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: pdfText },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Qwen API 错误: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (result.choices?.[0]?.message?.content) {
      const content = result.choices[0].message.content;
      const cleanedJson = cleanJsonString(content);
      const parsedData = JSON.parse(cleanedJson);

      if (validateVisaData(parsedData)) {
        return parsedData;
      } else {
        throw new Error('解析的数据格式不符合要求');
      }
    }

    throw new Error('Qwen API 返回格式异常');
  } catch (error) {
    console.error('调用 Qwen API 失败:', error);
    throw error;
  }
}

/**
 * 使用 Qwen 图片识别 API 解析签证信息
 */
async function parseWithQwenImage(imageBuffers: Buffer[]): Promise<ParsedVisaData | null> {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY 未配置');
    }

    if (!imageBuffers || imageBuffers.length === 0) {
      throw new Error('没有可用的图片进行识别');
    }

    const userPrompt = `你是一个印尼签证解析专家。请从以下图片中提取：
- customer_name: 客户姓名
- passport_no: 护照号码
- visa_type: 签证类型
- expiry_date: 到期日期（格式：YYYY-MM-DD）
- entry_date: 入境日期（格式：YYYY-MM-DD，如果没有则为 null）

必须且仅输出纯净的 JSON 字符串，不要带有 markdown 标记（如 \`\`\`json）。`;

    // 构建消息内容，包含提示和所有图片
    const messageContent: any[] = [{ type: 'text', text: userPrompt }];

    for (const imageBuffer of imageBuffers) {
      messageContent.push({
        type: 'image',
        image: imageBuffer.toString('base64'),
      });
    }

    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-max',
        messages: [
          { role: 'user', content: messageContent },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Qwen API 错误: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (result.choices?.[0]?.message?.content) {
      const content = result.choices[0].message.content;
      const cleanedJson = cleanJsonString(content);
      const parsedData = JSON.parse(cleanedJson);

      if (validateVisaData(parsedData)) {
        return parsedData;
      } else {
        throw new Error('解析的数据格式不符合要求');
      }
    }

    throw new Error('Qwen API 返回格式异常');
  } catch (error) {
    console.error('调用 Qwen 图片识别 API 失败:', error);
    throw error;
  }
}

/**
 * 智能识别流程：优先图片识别，失败则降级到文本识别
 */
async function smartParseVisaData(pdfBuffer: Buffer, filename: string): Promise<ParsedVisaData | null> {
  try {
    // 尝试图片识别
    const imageBuffers = await convertPdfToImages(pdfBuffer, filename);
    return await parseWithQwenImage(imageBuffers);
  } catch (imageError) {
    console.warn(`图片识别失败: ${imageError instanceof Error ? imageError.message : String(imageError)}`);

    // 降级到文本识别
    const pdfText = await extractTextFromPDF(pdfBuffer);
    return await parseWithQwen(pdfText);
  }
}

async function extractPDFAttachments(email: any): Promise<PDFAttachment[]> {
  const attachments: PDFAttachment[] = [];

  if (email.attachments && Array.isArray(email.attachments)) {
    for (const attachment of email.attachments) {
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

// ============================================================================
// 核心处理流程：记账式处理
// ============================================================================

/**
 * 处理单个 PDF 附件的完整流程
 * 1. 预记账：创建 EmailProcessLog 记录
 * 2. 核心处理：AI 提取 → 数据暂存 → 业务入库
 * 3. 状态闭环：SUCCESS 或 FAILED
 */
async function processPDFAttachment(
  pdfAttachment: PDFAttachment,
  messageId: string,
  uid: number
): Promise<{ success: boolean; logId: string }> {
  let logId = '';

  try {
    console.log(`\n处理 PDF 附件: ${pdfAttachment.filename} (UID: ${uid})`);

    // ========== 步骤 1: 预记账 ==========
    console.log('  [1] 上传 PDF 到 OSS...');
    const { ossUrl, pdfKey } = await uploadPdfToOSS(pdfAttachment.content, pdfAttachment.filename);
    console.log(`  ✓ OSS URL: ${ossUrl}`);

    // 创建 EmailProcessLog 记录（状态为 PENDING）
    console.log('  [2] 创建处理日志记录...');
    const logRecord = await prisma.emailProcessLog.create({
      data: {
        messageId,
        pdfKey,
        pdfFilename: pdfAttachment.filename,
        status: 'PENDING',
      },
    });
    logId = logRecord.id;
    console.log(`  ✓ 日志记录创建成功 (ID: ${logId})`);

    // ========== 步骤 2: 核心处理流程 (Try-Catch 包裹) ==========
    try {
      // 2.1 AI 提取 - 智能识别（优先图片识别，降级到文本识别）
      console.log('  [3] 启动智能识别流程...');
      const visaData = await smartParseVisaData(pdfAttachment.content, pdfAttachment.filename);

      if (!visaData) {
        throw new Error('Qwen 解析返回 null');
      }

      console.log(`  ✓ 解析成功: ${visaData.customer_name} (${visaData.passport_no})`);

      // 2.2 暂存数据：将 AI 返回的 JSON 更新到 Log 记录
      console.log('  [5] 暂存提取的数据...');
      await prisma.emailProcessLog.update({
        where: { id: logId },
        data: {
          extractedData: visaData as any,
        },
      });
      console.log('  ✓ 数据暂存成功');

      // 2.3 业务入库：检查重复 + Upsert Customer + Create VisaRecord
      console.log('  [6] 检查数据库中是否已存在...');
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
        // 即使重复也标记为 SUCCESS，因为数据已经在系统中
        await prisma.emailProcessLog.update({
          where: { id: logId },
          data: {
            status: 'SUCCESS',
            processedAt: new Date(),
          },
        });
        return { success: true, logId };
      }

      console.log('  [7] 执行业务入库...');
      // 使用事务确保数据一致性
      await prisma.$transaction(async (tx) => {
        // Upsert Customer
        const customer = await tx.customer.upsert({
          where: { passport_no: visaData.passport_no },
          update: {
            name: visaData.customer_name,
          },
          create: {
            passport_no: visaData.passport_no,
            name: visaData.customer_name,
          },
        });

        // Create VisaRecord
        await tx.visaRecord.create({
          data: {
            customerId: customer.id,
            visaTypeCode: 'UNKNOWN',
            passport_no: visaData.passport_no,
            expiry_date: new Date(visaData.expiry_date),
            entry_date: visaData.entry_date ? new Date(visaData.entry_date) : null,
            is_urgent: false,
            reminder_enabled: true,
            file_url: ossUrl,
          },
        });
      });

      console.log(`  ✓ 签证记录创建成功`);

      // ========== 步骤 3: 状态闭环 - SUCCESS ==========
      console.log('  [8] 更新日志状态为 SUCCESS...');
      await prisma.emailProcessLog.update({
        where: { id: logId },
        data: {
          status: 'SUCCESS',
          processedAt: new Date(),
        },
      });
      console.log('  ✓ 处理完成');

      return { success: true, logId };
    } catch (processingError) {
      // ========== 步骤 3: 状态闭环 - FAILED ==========
      const errorMessage = processingError instanceof Error ? processingError.message : String(processingError);
      console.error(`  ✗ 处理失败: ${errorMessage}`);

      console.log('  [9] 更新日志状态为 FAILED...');
      await prisma.emailProcessLog.update({
        where: { id: logId },
        data: {
          status: 'FAILED',
          errorMessage,
        },
      });
      console.log('  ✓ 失败状态已记录');

      return { success: false, logId };
    }
  } catch (error) {
    // 如果连 OSS 上传都失败，无法创建日志记录
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`处理 PDF 附件 ${pdfAttachment.filename} 异常:`, errorMessage);

    // 尝试创建失败日志（如果还没创建的话）
    if (!logId) {
      try {
        const failedLog = await prisma.emailProcessLog.create({
          data: {
            messageId,
            pdfKey: 'UNKNOWN',
            pdfFilename: pdfAttachment.filename,
            status: 'FAILED',
            errorMessage: `OSS 上传失败: ${errorMessage}`,
          },
        });
        logId = failedLog.id;
      } catch (logError) {
        console.error('创建失败日志记录失败:', logError);
      }
    }

    return { success: false, logId };
  }
}

/**
 * 处理单封邮件
 * 关键逻辑：只有当所有 PDF 的 EmailProcessLog 都是 SUCCESS 时，才标记邮件为已读
 */
async function processEmail(imap: ImapFlow, uid: number): Promise<boolean> {
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

    // 检查邮件发件人是否来自移民局
    const emailFilter = process.env.EMAIL_FILTER || 'no-reply@notif.imigrasi.go.id';
    const fromAddress = parsed.from?.text || '';

    if (!fromAddress.includes(emailFilter)) {
      console.log(`邮件 UID ${uid} 来自 ${fromAddress}，不符合过滤条件 (${emailFilter})，跳过`);
      return true;
    }

    console.log(`✓ 邮件来自移民局: ${fromAddress}`);

    // 提取 PDF 附件
    const pdfAttachments = await extractPDFAttachments(parsed);

    if (pdfAttachments.length === 0) {
      console.log(`邮件 UID ${uid} 没有 PDF 附件，跳过`);
      return true;
    }

    console.log(`找到 ${pdfAttachments.length} 个 PDF 附件`);

    // 使用邮件的 Message-ID 作为 messageId（如果没有则使用 UID）
    const messageId = parsed.messageId || `uid-${uid}`;

    // 处理每个 PDF 附件
    const processResults: { success: boolean; logId: string }[] = [];
    for (const pdfAttachment of pdfAttachments) {
      const result = await processPDFAttachment(pdfAttachment, messageId, uid);
      processResults.push(result);
    }

    // ========== 邮件标记规则 ==========
    // 只有当所有 PDF 的处理日志都是 SUCCESS 时，才标记邮件为已读
    const allSuccess = processResults.every((r) => r.success);

    if (allSuccess && pdfAttachments.length > 0) {
      try {
        console.log(`标记邮件 UID ${uid} 为已读...`);
        await imap.messageFlagsSet(uid, ['\\Seen']);
        console.log(`✓ 邮件 UID ${uid} 已标记为已读`);
      } catch (error) {
        console.error(`标记邮件 UID ${uid} 为已读失败:`, error);
        // 即使标记失败也不影响整体流程
      }
    } else if (!allSuccess) {
      console.warn(`邮件 UID ${uid} 中有处理失败的 PDF，保持未读状态以便下次重试`);
    }

    return allSuccess;
  } catch (error) {
    console.error(`处理邮件 UID ${uid} 异常:`, error);
    return false;
  }
}

/**
 * 连接 IMAP 并处理未读邮件
 */
async function fetchEmailsFromImap(): Promise<{ processedCount: number; successCount: number; failedCount: number }> {
  const imapConfig = {
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    secure: true,
    auth: {
      user: process.env.EMAIL_ACCOUNT || 'lianpeng523@gmail.com',
      pass: process.env.EMAIL_PASSWORD || '',
    },
  };

  if (!imapConfig.auth.pass) {
    console.error('EMAIL_PASSWORD 未配置');
    return { processedCount: 0, successCount: 0, failedCount: 0 };
  }

  console.log(`使用 IMAP 配置: ${imapConfig.host}:${imapConfig.port}, 账户: ${imapConfig.auth.user}`);

  const imap = new ImapFlow(imapConfig);
  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;

  try {
    console.log('连接到 IMAP 服务器...');
    await imap.connect();
    console.log('✓ IMAP 连接成功');

    console.log('打开收件箱...');
    const mailbox = await imap.mailboxOpen('INBOX');
    console.log(`✓ 收件箱打开成功，共 ${mailbox.exists} 封邮件`);

    console.log('搜索未读邮件...');
    const searchResults = await imap.search({ seen: false });

    if (!searchResults || searchResults.length === 0) {
      console.log('没有未读邮件');
      await imap.logout();
      return { processedCount: 0, successCount: 0, failedCount: 0 };
    }

    console.log(`找到 ${searchResults.length} 封未读邮件`);

    // 处理每封邮件
    for (const uid of searchResults) {
      try {
        processedCount++;
        const success = await processEmail(imap, uid);

        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`处理邮件 UID ${uid} 异常:`, error);
        failedCount++;
        continue;
      }
    }

    // 关闭连接
    await imap.logout();
    console.log('✓ IMAP 连接已关闭');

    return { processedCount, successCount, failedCount };
  } catch (error) {
    console.error('IMAP 处理过程中出错:', error);
    try {
      await imap.logout();
    } catch (logoutError) {
      console.error('关闭 IMAP 连接失败:', logoutError);
    }
    return { processedCount, successCount, failedCount };
  }
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function GET(request: Request) {
  try {
    console.log('\n=== 开始执行邮件抓取 Cron Job ===');
    console.log(`时间: ${new Date().toISOString()}`);

    // 验证 Cron 密钥
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      console.warn('Cron 密钥验证失败');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 执行邮件抓取
    const { processedCount, successCount, failedCount } = await fetchEmailsFromImap();

    console.log(`\n=== 邮件抓取完成 ===`);
    console.log(`处理邮件数: ${processedCount}`);
    console.log(`成功邮件数: ${successCount}`);
    console.log(`失败邮件数: ${failedCount}`);

    return NextResponse.json({
      success: true,
      message: `成功处理 ${successCount}/${processedCount} 封邮件`,
      processedCount,
      successCount,
      failedCount,
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

export async function POST(request: Request) {
  return GET(request);
}
