<template>
  <div class="download-list">
    <div class="list-header">
      <h2 class="list-title">{{ title }}</h2>
      <div class="list-actions">
        <!-- 批量操作按钮 -->
        <div class="batch-actions" v-if="selectedDownloads.size > 0">
          <button v-if="!isRecycle" class="action-btn batch-delete" @click="showBatchDeleteModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="m19 6-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
              <path d="m10 11 6"></path>
              <path d="m12 17 6"></path>
            </svg>
            删除选中 ({{ selectedDownloads.size }})
          </button>
          <button v-if="!isRecycle" class="action-btn batch-restart" @click="batchRestart">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            重新开始 ({{ selectedDownloads.size }})
          </button>
          <button v-if="isRecycle" class="action-btn batch-restart" @click="showRecycleBatchModal('restore')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            批量恢复 ({{ selectedDownloads.size }})
          </button>
          <button v-if="isRecycle" class="action-btn batch-delete" @click="showRecycleBatchModal('permanent-delete')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="m19 6-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
              <path d="m10 11 6"></path>
              <path d="m12 17 6"></path>
            </svg>
            批量彻底删除 ({{ selectedDownloads.size }})
          </button>
        </div>
        
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
        :is-selected="selectedDownloads.has(getItemKey(download))"
        :mode="mode"
        :selectable="true"
        @select="toggleSelectDownload(getItemKey(download))"
        @pause="pauseDownload"
        @resume="resumeDownload"
        @delete="showDeleteModal"
        @retry="retryDownload"
        @restore-confirm="(id) => showRecycleItemConfirm('restore', id)"
        @permanent-delete-confirm="(id) => showRecycleItemConfirm('permanent-delete', id)"
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
    
    <!-- 批量删除确认模态框 -->
    <transition name="fade">
      <div v-if="showBatchModal" class="modal-overlay" @click="closeBatchModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>批量删除确认</h3>
            <button class="close-modal" @click="closeBatchModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p>确定要删除选中的 {{ selectedDownloads.size }} 个下载任务吗？此操作无法撤销。</p>
          </div>
          <div class="modal-footer">
            <button class="btn cancel" @click="closeBatchModal">取消</button>
            <button class="btn delete" @click="confirmBatchDelete">确认删除</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 回收站单项确认 -->
    <transition name="fade">
      <div v-if="showRecycleItemModal" class="modal-overlay" @click="closeRecycleItemModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>{{ recycleActionType === 'restore' ? '确认恢复' : '确认彻底删除' }}</h3>
            <button class="close-modal" @click="closeRecycleItemModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p>
              {{ recycleActionType === 'restore' ? '确定要恢复该任务吗？' : '确定要永久删除该任务吗？此操作不可恢复。' }}
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn cancel" @click="closeRecycleItemModal">取消</button>
            <button class="btn delete" @click="confirmRecycleItem">确认</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 回收站批量确认 -->
    <transition name="fade">
      <div v-if="showRecycleBatchModalRef" class="modal-overlay" @click="closeRecycleBatchModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h3>{{ recycleBatchActionType === 'restore' ? '批量恢复确认' : '批量彻底删除确认' }}</h3>
            <button class="close-modal" @click="closeRecycleBatchModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p>
              {{ recycleBatchActionType === 'restore' 
                  ? `确定要恢复选中的 ${selectedDownloads.size} 个任务吗？`
                  : `确定要永久删除选中的 ${selectedDownloads.size} 个任务吗？此操作不可恢复。` }}
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn cancel" @click="closeRecycleBatchModal">取消</button>
            <button class="btn delete" @click="confirmRecycleBatch">确认</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, onUnmounted, defineExpose } from 'vue'
import DownloadItem from './DownloadItem.vue'

const selectedDownloads = ref(new Set());

