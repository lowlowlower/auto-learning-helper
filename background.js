// 后台服务工作进程
console.log('自动学习助手后台服务已启动');

// ========================================
// 标签页管理（双标签页架构）
// ========================================
let mainTabId = null;      // 主标签页ID（课程列表）
let videoTabId = null;     // 学习标签页ID（视频页面）
let learningStatus = 'idle'; // idle | learning
// idle: 空闲，可以打开新的学习标签页
// learning: 正在学习，已有学习标签页

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
  
  // 初始化标签页管理状态
  mainTabId = null;
  videoTabId = null;
  learningStatus = 'idle';
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[后台] 收到消息:', request, '来自标签页:', sender.tab?.id);
  
  // ========================================
  // 标签页管理消息
  // ========================================
  
  // 主标签页注册
  if (request.action === 'registerMainTab') {
    mainTabId = sender.tab.id;
    console.log('[后台] 📋 主标签页已注册:', mainTabId);
    sendResponse({ success: true, learningStatus });
    return true;
  }
  
  // 视频标签页注册
  if (request.action === 'trackVideoTab') {
    videoTabId = sender.tab.id;
    learningStatus = 'learning';
    console.log('[后台] 🎬 学习标签页已注册:', videoTabId);
    console.log('[后台] 状态: idle → learning');
    sendResponse({ success: true });
    return true;
  }
  
  // 检查学习状态（主标签页询问是否可以打开新课程）
  if (request.action === 'checkLearningStatus') {
    console.log('[后台] 📊 查询学习状态:', learningStatus);
    sendResponse({ learningStatus, videoTabId });
    return true;
  }
  
  // 关闭视频标签页（视频完成后）
  if (request.action === 'closeVideoTab') {
    console.log('[后台] 🔄 收到关闭视频标签页请求');
    
    if (videoTabId) {
      chrome.tabs.remove(videoTabId).then(() => {
        console.log('[后台] ✅ 已关闭学习标签页:', videoTabId);
        videoTabId = null;
        learningStatus = 'idle';
        console.log('[后台] 状态: learning → idle');
        
        // 通知主标签页继续下一个课程
        if (mainTabId) {
          setTimeout(() => {
            chrome.tabs.sendMessage(mainTabId, { action: 'startNextCourse' })
              .then(() => {
                console.log('[后台] ✅ 已通知主标签页继续学习');
              })
              .catch(err => {
                console.log('[后台] ⚠️ 通知主标签页失败:', err);
              });
          }, 1000);
        }
      }).catch(err => {
        console.log('[后台] ⚠️ 关闭标签页失败:', err);
        videoTabId = null;
        learningStatus = 'idle';
      });
    } else {
      console.log('[后台] ⚠️ 没有视频标签页需要关闭');
      learningStatus = 'idle';
    }
    
    sendResponse({ success: true });
    return true;
  }
  
  // ========================================
  // 原有消息处理
  // ========================================
  
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

// 监听标签页关闭
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // 如果关闭的是学习标签页，清除状态
  if (tabId === videoTabId) {
    console.log('[后台] 🔴 学习标签页已关闭:', tabId);
    videoTabId = null;
    learningStatus = 'idle';
    console.log('[后台] 状态: learning → idle');
    
    // 通知主标签页继续下一个课程
    if (mainTabId) {
      setTimeout(() => {
        chrome.tabs.sendMessage(mainTabId, { action: 'startNextCourse' })
          .then(() => {
            console.log('[后台] ✅ 已通知主标签页继续学习');
          })
          .catch(err => {
            console.log('[后台] ⚠️ 通知主标签页失败:', err);
          });
      }, 1000);
    }
  }
  
  // 如果关闭的是主标签页，清除状态
  if (tabId === mainTabId) {
    console.log('[后台] 🔴 主标签页已关闭:', tabId);
    mainTabId = null;
  }
});

