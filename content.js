// 内容脚本 - 双标签页架构
// 主标签页：课程列表（一直保持打开）
// 学习标签页：视频页面（新标签页，学完自动关闭）
console.log('自动学习助手内容脚本已加载（双标签页架构）');

let isRunning = false;
let checkInterval = null;
let videoCheckInterval = null;
let isVideoPageHandled = false; // 标记视频页面是否已处理
let hasSwitchedToElective = false; // 标记是否已切换到选修
let failedCourses = []; // 记录点击失败的课程ID
let isWaitingForVideoTab = false; // 标记是否正在等待新标签页打开（防止重复点击）
let waitingStartTime = null; // 记录等待开始时间（用于超时检测）

// 初始化
(async function init() {
  try {
    const result = await chrome.storage.local.get(['isRunning']);
    console.log('[主逻辑] 初始化，isRunning:', result.isRunning);
    
    if (result.isRunning) {
      console.log('[主逻辑] 检测到上次运行状态，正在恢复...');
      await start();
    }
  } catch (error) {
    console.log('[主逻辑] 初始化失败:', error);
  }
})();

// 监听来自popup和background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[主逻辑] 收到消息:', request);
  
  if (request.action === 'start') {
    start().then(() => sendResponse({ success: true }));
    return true;
  }
  
  if (request.action === 'stop') {
    stop().then(() => sendResponse({ success: true }));
    return true;
  }
  
  if (request.action === 'updateSpeed') {
    updateVideoSpeed(request.speed);
    sendResponse({ success: true });
  } else if (request.action === 'checkAndResume') {
    if (isRunning) {
      start().then(() => sendResponse({ success: true }));
      return true;
    } else {
      sendResponse({ success: true });
    }
  } else if (request.action === 'startNextCourse') {
    // 后台通知：学习标签页已关闭，继续下一个课程
    console.log('[主标签页] ✅ 收到后台指令，开始学习下一个课程');
    
    // ✅ 清除等待标志（新标签页已经关闭，可以继续）
    isWaitingForVideoTab = false;
    waitingStartTime = null;
    console.log('[主标签页] 🔓 清除等待标志，可以点击新课程');
    
    detectPageAndRun(); // 立即执行一次检测
    sendResponse({ success: true });
  }
});

// 开始自动学习
async function start() {
  if (isRunning) {
    console.log('[主逻辑] ⚠️ 已在运行，跳过启动');
    return;
  }
  
  isRunning = true;
  isVideoPageHandled = false;
  hasSwitchedToElective = false;
  log('开始自动学习');
  console.log('[主逻辑] 🚀 开始自动学习');
  console.log('[主逻辑] 当前URL:', location.href);
  
  // 启动检测循环
  startDetectionLoop();
  
  try {
    await chrome.storage.local.set({ isRunning: true });
  } catch (error) {
    console.log('[主逻辑] ⚠️ 保存运行状态失败');
  }
}

// 停止自动学习
async function stop() {
  isRunning = false;
  log('停止自动学习');
  console.log('[主逻辑] 🛑 停止自动学习');
  
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  
  if (videoCheckInterval) {
    clearInterval(videoCheckInterval);
    videoCheckInterval = null;
  }
  
  // ✅ 清除等待标志
  isWaitingForVideoTab = false;
  waitingStartTime = null;
  console.log('[主逻辑] 🔓 已清除所有等待标志');
  
  try {
    await chrome.storage.local.set({ isRunning: false });
  } catch (error) {
    console.log('[主逻辑] ⚠️ 保存运行状态失败');
  }
}

// 启动检测循环
function startDetectionLoop() {
  if (checkInterval) return;
  
  checkInterval = setInterval(() => {
    detectPageAndRun();
  }, 3000);
  
  // 立即执行一次
  detectPageAndRun();
}

