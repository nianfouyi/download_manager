import apiService from './api.js';

class DownloadService {
  constructor() {
    this.api = apiService;
  }

  // Map API response to frontend format
  mapTaskToDownloadItem(task) {
    return {
      id: task.id,
      title: task.title,
      filename: task.filename,
      url: task.m3u8_url,
      savePath: task.save_directory,
      progress: task.progress || 0,
      status: this.mapStatus(task.status),
      type: this.inferType(task.filename || task.title),
      size: task.file_size || 0,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      errorMessage: task.error_message,
      totalSegments: task.total_segments,
      completedSegments: task.completed_segments,
    };
  }

  // Map backend status to frontend status
  mapStatus(backendStatus) {
    const statusMap = {
      pending: 'pending',
      downloading: 'downloading', 
      paused: 'paused',
      merging: 'downloading', // Show as downloading during merge
      completed: 'complete',
      failed: 'error',
    };
    return statusMap[backendStatus] || backendStatus;
  }

  // Infer content type from filename/title
  inferType(nameOrTitle) {
    if (!nameOrTitle) return '未知';
    const name = nameOrTitle.toLowerCase();
    if (name.includes('.mp4') || name.includes('.mkv') || name.includes('.avi') || name.includes('视频')) {
      return '视频';
    }
    if (name.includes('.mp3') || name.includes('.wav') || name.includes('音频')) {
      return '音频';
    }
    if (name.includes('漫画') || name.includes('comic')) {
      return '漫画';
    }
    return '视频'; // Default to video for M3U8
  }

  // Get all tasks with automatic pagination
  async getAllTasks(params = {}) {
    try {
      let allTasks = [];
      let offset = 0;
      const limit = 20; 
      let hasMore = true;

      while (hasMore) {
        const response = await this.api.getTasks({ 
          ...params, 
          limit: limit, 
          offset: offset 
        });
        
        const tasks = response.data.tasks || [];
        allTasks.push(...tasks);
        
        hasMore = tasks.length === limit;
        offset += limit;
        
        if (allTasks.length > 10000) {
          console.warn('警告：任务数量过多，停止获取以避免性能问题');
          break;
        }
      }

      return allTasks;
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      throw error;
    }
  }

  // Get recent downloads - 获取所有任务，不带状态过滤
  async getRecentDownloads() {
    try {
      const tasks = await this.getAllTasks(); 
      console.log(`📊 获取到任务总数: ${tasks.length}`); 
      
      const statusCounts = {};
      tasks.forEach(task => {
        statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      });
      console.log('📊 后端任务状态分布:', statusCounts);
      
      const mappedTasks = tasks.map(task => this.mapTaskToDownloadItem(task));
      
      const mappedStatusCounts = {};
      mappedTasks.forEach(task => {
        mappedStatusCounts[task.status] = (mappedStatusCounts[task.status] || 0) + 1;
      });
      console.log('📊 前端任务状态分布:', mappedStatusCounts);
      
      return mappedTasks;
    } catch (error) {
      console.error('Error fetching recent downloads:', error);
      throw error;
    }
  }

