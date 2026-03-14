# 构建阶段 - Next.js 应用编译
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 复制 Prisma 配置（必须在 npm ci 前）
COPY prisma ./prisma

# 安装所有依赖（包括开发依赖，构建时需要）
RUN npm ci

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npm run postinstall

# 构建 Next.js 应用
RUN npm run build

# 运行阶段 - Next.js 生产服务器
FROM node:20-alpine

WORKDIR /app

# 设置生产环境变量
ENV NODE_ENV=production

# 复制 package 文件
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --only=production

# 从构建阶段复制编译产物
COPY --from=builder /app/.next ./.next

# 复制 Prisma 生成文件（必需）
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 复制 Prisma schema（数据库迁移需要）
COPY --from=builder /app/prisma ./prisma

# 复制 Next.js 配置文件
COPY --from=builder /app/next.config.ts ./

# 复制公开资源目录（如果存在）
COPY --from=builder /app/public ./public

# 暴露 Next.js 默认端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# 启动 Next.js 生产服务器
CMD ["npm", "start"]
