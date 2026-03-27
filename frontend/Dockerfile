# ========================================
# Pantheon Platform V2 - Frontend Dockerfile
# ========================================
# 多阶段构建，优化镜像大小
# ========================================

# ========================================
# Stage 1: 构建阶段
# ========================================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /build

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production=false

# 复制源代码
COPY . .

# 构建应用
ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ARG VITE_APP_TITLE=Pantheon Platform
ARG VITE_DEFAULT_LANGUAGE=zh

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_TITLE=${VITE_APP_TITLE}
ENV VITE_DEFAULT_LANGUAGE=${VITE_DEFAULT_LANGUAGE}

RUN npm run build

# ========================================
# Stage 2: 运行阶段
# ========================================
FROM nginx:1.25-alpine

# 安装必要的工具
RUN apk add --no-cache curl tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非root用户
RUN addgroup -g 1000 nginx && \
    adduser -D -u 1000 -G nginx nginx

# 从构建阶段复制构建产物
COPY --from=builder /build/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建必要的目录
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/tmp/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html /var/log/nginx /var/cache/nginx /var/tmp/nginx

# 切换到非root用户
USER nginx

# 暴露端口
EXPOSE 80 443

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