// 检测页面类型并执行相应逻辑
async function detectPageAndRun() {
  if (!isRunning) return;
  
  console.log('[主逻辑] 检测页面类型...', location.href);
  
  // 检测是否是视频播放页面
  const video = document.querySelector('video');
  if (video) {
    console.log('[学习标签页] ✅ 这是视频播放页面');
    
    // ✅ 向后台注册自己是学习标签页
    try {
      chrome.runtime.sendMessage({ action: 'trackVideoTab' });
    } catch (e) {
      // 扩展重新加载时会报错，正常
    }
    
    if (isVideoPageHandled) {
      // 视频页面已初始化，只检查播放状态
      await checkVideoCompletion(video);
      return;
    }
    
    isVideoPageHandled = true;
    await handleVideoPage(video);
    return;
  }
  
  // 非视频页面，检查系统对话框
  checkAndCloseSystemDialog();
  
  // 检测是否是课程列表页面
  const courseCards = detectCourseCards();
  if (courseCards && courseCards.length > 0) {
    console.log('[主标签页] ✅ 这是课程列表页面，共', courseCards.length, '个课程');
    
    // ✅ 向后台注册自己是主标签页
    try {
      chrome.runtime.sendMessage({ action: 'registerMainTab' });
    } catch (e) {
      // 扩展重新加载时会报错，正常
    }
    
    await handleCourseListPage(courseCards);
    return;
  }
  
  // 未知页面
  console.log('[主逻辑] ⏳ 等待页面加载...');
}