function toggleSelectAll() {
  if (selectedDownloads.value.size === filteredDownloads.value.length) {
    selectedDownloads.value.clear();
  } else {
    selectedDownloads.value = new Set(filteredDownloads.value.map(d=> getItemKey(d)));
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
  },
  mode: {
    type: String,
    default: 'normal'
  }
})

const emit = defineEmits(['pause', 'resume', 'delete', 'retry', 'batch-delete', 'batch-restart', 'restore', 'permanent-delete', 'batch-restore', 'batch-permanent-delete'])

const isRecycle = computed(() => props.mode === 'recycle')

function getItemKey(download) {
  return isRecycle.value ? download.recycleItemId : download.id;
}

const currentPage = ref(1)
const searchQuery = ref('')
const showModal = ref(false)
const showBatchModal = ref(false)
const downloadToDelete = ref(null)

// 组件不直接处理进度轮询或WebSocket，由父组件负责

onMounted(() => {})

onUnmounted(() => {})

function pauseDownload(id) {
  emit('pause', id)
}

function resumeDownload(id) {
  emit('resume', id)
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

function restoreItem(recycleItemId) {
  emit('restore', recycleItemId)
}

function permanentDeleteItem(recycleItemId) {
  emit('permanent-delete', recycleItemId)
}

// 批量操作方法
function showBatchDeleteModal() {
  showBatchModal.value = true
}

function batchRestart() {
  const selectedIds = Array.from(selectedDownloads.value)
  emit('batch-restart', selectedIds)
  selectedDownloads.value.clear()
}

function confirmBatchDelete() {
  const selectedIds = Array.from(selectedDownloads.value)
  emit('batch-delete', selectedIds)
  selectedDownloads.value.clear()
  closeBatchModal()
}

function clearSelection() {
  selectedDownloads.value.clear()
}

function closeBatchModal() {
  showBatchModal.value = false
}

// 暴露方法给父组件
defineExpose({
  clearSelection
})

// 回收站批量/单项确认弹窗
const showRecycleItemModal = ref(false)
const recycleActionType = ref('restore') // 'restore' | 'permanent-delete'
const recycleItemToAct = ref(null)

const showRecycleBatchModalRef = ref(false)
const recycleBatchActionType = ref('restore')

function showRecycleItemConfirm(type, recycleItemId) {
  recycleActionType.value = type
  recycleItemToAct.value = recycleItemId
  showRecycleItemModal.value = true
}

function closeRecycleItemModal() {
  showRecycleItemModal.value = false
  recycleItemToAct.value = null
}

function confirmRecycleItem() {
  if (!recycleItemToAct.value) return
  if (recycleActionType.value === 'restore') {
    emit('restore', recycleItemToAct.value)
  } else {
    emit('permanent-delete', recycleItemToAct.value)
  }
  closeRecycleItemModal()
}

function showRecycleBatchModal(type) {
  recycleBatchActionType.value = type
  showRecycleBatchModalRef.value = true
}

function closeRecycleBatchModal() {
  showRecycleBatchModalRef.value = false
}

function confirmRecycleBatch() {
  const ids = Array.from(selectedDownloads.value)
  if (recycleBatchActionType.value === 'restore') {
    emit('batch-restore', ids)
  } else {
    emit('batch-permanent-delete', ids)
  }
  selectedDownloads.value.clear()
  closeRecycleBatchModal()
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
  flex-wrap: wrap;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.action-btn.select-all {
  background-color: var(--primary-color);
  color: white;
}

.action-btn.select-all:hover {
  background-color: #3951d4;
}

.action-btn.batch-delete {
  background-color: var(--danger-color);
  color: white;
}

.action-btn.batch-delete:hover {
  background-color: #d32f2f;
}

.action-btn.batch-restart {
  background-color: #4caf50;
  color: white;
}

.action-btn.batch-restart:hover {
  background-color: #45a049;
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
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .batch-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .search-input {
    width: 150px;
  }
  
  .search-input:focus {
    width: 200px;
  }
}
</style> 
