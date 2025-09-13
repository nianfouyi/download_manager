<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import AppHeader from "./components/AppHeader.vue";
import AppSidebar from "./components/AppSidebar.vue";
import TabContainer from "./components/TabContainer.vue";
import DashboardStats from "./components/DashboardStats.vue";
import DownloadList from "./components/DownloadList.vue";
import DownloadItem from "./components/DownloadItem.vue";
import FloatingButton from "./components/FloatingButton.vue";
import AddDownloadModal from "./components/AddDownloadModal.vue";
import downloadService from "./services/downloadService.js";

// DownloadList 组件引用
const downloadListRef = ref(null);


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
  { title: "已暂停" },
  { title: "等待下载" },
  { title: "回收站" }
];
const activeTabIndex = ref(0);
const subscribedIds = ref(new Set());

async function handleTabChange(index) {
  // 清除之前选项卡的选中状态
  if (downloadListRef.value) {
    downloadListRef.value.clearSelection()
  }
  activeTabIndex.value = index;
  
  // 切换选项卡时刷新数据
  await refreshData();
}

// 从卡片切换到对应标签页
async function handleTabSwitch(index) {
  // 清除之前选项卡的选中状态
  if (downloadListRef.value) {
    downloadListRef.value.clearSelection()
  }
  activeTabIndex.value = index;
  
  // 切换选项卡时刷新数据
  await refreshData();
}

// Download data
const recentDownloads = ref([]);
const recycleDownloads = ref([]);
const isLoading = ref(true);
const ws = ref(null);
const pollingTimer = ref(null);
const POLLING_INTERVAL = 3000; // 3s fallback polling

// Filtered downloads based on active tab
const filteredDownloads = computed(() => {
  // 通用：按更新时间倒序
  const sortByUpdatedTime = (items) => items.slice().sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt);
    const dateB = new Date(b.updatedAt || b.createdAt);
    return dateB - dateA;
  });

  let filtered;

  if (activeTabTitle.value === '所有下载') {
    // 所有下载：按“最后完成时间”倒序，仅对已完成使用 updatedAt；其他放在后面，按创建时间倒序
    const completed = recentDownloads.value.filter(item => item.status === 'complete')
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    const others = recentDownloads.value.filter(item => item.status !== 'complete')
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    filtered = [...completed, ...others];
  } else if (activeTabTitle.value === '视频') {
    // 视频
    filtered = recentDownloads.value.filter((item) => item.type === "视频");
  } else if (activeTabTitle.value === '漫画') {
    // 漫画
    filtered = recentDownloads.value.filter((item) => item.type === "漫画");
  } else if (activeTabTitle.value === '已完成') {
    // 已完成：按完成时间倒序
    filtered = recentDownloads.value
      .filter((item) => item.status === "complete")
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  } else if (activeTabTitle.value === '正在下载') {
    // 正在下载 - 包含downloading状态的任务（包括原本的downloading和merging状态）
    filtered = recentDownloads.value.filter((item) => item.status === "downloading");
    console.log('🚀 正在下载的任务数量:', filtered.length, '任务详情:', filtered.map(item => ({id: item.id, status: item.status, title: item.title})));
  } else if (activeTabTitle.value === '已暂停') {
    // 已暂停
    filtered = recentDownloads.value.filter((item) => item.status === "paused");
  } else if (activeTabTitle.value === '等待下载') {
    // 等待下载（pending）
    filtered = recentDownloads.value.filter((item) => item.status === "pending");
  } else if (activeTabTitle.value === '回收站') {
    // 回收站数据单独来源
    filtered = recycleDownloads.value;
  } else {
    filtered = recentDownloads.value;
  }
  
  // 默认对过滤结果按更新时间倒序；已完成页已单独排序
  if (activeTabTitle.value !== '已完成' && activeTabTitle.value !== '所有下载' && activeTabTitle.value !== '回收站') {
    return sortByUpdatedTime(filtered);
  }
  return filtered;
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

