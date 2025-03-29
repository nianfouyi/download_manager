<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>添加新下载</h3>
          <button class="close-button" @click="closeModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div v-if="!showDirectoryBrowser" class="modal-body">
          <form @submit.prevent="submitForm">
            <div class="form-group">
              <label for="download-url">下载链接</label>
              <input 
                type="url" 
                id="download-url" 
                v-model="formData.url" 
                required 
                placeholder="输入下载链接"
              >
            </div>
            
            <div class="form-group">
              <label for="save-path">保存路径</label>
              <div class="path-input-group">
                <input 
                  type="text" 
                  id="save-path" 
                  v-model="formData.savePath" 
                  required 
                  placeholder="选择保存路径"
                  readonly
                >
                <button type="button" class="browse-button" @click="openDirectoryBrowser">
                  浏览
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <div v-else class="modal-body directory-browser-container">
          <DirectoryBrowser 
            :initial-path="formData.savePath || '/'" 
            @select="selectDirectory" 
            @cancel="showDirectoryBrowser = false"
          />
        </div>
        
        <div v-if="!showDirectoryBrowser" class="modal-footer">
          <button class="btn cancel" @click="closeModal">取消</button>
          <button class="btn submit" @click="submitForm" :disabled="!isFormValid">开始下载</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue'
import DirectoryBrowser from './DirectoryBrowser.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  url: '',
  savePath: ''
})

const showDirectoryBrowser = ref(false)

const isFormValid = computed(() => {
  return formData.value.url && formData.value.savePath
})

async function submitForm() {
  if (isFormValid.value) {
    try {
      const response = await fetch('/api/downloads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: formData.value.url,
          savePath: formData.value.savePath
        })
      })
      const data = await response.json()
      if (data.code === 200) {
        emit('submit', data.data)
        closeModal()
      }
    } catch (error) {
      console.error('添加下载失败:', error)
    }
  }
}

function closeModal() {
  showDirectoryBrowser.value = false
  emit('close')
  resetForm()
}

function resetForm() {
  formData.value = {
    url: '',
    savePath: ''
  }
}

function openDirectoryBrowser() {
  showDirectoryBrowser.value = true
}

function selectDirectory(path) {
  formData.value.savePath = path
  showDirectoryBrowser.value = false
}

// Reset form when modal is closed
watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<style scoped>
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
  width: 500px;
  max-width: 90%;
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition);
}

.close-button:hover {
  color: var(--danger-color);
}

.modal-body {
  padding: 1.5rem;
}

.directory-browser-container {
  padding: 0;
  height: 400px;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius);
  background-color: white;
  font-size: 1rem;
  transition: var(--transition);
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

.path-input-group {
  display: flex;
  gap: 0.5rem;
}

.path-input-group input {
  flex: 1;
}

.browse-button {
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius);
  background-color: white;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition);
}

.browse-button:hover {
  background-color: #f5f5f5;
}

.modal-footer {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.75rem 1.5rem;
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

.btn.submit {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.btn.submit:hover:not(:disabled) {
  background-color: #3951d4;
}

.btn.submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style> 