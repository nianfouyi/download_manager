<template>
  <div class="directory-browser">
    <div class="browser-header">
      <div class="current-path">
        <span>当前路径: {{ currentPath }}</span>
      </div>
      <button v-if="!isRoot" class="nav-btn" @click="goToParent">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        上级目录
      </button>
    </div>
    
    <div v-if="loading" class="loading">
      <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M16 12a4 4 0 1 1-8 0"></path>
      </svg>
      加载中...
    </div>
    
    <div v-else-if="error" class="error">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      {{ error }}
    </div>
    
    <div v-else class="directory-list">
      <div v-if="items.length === 0" class="empty-directory">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        此目录为空
      </div>
      
      <div 
        v-for="item in items" 
        :key="item.path" 
        class="directory-item"
        :class="{ 'is-directory': item.isDirectory }"
        @click="item.isDirectory && navigateTo(item.path)"
      >
        <svg v-if="item.isDirectory" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span class="item-name">{{ item.name }}</span>
      </div>
    </div>
    
    <div class="browser-footer">
      <button class="btn cancel" @click="cancel">取消</button>
      <button class="btn select" @click="selectCurrentPath">选择此目录</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  initialPath: {
    type: String,
    default: '/'
  }
})

const emit = defineEmits(['select', 'cancel'])

const currentPath = ref(props.initialPath)
const items = ref([])
const loading = ref(false)
const error = ref(null)
const isRoot = ref(false)
const parent = ref(null)

onMounted(() => {
  browsePath(currentPath.value)
})

async function browsePath(path) {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/browse-directory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPath: path
      })
    })
    
    const data = await response.json()
    
    if (data.code === 200) {
      currentPath.value = data.data.path
      items.value = data.data.items.filter(item => item.isDirectory)
      isRoot.value = data.data.isRoot
      parent.value = data.data.parent
    } else {
      error.value = data.message || '获取目录内容失败'
    }
  } catch (err) {
    console.error('浏览目录失败:', err)
    error.value = '网络错误，请重试'
  } finally {
    loading.value = false
  }
}

function navigateTo(path) {
  browsePath(path)
}

function goToParent() {
  if (parent.value) {
    browsePath(parent.value)
  }
}

function selectCurrentPath() {
  emit('select', currentPath.value)
}

function cancel() {
  emit('cancel')
}
</script>

<style scoped>
.directory-browser {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: var(--border-radius);
}

.browser-header {
  padding: 12px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-path {
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid #eaeaea;
  border-radius: var(--border-radius);
  padding: 6px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition);
}

.nav-btn:hover {
  background-color: #f5f5f5;
}

.directory-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  min-height: 300px;
}

.empty-directory {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  gap: 10px;
}

.directory-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  margin-bottom: 5px;
  border-radius: var(--border-radius);
  transition: var(--transition);
}

.directory-item.is-directory {
  cursor: pointer;
}

.directory-item.is-directory:hover {
  background-color: #f5f5f5;
}

.directory-item svg {
  color: var(--text-secondary);
}

.is-directory svg {
  color: var(--primary-color);
}

.item-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.browser-footer {
  padding: 12px;
  border-top: 1px solid #eaeaea;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.btn.cancel {
  background-color: transparent;
  border: 1px solid #e0e0e0;
  color: var(--text-secondary);
}

.btn.cancel:hover {
  background-color: #f5f5f5;
}

.btn.select {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.btn.select:hover {
  background-color: #3951d4;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 12px;
  color: var(--text-secondary);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  color: var(--danger-color);
}
</style> 