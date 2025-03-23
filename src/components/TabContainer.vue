<template>
  <div class="tab-container">
    <div class="tab-header">
      <div 
        v-for="(tab, index) in tabs" 
        :key="index" 
        class="tab" 
        :class="{ 'active': activeIndex === index }"
        @click="setActiveTab(index)"
      >
        {{ tab.title }}
        <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
      </div>
    </div>
    <div class="tab-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watchEffect } from 'vue'

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  },
  initialActiveIndex: {
    type: Number,
    default: 0
  }
})

const activeIndex = ref(props.initialActiveIndex)
const emit = defineEmits(['update:activeIndex'])

function setActiveTab(index) {
  activeIndex.value = index
  emit('update:activeIndex', index)
}

watchEffect(() => {
  activeIndex.value = props.initialActiveIndex
})
</script>

<style scoped>
.tab-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--box-shadow);
}

.tab-header {
  display: flex;
  overflow-x: auto;
  background-color: var(--card-bg);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.tab-header::-webkit-scrollbar {
  height: 3px;
}

.tab-header::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.tab {
  padding: 1rem 1.5rem;
  white-space: nowrap;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
}

.tab:hover {
  background-color: rgba(0, 0, 0, 0.03);
  color: var(--text-primary);
}

.tab.active {
  color: var(--primary-color);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: var(--primary-color);
}

.tab-count {
  margin-left: 0.5rem;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab.active .tab-count {
  background-color: var(--primary-color);
  color: white;
}

.tab-content {
  padding: 1.5rem;
  flex: 1;
}

@media (max-width: 768px) {
  .tab {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
  
  .tab-content {
    padding: 1rem;
  }
}
</style> 