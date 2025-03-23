<template>
  <header class="app-header">
    <div class="left-section">
      <button class="menu-button" @click="$emit('open-sidebar')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div class="app-title">下载管理器</div>
    </div>
    <div class="right-section">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" placeholder="搜索下载..." />
      </div>
      <div class="user-menu">
        <div class="notification-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="badge">2</span>
        </div>
        <div class="avatar">
          <img src="https://i.pravatar.cc/32" alt="User Avatar" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
defineEmits(['open-sidebar'])
</script>

<style scoped>
.app-header {
  background-color: var(--card-bg);
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  transition: var(--transition);
}

.menu-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
}

.app-title {
  font-weight: 600;
  font-size: 1.125rem;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f0f2f5;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  width: 280px;
}

.search-box svg {
  color: var(--text-secondary);
  margin-right: 0.5rem;
}

.search-box input {
  background: none;
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.search-box input::placeholder {
  color: var(--text-secondary);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notification-icon {
  position: relative;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.notification-icon:hover {
  color: var(--text-primary);
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .search-box {
    display: none;
  }
}
</style> 