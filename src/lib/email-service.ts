import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import prisma from '@/src/lib/prisma';
import { uploadPdfToOSS } from '@/src/lib/oss';
import { v4 as uuidv4 } from 'uuid';

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

async function parseWithDeepSeek(pdfBuffer: Buffer): Promise<ParsedVisaData | null> {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY 未配置');
    }

    console.log('  [3.3] 调用 DeepSeek API 处理 PDF...');

    const systemPrompt = `你是一个印尼签证解析专家。请从 PDF 文件中提取签证信息，并输出纯净的 JSON 格式：
{
  "customer_name": "客户姓名",
  "passport_no": "护照号码",
  "visa_type": "签证类型",
  "expiry_date": "到期日期（格式：YYYY-MM-DD）",
  "entry_date": "入境日期（格式：YYYY-MM-DD，如果没有则为 null）"
}

重要：仅输出 JSON，不要带有 markdown 标记`;

    const pdfBase64 = pdfBuffer.toString('base64');

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请分析这个PDF文件中的签证信息',
              },
              {
                type: 'document',
                document: {
                  type: 'application/pdf',
                  data: pdfBase64,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  DeepSeek API 响应: ${response.status} ${response.statusText}`);
      console.error(`  错误详情: ${errorText.substring(0, 200)}`);
      throw new Error(`DeepSeek API 错误: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (result.choices?.[0]?.message?.content) {
      const content = result.choices[0].message.content;
      const cleanedJson = cleanJsonString(content);
      const parsedData = JSON.parse(cleanedJson);

      if (validateVisaData(parsedData)) {
        console.log('  ✓ DeepSeek 识别成功');
        return parsedData;
      }
    }

    return null;
  } catch (error) {
    console.error('DeepSeek 解析失败:', error);
    return null;
  }
}

