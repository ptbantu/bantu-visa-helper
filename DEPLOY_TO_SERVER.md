# 部署到真实服务器指南

## 当前状态

✅ 应用已在本地开发环境成功部署
- 本地访问: http://localhost/visa (正常)
- 域名访问: http://www.bantuqifu.online/visa (需要部署到真实服务器)

## 为什么 www.bantuqifu.online 无法访问？

1. **应用运行在本地开发机**
   - 当前部署在 /home/bantu/dev/bantu-visa-helper
   - 只能通过 localhost 访问

2. **域名需要指向真实服务器**
   - www.bantuqifu.online 需要 DNS 解析到服务器 IP
   - 服务器需要运行 Docker 容器

3. **需要真实的服务器环境**
   - 云服务器（阿里云、腾讯云、AWS 等）
   - 或自有服务器

## 部署到真实服务器步骤

### 1. 准备服务器

```bash
# 在真实服务器上安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 上传项目代码

```bash
# 在本地开发机上
scp -r /home/bantu/dev/bantu-visa-helper user@server-ip:/home/bantu/

# 或使用 Git
git clone <repo-url> /home/bantu/bantu-visa-helper
```

### 3. 配置域名 DNS

在域名注册商（如阿里云、腾讯云等）配置 DNS：

```
记录类型: A
主机记录: www
记录值: <服务器公网IP>
```

### 4. 启动应用

```bash
# 登录服务器
ssh user@server-ip

# 进入项目目录
cd /home/bantu/bantu-visa-helper

# 启动应用
docker compose -f docker-compose.prod-http.yml up -d

# 验证
curl http://www.bantuqifu.online/visa
```

### 5. 升级到 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d www.bantuqifu.online \
  --email admin@bantuqifu.online \
  --agree-tos \
  --non-interactive

# 使用 HTTPS 配置
docker compose -f docker-compose.prod.yml up -d
```

## 快速部署脚本

在服务器上运行：

```bash
#!/bin/bash

# 1. 安装依赖
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# 2. 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 3. 克隆项目
cd /home/bantu
git clone <repo-url> bantu-visa-helper
cd bantu-visa-helper

# 4. 启动应用
docker compose -f docker-compose.prod-http.yml up -d

# 5. 验证
sleep 10
curl http://www.bantuqifu.online/visa
```

## 常见问题

### Q: 如何检查应用是否运行？

```bash
docker compose -f docker-compose.prod-http.yml ps
docker compose -f docker-compose.prod-http.yml logs -f
```

### Q: 如何更新应用？

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker compose -f docker-compose.prod-http.yml build --no-cache

# 重启应用
docker compose -f docker-compose.prod-http.yml restart
```

### Q: 如何备份数据？

```bash
# 备份数据库
docker compose -f docker-compose.prod-http.yml exec app \
  tar czf /app/backup-$(date +%Y%m%d).tar.gz /app/prisma/prod.db

# 复制到本地
scp user@server-ip:/home/bantu/bantu-visa-helper/backup-*.tar.gz ./
```

### Q: 如何监控应用？

```bash
# 查看实时日志
docker compose -f docker-compose.prod-http.yml logs -f

# 查看资源使用
docker stats

# 查看容器详情
docker ps -a
```

## 配置文件说明

| 文件 | 说明 | 用途 |
|------|------|------|
| `docker-compose.prod-http.yml` | HTTP 配置 | 初期部署 |
| `docker-compose.prod.yml` | HTTPS 配置 | 生产环境 |
| `nginx/visa-http.conf` | HTTP Nginx 配置 | 初期部署 |
| `nginx/visa.conf` | HTTPS Nginx 配置 | 生产环境 |

## 部署架构

```
互联网用户
    ↓
www.bantuqifu.online (DNS 解析到服务器 IP)
    ↓
服务器 (80/443 端口)
    ↓
Nginx 反向代理
    ↓
Next.js 应用 (3000 端口)
    ↓
SQLite 数据库
```

## 支持的云服务商

- 阿里云 ECS
- 腾讯云 CVM
- AWS EC2
- DigitalOcean
- Linode
- 其他支持 Docker 的服务器

## 下一步

1. **获取服务器**
   - 选择云服务商
   - 购买服务器实例

2. **配置 DNS**
   - 在域名注册商配置 DNS 记录
   - 指向服务器公网 IP

3. **部署应用**
   - 上传项目代码
   - 运行部署脚本

4. **验证访问**
   - 访问 http://www.bantuqifu.online/visa
   - 检查应用是否正常运行

5. **升级 HTTPS**
   - 获取 SSL 证书
   - 配置 HTTPS

---

**注意**: 当前应用已在本地成功部署，只需将其部署到真实服务器即可通过域名访问。
