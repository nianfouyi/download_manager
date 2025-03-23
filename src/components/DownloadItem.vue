<template>
  <div class="download-item" :class="{ 'selected': isSelected }">
    <div class="download-select">
      <input 
        type="checkbox" 
        :checked="isSelected" 
        @change="$emit('select')" 
        class="select-checkbox"
      />
    </div>
    <div class="download-thumbnail">
      <img :src="download.thumbnail" alt="thumbnail">
      <div class="download-type">{{ download.type }}</div>
    </div>
    <div class="download-details">
      <div class="download-header">
        <div class="download-title">{{ download.title }}</div>
        <div class="download-actions">
          <button v-if="download.status === 'downloading'" class="action-btn pause" @click="pauseDownload">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </button>
          <button v-if="download.status === 'paused'" class="action-btn resume" @click="resumeDownload">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          <button v-if="download.status === 'error'" class="action-btn retry" @click="retryDownload">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline>
              <polyline points="23 20 23 14 17 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
          </button>
          <button class="action-btn delete" @click="deleteDownload">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="download-info">
        <div class="info-item quality">{{ download.quality }}</div>
        <div class="info-item size">{{ download.size }}</div>
      </div>
      
      <div v-if="download.status === 'downloading' || download.status === 'paused'" class="download-progress-container">
        <div class="download-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${download.progress}%` }"></div>
          </div>
          <div class="progress-stats">
            <div class="progress-percentage">{{ download.progress }}%</div>
            <div v-if="download.timeLeft" class="progress-time">{{ download.timeLeft }}</div>
          </div>
        </div>
      </div>

      <div v-if="download.status === 'complete'" class="download-complete">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        已完成
      </div>

      <div v-if="download.status === 'error'" class="download-error">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        下载失败 - 点击重试
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  download: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['pause', 'resume', 'delete', 'retry', 'select'])

function pauseDownload() {
  emit('pause', props.download.id)
}

function resumeDownload() {
  emit('resume', props.download.id)
}

function deleteDownload() {
  emit('delete', props.download.id)
}

function retryDownload() {
  emit('retry', props.download.id)
}
</script>

<style scoped>
.download-item {
  display: flex;
  padding: 1rem;
  border-radius: var(--border-radius);
  background-color: var(--card-bg);
  margin-bottom: 1rem;
  box-shadow: var(--box-shadow);
  transition: var(--transition);
}

.download-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-hover);
}

.download-select {
  margin-right: 12px;
  display: flex;
  align-items: center;
}

.select-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.download-item.selected {
  background-color: rgba(67, 97, 238, 0.05);
  border-left: 3px solid var(--primary-color);
}

.download-thumbnail {
  width: 120px;
  height: 68px;
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  margin-right: 1rem;
}

.download-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.download-type {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.download-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.download-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.download-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
  line-height: 1.3;
}

.download-info {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.info-item {
  font-size: 0.875rem;
  color: var(--text-secondary);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

.download-progress-container {
  margin-top: 0.5rem;
}

.download-progress {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.progress-bar {
  height: 6px;
  width: 100%;
  background-color: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.download-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition);
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.action-btn.pause:hover {
  background-color: var(--warning-color);
  color: white;
}

.action-btn.resume:hover {
  background-color: var(--success-color);
  color: white;
}

.action-btn.delete:hover {
  background-color: var(--danger-color);
  color: white;
}

.action-btn.retry:hover {
  background-color: var(--primary-color);
  color: white;
}

.download-complete {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--success-color);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.download-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--danger-color);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.download-item.complete {
  border-left: 3px solid var(--success-color);
}

.download-item.error {
  border-left: 3px solid var(--danger-color);
}

.download-item.paused {
  border-left: 3px solid var(--warning-color);
}

.download-item.downloading {
  border-left: 3px solid var(--primary-color);
}

@media (max-width: 768px) {
  .download-item {
    flex-direction: column;
  }
  
  .download-thumbnail {
    width: 100%;
    height: 120px;
    margin-right: 0;
    margin-bottom: 1rem;
  }
  
  .download-actions {
    margin-left: auto;
  }
  
  .download-select {
    margin-bottom: 0.5rem;
  }
}
</style> 