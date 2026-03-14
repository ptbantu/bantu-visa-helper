#!/bin/bash

# Bantu 签证助手 - 启动脚本

echo "🚀 启动 Bantu 签证助手..."
echo ""

# 检查环境变量
echo "📋 检查环境变量..."
if grep -q "QWEN_VL_API_KEY" .env; then
    echo "✅ Qwen API密钥已配置"
else
    echo "❌ Qwen API密钥未配置，请在.env中添加"
    exit 1
fi

if grep -q "EMAIL_PASSWORD" .env; then
    echo "✅ 邮件密码已配置"
else
    echo "⚠️  邮件密码未配置"
fi

if grep -q "DATABASE_URL" .env; then
    echo "✅ 数据库连接已配置"
else
    echo "❌ 数据库连接未配置"
    exit 1
fi

echo ""
echo "📦 安装依赖..."
npm install

echo ""
echo "🔨 构建项目..."
npm run build

echo ""
echo "✅ 构建完成！"
echo ""
echo "🌐 启动开发服务器..."
echo "访问地址: http://localhost:8081"
echo ""

npm run dev