  // Get download statistics - 获取所有任务的统计，不带状态过滤
  async getDownloadStats() {
    try {
      const tasks = await this.getAllTasks(); // 不传递任何参数，获取所有任务
      
      const stats = {
        total: tasks.length,
        completed: 0,
        downloading: 0,
        paused: 0,
        error: 0,
        types: {
          video: 0,
          comic: 0,
          audio: 0,
          ebook: 0
        }
      };

      tasks.forEach(task => {
        const mappedTask = this.mapTaskToDownloadItem(task);
        // Count by status
        switch (mappedTask.status) {
          case 'complete':
            stats.completed++;
            break;
          case 'downloading':
            stats.downloading++;
            break;
          case 'paused':
            stats.paused++;
            break;
          case 'error':
            stats.error++;
            break;
        }

        // Count by type
        switch (mappedTask.type) {
          case '视频':
            stats.types.video++;
            break;
          case '漫画':
            stats.types.comic++;
            break;
          case '音频':
            stats.types.audio++;
            break;
          default:
            stats.types.ebook++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching download stats:', error);
      throw error;
    }
  }

  // Start a new download
  async startDownload(downloadData) {
    try {
      const response = await this.api.createTask(downloadData.url, downloadData.title || 'Untitled');
      return {
        code: 200,
        data: this.mapTaskToDownloadItem({
          id: response.data.task_id,
          filename: response.data.filename,
          title: downloadData.title || 'Untitled',
          m3u8_url: downloadData.url,
          status: 'pending',
          progress: 0,
        })
      };
    } catch (error) {
      console.error('Error starting download:', error);
      throw error;
    }
  }

  // Update download status
  async updateDownloadStatus(id, status) {
    try {
      switch (status) {
        case 'paused':
          await this.api.pauseTask(id);
          break;
        case 'downloading':
          await this.api.resumeTask(id);
          break;
        default:
          throw new Error(`Unsupported status update: ${status}`);
      }
    } catch (error) {
      console.error('Error updating download status:', error);
      throw error;
    }
  }

  // Delete a download
  async deleteDownload(id) {
    try {
      await this.api.deleteTask(id);
    } catch (error) {
      console.error('Error deleting download:', error);
      throw error;
    }
  }

  // Get filtered downloads
  async getDownloadsByStatus(status) {
    try {
      const backendStatusMap = {
        'complete': 'completed',
        'downloading': 'downloading',
        'paused': 'paused',
        'error': 'failed',
        'pending': 'pending',
      };
      
      const backendStatus = backendStatusMap[status];
      if (!backendStatus) {
        return this.getRecentDownloads();
      }
      
      const tasks = await this.getAllTasks({ status: backendStatus });
      return tasks.map(task => this.mapTaskToDownloadItem(task));
    } catch (error) {
      console.error('Error fetching downloads by status:', error);
      throw error;
    }
  }

  // WebSocket methods
  createTaskProgressWebSocket(taskId, onMessage, onError, onClose) {
    const ws = this.api.createTaskWebSocket(taskId);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      if (onError) onError(error);
    };
    
    ws.onclose = (event) => {
      if (onClose) onClose(event);
    };
    
    return ws;
  }

  createGlobalProgressWebSocket(onMessage, onError, onClose) {
    const ws = this.api.createGlobalWebSocket();
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      if (onError) onError(error);
    };
    
    ws.onclose = (event) => {
      if (onClose) onClose(event);
    };
    
    return ws;
  }

  // Recycle bin methods
  async getRecycleBinItems() {
    try {
      const response = await this.api.getRecycleBin();
      return response.data.items.map(item => ({
        id: item.id,
        originalTaskId: item.original_task_id,
        task: this.mapTaskToDownloadItem(item.task),
        deletedAt: item.deleted_at,
        expiresAt: item.expires_at,
        filePath: item.file_path,
        fileSize: item.file_size,
      }));
    } catch (error) {
      console.error('Error fetching recycle bin items:', error);
      throw error;
    }
  }

  async restoreFromRecycleBin(id) {
    try {
      return await this.api.restoreFromRecycleBin(id);
    } catch (error) {
      console.error('Error restoring from recycle bin:', error);
      throw error;
    }
  }

  async permanentlyDeleteFromRecycleBin(id) {
    try {
      return await this.api.permanentlyDelete(id);
    } catch (error) {
      console.error('Error permanently deleting from recycle bin:', error);
      throw error;
    }
  }

  async emptyRecycleBin() {
    try {
      return await this.api.emptyRecycleBin();
    } catch (error) {
      console.error('Error emptying recycle bin:', error);
      throw error;
    }
  }
}

// Create singleton instance
const downloadService = new DownloadService();

export default downloadService;