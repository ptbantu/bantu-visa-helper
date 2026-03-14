#!/bin/bash

# 快速启动脚本 - 用于开发和生产环境

COMMAND=${1:-help}
APP_DIR="/home/bantu/dev/bantu-visa-helper"

case $COMMAND in
  start)
    echo "启动应用..."
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml up -d
    echo "应用已启动，访问: https://www.bantuqifu.online/visa"
    ;;
  stop)
    echo "停止应用..."
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml down
    echo "应用已停止"
    ;;
  restart)
    echo "重启应用..."
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml restart
    echo "应用已重启"
    ;;
  logs)
    echo "查看应用日志..."
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml logs -f app
    ;;
  nginx-logs)
    echo "查看 Nginx 日志..."
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml logs -f nginx
    ;;
  status)
    echo "应用状态..."
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml ps
    ;;
  rebuild)
    echo "重新构建应用..."
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    echo "应用已重新构建并启动"
    ;;
  cert-status)
    echo "证书状态..."
    sudo certbot certificates
    ;;
  cert-renew)
    echo "续期证书..."
    sudo certbot renew
    ;;
  *)
    echo "Bantu Visa Helper 管理脚本"
    echo ""
    echo "用法: $0 {start|stop|restart|logs|nginx-logs|status|rebuild|cert-status|cert-renew}"
    echo ""
    echo "命令说明:"
    echo "  start         - 启动应用"
    echo "  stop          - 停止应用"
    echo "  restart       - 重启应用"
    echo "  logs          - 查看应用日志"
    echo "  nginx-logs    - 查看 Nginx 日志"
    echo "  status        - 查看应用状态"
    echo "  rebuild       - 重新构建应用"
    echo "  cert-status   - 查看证书状态"
    echo "  cert-renew    - 续期证书"
    ;;
esac