// 处理视频播放页面
async function handleVideoPage(video) {
  console.log('[学习标签页] 检测到视频元素', video);
  
  // 检查确认对话框
  const confirmBtns = document.querySelectorAll('button');
  for (const btn of confirmBtns) {
    const btnText = btn.textContent.trim();
    if (btnText.includes('确定') || btnText.includes('确认') || btnText.includes('继续')) {
      console.log('[学习标签页] 🔔 发现确认对话框，自动点击确定', btn);
      setTimeout(() => {
        btn.click();
        log('已点击确认按钮');
      }, 500);
      break;
    }
  }
  
  // 获取课程标题
  const title = getCourseTitle();
  await updateStatus({ currentCourse: title || '正在播放' });
  console.log('[学习标签页] 当前课程:', title);
  
  // 禁用视频循环
  video.loop = false;
  
  // 获取并设置视频倍速
  const settings = await getSettings();
  const speed = parseFloat(settings.videoSpeed || '1');
  video.playbackRate = speed;
  log(`已设置视频倍速: ${speed}x`);
  console.log('[学习标签页] 视频倍速:', speed + 'x');
  
  // ✅ 等待2秒，检查视频是否自动播放
  console.log('[学习标签页] ⏳ 等待2秒，检查视频是否自动播放...');
  setTimeout(() => {
    // ✅ 输出详细的视频状态
    console.log('[学习标签页] 📊 视频状态检查:');
    console.log(`  - paused: ${video.paused}`);
    console.log(`  - currentTime: ${video.currentTime.toFixed(2)}s`);
    console.log(`  - duration: ${video.duration ? video.duration.toFixed(2) + 's' : 'unknown'}`);
    console.log(`  - readyState: ${video.readyState}`);
    
    // ✅ 只检查 paused，不检查 currentTime（因为可能有预加载）
    if (video.paused) {
      console.log('[学习标签页] ⚠️ 视频处于暂停状态，尝试播放');
      
      // ✅ 检查 currentTime，如果已经播放过很久，直接使用静音播放
      if (video.currentTime > 10) {
        console.log('[学习标签页] 📊 视频已播放过 (currentTime > 10s)');
        console.log('[学习标签页] 🔇 直接使用静音播放（避免浏览器限制）');
        
        video.muted = true;
        video.play().then(() => {
          console.log('[学习标签页] ✅ 静音播放成功');
          console.log('[学习标签页] ⚠️ 视频当前为静音状态（浏览器限制）');
          console.log('[学习标签页] 💡 提示：点击页面任意位置即可恢复声音');
          
          // ✅ 监听用户点击，自动取消静音
          const unmuteHandler = () => {
            if (video.muted) {
              video.muted = false;
              console.log('[学习标签页] 🔊 检测到用户点击，已自动恢复声音！');
              log('已恢复声音');
            }
            document.removeEventListener('click', unmuteHandler);
            document.removeEventListener('keydown', unmuteHandler);
          };
          
          document.addEventListener('click', unmuteHandler, { once: true });
          document.addEventListener('keydown', unmuteHandler, { once: true });
        }).catch(err => {
          console.log('[学习标签页] ❌ 静音播放失败:', err.message);
        });
        
        return; // ✅ 直接返回，不再尝试点击播放按钮
      }
      
      // ✅ currentTime <= 10s，尝试点击播放按钮
      const playBtn = document.querySelector('.vjs-big-play-button, .video-play-button, [class*="play-btn"]');
      
      // ✅ 输出按钮查找详情
      console.log('[学习标签页] 🔍 查找播放按钮:');
      console.log(`  - 找到按钮: ${playBtn ? 'true' : 'false'}`);
      if (playBtn) {
        console.log(`  - 按钮类名: ${playBtn.className}`);
        console.log(`  - offsetParent: ${playBtn.offsetParent}`);
        console.log(`  - display: ${getComputedStyle(playBtn).display}`);
        console.log(`  - visibility: ${getComputedStyle(playBtn).visibility}`);
        console.log('  - 按钮元素:', playBtn);
      }
      
      // ✅ 放宽条件：只要找到按钮就点击（移除 offsetParent 检查）
      if (playBtn) {
        console.log('[学习标签页] ✅ 找到播放按钮，准备点击');
        
        // ✅ 使用真实的鼠标事件来模拟用户点击（绕过自动播放限制）
        const clickPlayButton = () => {
          // 方法1：普通点击
          playBtn.click();
          
          // 方法2：模拟真实鼠标事件
          const mouseEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            buttons: 1
          });
          playBtn.dispatchEvent(mouseEvent);
          
          // 方法3：模拟鼠标按下和释放
          const mouseDown = new MouseEvent('mousedown', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          const mouseUp = new MouseEvent('mouseup', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          playBtn.dispatchEvent(mouseDown);
          playBtn.dispatchEvent(mouseUp);
        };
        
        // 第1次点击
        clickPlayButton();
        log('已点击播放按钮');
        console.log('[学习标签页] 🖱️ 第1次点击播放按钮（使用真实鼠标事件）');
        
        // 500ms后再点击一次（确保生效）
        setTimeout(() => {
          if (video.paused) {
            console.log('[学习标签页] ⚠️ 第1次点击后仍暂停，再次点击');
            clickPlayButton();
          }
        }, 500);
        
        // ✅ 1秒后再次检查
        setTimeout(() => {
          console.log('[学习标签页] 📊 点击后视频状态:');
          console.log(`  - paused: ${video.paused}`);
          console.log(`  - currentTime: ${video.currentTime.toFixed(2)}s`);
          if (!video.paused) {
            console.log('[学习标签页] ✅ 播放按钮点击成功，视频开始播放');
          } else {
            console.log('[学习标签页] ⚠️ 点击播放按钮后视频仍暂停');
            console.log('[学习标签页] 🔇 直接使用静音播放（绕过浏览器限制）');
            
            // ✅ 直接使用静音播放，不再尝试其他方法
            video.muted = true;
            video.play().then(() => {
              console.log('[学习标签页] ✅ 静音播放成功');
              console.log('[学习标签页] ⚠️ 视频当前为静音状态（浏览器限制）');
              console.log('[学习标签页] 💡 提示：点击页面任意位置即可恢复声音');
              
              // ✅ 监听用户点击，自动取消静音
              const unmuteHandler = () => {
                if (video.muted) {
                  video.muted = false;
                  console.log('[学习标签页] 🔊 检测到用户点击，已自动恢复声音！');
                  log('已恢复声音');
                }
                // 只监听一次
                document.removeEventListener('click', unmuteHandler);
                document.removeEventListener('keydown', unmuteHandler);
              };
              
              // 监听点击和按键事件
              document.addEventListener('click', unmuteHandler, { once: true });
              document.addEventListener('keydown', unmuteHandler, { once: true });
            }).catch(err => {
              console.log('[学习标签页] ❌ 静音播放也失败:', err.message);
              console.log('[学习标签页] ⚠️ 无法自动播放，可能需要用户手动点击');
            });
          }
        }, 1000);
      } else {
        // 如果没有播放按钮，尝试直接播放
        console.log('[学习标签页] ❌ 未找到播放按钮，尝试直接播放');
        video.play().then(() => {
          log('视频已开始播放');
          console.log('[学习标签页] ✅ 视频已开始播放');
        }).catch(err => {
          console.log('[学习标签页] ❌ 播放失败:', err.message);
          console.log('[学习标签页] 🔇 尝试静音播放（绕过自动播放限制）');
          
          // 静音播放
          video.muted = true;
          video.play().then(() => {
            console.log('[学习标签页] ✅ 静音播放成功');
            console.log('[学习标签页] ⚠️ 视频当前为静音状态（浏览器限制）');
            console.log('[学习标签页] 💡 提示：点击页面任意位置即可恢复声音');
            
            // ✅ 监听用户点击，自动取消静音
            const unmuteHandler = () => {
              if (video.muted) {
                video.muted = false;
                console.log('[学习标签页] 🔊 检测到用户点击，已自动恢复声音！');
                log('已恢复声音');
              }
              document.removeEventListener('click', unmuteHandler);
              document.removeEventListener('keydown', unmuteHandler);
            };
            
            document.addEventListener('click', unmuteHandler, { once: true });
            document.addEventListener('keydown', unmuteHandler, { once: true });
          }).catch(err2 => {
            console.log('[学习标签页] ❌ 静音播放也失败:', err2.message);
          });
        });
      }
    } else {
      console.log('[学习标签页] ✅ 视频已在播放，无需点击');
    }
  }, 2000);
  
  // 开始监控视频完成
  if (!videoCheckInterval) {
    videoCheckInterval = setInterval(() => {
      checkVideoCompletion(video);
    }, 3000);
  }
}

