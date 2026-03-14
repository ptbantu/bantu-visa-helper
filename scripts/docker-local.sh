#!/bin/bash

# Docker Compose 本地测试脚本

set -e

APP_DIR="/home/bantu/dev/bantu-visa-helper"

echo "=========================================="
echo "Docker Compose 本地测试"
echo "=========================================="

# 1. 检查 Docker
echo "✓ 检查 Docker..."
command -v docker >/dev/null 2>&1 || { echo "✗ 需要安装 Docker"; exit 1; }

# 2. 进入项目目录
cd $APP_DIR
echo "✓ 进入项目目录"

# 3. 停止旧容器
echo "✓ 停止旧容器..."
docker compose -f docker-compose.local.yml down 2>/dev/null || true

# 4. 创建日志目录
echo "✓ 创建日志目录..."
mkdir -p nginx/logs

# 5. 构建并启动
echo "✓ 构建并启动容器..."
docker compose -f docker-compose.local.yml up -d

# 6. 等待应用启动
echo "✓ 等待应用启动..."
sleep 10

# 7. 验证部署
echo "✓ 验证部署..."
if curl -s http://localhost/visa > /dev/null 2>&1; then
    echo ""
    echo "=========================================="
    echo "✓ 部署成功！"
    echo "=========================================="
    echo ""
    echo "访问地址:"
    echo "  http://localhost/visa"
    echo ""
    echo "常用命令:"
    echo "  查看日志:     docker compose -f docker-compose.local.yml logs -f"
    echo "  停止容器:     docker compose -f docker-compose.local.yml down"
    echo "  查看状态:     docker compose -f docker-compose.local.yml ps"
    echo ""
else
    echo "✗ 部署验证失败"
    docker compose -f docker-compose.local.yml logs
    exit 1
fi
