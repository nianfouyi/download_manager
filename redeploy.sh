#!/bin/bash

# 停止运行容器
docker stop missav_frontend

# 删除容器
docker rm missav_frontend

# 重新构建docker镜像
docker build -t missav_frontend:latest .

# 运行容器
docker run -d --name missav_frontend -p 3000:3000 --restart unless-stopped missav_frontend:latest