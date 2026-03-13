import { NextResponse } from 'next/server';
import { Imap } from 'imap';
import { simpleParser } from 'mailparser';
import prisma from '@/src/lib/prisma';
import { Readable } from 'stream';

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

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 清洗 JSON 字符串：移除 ```json 等包裹符号
 */
function cleanJsonString(str: string): string {
  // 移除 ```json 或 ``` 包裹
  let cleaned = str.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  // 移除前后空白
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
 * 调用阿里云 Qwen-VL-Max 模型解析图片
 */
async function parseImageWithQwen(imageBase64: string): Promise<ParsedVisaData | null> {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      console.error('DASHSCOPE_API_KEY 未配置');
      return null;
    }

    const prompt = `你是一个印尼签证解析专家。请解析图片，提取以下信息：
- customer_name: 客户姓名
- passport_no: 护照号码
- visa_type: 签证类型
- expiry_date: 到期日期（格式：YYYY-MM-DD）
- entry_date: 入境日期（格式：YYYY-MM-DD，如果没有则为 null）

必须且只能输出纯净的 JSON 字符串，绝不能包含 Markdown 代码块（如 \`\`\`json）或其他解释文字。`;

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-max',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  image: `data:image/jpeg;base64,${imageBase64}`,
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
        },
        parameters: {
          max_tokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Qwen API 错误: ${response.status} ${response.statusText}`);
      return null;
    }

    const result = await response.json();

    if (result.output?.choices?.[0]?.message?.content) {
      const content = result.output.choices[0].message.content;

      // 处理可能的数组格式
      let textContent = '';
      if (Array.isArray(content)) {
        textContent = content
          .filter((item: any) => item.type === 'text')
          .map((item: any) => item.text)
          .join('');
      } else {
        textContent = content;
      }

      // 清洗 JSON 字符串
      const cleanedJson = cleanJsonString(textContent);

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
 * 从邮件中提取图片附件
 */
async function extractImageAttachments(email: any): Promise<EmailAttachment[]> {
  const attachments: EmailAttachment[] = [];

  if (email.attachments && Array.isArray(email.attachments)) {
    for (const attachment of email.attachments) {
      // 只处理图片类型
      if (attachment.contentType?.startsWith('image/')) {
        try {
          const content = await attachment.content.buffer();
          attachments.push({
            filename: attachment.filename || 'unknown',
            content,
            contentType: attachment.contentType,
          });
        } catch (error) {
          console.error(`提取附件 ${attachment.filename} 失败:`, error);
        }
      }
    }
  }

  return attachments;
}

/**
 * 处理单封邮件
 */
async function processEmail(uid: number, imap: Imap): Promise<number> {
  let processedCount = 0;

  try {
    const f = imap.fetch(uid, { bodies: '' });

    return new Promise((resolve, reject) => {
      f.on('message', (msg) => {
        simpleParser(msg, {}, async (err, parsed) => {
          if (err) {
            console.error(`解析邮件 UID ${uid} 失败:`, err);
            resolve(0);
            return;
          }

          try {
            // 提取图片附件
            const attachments = await extractImageAttachments(parsed);

            if (attachments.length === 0) {
              console.log(`邮件 UID ${uid} 没有图片附件`);
              resolve(0);
              return;
            }

            // 处理每个附件
            for (const attachment of attachments) {
              try {
                // 转换为 Base64
                const base64 = attachment.content.toString('base64');

                // 调用 Qwen 解析
                const visaData = await parseImageWithQwen(base64);

                if (!visaData) {
                  console.warn(`附件 ${attachment.filename} 解析失败`);
                  continue;
                }

                // 检查数据库中是否已存在相同的记录
                const existingRecord = await prisma.visaRecord.findFirst({
                  where: {
                    passport_no: visaData.passport_no,
                    expiry_date: new Date(visaData.expiry_date),
                  },
                });

                if (existingRecord) {
                  console.log(
                    `记录已存在 (passport_no: ${visaData.passport_no}, expiry_date: ${visaData.expiry_date})，跳过`
                  );
                  continue;
                }

                // 创建新记录
                await prisma.visaRecord.create({
                  data: {
                    customer_name: visaData.customer_name,
                    passport_no: visaData.passport_no,
                    visa_type: visaData.visa_type,
                    expiry_date: new Date(visaData.expiry_date),
                    entry_date: visaData.entry_date ? new Date(visaData.entry_date) : null,
                    is_urgent: false,
                    reminder_enabled: true,
                  },
                });

                console.log(
                  `✓ 成功创建签证记录: ${visaData.customer_name} (${visaData.passport_no})`
                );
                processedCount++;
              } catch (error) {
                console.error(`处理附件 ${attachment.filename} 失败:`, error);
                continue;
              }
            }

            resolve(processedCount);
          } catch (error) {
            console.error(`处理邮件 UID ${uid} 失败:`, error);
            resolve(0);
          }
        });
      });

      f.on('error', (err) => {
        console.error(`获取邮件 UID ${uid} 失败:`, err);
        resolve(0);
      });
    });
  } catch (error) {
    console.error(`处理邮件 UID ${uid} 异常:`, error);
    return 0;
  }
}

/**
 * 连接 IMAP 并获取未读邮件
 */
async function fetchEmailsFromImap(): Promise<number> {
  const imapConfig = {
    user: process.env.EMAIL_ACCOUNT || 'admin@bantuqifu.com',
    password: process.env.EMAIL_PASSWORD || '',
    host: process.env.IMAP_HOST || 'imap.qq.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: true,
  };

  if (!imapConfig.password) {
    console.error('EMAIL_PASSWORD 未配置');
    return 0;
  }

  const imap = new Imap(imapConfig);
  let totalProcessed = 0;

  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, async (err, box) => {
      if (err) {
        console.error('打开邮箱失败:', err);
        imap.end();
        resolve(0);
        return;
      }

      try {
        // 搜索未读邮件
        imap.search(['UNSEEN'], async (err, results) => {
          if (err) {
            console.error('搜索未读邮件失败:', err);
            imap.end();
            resolve(0);
            return;
          }

          if (!results || results.length === 0) {
            console.log('没有未读邮件');
            imap.end();
            resolve(0);
            return;
          }

          console.log(`找到 ${results.length} 封未读邮件`);

          // 处理每封邮件
          for (const uid of results) {
            try {
              const count = await processEmail(uid, imap);
              totalProcessed += count;
            } catch (error) {
              console.error(`处理邮件 UID ${uid} 异常:`, error);
              continue;
            }
          }

          imap.end();
          resolve(totalProcessed);
        });
      } catch (error) {
        console.error('处理邮件过程中出错:', error);
        imap.end();
        resolve(totalProcessed);
      }
    });

    imap.on('error', (err) => {
      console.error('IMAP 连接错误:', err);
      resolve(totalProcessed);
    });

    imap.on('end', () => {
      console.log('IMAP 连接已关闭');
    });

    imap.openIBox('INBOX', false, (err) => {
      if (err) {
        console.error('打开收件箱失败:', err);
        resolve(totalProcessed);
      }
    });

    imap.openIBox('INBOX', false, (err) => {
      if (err) throw err;
    });
  });
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function GET(request: Request) {
  try {
    console.log('=== 开始执行邮件抓取 Cron Job ===');
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
    const processedCount = await fetchEmailsFromImap();

    console.log(`=== 邮件抓取完成，共处理 ${processedCount} 条记录 ===`);

    return NextResponse.json({
      success: true,
      message: `成功处理 ${processedCount} 条签证记录`,
      processedCount,
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
