# ========================================
# Pantheon Platform V2 - Backend Dockerfile
# ========================================
# 多阶段构建，优化镜像大小
# ========================================

# ========================================
# Stage 1: 构建阶段
# ========================================
FROM golang:1.23-alpine AS builder

# 安装必要的工具
RUN apk add --no-cache git ca-certificates tzdata

# 设置工作目录
WORKDIR /build

# 复制 go.mod 和 go.sum 文件
COPY go.mod go.sum ./

# 下载依赖（利用Docker缓存）
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
# CGO_ENABLED=0: 生成静态可执行文件
# -ldflags: 减小程序大小
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -extldflags '-static'" \
    -a -installsuffix cgo \
    -o pantheon-server \
    ./cmd/server/main.go

# ========================================
# Stage 2: 运行阶段
# ========================================
FROM alpine:3.19

# 安装必要的工具和库
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    curl \
    wget \
    bash

# 创建非root用户
RUN addgroup -g 1000 pantheon && \
    adduser -D -u 1000 -G pantheon pantheon

# 设置时区
ENV TZ=Asia/Shanghai

# 创建必要的目录
RUN mkdir -p /root/logs /root/uploads /root/config && \
    chown -R pantheon:pantheon /root

# 设置工作目录
WORKDIR /root

# 从构建阶段复制可执行文件
COPY --from=builder /build/pantheon-server .

# 复制配置文件
COPY config.yaml.example config.yaml.example

# 切换到非root用户
USER pantheon

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 启动应用
CMD ["./pantheon-server"]