// 检查视频是否完成
async function checkVideoCompletion(video) {
  if (!video || !video.duration) return false;
  
  // 禁用视频循环（每次都检查）
  video.loop = false;
  
  // 方法1：检查是否有Replay按钮（最可靠）⭐
  const replayButton = document.querySelector('button[title="Replay"], button[aria-label="Replay"]');
  const hasReplayButton = replayButton && replayButton.offsetParent !== null;
  
  // 方法2：检查播放控制按钮是否有vjs-ended类 ⭐
  const playControl = document.querySelector('.vjs-play-control');
  const hasEndedClass = playControl && playControl.classList.contains('vjs-ended');
  
  // 方法3：video.ended属性 ⭐
  const isVideoEnded = video.ended;
  
  // 方法4：暂停在结尾（至少播放到95%以上）⭐
  const progress = video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0;
  const isPausedAtEnd = video.paused && progress >= 95;
  
  // ⚠️ 注意：大播放按钮可见不能作为完成判断，因为暂停时也会显示！
  
  // 调试输出
  console.log(`[学习标签页] 播放进度: ${progress.toFixed(1)}% (${video.currentTime.toFixed(0)}s / ${video.duration.toFixed(0)}s)`);
  
  // ✅ 综合判断（移除了大播放按钮可见的判断）
  const isCompleted = hasReplayButton || hasEndedClass || isVideoEnded || isPausedAtEnd;
  
  if (isCompleted) {
    console.log('[学习标签页] 🎬 视频学习完成！');
    console.log(`[学习标签页] 完成判断依据:`);
    console.log(`  - Replay按钮出现: ${hasReplayButton} ⭐`);
    console.log(`  - 播放控制按钮有vjs-ended类: ${hasEndedClass} ⭐`);
    console.log(`  - 视频ended: ${isVideoEnded} ⭐`);
    console.log(`  - 暂停在结尾(≥95%): ${isPausedAtEnd} ⭐`);
    console.log(`  - 播放进度: ${progress.toFixed(1)}%`);
    console.log(`  - 当前时间: ${video.currentTime.toFixed(2)}s / ${video.duration.toFixed(2)}s`);
    
    log('视频播放完成');
    
    // 更新学习计数
    try {
      const result = await chrome.storage.local.get(['learnedCount']);
      const newCount = (result.learnedCount || 0) + 1;
      await updateStatus({ learnedCount: newCount });
    } catch (error) {
      console.log('[学习标签页] ⚠️ 更新学习计数失败');
    }
    
    // 记录已学习课程
    try {
      const result = await chrome.storage.local.get(['currentLearningCourseId', 'learnedCourses']);
      const courseId = result.currentLearningCourseId;
      const learnedCourses = result.learnedCourses || [];
      
      if (courseId && !learnedCourses.includes(courseId)) {
        learnedCourses.push(courseId);
        await chrome.storage.local.set({ learnedCourses, currentLearningCourseId: null });
        console.log('[学习标签页] ✅ 课程已完成，记录到已学习列表', courseId);
      }
    } catch (error) {
      console.log('[学习标签页] ⚠️ 记录已学习课程失败');
    }
    
    // 停止所有循环
    if (checkInterval) clearInterval(checkInterval);
    if (videoCheckInterval) clearInterval(videoCheckInterval);
    checkInterval = null;
    videoCheckInterval = null;
    isRunning = false;
    
    // 请求后台关闭此标签页
    console.log('[学习标签页] 🔄 请求后台关闭此标签页');
    try {
      chrome.runtime.sendMessage({ action: 'closeVideoTab' });
    } catch (e) {
      // 扩展重新加载时会报错，正常
      console.log('[学习标签页] ⚠️ 无法联系后台，可能是扩展重新加载');
    }
    
    return true;
  }
  
  return false;
}

