// 获取DOM元素
const toggleBtn = document.getElementById('toggle-btn');
const btnText = document.getElementById('btn-text');
const resetBtn = document.getElementById('reset-btn');
const statusEl = document.getElementById('status');
const learnedCountEl = document.getElementById('learned-count');
const currentCourseEl = document.getElementById('current-course');
const videoSpeedEl = document.getElementById('video-speed');
const autoNextEl = document.getElementById('auto-next');
const loopLearningEl = document.getElementById('loop-learning');
const logContentEl = document.getElementById('log-content');

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadStatus();
  await loadSettings();
  await loadLogs();
});

// 加载状态
async function loadStatus() {
  const result = await chrome.storage.local.get(['isRunning', 'learnedCount', 'currentCourse']);
  const isRunning = result.isRunning || false;
  const learnedCount = result.learnedCount || 0;
  const currentCourse = result.currentCourse || '无';
  
  updateUI(isRunning, learnedCount, currentCourse);
}

// 加载设置
async function loadSettings() {
  const result = await chrome.storage.local.get(['videoSpeed', 'autoNext', 'loopLearning']);
  videoSpeedEl.value = result.videoSpeed || '1.5';
  autoNextEl.checked = result.autoNext !== undefined ? result.autoNext : true;
  loopLearningEl.checked = result.loopLearning !== undefined ? result.loopLearning : true;
}

// 加载日志
async function loadLogs() {
  const result = await chrome.storage.local.get(['logs']);
  const logs = result.logs || [];
  
  logContentEl.innerHTML = '';
  logs.slice(-10).reverse().forEach(log => {
    addLogToUI(log.time, log.message);
  });
}

// 更新UI
function updateUI(isRunning, learnedCount, currentCourse) {
  if (isRunning) {
    statusEl.textContent = '运行中';
    statusEl.className = 'status-value running';
    btnText.textContent = '停止学习';
    toggleBtn.classList.add('running');
  } else {
    statusEl.textContent = '已停止';
    statusEl.className = 'status-value stopped';
    btnText.textContent = '开始学习';
    toggleBtn.classList.remove('running');
  }
  
  learnedCountEl.textContent = learnedCount;
  currentCourseEl.textContent = currentCourse;
}

// 添加日志到UI
function addLogToUI(time, message) {
  const logItem = document.createElement('div');
  logItem.className = 'log-item';
  logItem.innerHTML = `<span class="log-time">${time}</span>${message}`;
  logContentEl.insertBefore(logItem, logContentEl.firstChild);
  
  // 保持最多10条日志
  while (logContentEl.children.length > 10) {
    logContentEl.removeChild(logContentEl.lastChild);
  }
}

// 开关按钮点击事件
toggleBtn.addEventListener('click', async () => {
  const result = await chrome.storage.local.get(['isRunning']);
  const isRunning = result.isRunning || false;
  
  const newStatus = !isRunning;
  await chrome.storage.local.set({ isRunning: newStatus });
  
  // 发送消息到content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { 
      action: newStatus ? 'start' : 'stop' 
    }).catch(err => {
      console.log('发送消息失败:', err);
      addLog('请刷新页面后重试');
    });
  }
  
  await loadStatus();
  addLog(newStatus ? '开始自动学习' : '停止自动学习');
});

// 重置按钮点击事件
resetBtn.addEventListener('click', async () => {
  if (confirm('确定要重置学习进度吗？这将清除所有已学习课程记录。')) {
    await chrome.storage.local.set({
      isRunning: false,
      learnedCount: 0,
      currentCourse: '无',
      learnedCourses: [],
      currentLearningCourseId: null,
      activeSessionId: null,
      logs: []
    });
    
    await loadStatus();
    await loadLogs();
    addLog('已重置学习进度，可以重新学习所有课程');
  }
});

// 设置变更事件
videoSpeedEl.addEventListener('change', async (e) => {
  await chrome.storage.local.set({ videoSpeed: e.target.value });
  
  // 发送消息到content script更新倍速
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { 
      action: 'updateSpeed',
      speed: parseFloat(e.target.value)
    }).catch(err => console.log('发送消息失败:', err));
  }
  
  addLog(`已设置视频倍速为 ${e.target.value}x`);
});

autoNextEl.addEventListener('change', async (e) => {
  await chrome.storage.local.set({ autoNext: e.target.checked });
  addLog(`自动下一课：${e.target.checked ? '开启' : '关闭'}`);
});

loopLearningEl.addEventListener('change', async (e) => {
  await chrome.storage.local.set({ loopLearning: e.target.checked });
  addLog(`循环学习：${e.target.checked ? '开启' : '关闭'}`);
});

// 添加日志
async function addLog(message) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const log = { time, message };
  
  const result = await chrome.storage.local.get(['logs']);
  const logs = result.logs || [];
  logs.push(log);
  
  // 只保留最近50条日志
  if (logs.length > 50) {
    logs.shift();
  }
  
  await chrome.storage.local.set({ logs });
  addLogToUI(time, message);
}

// 监听storage变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.isRunning || changes.learnedCount || changes.currentCourse) {
      loadStatus();
    }
  }
});