// 刷新数据的通用函数
async function refreshData() {
  try {
    // Fetch all data in parallel
    const [recentData, statsData] = await Promise.all([
      downloadService.getRecentDownloads(),
      downloadService.getDownloadStats(),
    ]);

    recentDownloads.value = recentData;
    stats.value = statsData;

    // 回收站页额外加载回收站数据
    if (activeTabTitle.value === '回收站') {
      await refreshRecycle();
    }

    // 仅在“正在下载”标签页时订阅进度
    if (activeTabTitle.value === '正在下载') {
      subscribeActiveTasks();
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function refreshRecycle() {
  try {
    const items = await downloadService.getRecycleBinItems();
    // 将回收站条目映射为 DownloadList 可展示的数据（使用其 task 字段）
    recycleDownloads.value = items.map(it => ({
      // 显示时以原任务字段为主；保留 recycleItemId 以便未来扩展操作
      ...it.task,
      recycleItemId: it.id,
    }));
  } catch (e) {
    console.error('Error fetching recycle bin:', e);
    recycleDownloads.value = [];
  }
}

// Fetch data on component mount
onMounted(async () => {
  isLoading.value = true;
  try {
    await refreshData();

    // Setup WebSocket for real-time progress
    initGlobalWebSocket();

    // 在“正在下载”标签时才启动回退轮询
    if (activeTabTitle.value === '正在下载') {
      startFallbackPolling();
    }
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  stopFallbackPolling();
  try { ws.value?.close(); } catch {}
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
    await refreshData();

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
    await refreshData();
  } catch (error) {
    console.error("Error pausing download:", error);
  }
}

async function handleResume(id) {
  try {
    await downloadService.updateDownloadStatus(id, "downloading");
    // Refresh data
    await refreshData();
  } catch (error) {
    console.error("Error resuming download:", error);
  }
}

async function handleDelete(id) {
  try {
    await downloadService.deleteDownload(id);
    // Refresh data
    await refreshData();
  } catch (error) {
    console.error("Error deleting download:", error);
  }
}

async function handleRetry(id) {
  try {
    await downloadService.updateDownloadStatus(id, "downloading");
    // Refresh data
    await refreshData();
  } catch (error) {
    console.error("Error retrying download:", error);
  }
}

// 回收站操作
async function handleRestoreRecycle(recycleItemId) {
  try {
    await downloadService.restoreFromRecycleBin(recycleItemId);
    // 刷新任务与回收站数据
    await refreshData();
  } catch (error) {
    console.error("Error restoring from recycle bin:", error);
  }
}

async function handlePermanentDeleteRecycle(recycleItemId) {
  try {
    await downloadService.permanentlyDeleteFromRecycleBin(recycleItemId);
    // 刷新回收站与统计
    await refreshData();
  } catch (error) {
    console.error("Error permanently deleting from recycle bin:", error);
  }
}

async function handleBatchRestoreRecycle(ids) {
  try {
    await Promise.all(ids.map(id => downloadService.restoreFromRecycleBin(id)));
    await refreshData();
  } catch (error) {
    console.error('Error batch restoring from recycle bin:', error);
  }
}

async function handleBatchPermanentDeleteRecycle(ids) {
  try {
    await Promise.all(ids.map(id => downloadService.permanentlyDeleteFromRecycleBin(id)));
    await refreshData();
  } catch (error) {
    console.error('Error batch permanently deleting from recycle bin:', error);
  }
}

// 批量操作处理方法
async function handleBatchDelete(ids) {
  try {
    // 批量删除所有选中的任务
    await Promise.all(ids.map(id => downloadService.deleteDownload(id)));
    
    // 刷新数据
    await refreshData();
  } catch (error) {
    console.error("Error batch deleting downloads:", error);
  }
}

async function handleBatchRestart(ids) {
  try {
    // 批量重新开始所有选中的任务
    await Promise.all(ids.map(id => downloadService.updateDownloadStatus(id, "downloading")));
    
    // 刷新数据
    await refreshData();
  } catch (error) {
    console.error("Error batch restarting downloads:", error);
  }
}

// ----- Real-time progress (WebSocket + fallback polling) -----
function initGlobalWebSocket() {
  try {
    if (ws.value) {
      try { ws.value.close(); } catch {}
    }
    ws.value = downloadService.createGlobalProgressWebSocket(
      (msg) => {
        if (msg?.type === 'progress' && msg.taskId) {
          applyProgressUpdate(msg.taskId, msg);
        }
      },
      (err) => {
        console.warn('Global WS error, will rely on polling:', err);
      },
      () => {
        // Closed: keep polling as fallback
      }
    );

    ws.value.onopen = () => {
      if (activeTabTitle.value === '正在下载') subscribeActiveTasks();
    };
  } catch (e) {
    console.warn('Failed to init global WebSocket:', e);
  }
}

function subscribeActiveTasks() {
  if (!ws.value || ws.value.readyState !== 1 /* OPEN */) return;
  const nextIds = new Set(
    recentDownloads.value
      .filter(item => ['downloading', 'paused', 'pending'].includes(item.status))
      .map(item => item.id)
  );
  // compute diff
  const toSubscribe = Array.from(nextIds).filter(id => !subscribedIds.value.has(id));
  const toUnsubscribe = Array.from(subscribedIds.value).filter(id => !nextIds.has(id));

  try {
    if (toUnsubscribe.length > 0) {
      ws.value.send(JSON.stringify({ type: 'unsubscribe', taskIds: toUnsubscribe }));
    }
    if (toSubscribe.length > 0) {
      ws.value.send(JSON.stringify({ type: 'subscribe', taskIds: toSubscribe }));
    }
    subscribedIds.value = nextIds;
  } catch (e) {
    console.warn('Subscribe/unsubscribe failed:', e);
  }
}

function applyProgressUpdate(taskId, payload) {
  const idx = recentDownloads.value.findIndex(d => d.id === taskId);
  if (idx === -1) return;
  const current = recentDownloads.value[idx];
  const mappedStatus = downloadService.mapStatus ? downloadService.mapStatus(payload.status) : payload.status;
  const updated = {
    ...current,
    status: mappedStatus || current.status,
    progress: typeof payload.progress === 'number' ? Math.max(0, Math.min(100, Number(payload.progress.toFixed ? payload.progress.toFixed(1) : payload.progress))) : current.progress,
    totalSegments: payload.totalSegments ?? current.totalSegments,
    completedSegments: payload.completedSegments ?? current.completedSegments,
    errorMessage: payload.errorMessage ?? current.errorMessage,
    // 不更新 updatedAt，避免“所有下载”排序抖动
  };
  // Vue reactivity: replace item to ensure updates propagate
  recentDownloads.value.splice(idx, 1, updated);
}

function startFallbackPolling() {
  if (pollingTimer.value) clearInterval(pollingTimer.value);
  pollingTimer.value = setInterval(async () => {
    try {
      // 仅在“正在下载”标签页时执行
      if (activeTabTitle.value !== '正在下载') return;
      const active = recentDownloads.value.filter(item => ['downloading', 'paused', 'pending'].includes(item.status));
      if (active.length === 0) return;
      // Fetch each task's progress
      const updates = await Promise.allSettled(active.map(item => downloadService.api.getTaskProgress(item.id)));
      updates.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          const data = res.value?.data;
          if (data?.task_id) {
            applyProgressUpdate(data.task_id, {
              status: data.status,
              progress: data.progress,
              totalSegments: data.total_segments,
              completedSegments: data.completed_segments,
              errorMessage: data.error_message,
            });
          }
        }
      });
    } catch (e) {
      // keep silent; next tick will retry
    }
  }, POLLING_INTERVAL);
}

function stopFallbackPolling() {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value);
    pollingTimer.value = null;
  }
}

