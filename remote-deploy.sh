#!/bin/bash

# Remote deployment script for missav_frontend
# 用于在192.168.5.253上停止、删除、重新构建和运行Docker容器

set -e

# 配置
IMAGE_NAME="missav_frontend"
CONTAINER_NAME="missav_frontend"
TAG="latest"
PORT="3000"

echo "🚀 开始部署 ${IMAGE_NAME}..."

# 1. 停止正在运行的容器
echo "🛑 停止正在运行的容器..."
if docker ps -q --filter "name=${CONTAINER_NAME}" | grep -q .; then
    docker stop ${CONTAINER_NAME}
    echo "✅ 容器已停止"
else
    echo "ℹ️  没有正在运行的容器"
fi

# 2. 删除容器（如果存在）
echo "🗑️  删除现有容器..."
if docker ps -aq --filter "name=${CONTAINER_NAME}" | grep -q .; then
    docker rm ${CONTAINER_NAME}
    echo "✅ 容器已删除"
else
    echo "ℹ️  没有现有容器需要删除"
fi

# 3. 删除现有镜像（可选，释放空间）
echo "🧹 清理现有镜像..."
if docker images -q ${IMAGE_NAME}:${TAG} | grep -q .; then
    docker rmi ${IMAGE_NAME}:${TAG}
    echo "✅ 镜像已删除"
else
    echo "ℹ️  没有现有镜像需要删除"
fi

# 4. 检查必要文件是否存在
echo "📂 检查部署文件..."
required_files=("dist" "Dockerfile" "docker-compose.yml")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -e "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ 缺少必要文件: ${missing_files[*]}"
    echo "请确保以下文件存在:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

# 5. 构建新的Docker镜像
echo "🔨 构建Docker镜像..."
docker build --platform linux/arm64 -t ${IMAGE_NAME}:${TAG} .

if [ $? -eq 0 ]; then
    echo "✅ Docker镜像构建成功"
else
    echo "❌ Docker镜像构建失败"
    exit 1
fi

# 6. 运行新容器
echo "▶️  启动新容器..."
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:${PORT} \
    --restart unless-stopped \
    ${IMAGE_NAME}:${TAG}

if [ $? -eq 0 ]; then
    echo "✅ 容器启动成功"
else
    echo "❌ 容器启动失败"
    exit 1
fi

# 7. 检查容器状态
echo "🔍 检查容器状态..."
sleep 3

if docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q ${CONTAINER_NAME}; then
    echo "✅ 容器运行正常"
    echo ""
    echo "📊 容器信息:"
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "🌐 前端地址: http://192.168.5.253:${PORT}"
    echo ""
else
    echo "❌ 容器运行异常"
    echo "📋 容器日志:"
    docker logs ${CONTAINER_NAME}
    exit 1
fi

# 8. 清理构建缓存（可选）
echo "🧹 清理Docker构建缓存..."
docker builder prune -f > /dev/null 2>&1 || true

echo "🎉 部署完成!"
echo ""
echo "常用命令:"
echo "  查看日志: docker logs -f ${CONTAINER_NAME}"
echo "  停止容器: docker stop ${CONTAINER_NAME}"
echo "  重启容器: docker restart ${CONTAINER_NAME}"
echo "  进入容器: docker exec -it ${CONTAINER_NAME} sh"