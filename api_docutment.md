# 视频下载服务 API 文档

## 概述

这是一个基于Go语言开发的M3U8视频下载服务，支持直接通过M3U8链接和标题创建下载任务。

- **Base URL**: `https://192.168.5.253:10000/api/v1`
- **版本**: v1.0
- **协议**: HTTP/HTTPS + WebSocket

## 认证

当前版本暂不需要认证，所有接口均为公开访问。

## 响应格式

所有API响应都遵循统一的格式：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功信息",
  "error": "错误信息(仅在success=false时存在)"
}
```

## 错误码

| HTTP状态码 | 描述 |
|------------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 410 | 资源已过期 |
| 500 | 服务器内部错误 |

---

## 一、任务管理 API

### 1.1 创建下载任务

**POST** `/api/v1/tasks`

直接使用M3U8 URL创建下载任务。

#### 请求参数

```json
{
  "m3u8_url": "https://cdn.example.com/video.m3u8",
  "title": "视频标题"
}
```

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| m3u8_url | string | 是 | M3U8视频流链接 |
| title | string | 是 | 视频标题/任务名称 |

#### 请求示例

```bash
curl -X POST https://192.168.5.253:10000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "m3u8_url": "https://cdn.example.com/video.m3u8",
    "title": "我的视频"
  }'
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "filename": "我的视频.mp4",
    "message": "Task created successfully"
  },
  "message": "Task created successfully"
}
```

#### 已存在任务响应

```json
{
  "success": true,
  "data": {
    "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "filename": "我的视频.mp4",
    "message": "Task already exists with status: completed"
  },
  "message": "Task already exists with status: completed"
}
```

### 1.2 获取任务列表

**GET** `/api/v1/tasks`

获取下载任务列表，支持状态过滤和分页。

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| status | string | 否 | - | 任务状态过滤 |
| limit | integer | 否 | 20 | 每页数量 |
| offset | integer | 否 | 0 | 偏移量 |

#### 状态值

- `pending` - 等待中
- `downloading` - 下载中
- `paused` - 已暂停
- `merging` - 合并中
- `completed` - 已完成
- `failed` - 失败

#### 请求示例

```bash
# 获取所有任务
curl https://192.168.5.253:10000/api/v1/tasks

# 获取已完成的任务
curl https://192.168.5.253:10000/api/v1/tasks?status=completed

# 分页获取任务
curl https://192.168.5.253:10000/api/v1/tasks?limit=10&offset=20
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "url": "https://example.com/video-page",
        "save_directory": "./downloads",
        "filename": "电影标题.mp4",
        "title": "电影标题",
        "status": "completed",
        "m3u8_url": "https://cdn.example.com/video.m3u8",
        "total_segments": 100,
        "completed_segments": 100,
        "progress": 100.0,
        "created_at": "2024-01-01T10:00:00Z",
        "updated_at": "2024-01-01T10:30:00Z",
        "error_message": "",
        "file_size": 1073741824
      }
    ],
    "total": 1
  },
  "message": "Tasks retrieved successfully"
}
```

### 1.3 获取单个任务详情

**GET** `/api/v1/tasks/{id}`

根据任务ID获取任务的详细信息。

#### 请求示例

```bash
curl https://192.168.5.253:10000/api/v1/tasks/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "url": "https://example.com/video-page",
    "save_directory": "./downloads",
    "filename": "电影标题.mp4",
    "title": "电影标题",
    "status": "completed",
    "m3u8_url": "https://cdn.example.com/video.m3u8",
    "total_segments": 100,
    "completed_segments": 100,
    "progress": 100.0,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:30:00Z",
    "error_message": "",
    "file_size": 1073741824
  },
  "message": "Task retrieved successfully"
}
```

### 1.4 获取任务进度

**GET** `/api/v1/tasks/{id}/progress`

获取指定任务的下载进度信息。

#### 请求示例

```bash
curl https://192.168.5.253:10000/api/v1/tasks/a1b2c3d4-e5f6-7890-abcd-ef1234567890/progress
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "downloading",
    "progress": 45.5,
    "total_segments": 100,
    "completed_segments": 45,
    "error_message": ""
  },
  "message": "Progress retrieved successfully"
}
```

### 1.5 暂停任务

**POST** `/api/v1/tasks/{id}/pause`

暂停正在下载的任务。

#### 请求示例

```bash
curl -X POST https://192.168.5.253:10000/api/v1/tasks/a1b2c3d4-e5f6-7890-abcd-ef1234567890/pause
```

#### 成功响应

```json
{
  "success": true,
  "data": null,
  "message": "Task paused successfully"
}
```

### 1.6 恢复/重启任务

**POST** `/api/v1/tasks/{id}/resume`

恢复已暂停的任务，或重新启动失败的任务。支持断点续传，会利用已下载的片段。

**支持的任务状态：**
- `paused`: 恢复暂停的任务
- `failed`: 重新启动失败的任务
- `pending`: 启动待处理的任务

#### 请求示例

```bash
curl -X POST https://192.168.5.253:10000/api/v1/tasks/a1b2c3d4-e5f6-7890-abcd-ef1234567890/resume
```

#### 成功响应

```json
{
  "success": true,
  "data": null,
  "message": "Task resumed/recovered successfully"
}
```

### 1.7 删除任务（移入回收站）

**DELETE** `/api/v1/tasks/{id}`

将任务移入回收站（软删除）。

#### 请求示例

```bash
curl -X DELETE https://192.168.5.253:10000/api/v1/tasks/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

