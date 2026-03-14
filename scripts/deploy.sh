#!/bin/bash

# 部署脚本 - Bantu Visa Helper
# 使用 Let's Encrypt 和 nginx 部署到生产环境

set -e

DOMAIN="www.bantuqifu.online"
EMAIL="admin@bantuqifu.online"  # 修改为你的邮箱
APP_DIR="/home/bantu/dev/bantu-visa-helper"
CERTBOT_DIR="/var/www/certbot"

echo "=========================================="
echo "Bantu Visa Helper 部署脚本"
echo "=========================================="

# 1. 检查依赖
echo "检查系统依赖..."
command -v docker >/dev/null 2>&1 || { echo "需要安装 Docker"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "需要安装 Docker Compose"; exit 1; }
command -v certbot >/dev/null 2>&1 || { echo "需要安装 certbot"; exit 1; }

# 2. 创建必要的目录
echo "创建必要的目录..."
sudo mkdir -p $CERTBOT_DIR
sudo mkdir -p $APP_DIR/nginx/logs

# 3. 获取 Let's Encrypt 证书
echo "获取 Let's Encrypt 证书..."
sudo certbot certonly --webroot \
  -w $CERTBOT_DIR \
  -d $DOMAIN \
  --email $EMAIL \
  --agree-tos \
  --non-interactive \
  --expand

# 4. 设置证书自动续期
echo "设置证书自动续期..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 5. 构建并启动应用
echo "构建并启动应用..."
cd $APP_DIR
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 6. 验证部署
echo "验证部署..."
sleep 5
if curl -s https://$DOMAIN/visa > /dev/null; then
    echo "✓ 部署成功！"
    echo "应用地址: https://$DOMAIN/visa"
else
    echo "✗ 部署验证失败，请检查日志"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

echo "=========================================="
echo "部署完成！"
echo "=========================================="
