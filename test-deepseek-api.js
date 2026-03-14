#!/usr/bin/env node

/**
 * DeepSeek API 测试脚本
 */

const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  console.error('❌ 错误: 未找到 DEEPSEEK_API_KEY 环境变量');
  process.exit(1);
}

console.log('🔍 DeepSeek API 测试');
console.log('========================');
console.log(`API Key: ${apiKey.substring(0, 10)}...`);
console.log('');

async function testDeepSeekAPI() {
  try {
    console.log('📤 发送测试请求到 DeepSeek API...');

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

testDeepSeekAPI();
