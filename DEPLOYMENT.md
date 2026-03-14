# 部署指南 - Bantu Visa Helper

## 前置要求

在服务器上安装以下工具：
- Docker & Docker Compose
- Certbot (Let's Encrypt 客户端)
- Nginx (可选，如果不使用 Docker)

### Ubuntu/Debian 安装命令

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y

# 安装 Nginx
sudo apt-get install nginx -y
```

## 部署步骤

### 方案 A：使用 Docker Compose（推荐）

1. **克隆项目到服务器**
```bash
cd /home/bantu/dev
git clone <repo-url> bantu-visa-helper
cd bantu-visa-helper
```

2. **修改配置**
- 编辑 `scripts/deploy.sh`，修改 `EMAIL` 变量为你的邮箱
- 确保 `DOMAIN` 设置为 `www.bantuqifu.online`

3. **运行部署脚本**
```bash
chmod +x scripts/deploy.sh
sudo scripts/deploy.sh
```

4. **验证部署**
```bash
curl -I https://www.bantuqifu.online/visa
```

### 方案 B：手动部署

1. **获取 SSL 证书**
```bash
sudo certbot certonly --standalone \
  -d www.bantuqifu.online \
  --email admin@bantuqifu.online \
  --agree-tos \
  --non-interactive
```

2. **配置 Nginx**
```bash
# 复制配置文件
sudo cp nginx/visa.conf /etc/nginx/sites-available/visa
sudo ln -s /etc/nginx/sites-available/visa /etc/nginx/sites-enabled/visa

# 测试配置
sudo nginx -t

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

3. **构建并启动应用**
```bash
npm install
npm run build
npm start &
```

## 环境变量配置

创建 `.env.production` 文件：

```env
NODE_ENV=production
DATABASE_URL=file:./prisma/prod.db
NEXT_PUBLIC_API_URL=https://www.bantuqifu.online/visa
```

## 证书自动续期

Let's Encrypt 证书有效期为 90 天。设置自动续期：

```bash
# 创建续期脚本
sudo tee /etc/letsencrypt/renewal-hooks/post/nginx-reload.sh > /dev/null <<EOF
#!/bin/bash
systemctl reload nginx
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/post/nginx-reload.sh

# 测试续期
sudo certbot renew --dry-run

# 启用自动续期定时任务
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 常用命令

```bash
# 查看应用日志
docker-compose -f docker-compose.prod.yml logs -f app

# 查看 Nginx 日志
docker-compose -f docker-compose.prod.yml logs -f nginx

# 重启应用
docker-compose -f docker-compose.prod.yml restart app

# 停止应用
docker-compose -f docker-compose.prod.yml down

# 查看证书信息
sudo certbot certificates

# 手动续期证书
sudo certbot renew
```

## 故障排查

### 证书获取失败
```bash
# 检查 DNS 解析
nslookup www.bantuqifu.online

# 检查端口 80 是否开放
sudo netstat -tlnp | grep :80

# 查看 Certbot 日志
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### 应用无法访问
```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/visa_error.log

# 检查应用是否运行
docker-compose -f docker-compose.prod.yml ps
```

### 性能优化

1. **启用 Gzip 压缩**
   - 已在 nginx 配置中配置

2. **启用缓存**
   - 静态资源缓存 30 天
   - 在 nginx 配置中已配置

3. **监控资源使用**
```bash
docker stats visa-app visa-nginx
```

## 多域名配置

如果需要在同一服务器上部署多个应用，创建新的 nginx 配置文件：

```bash
# 复制配置模板
cp nginx/visa.conf nginx/another-app.conf

# 修改配置中的：
# - server_name
# - upstream 端口
# - location 路径
# - SSL 证书路径

# 获取新域名的证书
sudo certbot certonly --webroot -w /var/www/certbot -d another-domain.com

# 重新加载 Nginx
sudo nginx -s reload
```

## 安全建议

1. **防火墙配置**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **定期备份数据库**
```bash
# 添加到 crontab
0 2 * * * docker exec visa-app tar czf /app/backup-$(date +\%Y\%m\%d).tar.gz /app/prisma/prod.db
```

3. **监控日志**
```bash
# 查看访问日志
tail -f /var/log/nginx/visa_access.log

# 查看错误日志
tail -f /var/log/nginx/visa_error.log
```

## 支持

如有问题，请检查：
- Nginx 配置文件：`nginx/visa.conf`
- Docker Compose 配置：`docker-compose.prod.yml`
- 应用日志：`docker-compose logs`
