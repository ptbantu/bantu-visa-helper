# Docker Compose 部署指南

## 本地测试部署

### 快速启动

```bash
cd /home/bantu/dev/bantu-visa-helper

# 启动本地测试环境
docker compose -f docker-compose.local.yml up -d

# 等待容器启动（约 10-15 秒）
sleep 15

# 测试访问
curl http://localhost/visa
```

### 访问应用

- **本地测试**: http://localhost/visa
- **应用主页**: http://localhost/visa
- **健康检查**: http://localhost/health

### 常用命令

```bash
# 查看容器状态
docker compose -f docker-compose.local.yml ps

# 查看日志
docker compose -f docker-compose.local.yml logs -f

# 查看应用日志
docker compose -f docker-compose.local.yml logs -f app

# 查看 nginx 日志
docker compose -f docker-compose.local.yml logs -f nginx

# 停止容器
docker compose -f docker-compose.local.yml down

# 重启容器
docker compose -f docker-compose.local.yml restart

# 重新构建镜像
docker compose -f docker-compose.local.yml build --no-cache
```

## 生产部署

### 前置要求

- Docker 和 Docker Compose
- Certbot（Let's Encrypt 客户端）
- 有效的域名 DNS 解析

### 一键部署

```bash
chmod +x scripts/docker-prod.sh
sudo scripts/docker-prod.sh
```

### 手动部署步骤

1. **获取 SSL 证书**
```bash
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d www.bantuqifu.online \
  --email admin@bantuqifu.online \
  --agree-tos \
  --non-interactive
```

2. **启动容器**
```bash
docker compose -f docker-compose.prod.yml up -d
```

3. **验证部署**
```bash
curl https://www.bantuqifu.online/visa
```

### 生产环境访问

- **应用地址**: https://www.bantuqifu.online/visa
- **健康检查**: https://www.bantuqifu.online/health

## 配置文件说明

### Docker Compose 配置

| 文件 | 说明 |
|------|------|
| `docker-compose.local.yml` | 本地测试配置（HTTP） |
| `docker-compose.prod.yml` | 生产环境配置（HTTPS） |

### Nginx 配置

| 文件 | 说明 |
|------|------|
| `nginx/local.conf` | 本地测试配置（HTTP） |
| `nginx/visa.conf` | 生产环境配置（HTTPS） |

### 部署脚本

| 脚本 | 说明 |
|------|------|
| `scripts/docker-local.sh` | 本地测试部署脚本 |
| `scripts/docker-prod.sh` | 生产环境部署脚本 |

## 容器架构

```
┌─────────────────────────────────────┐
│      Docker Compose Network         │
│  (visa-network)                     │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Nginx (visa-nginx)         │  │
│  │   - 监听 80/443              │  │
│  │   - 反向代理 /visa 路径      │  │
│  └──────────────────────────────┘  │
│           ↓                         │
│  ┌──────────────────────────────┐  │
│  │   Next.js App (visa-app)     │  │
│  │   - 监听 3000                │  │
│  │   - 处理应用逻辑             │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

## 路径映射

```
外部请求                    内部路由
─────────────────────────────────────
http://localhost/visa    →  http://app:3000/
http://localhost/visa/   →  http://app:3000/
http://localhost/health  →  健康检查响应
```

## 证书管理

### 自动续期

```bash
# 启用自动续期定时任务
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 测试续期
sudo certbot renew --dry-run
```

### 手动续期

```bash
sudo certbot renew
docker compose -f docker-compose.prod.yml restart nginx
```

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker compose -f docker-compose.local.yml logs

# 检查端口占用
lsof -i :80
lsof -i :443
lsof -i :3000
```

### Nginx 配置错误

```bash
# 进入 nginx 容器
docker compose -f docker-compose.local.yml exec nginx sh

# 测试配置
nginx -t

# 查看配置
cat /etc/nginx/conf.d/default.conf
```

### 应用无法连接

```bash
# 检查容器网络
docker network ls
docker network inspect bantu-visa-helper_visa-network

# 测试容器间通信
docker compose -f docker-compose.local.yml exec nginx ping app
```

## 性能优化

### 启用缓存

Nginx 已配置静态资源缓存（30 天）

### 监控资源使用

```bash
docker stats
```

### 查看日志

```bash
# 实时日志
docker compose -f docker-compose.local.yml logs -f

# 查看特定容器
docker compose -f docker-compose.local.yml logs app
docker compose -f docker-compose.local.yml logs nginx
```

## 备份和恢复

### 备份数据库

```bash
docker compose -f docker-compose.local.yml exec app \
  tar czf /app/backup-$(date +%Y%m%d).tar.gz /app/prisma/prod.db

docker cp visa-app:/app/backup-*.tar.gz ./backups/
```

### 恢复数据库

```bash
docker cp ./backups/backup-*.tar.gz visa-app:/app/
docker compose -f docker-compose.local.yml exec app \
  tar xzf /app/backup-*.tar.gz -C /
```

## 支持

- 部署文档: `DEPLOYMENT.md`
- 快速参考: `QUICK_START.md`
- 项目文档: `CLAUDE.md`
