<template>
  <button class="floating-button" @click="$emit('click')">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  </button>
</template>

<script setup>
defineEmits(['click'])
</script>

<style scoped>
.floating-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 4px 10px rgba(67, 97, 238, 0.3);
  cursor: pointer;
  transition: var(--transition);
  z-index: 100;
}

.floating-button:hover {
  transform: translateY(-5px);
  background-color: #3951d4;
  box-shadow: 0 6px 15px rgba(67, 97, 238, 0.4);
}

.floating-button:active {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .floating-button {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 48px;
    height: 48px;
  }
}
</style> 