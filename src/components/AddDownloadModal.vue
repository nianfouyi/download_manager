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
        
        <div class="modal-body">
          <form @submit.prevent="submitForm">
            <div class="form-group">
              <label for="download-url">M3U8链接</label>
              <input 
                type="url" 
                id="download-url" 
                v-model="formData.url" 
                required 
                placeholder="输入M3U8视频链接"
              >
            </div>
            
            <div class="form-group">
              <label for="title">视频标题</label>
              <input 
                type="text" 
                id="title" 
                v-model="formData.title" 
                required 
                placeholder="输入视频标题"
              >
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn cancel" @click="closeModal">取消</button>
          <button class="btn submit" @click="submitForm" :disabled="!isFormValid">开始下载</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue'
import downloadService from '../services/downloadService.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  url: '',
  title: ''
})

const isFormValid = computed(() => {
  return formData.value.url && formData.value.title
})

async function submitForm() {
  if (isFormValid.value) {
    try {
      const result = await downloadService.startDownload({
        url: formData.value.url,
        title: formData.value.title
      });
      
      emit('submit', result.data)
      closeModal()
    } catch (error) {
      console.error('添加下载失败:', error)
    }
  }
}

function closeModal() {
  emit('close')
  resetForm()
}

function resetForm() {
  formData.value = {
    url: '',
    title: ''
  }
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