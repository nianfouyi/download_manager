# Missav Frontend

Vue.js前端应用，用于M3U8视频下载任务管理系统。

## 功能特性

- 📹 支持M3U8视频链接下载
- 📊 实时下载进度监控
- 🗂️ 任务分类管理（所有下载、视频、已完成、正在下载、已暂停）
- ♻️ 回收站功能
- 📱 响应式设计，支持移动端
- 🚀 WebSocket实时更新

## 技术栈

- Vue 3 (Composition API)
- Vite
- Docker (ARM64支持)
- Node.js serve (静态文件服务)

## 前置要求

- Node.js >= 18
- pnpm (推荐使用pnpm作为包管理器)
- Docker (用于ARM64部署)

## 快速开始

### 开发环境

1. 安装依赖：
```bash
pnpm install
```

2. 启动开发服务器：
```bash
pnpm run dev
```

3. 构建生产版本：
```bash
pnpm run build
```

### Docker部署（ARM64）

#### 方式一：使用构建脚本

```bash
# 构建Docker镜像
./deploy.sh

# 构建并推送到仓库
./deploy.sh --push

# 构建并准备部署
./deploy.sh --deploy
```

#### 方式二：使用Docker Compose

```bash
# 构建并启动服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 方式三：手动Docker命令

```bash
# 构建ARM64镜像
docker buildx build --platform linux/arm64 -t missav_frontend:latest .

# 运行容器
docker run -d --name missav_frontend -p 3000:3000 missav_frontend:latest
```

## 配置说明

### 部署架构

```
用户 -> Frontend Container(3000) -> Backend Container(10000)
     192.168.5.253              192.168.5.253
```

前端和后端都部署在同一台设备 `192.168.5.253` 上：
- 前端：端口 3000 (missav_frontend)
- 后端：端口 10000

### 后端API配置

后端API地址配置在 `src/services/api.js` 文件中：

```javascript
const BASE_URL = 'https://192.168.5.253:10000/api/v1';
const WS_BASE_URL = 'wss://192.168.5.253:10000/api/v1/ws';
```

### 本地开发

开发环境的代理配置在 `vite.config.js` 中：

```javascript
proxy: {
  '/api': {
    target: 'https://192.168.5.253:10000',
    changeOrigin: true,
    secure: false
  }
}
```

## 部署流程

### 使用部署脚本（推荐）

1. **配置SSH访问**
   ```bash
   # 确保可以SSH到目标服务器
   ssh root@192.168.5.253
   ```

2. **执行部署**
   ```bash
   ./deploy.sh
   ```

   脚本会自动完成：
   - 本地构建Vue应用
   - 打包构建文件
   - 上传到目标服务器
   - 构建Docker镜像
   - 启动容器

### 手动部署

1. **本地构建**
   ```bash
   pnpm install
   pnpm run build
   ```

2. **传输文件到服务器**
   ```bash
   scp -r dist/ Dockerfile docker-compose.yml root@192.168.5.253:/mnt/sdb/missav_frontend/
   ```

3. **在服务器上构建和运行**
   ```bash
   ssh root@192.168.5.253
   cd /mnt/sdb/missav_frontend
   docker buildx build --platform linux/arm64 -t missav_frontend:latest .
   docker run -d --name missav_frontend -p 3000:3000 --restart unless-stopped missav_frontend:latest
   ```

## 主要组件

- `App.vue` - 主应用组件
- `AddDownloadModal.vue` - 添加下载任务模态框
- `DownloadList.vue` - 下载列表组件
- `DashboardStats.vue` - 统计面板组件
- `services/api.js` - API客户端
- `services/downloadService.js` - 下载服务封装

## WebSocket连接

支持两种WebSocket连接模式：

1. **单任务监听**：`wss://192.168.5.253:10000/api/v1/ws/task/{taskId}`
2. **全局监听**：`wss://192.168.5.253:10000/api/v1/ws/global`

## 访问地址

- **前端应用**: http://192.168.5.253:3000
- **后端API**: https://192.168.5.253:10000

## 故障排除

### 常见问题

1. **HTTPS证书问题**
   - 开发环境已配置 `secure: false` 允许自签证书
   - 生产环境确保后端使用有效证书

2. **端口冲突**
   - 前端使用端口 3000
   - 后端使用端口 10000
   - 确保这些端口没有被其他服务占用

3. **ARM64构建问题**
   - 确保Docker支持buildx: `docker buildx version`
   - 如需要，创建新的builder: `docker buildx create --use`

4. **SSH连接问题**
   - 确保能够SSH连接到目标服务器
   - 检查用户权限和目录权限
   - 确保 `/mnt/sdb` 目录存在且有写权限

### 日志查看

```bash
# 查看容器日志
docker logs missav_frontend

# 实时查看日志
docker logs -f missav_frontend
```

## 许可证

MIT License 