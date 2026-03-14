#!/bin/bash

# 本地测试部署脚本 - Bantu Visa Helper
# 用于本地开发环境测试

set -e

APP_DIR="/home/bantu/dev/bantu-visa-helper"
LOCAL_PORT=3000
NGINX_PORT=8080

echo "=========================================="
echo "本地测试部署 - Bantu Visa Helper"
echo "=========================================="

# 1. 检查依赖
echo "✓ 检查系统依赖..."
command -v docker >/dev/null 2>&1 || { echo "✗ 需要安装 Docker"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "✗ 需要安装 Node.js"; exit 1; }

# 2. 进入项目目录
cd $APP_DIR
echo "✓ 进入项目目录: $APP_DIR"

# 3. 安装依赖
echo "✓ 安装 npm 依赖..."
npm install

# 4. 构建应用
echo "✓ 构建应用..."
npm run build

# 5. 启动应用
echo "✓ 启动应用 (端口 $LOCAL_PORT)..."
npm start &
APP_PID=$!
echo "应用 PID: $APP_PID"

# 等待应用启动
sleep 5

# 6. 验证应用是否运行
echo "✓ 验证应用..."
if curl -s http://localhost:$LOCAL_PORT > /dev/null 2>&1; then
    echo "✓ 应用已启动！"
else
    echo "✗ 应用启动失败"
    kill $APP_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ 部署成功！"
echo "=========================================="
echo ""
echo "应用地址:"
echo "  http://localhost:$LOCAL_PORT"
echo "  http://localhost:$LOCAL_PORT/visa"
echo ""
echo "按 Ctrl+C 停止应用"
echo ""

# 保持应用运行
wait $APP_PID