// 处理课程列表页面
async function handleCourseListPage(courseCards) {
  log(`检测到课程列表页面，共 ${courseCards.length} 个课程`);
  
  // ✅ 超时检测：如果等待新标签页打开超过10秒，清除等待标志
  if (isWaitingForVideoTab && waitingStartTime) {
    const elapsed = Date.now() - waitingStartTime;
    if (elapsed > 10000) { // 10秒超时
      console.log('[主标签页] ⚠️ 等待新标签页打开超时（10秒），清除等待标志');
      isWaitingForVideoTab = false;
      waitingStartTime = null;
    }
  }
  
  // ✅ 检查是否正在等待新标签页打开（防止重复点击）
  if (isWaitingForVideoTab) {
    const elapsed = waitingStartTime ? Math.floor((Date.now() - waitingStartTime) / 1000) : 0;
    console.log('[主标签页] ⏸️ 正在等待新标签页打开，跳过处理...', `(已等待${elapsed}秒)`);
    return;
  }
  
  // 先检查是否需要切换学习类型
  const needSwitch = checkAndSwitchLearningType();
  if (needSwitch) {
    console.log('[主标签页] ⏸️ 正在切换学习类型，等待...');
    return;
  }
  
  // ✅ 询问后台：是否已有学习标签页在学习
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkLearningStatus' });
    
    if (response.learningStatus === 'learning') {
      console.log('[主标签页] ⏸️ 已有学习标签页在学习，等待完成...');
      return; // 等待学习标签页完成
    }
  } catch (error) {
    console.log('[主标签页] ⚠️ 查询学习状态失败');
  }
  
  // 获取已学习列表
  const settings = await getSettings();
  const learnedCourses = settings.learnedCourses || [];
  
  // 查找未学习完成的课程
  let unlearnedCourse = null;
  let completedCount = 0;
  let skippedCount = 0;
  
  for (const card of courseCards) {
    const courseId = getCourseId(card);
    
    // 检查是否已100%完成
    if (isCourseCompleted(card)) {
      completedCount++;
      console.log('[主标签页] ⏭️ 跳过已完成课程:', getCourseCardTitle(card));
      continue;
    }
    
    // 检查是否在失败列表中
    if (courseId && failedCourses.includes(courseId)) {
      skippedCount++;
      console.log('[主标签页] 🚫 跳过失败课程:', getCourseCardTitle(card));
      continue;
    }
    
    // 检查是否在已学习列表中
    if (courseId && learnedCourses.includes(courseId)) {
      skippedCount++;
      console.log('[主标签页] ⏭️ 跳过已记录课程:', getCourseCardTitle(card));
      continue;
    }
    
    // 找到未完成的课程
    unlearnedCourse = card;
    break;
  }
  
  console.log('[主标签页] 📊 统计:', `总数${courseCards.length}, 已完成${completedCount}, 跳过${skippedCount}`);
  
  if (unlearnedCourse) {
    const courseId = getCourseId(unlearnedCourse);
    const title = getCourseCardTitle(unlearnedCourse);
    
    log(`准备学习: ${title}`);
    console.log('[主标签页] 🎯 准备学习:', title);
    await updateStatus({ currentCourse: title });
    
    // 保存当前学习课程ID
    try {
      await chrome.storage.local.set({ currentLearningCourseId: courseId });
      console.log('[主标签页] 💾 保存当前学习课程ID', courseId);
    } catch (error) {
      console.log('[主标签页] ⚠️ 保存课程ID失败');
    }
    
    // ✅ 立即设置等待标志（防止重复点击）
    isWaitingForVideoTab = true;
    waitingStartTime = Date.now();
    console.log('[主标签页] 🔒 设置等待标志，防止重复点击');
    
    // 点击课程卡片（将在新标签页打开）
    setTimeout(() => {
      console.log('[主标签页] 🖱️ 即将点击课程...');
      clickCourseCard(unlearnedCourse);
    }, 1000);
    
  } else {
    // 当前页所有课程都学完了或都失败了
    console.log('[主标签页] ✅ 当前页所有课程已完成（或全部失败）');
    console.log('[主标签页] 📊 失败课程数:', failedCourses.length);
    
    // 如果有失败的课程，清空失败列表并重试
    if (failedCourses.length > 0) {
      console.log('[主标签页] ⚠️ 检测到失败课程，清空失败列表并重试');
      failedCourses = [];
      console.log('[主标签页] 🔄 3秒后重新扫描课程...');
      return;
    }
    
    // 尝试翻到下一页
    const hasNextPage = goToNextPage();
    
    if (!hasNextPage) {
      // 没有下一页了，所有课程都学完了
      log('所有课程已学习完毕！');
      console.log('[主标签页] 🎉 所有课程已学习完毕！');
      
      if (settings.loopLearning) {
        log('开启循环学习，重置进度...');
        try {
          await chrome.storage.local.set({ learnedCourses: [] });
        } catch (error) {
          console.log('[主标签页] ⚠️ 重置学习记录失败');
        }
        setTimeout(() => {
          location.reload();
        }, 2000);
      } else {
        stop();
        await updateStatus({ isRunning: false });
      }
    }
  }
}

