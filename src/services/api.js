// API configuration - backend runs on port 10000, frontend on port 3000, same host
const BASE_URL = 'https://192.168.5.253:10000/api/v1';

// WebSocket configuration
const WS_BASE_URL = 'wss://192.168.5.253:10000/api/v1/ws';

class ApiService {
  constructor() {
    this.baseURL = BASE_URL;
    this.wsBaseURL = WS_BASE_URL;
  }

  // Generic fetch wrapper
  async fetch(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Task management
  async createTask(m3u8Url, title) {
    return this.fetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        m3u8_url: m3u8Url,
        title: title,
      }),
    });
  }

  async getTasks(params = {}) {
    const defaultParams = {
      sort: 'updated_at',
      order: 'desc',
      ...params
    };
    const queryString = new URLSearchParams(defaultParams).toString();
    const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
    return this.fetch(endpoint);
  }

  async getTask(id) {
    return this.fetch(`/tasks/${id}`);
  }

  async getTaskProgress(id) {
    return this.fetch(`/tasks/${id}/progress`);
  }

  async pauseTask(id) {
    return this.fetch(`/tasks/${id}/pause`, {
      method: 'POST',
    });
  }

  async resumeTask(id) {
    return this.fetch(`/tasks/${id}/resume`, {
      method: 'POST',
    });
  }

  async deleteTask(id) {
    return this.fetch(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Recycle bin management
  async getRecycleBin(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/recycle?${queryString}` : '/recycle';
    return this.fetch(endpoint);
  }

  async getRecycleBinStats() {
    return this.fetch('/recycle/stats');
  }

  async restoreFromRecycleBin(id) {
    return this.fetch(`/recycle/${id}/restore`, {
      method: 'POST',
    });
  }

  async permanentlyDelete(id) {
    return this.fetch(`/recycle/${id}`, {
      method: 'DELETE',
    });
  }

  async emptyRecycleBin() {
    return this.fetch('/recycle', {
      method: 'DELETE',
    });
  }

  async cleanupExpiredItems() {
    return this.fetch('/recycle/cleanup', {
      method: 'POST',
    });
  }

  // System management
  async getHealth() {
    return this.fetch('/health');
  }

  async getSystemStatus() {
    return this.fetch('/status');
  }

  async getConfig() {
    return this.fetch('/config');
  }

  // WebSocket connections
  createTaskWebSocket(taskId) {
    return new WebSocket(`${this.wsBaseURL}/task/${taskId}`);
  }

  createGlobalWebSocket() {
    return new WebSocket(`${this.wsBaseURL}/global`);
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;