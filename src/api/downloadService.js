// Mock data for download items
const downloads = [
  {
    id: 1,
    title: "宇宙探索纪录片",
    type: "视频",
    quality: "1080p",
    size: "2.3 GB",
    status: "complete",
    progress: 100,
    timeLeft: null,
    thumbnail: "https://picsum.photos/id/1002/300/200"
  },
  {
    id: 2,
    title: "海底世界探险",
    type: "视频",
    quality: "4K",
    size: "5.7 GB",
    status: "downloading",
    progress: 45,
    timeLeft: "约 30 分钟",
    thumbnail: "https://picsum.photos/id/1015/300/200"
  },
  {
    id: 3,
    title: "漫威英雄传奇第一季",
    type: "漫画",
    quality: "高清",
    size: "450 MB",
    status: "complete",
    progress: 100,
    timeLeft: null,
    thumbnail: "https://picsum.photos/id/1025/300/200"
  },
  {
    id: 4,
    title: "现代科学与技术",
    type: "电子书",
    quality: "文本",
    size: "15 MB",
    status: "paused",
    progress: 72,
    timeLeft: null,
    thumbnail: "https://picsum.photos/id/106/300/200"
  },
  {
    id: 5,
    title: "周杰伦 - 最伟大的作品",
    type: "音频",
    quality: "320kbps",
    size: "120 MB",
    status: "complete",
    progress: 100,
    timeLeft: null,
    thumbnail: "https://picsum.photos/id/1074/300/200"
  },
  {
    id: 6,
    title: "奇幻森林历险记",
    type: "漫画",
    quality: "高清",
    size: "350 MB",
    status: "downloading",
    progress: 12,
    timeLeft: "约 50 分钟",
    thumbnail: "https://picsum.photos/id/1059/300/200"
  },
  {
    id: 7,
    title: "科幻小说合集",
    type: "电子书",
    quality: "文本",
    size: "28 MB",
    status: "error",
    progress: 50,
    timeLeft: null,
    thumbnail: "https://picsum.photos/id/110/300/200"
  },
  {
    id: 8,
    title: "自然风光摄影集",
    type: "视频",
    quality: "1080p",
    size: "1.8 GB",
    status: "paused",
    progress: 30,
    timeLeft: null,
    thumbnail: "https://picsum.photos/id/1039/300/200"
  },
  {
    id: 9,
    title: "电子音乐精选集",
    type: "音频",
    quality: "FLAC",
    size: "350 MB",
    status: "complete",
    progress: 100,
    timeLeft: null,
    thumbnail: "https://picsum.photos/id/1062/300/200"
  },
  {
    id: 10,
    title: "太空漫游",
    type: "视频",
    quality: "4K",
    size: "8.2 GB",
    status: "downloading",
    progress: 75,
    timeLeft: "约 15 分钟",
    thumbnail: "https://picsum.photos/id/1008/300/200"
  },
  {
    id: 11,
    title: "超级英雄联盟",
    type: "漫画",
    quality: "高清",
    size: "520 MB",
    status: "downloading",
    progress: 28,
    timeLeft: "约 30 分钟",
    thumbnail: "https://picsum.photos/id/1027/300/200"
  },
  {
    id: 12,
    title: "经典音乐合集",
    type: "音频",
    quality: "320kbps",
    size: "280 MB",
    status: "paused",
    progress: 45,
    timeLeft: null,
    thumbnail: "https://picsum.photos/id/1082/300/200"
  }
];

const downloadService = {
  // Get all downloads with optional filtering
  getRecentDownloads(filter = null) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!filter) {
          resolve(downloads);
          return;
        }
        
        let filteredData = [...downloads];
        
        if (filter.type) {
          filteredData = filteredData.filter(download => download.type === filter.type);
        }
        
        if (filter.status) {
          filteredData = filteredData.filter(download => download.status === filter.status);
        }
        
        resolve(filteredData);
      }, 300); // Simulate network delay
    });
  },
  
  // Get download statistics
  getDownloadStats() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const stats = {
          total: downloads.length,
          completed: downloads.filter(d => d.status === 'complete').length,
          downloading: downloads.filter(d => d.status === 'downloading').length,
          paused: downloads.filter(d => d.status === 'paused').length,
          error: downloads.filter(d => d.status === 'error').length,
          types: {
            video: downloads.filter(d => d.type === '视频').length,
            comic: downloads.filter(d => d.type === '漫画').length,
            audio: downloads.filter(d => d.type === '音频').length,
            ebook: downloads.filter(d => d.type === '电子书').length
          }
        };
        resolve(stats);
      }, 200);
    });
  },
  
  // Start a new download
  startDownload(downloadInfo) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newDownload = {
          id: downloads.length + 1,
          title: downloadInfo.title,
          type: downloadInfo.type,
          quality: downloadInfo.quality || '标准',
          size: downloadInfo.size || '未知',
          status: 'downloading',
          progress: 0,
          timeLeft: '计算中...',
          thumbnail: downloadInfo.thumbnail || `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/300/200`
        };
        
        downloads.unshift(newDownload);
        resolve(newDownload);
      }, 500);
    });
  },
  
  // Update download status (pause, resume, etc)
  updateDownloadStatus(id, newStatus) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const downloadIndex = downloads.findIndex(d => d.id === id);
        
        if (downloadIndex === -1) {
          reject(new Error('Download not found'));
          return;
        }
        
        const download = downloads[downloadIndex];
        download.status = newStatus;
        
        // Update related properties based on new status
        if (newStatus === 'downloading') {
          download.timeLeft = '计算中...';
        } else if (newStatus === 'paused') {
          download.timeLeft = null;
        } else if (newStatus === 'complete') {
          download.progress = 100;
          download.timeLeft = null;
        }
        
        resolve(download);
      }, 300);
    });
  },
  
  // Delete a download
  deleteDownload(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const downloadIndex = downloads.findIndex(d => d.id === id);
        
        if (downloadIndex === -1) {
          reject(new Error('Download not found'));
          return;
        }
        
        const deleted = downloads.splice(downloadIndex, 1)[0];
        resolve(deleted);
      }, 300);
    });
  }
};

export default downloadService; 