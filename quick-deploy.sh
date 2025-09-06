#!/bin/bash

# 简化版远程部署脚本
# 快速停止、删除、重新构建和运行Docker容器

set -e

IMAGE_NAME="missav_frontend"
CONTAINER_NAME="missav_frontend"
TAG="latest"

echo "🚀 开始重新部署..."

# 停止并删除容器
echo "🛑 停止并删除现有容器..."
docker stop ${CONTAINER_NAME} 2>/dev/null || true
docker rm ${CONTAINER_NAME} 2>/dev/null || true

# 删除镜像
echo "🧹 删除现有镜像..."
docker rmi ${IMAGE_NAME}:${TAG} 2>/dev/null || true

# 构建镜像
echo "🔨 构建新镜像..."
docker buildx build --platform linux/arm64 -t ${IMAGE_NAME}:${TAG} .

# 运行容器
echo "▶️  启动容器..."
docker run -d --name ${CONTAINER_NAME} -p 3000:3000 --restart unless-stopped ${IMAGE_NAME}:${TAG}

echo "✅ 部署完成!"
echo "🌐 访问地址: http://192.168.5.253:3000"

# 显示容器状态
docker ps | grep ${CONTAINER_NAME} || echo "容器可能启动失败，请检查日志: docker logs ${CONTAINER_NAME}"