#### 成功响应

```json
{
  "success": true,
  "data": null,
  "message": "Task deleted successfully"
}
```

---

## 二、回收站管理 API

### 2.1 获取回收站列表

**GET** `/api/v1/recycle`

获取回收站中的任务列表，支持分页。

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| limit | integer | 否 | 20 | 每页数量 |
| offset | integer | 否 | 0 | 偏移量 |

#### 请求示例

```bash
curl https://192.168.5.253:10000/api/v1/recycle?limit=10&offset=0
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "recycle-item-id",
        "original_task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "task": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "title": "电影标题",
          "filename": "电影标题.mp4",
          "status": "completed",
          "progress": 100.0,
          "file_size": 1073741824
        },
        "deleted_at": "2024-01-01T15:00:00Z",
        "expires_at": "2024-01-31T15:00:00Z",
        "file_path": "/app/downloads/movies/action/电影标题.mp4",
        "file_size": 1073741824
      }
    ],
    "total": 1,
    "stats": {
      "total_items": 1,
      "total_size": 1073741824
    }
  },
  "message": "Recycle bin retrieved successfully"
}
```

### 2.2 获取回收站统计

**GET** `/api/v1/recycle/stats`

获取回收站的统计信息。

#### 请求示例

```bash
curl https://192.168.5.253:10000/api/v1/recycle/stats
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "total_items": 5,
    "total_size": 5368709120
  },
  "message": "Recycle bin stats retrieved successfully"
}
```

### 2.3 恢复任务

**POST** `/api/v1/recycle/{id}/restore`

从回收站恢复指定任务。

#### 请求示例

```bash
curl -X POST https://192.168.5.253:10000/api/v1/recycle/recycle-item-id/restore
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "item_id": "recycle-item-id",
    "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "message": "Task restored successfully"
  },
  "message": "Task restored successfully"
}
```

### 2.4 永久删除

**DELETE** `/api/v1/recycle/{id}`

永久删除回收站中的指定项目。

#### 请求示例

```bash
curl -X DELETE https://192.168.5.253:10000/api/v1/recycle/recycle-item-id
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "item_id": "recycle-item-id",
    "message": "Item permanently deleted"
  },
  "message": "Item permanently deleted"
}
```

### 2.5 清空回收站

**DELETE** `/api/v1/recycle`

清空整个回收站。

#### 请求示例

```bash
curl -X DELETE https://192.168.5.253:10000/api/v1/recycle
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "deleted_count": 5,
    "message": "Recycle bin emptied successfully"
  },
  "message": "Recycle bin emptied successfully"
}
```

### 2.6 清理过期项目

**POST** `/api/v1/recycle/cleanup`

清理回收站中已过期的项目。

#### 请求示例

```bash
curl -X POST https://192.168.5.253:10000/api/v1/recycle/cleanup
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "cleaned_count": 2,
    "message": "Expired items cleaned up successfully"
  },
  "message": "Expired items cleaned up successfully"
}
```

---

## 三、WebSocket 实时通信

### 3.1 单任务监听

**WebSocket** `/api/v1/ws/task/{taskId}`

监听指定任务的实时进度更新。

#### 连接示例

```javascript
const ws = new WebSocket('ws://localhost:8080/api/v1/ws/task/a1b2c3d4-e5f6-7890-abcd-ef1234567890');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('进度更新:', data);
};
```

