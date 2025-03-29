<template>
  <div class="download-list">
    <div class="list-header">
      <h2 class="list-title">{{ title }}</h2>
      <div class="list-actions">
        <button v-if="canSelectAll" class="action-btn select-all" @click="toggleSelectAll">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          {{ isAllSelected ? '取消全选' :'全选' }}
        </button>
        <div class="search-container">
          <input type="text" class="search-input" placeholder="搜索下载" v-model="searchQuery">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>
    </div>

    <div v-if="filteredDownloads.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <p class="empty-message">{{ emptyMessage }}</p>
    </div>

    <div v-else class="list-content">
      <DownloadItem 
        v-for="download in filteredDownloads" 
        :key="download.id" 
        :download="download"
        :is-selected="selectedDownloads.has(download.id)"
        @select="toggleSelectDownload(download.id)"
        @pause="pauseDownload"
        @resume="resumeDownload"
        @delete="showDeleteModal"
        @retry="retryDownload"
      />
    </div>
    
    <div class="list-footer" v-if="filteredDownloads.length > 0">
      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="currentPage === 1" @click="prevPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="nextPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
    
    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>确认删除</h3>
            <button class="close-modal" @click="closeModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p>确定要删除这个下载吗？此操作无法撤销。</p>
          </div>
          <div class="modal-footer">
            <button class="btn cancel" @click="closeModal">取消</button>
            <button class="btn delete" @click="confirmDelete">确认删除</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, onUnmounted } from 'vue'
import DownloadItem from './DownloadItem.vue'

const selectedDownloads = ref(new Set());

function toggleSelectAll() {
  if (selectedDownloads.value.size === filteredDownloads.value.length) {
    selectedDownloads.value.clear();
  } else {
    selectedDownloads.value = new Set(filteredDownloads.value.map(d=> d.id));
  }
}

function toggleSelectDownload(id) {
  if (selectedDownloads.value.has(id)){
    selectedDownloads.value.delete(id);
  } else {
    selectedDownloads.value.add(id);
  }
}

const isAllSelected = computed(() => {
  return filteredDownloads.value.length > 0 && selectedDownloads.value.size === filteredDownloads.value.length;
});

const props = defineProps({
  downloads: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: '下载列表'
  },
  emptyMessage: {
    type: String,
    default: '没有找到下载内容'
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  canSelectAll: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['pause', 'resume', 'delete', 'retry'])

const currentPage = ref(1)
const searchQuery = ref('')
const showModal = ref(false)
const downloadToDelete = ref(null)

const pollingTimer = ref(null)
const wsConnection = ref(null)

const POLLING_INTERVAL = 2000 // 2秒轮询一次

function connectWebSocket() {
  wsConnection.value = new WebSocket('ws://localhost:8080/ws/downloads')
  wsConnection.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'progress') {
      updateDownloadProgress(data.downloadId, data.progress, data.speed, data.status)
    }
  }
  wsConnection.value.onerror = (error) => {
    console.error('WebSocket连接错误:', error)
    startPolling()
  }
}

function startPolling() {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
  }
  
  pollingTimer.value = setInterval(async () => {
    try {
      const response = await fetch('/api/downloads/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: props.downloads.map(d => d.id)
        })
      })
      const data = await response.json()
      if (data.code === 200) {
        data.data.forEach(update => {
          updateDownloadProgress(update.id, update.progress, update.speed, update.status)
        })
      }
    } catch (error) {
      console.error('获取下载进度失败:', error)
    }
  }, POLLING_INTERVAL)
}

function updateDownloadProgress(downloadId, progress, speed, status) {
  const download = props.downloads.find(d => d.id === downloadId)
  if (download) {
    download.progress = progress
    download.speed = speed
    download.status = status
  }
}

onMounted(async () => {
  try {
    // 尝试建立WebSocket连接
    connectWebSocket()
    
    // 如果WebSocket连接失败，启动轮询
    if (!wsConnection.value) {
      startPolling()
    }
    
    // 获取初始下载列表
    await fetchDownloads()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

onUnmounted(() => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
  }
  if (wsConnection.value) {
    wsConnection.value.close()
  }
})

async function pauseDownload(id) {
  try {
    const response = await fetch(`/api/downloads/${id}/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    if (data.code === 200) {
      const download = props.downloads.find(d => d.id === id)
      if (download) {
        download.status = 'paused'
      }
    }
  } catch (error) {
    console.error('暂停下载失败:', error)
  }
}

async function resumeDownload(id) {
  try {
    const response = await fetch(`/api/downloads/${id}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    if (data.code === 200) {
      const download = props.downloads.find(d => d.id === id)
      if (download) {
        download.status = 'downloading'
      }
    }
  } catch (error) {
    console.error('继续下载失败:', error)
  }
}

const filteredDownloads = computed(() => {
  if (!searchQuery.value) {
    const start = (currentPage.value - 1) * props.itemsPerPage
    const end = start + props.itemsPerPage
    return props.downloads.slice(start, end)
  }
  
  const filtered = props.downloads.filter(download => 
    download.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
  
  currentPage.value = 1 // Reset to first page when searching
  
  const start = (currentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  if (!searchQuery.value) {
    return Math.ceil(props.downloads.length / props.itemsPerPage)
  }
  
  const filtered = props.downloads.filter(download => 
    download.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
  
  return Math.ceil(filtered.length / props.itemsPerPage)
})

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function retryDownload(id) {
  emit('retry', id)
}

function showDeleteModal(id) {
  downloadToDelete.value = id
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  downloadToDelete.value = null
}

function confirmDelete() {
  if (downloadToDelete.value) {
    emit('delete', downloadToDelete.value)
    closeModal()
  }
}
</script>

<style scoped>
.download-list {
  width: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.list-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.action-btn:hover {
  background-color: #3951d4;
}

.search-container {
  position: relative;
}

.search-input {
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  width: 200px;
  transition: var(--transition);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  width: 250px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.empty-state svg {
  color: var(--text-secondary);
  opacity: 0.5;
  margin-bottom: 1rem;
}

.empty-message {
  font-size: 1.125rem;
  color: var(--text-secondary);
  text-align: center;
}

.list-footer {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  background-color: white;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition);
}

.page-btn:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 400px;
  max-width: 90%;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  overflow: hidden;
}

.modal-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.close-modal {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition);
}

.close-modal:hover {
  color: var(--danger-color);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.btn.cancel {
  background-color: #f0f0f0;
  color: var(--text-primary);
}

.btn.cancel:hover {
  background-color: #e0e0e0;
}

.btn.delete {
  background-color: var(--danger-color);
  color: white;
}

.btn.delete:hover {
  background-color: #d32f2f;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .list-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .search-input {
    width: 150px;
  }
  
  .search-input:focus {
    width: 200px;
  }
}
</style> 