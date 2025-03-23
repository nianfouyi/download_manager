# 下载管理器 (Download Manager)

一个用于管理各种下载内容的现代化Vue 3应用，支持视频、漫画、音频和电子书等各类媒体文件的下载管理。

## 功能特性

- 🚀 支持多种媒体类型的下载（视频、漫画、音频、电子书等）
- 📊 实时显示下载进度和状态
- ⏸️ 暂停、恢复、重试和删除下载
- 🔍 按状态和类型筛选下载内容
- 📱 响应式设计，适配各种设备

## 技术栈

- Vue 3 (使用 Composition API)
- JavaScript
- CSS3 (CSS变量, Flexbox, Grid)

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run serve
```

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 项目结构

```
src/
├── api/              # API层和服务
├── components/       # 可复用组件
├── assets/           # 静态资源
├── style.css         # 全局样式
├── App.vue           # 主应用组件
└── main.js           # 应用入口
```

## 组件结构

- `App.vue` - 主应用容器
- `AppHeader.vue` - 应用头部组件
- `AppSidebar.vue` - 侧边栏组件
- `TabContainer.vue` - 标签页容器组件
- `DownloadList.vue` - 下载列表组件
- `DownloadItem.vue` - 单个下载项组件

## 贡献指南

1. Fork 项目
2. 创建新分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

MIT 