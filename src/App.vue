<script setup>
import { ref, onMounted, computed } from "vue";
import AppHeader from "./components/AppHeader.vue";
import AppSidebar from "./components/AppSidebar.vue";
import TabContainer from "./components/TabContainer.vue";
import DashboardStats from "./components/DashboardStats.vue";
import DownloadList from "./components/DownloadList.vue";
import DownloadItem from "./components/DownloadItem.vue";
import FloatingButton from "./components/FloatingButton.vue";
import AddDownloadModal from "./components/AddDownloadModal.vue";
import downloadService from "./services/downloadService.js";


// Sidebar state
const isSidebarActive = ref(false);

function openSidebar() {
  isSidebarActive.value = true;
}

function closeSidebar() {
  isSidebarActive.value = false;
}

// Modal state
const isModalOpen = ref(false);

function openModal() {
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
}

// Tab data
const tabs = [
  { title: "所有下载" },
  { title: "视频" },
  { title: "漫画" },
  { title: "已完成" },
  { title: "正在下载" },
  { title: "已暂停" }
];
const activeTabIndex = ref(0);

function handleTabChange(index) {
  activeTabIndex.value = index;
}

// 从卡片切换到对应标签页
function handleTabSwitch(index) {
  activeTabIndex.value = index;
}

// Download data
const recentDownloads = ref([]);
const isLoading = ref(true);

// Filtered downloads based on active tab
const filteredDownloads = computed(() => {
  if (activeTabIndex.value === 0) {
    // 所有下载
    return recentDownloads.value;
  } else if (activeTabIndex.value === 1) {
    // 视频
    return recentDownloads.value.filter((item) => item.type === "视频");
  } else if (activeTabIndex.value === 2) {
    // 漫画
    return recentDownloads.value.filter((item) => item.type === "漫画");
  } else if (activeTabIndex.value === 3) {
    // 已完成
    return recentDownloads.value.filter((item) => item.status === "complete");
  } else if (activeTabIndex.value === 4) {
    // 正在下载 - 包含downloading状态的任务（包括原本的downloading和merging状态）
    const downloadingItems = recentDownloads.value.filter(
      (item) => item.status === "downloading"
    );
    console.log('🚀 正在下载的任务数量:', downloadingItems.length, '任务详情:', downloadingItems.map(item => ({id: item.id, status: item.status, title: item.title})));
    return downloadingItems;
  } else if (activeTabIndex.value === 5) {
    // 已暂停
    return recentDownloads.value.filter((item) => item.status === "paused");
  }
  return recentDownloads.value;
});

// Get active tab title
const activeTabTitle = computed(() => {
  return tabs[activeTabIndex.value].title;
});

// Stats data
const stats = ref({
  total: 0,
  completed: 0,
  downloading: 0,
  paused: 0,
  error: 0,
  types: {
    video: 0,
    comic: 0,
    audio: 0,
    ebook: 0
  }
});

// Fetch data on component mount
onMounted(async () => {
  isLoading.value = true;
  try {
    // Fetch all data in parallel
    const [recentData, statsData] = await Promise.all([
      downloadService.getRecentDownloads(),
      downloadService.getDownloadStats(),
    ]);

    recentDownloads.value = recentData;
    stats.value = statsData;
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    isLoading.value = false;
  }
});

// Handle new download
function handleNewDownload() {
  openModal();
}

async function submitDownload(downloadData) {
  try {
    // Start the download
    await downloadService.startDownload(downloadData);

    // Refresh the data
    recentDownloads.value = await downloadService.getRecentDownloads();
    stats.value = await downloadService.getDownloadStats();

    // Close the modal
    closeModal();
  } catch (error) {
    console.error("Error starting download:", error);
  }
}

async function handlePause(id) {
  try {
    await downloadService.updateDownloadStatus(id, "paused");
    // Refresh data
    recentDownloads.value = await downloadService.getRecentDownloads();
    stats.value = await downloadService.getDownloadStats();
  } catch (error) {
    console.error("Error pausing download:", error);
  }
}

async function handleResume(id) {
  try {
    await downloadService.updateDownloadStatus(id, "downloading");
    // Refresh data
    recentDownloads.value = await downloadService.getRecentDownloads();
    stats.value = await downloadService.getDownloadStats();
  } catch (error) {
    console.error("Error resuming download:", error);
  }
}

async function handleDelete(id) {
  try {
    await downloadService.deleteDownload(id);
    // Refresh data
    recentDownloads.value = await downloadService.getRecentDownloads();
    stats.value = await downloadService.getDownloadStats();
  } catch (error) {
    console.error("Error deleting download:", error);
  }
}

async function handleRetry(id) {
  try {
    await downloadService.updateDownloadStatus(id, "downloading");
    // Refresh data
    recentDownloads.value = await downloadService.getRecentDownloads();
    stats.value = await downloadService.getDownloadStats();
  } catch (error) {
    console.error("Error retrying download:", error);
  }
}

// 批量操作处理方法
async function handleBatchDelete(ids) {
  try {
    // 批量删除所有选中的任务
    await Promise.all(ids.map(id => downloadService.deleteDownload(id)));
    
    // 刷新数据
    recentDownloads.value = await downloadService.getRecentDownloads();
    stats.value = await downloadService.getDownloadStats();
  } catch (error) {
    console.error("Error batch deleting downloads:", error);
  }
}

async function handleBatchRestart(ids) {
  try {
    // 批量重新开始所有选中的任务
    await Promise.all(ids.map(id => downloadService.updateDownloadStatus(id, "downloading")));
    
    // 刷新数据
    recentDownloads.value = await downloadService.getRecentDownloads();
    stats.value = await downloadService.getDownloadStats();
  } catch (error) {
    console.error("Error batch restarting downloads:", error);
  }
}
</script>

<template>
  <AppHeader @open-sidebar="openSidebar" />
  <AppSidebar :is-active="isSidebarActive" @close="closeSidebar" />

  <main>
    <TabContainer 
      :tabs="tabs" 
      :initial-active-index="activeTabIndex"
      @update:active-index="handleTabChange"
    />

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载数据...</p>
    </div>
    <template v-else>
      <DashboardStats 
        :stats="stats" 
        @switch-tab="handleTabSwitch"
      />

      <DownloadList 
        :downloads="filteredDownloads" 
        :title="activeTabTitle"
        @pause="handlePause"
        @resume="handleResume"
        @delete="handleDelete"
        @retry="handleRetry"
        @batch-delete="handleBatchDelete"
        @batch-restart="handleBatchRestart"
      />
    </template>

    <FloatingButton @click="handleNewDownload" />

    <!-- Add Download Modal -->
    <AddDownloadModal
      :is-open="isModalOpen"
      @close="closeModal"
      @submit="submitDownload"
    />
  </main>
</template>

<style scoped>
main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  width: 100%;
}

.loading-state {
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-secondary);
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  margin-bottom: 2rem;
}

.loading-state p {
  margin-top: 1rem;
}
</style>