// 切换标签时控制订阅与轮询
watch(activeTabIndex, async () => {
  // 回收站切换时刷新
  if (activeTabTitle.value === '回收站') {
    await refreshRecycle();
  }

  if (activeTabTitle.value === '正在下载') {
    subscribeActiveTasks();
    startFallbackPolling();
  } else {
    // 取消订阅并停止轮询
    if (ws.value && ws.value.readyState === 1 && subscribedIds.value.size > 0) {
      try {
        ws.value.send(JSON.stringify({ type: 'unsubscribe', taskIds: Array.from(subscribedIds.value) }));
      } catch {}
    }
    subscribedIds.value = new Set();
    stopFallbackPolling();
  }
});
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
        ref="downloadListRef"
        :downloads="filteredDownloads" 
        :title="activeTabTitle"
        :mode="activeTabTitle === '回收站' ? 'recycle' : 'normal'"
        :can-select-all="true"
        @pause="handlePause"
        @resume="handleResume"
        @delete="handleDelete"
        @retry="handleRetry"
        @batch-delete="handleBatchDelete"
        @batch-restart="handleBatchRestart"
        @restore="handleRestoreRecycle"
        @permanent-delete="handlePermanentDeleteRecycle"
        @batch-restore="handleBatchRestoreRecycle"
        @batch-permanent-delete="handleBatchPermanentDeleteRecycle"
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
