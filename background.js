// 后台服务工作进程
console.log('自动学习助手后台服务已启动');

// 初始化存储
chrome.runtime.onInstalled.addListener(async () => {
  console.log('插件已安装/更新');
  
  const result = await chrome.storage.local.get([
    'isRunning',
    'learnedCount',
    'currentCourse',
    'videoSpeed',
    'autoNext',
    'loopLearning',
    'learnedCourses',
    'logs'
  ]);
  
  // 设置默认值
  const defaults = {
    isRunning: result.isRunning !== undefined ? result.isRunning : false,
    learnedCount: result.learnedCount || 0,
    currentCourse: result.currentCourse || '无',
    videoSpeed: result.videoSpeed || '1.5',
    autoNext: result.autoNext !== undefined ? result.autoNext : true,
    loopLearning: result.loopLearning !== undefined ? result.loopLearning : true,
    learnedCourses: result.learnedCourses || [],
    logs: result.logs || []
  };
  
  await chrome.storage.local.set(defaults);
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request);
  
  if (request.action === 'updateStatus') {
    chrome.storage.local.set(request.data).then(() => {
      sendResponse({ success: true });
    });
    return true; // 保持消息通道开放
  }
  
  if (request.action === 'addLog') {
    addLog(request.message).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getSettings') {
    chrome.storage.local.get([
      'videoSpeed',
      'autoNext',
      'loopLearning',
      'learnedCourses'
    ]).then(result => {
      sendResponse(result);
    });
    return true;
  }
});

// 添加日志函数
async function addLog(message) {
  const time = new Date().toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  const log = { time, message };
  const result = await chrome.storage.local.get(['logs']);
  const logs = result.logs || [];
  logs.push(log);
  
  // 只保留最近50条日志
  if (logs.length > 50) {
    logs.shift();
  }
  
  await chrome.storage.local.set({ logs });
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // 页面加载完成后，检查是否需要恢复运行状态
    const result = await chrome.storage.local.get(['isRunning']);
    if (result.isRunning) {
      // 延迟一下确保页面完全加载
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: 'checkAndResume' })
          .catch(err => console.log('无法发送消息到标签页:', err));
      }, 1000);
    }
  }
});

