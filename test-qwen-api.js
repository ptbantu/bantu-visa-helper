#!/usr/bin/env node

/**
 * Qwen API 密钥测试脚本
 */

const apiKey = process.env.QWEN_VL_API_KEY || process.env.DASHSCOPE_API_KEY;

if (!apiKey) {
  console.error('❌ 错误: 未找到 Qwen API 密钥');
  console.error('请设置 QWEN_VL_API_KEY 或 DASHSCOPE_API_KEY 环境变量');
  process.exit(1);
}

console.log('🔍 Qwen API 密钥测试');
console.log('========================');
console.log(`API Key 长度: ${apiKey.length}`);
console.log(`API Key 前缀: ${apiKey.substring(0, 10)}...`);
console.log('');

// 测试简单的文本请求
async function testQwenAPI() {
  try {
    console.log('📤 发送测试请求到 Qwen API...');

    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-max',
        messages: [
          {
            role: 'user',
            content: '你好，请回复"API密钥有效"',
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    });

    console.log(`📊 响应状态: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 错误:');
      console.error(errorText);
      process.exit(1);
    }

    const result = await response.json();

    if (result.choices?.[0]?.message?.content) {
      console.log('✅ API 密钥有效！');
      console.log(`📝 响应: ${result.choices[0].message.content}`);
    } else {
      console.error('❌ 响应格式错误:');
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 请求失败:');
    console.error(error);
    process.exit(1);
  }
}

testQwenAPI();
