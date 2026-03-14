#!/bin/bash

# Docker Compose 生产部署脚本

set -e

DOMAIN="www.bantuqifu.online"
EMAIL="admin@bantuqifu.online"
APP_DIR="/home/bantu/dev/bantu-visa-helper"
CERTBOT_DIR="/var/www/certbot"

echo "=========================================="
echo "Docker Compose 生产部署"
echo "=========================================="

# 1. 检查依赖
echo "✓ 检查系统依赖..."
command -v docker >/dev/null 2>&1 || { echo "✗ 需要安装 Docker"; exit 1; }

# 检查 certbot（可选，如果没有则跳过证书获取）
CERTBOT_AVAILABLE=false
if command -v certbot >/dev/null 2>&1; then
    CERTBOT_AVAILABLE=true
fi

# 2. 创建必要的目录
echo "✓ 创建必要的目录..."
sudo mkdir -p $CERTBOT_DIR
mkdir -p $APP_DIR/nginx/logs

# 3. 获取 Let's Encrypt 证书
echo "✓ 获取 Let's Encrypt 证书..."
if [ "$CERTBOT_AVAILABLE" = true ]; then
    sudo certbot certonly --webroot \
      -w $CERTBOT_DIR \
      -d $DOMAIN \
      --email $EMAIL \
      --agree-tos \
      --non-interactive \
      --expand 2>/dev/null || echo "⚠ 证书获取失败或已存在"
else
    echo "⚠ Certbot 未安装，跳过证书获取"
    echo "  生产环境需要手动获取证书："
    echo "  sudo certbot certonly --webroot -w /var/www/certbot -d $DOMAIN"
fi

# 4. 进入项目目录
cd $APP_DIR

# 5. 停止旧容器
echo "✓ 停止旧容器..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# 6. 构建并启动
echo "✓ 构建并启动容器..."
docker compose -f docker-compose.prod.yml up -d

# 7. 等待应用启动
echo "✓ 等待应用启动..."
sleep 15

# 8. 验证部署
echo "✓ 验证部署..."
if curl -s http://$DOMAIN/visa > /dev/null 2>&1 || curl -s https://$DOMAIN/visa > /dev/null 2>&1; then
    echo ""
    echo "=========================================="
    echo "✓ 部署成功！"
    echo "=========================================="
    echo ""
    echo "访问地址:"
    echo "  https://$DOMAIN/visa"
    echo ""
    echo "常用命令:"
    echo "  查看日志:     docker compose -f docker-compose.prod.yml logs -f"
    echo "  停止容器:     docker compose -f docker-compose.prod.yml down"
    echo "  查看状态:     docker compose -f docker-compose.prod.yml ps"
    echo "  续期证书:     sudo certbot renew"
    echo ""
else
    echo "⚠ 部署验证失败，但容器已启动"
    echo "请检查日志:"
    docker compose -f docker-compose.prod.yml logs
fi
