import OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';

/**
 * 初始化 OSS 客户端
 */
export function initOSSClient(): OSS {
  const endpoint = process.env.OSS_ENDPOINT || 'oss-ap-southeast-5.aliyuncs.com';
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID || '';
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET || '';
  const bucket = process.env.OSS_BUCKET_NAME || 'bantuqifu-dev';

  if (!accessKeyId || !accessKeySecret) {
    throw new Error('OSS_ACCESS_KEY_ID 或 OSS_ACCESS_KEY_SECRET 未配置');
  }

  return new OSS({
    endpoint,
    accessKeyId,
    accessKeySecret,
    bucket,
  });
}

/**
 * 上传文件到 OSS
 * @param fileBuffer 文件内容
 * @param filename 文件名
 * @param folder 文件夹路径（可选）
 * @returns OSS URL 和文件 Key
 */
export async function uploadFileToOSS(
  fileBuffer: Buffer,
  filename: string,
  folder: string = 'uploads'
): Promise<{ ossUrl: string; pdfKey: string }> {
  try {
    const oss = initOSSClient();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const uuid = uuidv4();
    const ext = filename.split('.').pop() || 'bin';
    const ossPath = `${folder}/${dateStr}/${uuid}.${ext}`;

    const result = await oss.put(ossPath, fileBuffer);

    // 构建 OSS URL
    const endpoint = process.env.OSS_ENDPOINT || 'oss-ap-southeast-5.aliyuncs.com';
    const bucket = process.env.OSS_BUCKET_NAME || 'bantuqifu-dev';
    const ossUrl = result.url || `https://${bucket}.${endpoint}/${ossPath}`;

    console.log(`✓ 文件上传成功: ${ossPath}`);
    return { ossUrl, pdfKey: ossPath };
  } catch (error) {
    console.error('上传文件到 OSS 失败:', error);
    throw error;
  }
}

/**
 * 上传 PDF 文件到 OSS
 * @param pdfBuffer PDF 文件内容
 * @param filename 文件名
 * @returns OSS URL 和文件 Key
 */
export async function uploadPdfToOSS(
  pdfBuffer: Buffer,
  filename: string
): Promise<{ ossUrl: string; pdfKey: string }> {
  return uploadFileToOSS(pdfBuffer, filename, 'visas');
}

/**
 * 删除 OSS 中的文件
 * @param ossKey 文件 Key
 */
export async function deleteFileFromOSS(ossKey: string): Promise<void> {
  try {
    const oss = initOSSClient();
    await oss.delete(ossKey);
    console.log(`✓ 文件删除成功: ${ossKey}`);
  } catch (error) {
    console.error('删除 OSS 文件失败:', error);
    throw error;
  }
}

/**
 * 获取 OSS 文件的临时下载 URL
 * @param ossKey 文件 Key
 * @param expiresIn 过期时间（秒，默认 3600）
 */
export async function getOSSFileUrl(
  ossKey: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const oss = initOSSClient();
    const url = oss.signatureUrl(ossKey, { expires: expiresIn });
    return url;
  } catch (error) {
    console.error('获取 OSS 文件 URL 失败:', error);
    throw error;
  }
}