// 点击课程卡片
function clickCourseCard(card) {
  log('点击课程卡片');
  console.log('[主标签页] 🖱️ 点击课程卡片', card);
  
  // ✅ 防止重复点击：给卡片打上标记
  if (card.dataset.clicking === 'true') {
    console.log('[主标签页] ⚠️ 该课程正在点击中，跳过');
    return;
  }
  card.dataset.clicking = 'true';
  
  // 高亮显示
  card.style.outline = '3px solid red';
  setTimeout(() => {
    card.style.outline = '';
    // 5秒后清除标记（防止永久锁定）
    setTimeout(() => {
      delete card.dataset.clicking;
    }, 3000);
  }, 2000);
  
  // ✅ 不移除 target="_blank"，让它在新标签页打开
  const link = card.tagName === 'A' ? card : card.querySelector('a');
  if (link && link.href) {
    console.log('[主标签页] ✅ 找到链接，将在新标签页打开', link.href);
    link.click();
    log('已点击链接（新标签页）');
    return;
  }
  
  // 尝试点击封面
  const cover = card.querySelector('.cover');
  if (cover) {
    console.log('[主标签页] ✅ 找到封面，点击封面');
    const coverLink = cover.querySelector('a');
    if (coverLink && coverLink.href) {
      console.log('[主标签页] 封面内有链接，将在新标签页打开');
      coverLink.click();
      log('已点击封面链接（新标签页）');
      return;
    }
    
    cover.click();
    log('已点击封面');
    return;
  }
  
  // 直接点击卡片
  console.log('[主标签页] ✅ 直接点击卡片');
  card.click();
  log('已点击卡片');
}