#### 接收消息格式

```json
{
  "total_segments": 100,
  "completed_segments": 45,
  "progress": 45.0,
  "status": "downloading",
  "error_message": ""
}
```

### 3.2 全局任务监听

**WebSocket** `/api/v1/ws/global`

监听所有任务的实时进度更新。

#### 连接示例

```javascript
const ws = new WebSocket('ws://localhost:8080/api/v1/ws/global');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log(`任务 ${data.task_id} 进度更新:`, data.progress);
};
```

#### 接收消息格式

```json
{
  "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "total_segments": 100,
  "completed_segments": 45,
  "progress": 45.0,
  "status": "downloading",
  "error_message": ""
}
```

---

## 四、系统管理 API

### 4.1 健康检查

**GET** `/api/v1/health`

检查服务健康状态。

#### 请求示例

```bash
curl https://192.168.5.253:10000/api/v1/health
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T10:00:00Z"
  },
  "message": "Service is healthy"
}
```

### 4.2 获取系统状态

**GET** `/api/v1/status`

获取系统运行状态，包括活跃任务数量等信息。

#### 请求示例

```bash
curl https://192.168.5.253:10000/api/v1/status
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "active_tasks": 2,
    "max_concurrent_tasks": 3,
    "total_tasks": 15,
    "system_status": "running",
    "available_slots": 1
  },
  "message": "System status retrieved successfully"
}
```

### 4.3 获取配置信息

**GET** `/api/v1/config`

获取当前服务配置信息。

#### 请求示例

```bash
curl https://192.168.5.253:10000/api/v1/config
```

#### 成功响应

```json
{
  "success": true,
  "data": {
    "server": {
      "host": "localhost",
      "port": 8080
    },
    "download": {
      "default_directory": "./downloads",
      "max_concurrent": 15,
      "max_concurrent_tasks": 3,
      "timeout_seconds": 30
    },
    "recycle": {
      "retention_days": 30,
      "auto_cleanup": true
    }
  },
  "message": "Configuration retrieved successfully"
}
```

---

## 五、使用示例

### 5.1 完整下载流程

```bash
# 1. 创建下载任务
TASK_RESPONSE=$(curl -s -X POST https://192.168.5.253:10000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "m3u8_url": "https://cdn.example.com/video.m3u8",
    "title": "我的视频"
  }')

# 2. 提取任务ID
TASK_ID=$(echo $TASK_RESPONSE | jq -r '.data.task_id')
echo "任务ID: $TASK_ID"

# 3. 监听进度（可选）
# 使用WebSocket连接 ws://localhost:8080/api/v1/ws/task/$TASK_ID

# 4. 查询任务状态
while true; do
  STATUS=$(curl -s https://192.168.5.253:10000/api/v1/tasks/$TASK_ID | jq -r '.data.status')
  echo "当前状态: $STATUS"
  
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  
  sleep 5
done

echo "下载完成!"
```

### 5.2 回收站管理

```bash
# 1. 删除任务（移入回收站）
curl -X DELETE https://192.168.5.253:10000/api/v1/tasks/a1b2c3d4-e5f6-7890-abcd-ef1234567890

# 2. 查看回收站
curl https://192.168.5.253:10000/api/v1/recycle

# 3. 恢复任务
curl -X POST https://192.168.5.253:10000/api/v1/recycle/recycle-item-id/restore

# 4. 清理过期项目
curl -X POST https://192.168.5.253:10000/api/v1/recycle/cleanup
```

---

## 六、注意事项

1. **任务ID**: 所有任务使用UUID格式的唯一标识符
2. **文件路径**: 保存目录为相对于配置文件中`default_directory`的路径
3. **WebSocket**: 连接时需要处理连接断开和重连逻辑
4. **回收站**: 删除的任务会在回收站保留30天（可配置）
5. **并发限制**: 
   - `max_concurrent`: 单个任务内部并发下载段数量限制（默认15）
   - `max_concurrent_tasks`: 全局同时进行的任务数量限制（默认3）
6. **错误处理**: 所有接口都会返回详细的错误信息

## 七、错误响应示例

```json
{
  "success": false,
  "error": "Task not found"
}
```

```json
{
  "success": false,
  "error": "Invalid request format"
}
```

```json
{
  "success": false,
  "error": "Task is already running"
}
```