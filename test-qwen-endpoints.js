#!/usr/bin/env node

/**
 * Qwen API 多端点测试脚本
 */

const apiKey = process.env.QWEN_VL_API_KEY || process.env.DASHSCOPE_API_KEY;

if (!apiKey) {
  console.error('❌ 错误: 未找到 Qwen API 密钥');
  process.exit(1);
}

console.log('🔍 Qwen API 多端点测试');
console.log('========================');
console.log(`API Key: ${apiKey.substring(0, 10)}...`);
console.log('');

const endpoints = [
  {
    name: 'DashScope Compatible Mode',
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-vl-max',
  },
  {
    name: 'DashScope API v1',
    url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'qwen-max',
  },
  {
    name: 'DashScope Vision',
    url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    model: 'qwen-vl-max',
  },
];

async function testEndpoint(endpoint) {
  try {
    console.log(`📤 测试: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: endpoint.model,
        messages: [
          {
            role: 'user',
            content: '你好',
          },
        ],
      }),
    });

    console.log(`   状态: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log('   ✅ 成功！');
      const result = await response.json();
      console.log(`   响应: ${JSON.stringify(result).substring(0, 100)}...`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ 失败: ${errorText.substring(0, 100)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function testAll() {
  console.log('测试所有端点...\n');

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    console.log('');
  }
}

testAll();