// ========================================
// 工具函数（从原content.js复制）
// ========================================

// 检查并切换学习类型
function checkAndSwitchLearningType() {
  if (!window.location.hash.includes('/myClass')) {
    return false;
  }
  
  const progressElements = document.querySelectorAll('[data-v-a2a750ea]');
  let requiredProgress = null;
  
  for (const elem of progressElements) {
    const text = elem.textContent;
    if (text.includes('必修学习进度')) {
      const match = text.match(/([\d.]+)学时\s*\/([\d.]+)学时/);
      if (match) {
        const completed = parseFloat(match[1]);
        const total = parseFloat(match[2]);
        requiredProgress = { completed, total, percentage: (completed / total) * 100 };
      }
    }
  }
  
  if (requiredProgress && requiredProgress.percentage >= 100) {
    console.log('[主标签页] 📊 必修学时已满:', requiredProgress.completed, '/', requiredProgress.total);
    
    if (hasSwitchedToElective) {
      console.log('[主标签页] ℹ️ 已切换过选修，不再重复切换');
      return false;
    }
    
    const electiveTabs = document.querySelectorAll('.item');
    for (const tab of electiveTabs) {
      if (tab.textContent.trim() === '选修') {
        console.log('[主标签页] 🔄 自动切换到选修课程');
        tab.click();
        hasSwitchedToElective = true;
        return true;
      }
    }
  }
  
  return false;
}

// 检查并关闭系统对话框
function checkAndCloseSystemDialog() {
  const dialogBtns = document.querySelectorAll('button.ivu-btn-primary');
  
  for (const btn of dialogBtns) {
    const btnText = btn.textContent.trim();
    if (btnText === '确定' || btnText === '我知道了' || btnText === '关闭') {
      const dialogParent = btn.closest('.ivu-modal-wrap, .ivu-message, .ivu-notice');
      
      if (dialogParent && dialogParent.offsetParent !== null) {
        console.log('[主逻辑] 🔔 发现系统提示对话框，自动点击确定', btn);
        setTimeout(() => {
          btn.click();
          console.log('[主逻辑] ✅ 已点击系统对话框确定按钮');
        }, 500);
        break;
      }
    }
  }
}

// 检测课程卡片
function detectCourseCards() {
  const selectors = [
    '.item.hover-shadow',
    '.course-card',
    '[class*="course"][class*="item"]',
    '.course-list .item'
  ];
  
  for (const selector of selectors) {
    const cards = document.querySelectorAll(selector);
    if (cards && cards.length > 0) {
      console.log(`[主逻辑] ✅ 使用选择器 "${selector}" 找到 ${cards.length} 个课程`);
      return Array.from(cards);
    }
  }
  
  return null;
}

// 检查课程是否已完成
function isCourseCompleted(card) {
  const progressBar = card.querySelector('.el-progress-bar__inner');
  if (progressBar) {
    const width = progressBar.style.width;
    if (width === '100%') {
      return true;
    }
  }
  
  const progressText = card.textContent;
  const creditMatch = progressText.match(/([\d.]+)\s*学时\s*\/([\d.]+)学时/);
  if (creditMatch) {
    const completed = parseFloat(creditMatch[1]);
    const total = parseFloat(creditMatch[2]);
    if (completed >= total) {
      return true;
    }
  }
  
  return false;
}

// 获取课程ID
function getCourseId(card) {
  const link = card.tagName === 'A' ? card : card.querySelector('a');
  if (link && link.href) {
    const match = link.href.match(/id=([^&]+)/);
    if (match) {
      return match[1];
    }
  }
  
  const img = card.querySelector('img[src]');
  if (img && img.src) {
    return img.src;
  }
  
  return null;
}