async function smartParseVisaData(pdfBuffer: Buffer, filename: string): Promise<ParsedVisaData | null> {
  try {
    console.log('  [3] 使用 DeepSeek 直接处理 PDF...');
    return await parseWithDeepSeek(pdfBuffer);
  } catch (error) {
    console.error('PDF 解析失败:', error);
    return null;
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
          let content: Buffer;

          // 处理不同类型的 content
          if (Buffer.isBuffer(attachment.content)) {
            // 如果已经是 Buffer
            content = attachment.content;
          } else if (typeof attachment.content.buffer === 'function') {
            // 如果有 buffer() 方法
            content = await attachment.content.buffer();
          } else if (typeof attachment.content === 'string') {
            // 如果是字符串，转换为 Buffer
            content = Buffer.from(attachment.content);
          } else {
            // 尝试转换为 Buffer
            content = Buffer.from(attachment.content);
          }

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

async function processPDFAttachment(
  pdfAttachment: PDFAttachment,
  messageId: string,
  uid: number
): Promise<{ success: boolean; logId: string }> {
  let logId = '';

  try {
    console.log(`\n处理 PDF 附件: ${pdfAttachment.filename} (UID: ${uid})`);

    console.log('  [1] 上传 PDF 到 OSS...');
    const { ossUrl, pdfKey } = await uploadPdfToOSS(pdfAttachment.content, pdfAttachment.filename);
    console.log(`  ✓ OSS URL: ${ossUrl}`);

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

    try {
      console.log('  [3] 启动智能识别流程...');
      const visaData = await smartParseVisaData(pdfAttachment.content, pdfAttachment.filename);

      if (!visaData) {
        throw new Error('解析返回 null');
      }

      console.log(`  ✓ 解析成功: ${visaData.customer_name} (${visaData.passport_no})`);

      console.log('  [5] 暂存提取的数据...');
      await prisma.emailProcessLog.update({
        where: { id: logId },
        data: {
          extractedData: visaData as any,
        },
      });
      console.log('  ✓ 数据暂存成功');

      console.log('  [6] 检查数据库中是否已存在...');
      const existingRecord = await prisma.visaRecord.findFirst({
        where: {
          passport_no: visaData.passport_no,
          expiry_date: new Date(visaData.expiry_date),
        },
      });

      if (existingRecord) {
        console.log(`  ⚠ 记录已存在，跳过创建`);
      } else {
        console.log('  [7] 创建或更新客户信息...');
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
        console.log(`  ✓ 客户信息已处理 (ID: ${customer.id})`);

        console.log('  [8] 创建签证记录...');
        await prisma.visaRecord.create({
          data: {
            customerId: customer.id,
            visaTypeCode: visaData.visa_type,
            passport_no: visaData.passport_no,
            expiry_date: new Date(visaData.expiry_date),
            entry_date: visaData.entry_date ? new Date(visaData.entry_date) : null,
            reminder_enabled: true,
            file_url: ossUrl,
          },
        });
        console.log('  ✓ 签证记录创建成功');
      }

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`处理 PDF 附件 ${pdfAttachment.filename} 异常:`, errorMessage);

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

async function processEmail(
  imap: ImapFlow,
  uid: number,
  processedMessageIds: Set<string>
): Promise<{ success: boolean; skipped: boolean }> {
  try {
    console.log(`\n处理邮件 UID: ${uid}`);

    const message = await imap.fetchOne(uid, { source: true });

    if (!message) {
      console.error(`无法获取邮件 UID ${uid}`);
      return { success: false, skipped: false };
    }

    const parsed = await simpleParser(message.source);
    const messageId = parsed.messageId || `uid-${uid}`;

    // 检查是否已处理过
    if (processedMessageIds.has(messageId)) {
      console.log(`邮件 ${messageId} 已处理过，跳过`);
      return { success: true, skipped: true };
    }

    const pdfAttachments = await extractPDFAttachments(parsed);

    if (pdfAttachments.length === 0) {
      console.log(`邮件 UID ${uid} 没有 PDF 附件，跳过`);
      return { success: true, skipped: false };
    }

    console.log(`找到 ${pdfAttachments.length} 个 PDF 附件`);

    const processResults: { success: boolean; logId: string }[] = [];
    for (const pdfAttachment of pdfAttachments) {
      const result = await processPDFAttachment(pdfAttachment, messageId, uid);
      processResults.push(result);
    }

    const allSuccess = processResults.every((r) => r.success);

    if (allSuccess && pdfAttachments.length > 0) {
      try {
        console.log(`标记邮件 UID ${uid} 为已读...`);
        await imap.messageFlagsSet(uid, ['\\Seen']);
        console.log(`✓ 邮件 UID ${uid} 已标记为已读`);
      } catch (error) {
        console.error(`标记邮件 UID ${uid} 为已读失败:`, error);
      }
    } else if (!allSuccess) {
      console.warn(`邮件 UID ${uid} 中有处理失败的 PDF，保持未读状态以便下次重试`);
    }

    return { success: allSuccess, skipped: false };
  } catch (error) {
    console.error(`处理邮件 UID ${uid} 异常:`, error);
    return { success: false, skipped: false };
  }
}

export async function fetchEmailsFromImap(): Promise<{ processedCount: number; successCount: number; failedCount: number; skippedCount: number }> {
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
    return { processedCount: 0, successCount: 0, failedCount: 0, skippedCount: 0 };
  }

  console.log(`使用 IMAP 配置: ${imapConfig.host}:${imapConfig.port}, 账户: ${imapConfig.auth.user}`);

  const imap = new ImapFlow(imapConfig);
  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  try {
    console.log('连接到 IMAP 服务器...');
    await imap.connect();
    console.log('✓ IMAP 连接成功');

    console.log('打开收件箱...');
    const mailbox = await imap.mailboxOpen('INBOX');
    console.log(`✓ 收件箱打开成功，共 ${mailbox.exists} 封邮件`);

    // 获取所有已处理成功的 messageId
    console.log('获取已处理成功的邮件列表...');
    const processedEmails = await prisma.emailProcessLog.findMany({
      where: { status: 'SUCCESS' },
      select: { messageId: true },
    });
    const processedMessageIds = new Set(processedEmails.map(e => e.messageId));
    console.log(`✓ 已处理成功的邮件数: ${processedMessageIds.size}`);

    // 计算日期范围
    const daysBack = parseInt(process.env.EMAIL_DAYS_BACK || '7');
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);
    sinceDate.setHours(0, 0, 0, 0);

    console.log(`搜索条件: 最近 ${daysBack} 天的所有邮件`);
    console.log(`日期范围: ${sinceDate.toISOString()} 至今`);

    // 搜索条件：只按日期范围，不按已读/未读
    const searchResults = await imap.search({
      since: sinceDate,
    });

    if (!searchResults || searchResults.length === 0) {
      console.log('没有符合条件的邮件');
      await imap.logout();
      return { processedCount, successCount, failedCount, skippedCount };
    }

    console.log(`找到 ${searchResults.length} 封符合条件的邮件`);

    for (const uid of searchResults) {
      try {
        const result = await processEmail(imap, uid, processedMessageIds);

        if (result.skipped) {
          skippedCount++;
        } else {
          processedCount++;
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
          }
        }
      } catch (error) {
        console.error(`处理邮件 UID ${uid} 异常:`, error);
        failedCount++;
        continue;
      }
    }

    await imap.logout();
    console.log('✓ IMAP 连接已关闭');

    return { processedCount, successCount, failedCount, skippedCount };
  } catch (error) {
    console.error('IMAP 处理过程中出错:', error);
    try {
      await imap.logout();
    } catch (logoutError) {
      console.error('关闭 IMAP 连接失败:', logoutError);
    }
    return { processedCount, successCount, failedCount, skippedCount };
  }
}
