# 快速部署参考

## 一键部署（推荐）

```bash
# 1. 登录服务器
ssh user@your-server

# 2. 克隆项目
cd /home/bantu/dev
git clone <repo-url> bantu-visa-helper
cd bantu-visa-helper

# 3. 修改邮箱（scripts/deploy.sh 第 10 行）
nano scripts/deploy.sh

# 4. 运行部署
chmod +x scripts/deploy.sh
sudo scripts/deploy.sh
```

## 部署后管理

```bash
# 使用管理脚本
chmod +x scripts/manage.sh

# 启动应用
./scripts/manage.sh start

# 查看日志
./scripts/manage.sh logs

# 重启应用
./scripts/manage.sh restart

# 查看证书状态
./scripts/manage.sh cert-status
```

## 关键配置文件

| 文件 | 说明 |
|------|------|
| `nginx/visa.conf` | Nginx 反向代理配置 |
| `docker-compose.prod.yml` | Docker Compose 生产配置 |
| `Dockerfile` | 应用容器镜像定义 |
| `scripts/deploy.sh` | 自动部署脚本 |
| `scripts/manage.sh` | 应用管理脚本 |
| `DEPLOYMENT.md` | 详细部署文档 |

## 访问地址

- **生产环境**: https://www.bantuqifu.online/visa
- **应用端口**: 3000 (内部)
- **Nginx 端口**: 80/443 (外部)

## 常见问题

### Q: 如何更新应用？
```bash
cd /home/bantu/dev/bantu-visa-helper
git pull
./scripts/manage.sh rebuild
```

### Q: 如何查看实时日志？
```bash
./scripts/manage.sh logs
```

### Q: 证书即将过期怎么办？
```bash
./scripts/manage.sh cert-renew
```

### Q: 如何在同一服务器部署多个应用？
参考 `DEPLOYMENT.md` 中的"多域名配置"部分

## 监控和维护

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看进程
ps aux | grep node
```

## 紧急情况

```bash
# 停止应用
./scripts/manage.sh stop

# 查看错误日志
./scripts/manage.sh logs
./scripts/manage.sh nginx-logs

# 重新启动
./scripts/manage.sh start
```

## 备份数据库

```bash
# 手动备份
docker exec visa-app tar czf /app/backup-$(date +%Y%m%d).tar.gz /app/prisma/prod.db

# 复制到本地
docker cp visa-app:/app/backup-*.tar.gz ./backups/
```

## 支持

- 部署文档: `DEPLOYMENT.md`
- 项目文档: `CLAUDE.md`
- 问题排查: 查看 Nginx 和应用日志