// 获取课程卡片标题
function getCourseCardTitle(card) {
  const titleSelectors = [
    '.title',
    '.course-title',
    '.name',
    'h3',
    'h4',
    '.c-text'
  ];
  
  for (const selector of titleSelectors) {
    const titleElem = card.querySelector(selector);
    if (titleElem && titleElem.textContent.trim()) {
      return titleElem.textContent.trim();
    }
  }
  
  return '未知课程';
}

// 获取当前课程标题
function getCourseTitle() {
  const selectors = [
    '.course-title',
    '.video-title',
    'h1',
    'h2',
    '.title'
  ];
  
  for (const selector of selectors) {
    const elem = document.querySelector(selector);
    if (elem && elem.textContent.trim()) {
      return elem.textContent.trim();
    }
  }
  
  return '正在播放';
}

// 翻到下一页
function goToNextPage() {
  log('尝试翻到下一页...');
  console.log('[主标签页] 📄 尝试翻到下一页...');
  
  const nextBtnSelectors = [
    '.ivu-page-next:not(.ivu-page-disabled)',
    '.el-pagination__next:not(.disabled)',
    'button[class*="next"]:not([disabled])'
  ];
  
  for (const selector of nextBtnSelectors) {
    const btn = document.querySelector(selector);
    if (btn && !btn.classList.contains('disabled') && !btn.disabled) {
      console.log('[主标签页] ✅ 找到下一页按钮，准备点击', btn);
      setTimeout(() => {
        btn.click();
        log('已点击下一页按钮');
        console.log('[主标签页] ✅ 已点击下一页');
        
        // 清空失败列表
        failedCourses = [];
        console.log('[主标签页] 🔄 已清空失败列表（翻页）');
      }, 2000);
      return true;
    }
  }
  
  // 方法2：查找当前页码，点击下一个页码
  const activePage = document.querySelector('.ivu-page-item-active, .el-pagination__current');
  if (activePage) {
    const currentPageNum = parseInt(activePage.textContent.trim());
    console.log('[主标签页] 当前页码:', currentPageNum);
    
    const pageItems = document.querySelectorAll('.ivu-page-item, .el-pagination__item');
    
    for (const item of pageItems) {
      const pageNum = parseInt(item.textContent.trim());
      if (pageNum === currentPageNum + 1) {
        console.log('[主标签页] ✅ 找到下一页页码，准备点击', item);
        setTimeout(() => {
          item.click();
          log(`已点击第${pageNum}页`);
          console.log('[主标签页] ✅ 已点击页码', pageNum);
          
          // 清空失败列表
          failedCourses = [];
          console.log('[主标签页] 🔄 已清空失败列表（翻页）');
        }, 2000);
        return true;
      }
    }
  }
  
  console.log('[主标签页] ⚠️ 没有找到下一页按钮');
  return false;
}

// 获取设置
async function getSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    return response;
  } catch (error) {
    console.log('[主逻辑] ⚠️ 获取设置失败，使用默认值');
    return {
      videoSpeed: '1.5',
      autoNext: true,
      loopLearning: true,
      learnedCourses: []
    };
  }
}

// 更新状态
async function updateStatus(data) {
  try {
    await chrome.runtime.sendMessage({
      action: 'updateStatus',
      data: data
    });
  } catch (error) {
    console.log('[主逻辑] ⚠️ 更新状态失败');
  }
}

// 添加日志
function log(message) {
  try {
    chrome.runtime.sendMessage({
      action: 'addLog',
      message: message
    });
  } catch (error) {
    // 扩展重新加载时会报错，忽略
  }
}

// 更新视频速度
function updateVideoSpeed(speed) {
  const video = document.querySelector('video');
  if (video) {
    video.playbackRate = parseFloat(speed);
    log(`视频倍速已更新: ${speed}x`);
    console.log('[主逻辑] 视频倍速已更新:', speed + 'x');
  }
}

