#!/bin/bash

# Build locally and deploy to remote ARM64 server
set -e

# Configuration
IMAGE_NAME="missav_frontend"
TAG="latest"
REMOTE_HOST="192.168.5.253"
REMOTE_USER="root"  # 根据你的实际用户名修改
REMOTE_PATH="/mnt/sdb/missav_frontend"

echo "🏗️  Building Vue.js application locally..."

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Build the application locally
echo "🔨 Building production bundle..."
pnpm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Dist size: $(du -sh dist | cut -f1)"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf frontend-deploy.tar.gz dist/ Dockerfile docker-compose.yml

echo "📤 Uploading to remote server ${REMOTE_HOST}..."

# Upload to remote server
scp frontend-deploy.tar.gz ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

echo "🚀 Deploying on remote server..."

# Execute deployment on remote server
ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
    # Create directory if it doesn't exist
    mkdir -p ${REMOTE_PATH}
    cd ${REMOTE_PATH}
    
    echo "📂 Extracting files..."
    tar -xzf frontend-deploy.tar.gz
    
    echo "🐳 Building Docker image..."
    docker buildx build --platform linux/arm64 -t ${IMAGE_NAME}:${TAG} .
    
    echo "🔄 Restarting container..."
    docker stop ${IMAGE_NAME} 2>/dev/null || true
    docker rm ${IMAGE_NAME} 2>/dev/null || true
    
    docker run -d --name ${IMAGE_NAME} \
        -p 3000:3000 \
        --restart unless-stopped \
        ${IMAGE_NAME}:${TAG}
    
    echo "🧹 Cleaning up..."
    rm -f frontend-deploy.tar.gz
    
    echo "✅ Deployment completed!"
    echo "📊 Container status:"
    docker ps | grep ${IMAGE_NAME} || echo "Container not running!"
EOF

# Clean up local files
rm -f frontend-deploy.tar.gz

echo "🎉 Deployment process completed!"
echo "🌐 Your frontend should be available at: http://${REMOTE_HOST}:3000"