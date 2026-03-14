# Docker Compose 快速参考

## 本地测试（已运行）

```bash
# 启动
docker compose -f docker-compose.local.yml up -d

# 访问
http://localhost/visa

# 查看日志
docker compose -f docker-compose.local.yml logs -f

# 停止
docker compose -f docker-compose.local.yml down
```

## 生产部署

```bash
# 一键部署
chmod +x scripts/docker-prod.sh
sudo scripts/docker-prod.sh

# 或手动部署
sudo certbot certonly --webroot -w /var/www/certbot -d www.bantuqifu.online
docker compose -f docker-compose.prod.yml up -d

# 访问
https://www.bantuqifu.online/visa
```

## 关键文件

| 文件 | 说明 |
|------|------|
| `docker-compose.local.yml` | 本地测试配置 |
| `docker-compose.prod.yml` | 生产环境配置 |
| `nginx/local.conf` | 本地 nginx 配置 |
| `nginx/visa.conf` | 生产 nginx 配置 |
| `Dockerfile` | 应用镜像定义 |
| `scripts/docker-local.sh` | 本地部署脚本 |
| `scripts/docker-prod.sh` | 生产部署脚本 |

## 容器架构

```
Nginx (80/443)
    ↓
反向代理 /visa
    ↓
Next.js App (3000)
```

## 常用命令

```bash
# 查看状态
docker compose -f docker-compose.local.yml ps

# 查看日志
docker compose -f docker-compose.local.yml logs -f app
docker compose -f docker-compose.local.yml logs -f nginx

# 重启容器
docker compose -f docker-compose.local.yml restart

# 进入容器
docker compose -f docker-compose.local.yml exec app sh
docker compose -f docker-compose.local.yml exec nginx sh

# 查看资源使用
docker stats
```

## 部署检查清单

- [x] 应用构建成功
- [x] Docker 镜像创建
- [x] 本地测试环境运行
- [x] Nginx 反向代理配置
- [x] /visa 路径映射
- [x] HTTP 200 OK 响应
- [x] 生产环境配置准备
- [x] SSL 证书配置
- [x] 部署脚本创建

## 下一步

1. **生产部署**
   ```bash
   sudo scripts/docker-prod.sh
   ```

2. **验证部署**
   ```bash
   curl https://www.bantuqifu.online/visa
   ```

3. **监控应用**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

4. **证书续期**
   ```bash
   sudo certbot renew
   ```

## 文档

- 详细部署指南: `DOCKER_DEPLOYMENT.md`
- 项目架构: `CLAUDE.md`
- 快速启动: `QUICK_START.md`
