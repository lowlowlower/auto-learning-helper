// 内容脚本 - 在页面中执行自动化操作
console.log('自动学习助手内容脚本已加载');

let isRunning = false;
let checkInterval = null;
let videoCheckInterval = null;
let isNavigating = false; // 标记是否正在跳转页面

// 初始化
(async function init() {
  try {
    const result = await chrome.storage.local.get(['isRunning']);
    isRunning = result.isRunning || false;
    
    if (isRunning) {
      log('检测到上次运行状态，正在恢复...');
      start();
    }
  } catch (error) {
    console.log('%c[自动学习助手] ⚠️ 初始化失败，扩展可能已重新加载', 'color: orange');
  }
})();

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('content script收到消息:', request);
  
  if (request.action === 'start') {
    start();
    sendResponse({ success: true });
  } else if (request.action === 'stop') {
    stop();
    sendResponse({ success: true });
  } else if (request.action === 'updateSpeed') {
    updateVideoSpeed(request.speed);
    sendResponse({ success: true });
  } else if (request.action === 'checkAndResume') {
    if (isRunning) {
      start();
    }
    sendResponse({ success: true });
  }
  
  return true;
});

// 启动检测循环
function startDetectionLoop() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  
  // 立即检测一次
  detectPageAndRun();
  
  // 定期检查页面状态
  checkInterval = setInterval(() => {
    detectPageAndRun();
  }, 3000);
}

// 开始自动学习
function start() {
  if (isRunning) return;
  
  isRunning = true;
  log('开始自动学习');
  console.log('%c[自动学习助手] 🚀 开始自动学习', 'color: green; font-size: 16px; font-weight: bold');
  console.log('%c[自动学习助手] 当前URL:', 'color: blue', location.href);
  
  // 启动检测循环
  startDetectionLoop();
}

// 停止自动学习
function stop() {
  isRunning = false;
  log('停止自动学习');
  
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  
  if (videoCheckInterval) {
    clearInterval(videoCheckInterval);
    videoCheckInterval = null;
  }
}

// 检测页面类型并执行
async function detectPageAndRun() {
  if (!isRunning) return;
  
  console.log('%c[自动学习助手] 检测页面类型...', 'color: purple', location.href);
  
  // 检测是否是视频播放页面
  const video = document.querySelector('video');
  if (video) {
    console.log('%c[自动学习助手] ✅ 这是视频播放页面', 'color: green; font-weight: bold');
    // 清除跳转标志
    isNavigating = false;
    await handleVideoPage(video);
    return;
  }
  
  // 检测是否是课程列表页面
  const courseCards = detectCourseCards();
  if (courseCards && courseCards.length > 0) {
    console.log('%c[自动学习助手] ✅ 这是课程列表页面', 'color: green; font-weight: bold');
    
    // 如果正在跳转页面，跳过课程列表的处理
    if (isNavigating) {
      console.log('%c[自动学习助手] ⏸️ 正在跳转页面，跳过课程列表处理', 'color: gray');
      return;
    }
    
    await handleCourseListPage(courseCards);
    return;
  }
  
  // 未知页面
  log('等待页面加载...');
  console.log('%c[自动学习助手] ⏳ 等待页面加载...', 'color: gray');
}

// 处理视频播放页面
async function handleVideoPage(video) {
  log('检测到视频页面');
  console.log('%c[自动学习助手] 检测到视频元素', 'color: blue; font-weight: bold', video);
  
  // 获取课程标题
  const title = getCourseTitle();
  await updateStatus({ currentCourse: title || '正在播放' });
  console.log('%c[自动学习助手] 当前课程:', 'color: blue', title);
  
  // 设置视频倍速
  const settings = await getSettings();
  if (settings.videoSpeed) {
    video.playbackRate = parseFloat(settings.videoSpeed);
    log(`已设置视频倍速: ${settings.videoSpeed}x`);
    console.log('%c[自动学习助手] 视频倍速:', 'color: blue', settings.videoSpeed + 'x');
  }
  
  // 尝试点击播放按钮（Video.js播放器）
  const playButton = document.querySelector('.vjs-big-play-button');
  if (playButton) {
    console.log('%c[自动学习助手] 找到播放按钮，准备点击', 'color: green; font-weight: bold', playButton);
    setTimeout(() => {
      playButton.click();
      log('已点击播放按钮');
      console.log('%c[自动学习助手] ✅ 已点击播放按钮', 'color: green; font-weight: bold');
    }, 1000);
  } else {
    console.log('%c[自动学习助手] 未找到播放按钮，尝试直接播放', 'color: orange');
  }
  
  // 确保视频播放
  setTimeout(async () => {
    if (video.paused) {
      console.log('%c[自动学习助手] 视频处于暂停状态，尝试播放', 'color: orange');
      try {
        await video.play();
        log('视频开始播放');
        console.log('%c[自动学习助手] ✅ 视频已开始播放', 'color: green; font-weight: bold');
      } catch (err) {
        console.error('%c[自动学习助手] ❌ 播放视频失败:', 'color: red; font-weight: bold', err);
        // 再次尝试点击播放按钮
        const retryButton = document.querySelector('.vjs-big-play-button, .vjs-play-control');
        if (retryButton) {
          console.log('%c[自动学习助手] 重试点击播放按钮', 'color: orange');
          retryButton.click();
        }
      }
    } else {
      console.log('%c[自动学习助手] ✅ 视频正在播放中', 'color: green');
    }
  }, 2000);
  
  // 监控视频结束
  if (!videoCheckInterval) {
    videoCheckInterval = setInterval(async () => {
      if (!isRunning) {
        clearInterval(videoCheckInterval);
        videoCheckInterval = null;
        return;
      }
      
      // 方法1：检查播放控制按钮是否显示 "vjs-ended" 状态（最可靠）
      const playControlButton = document.querySelector('.vjs-play-control');
      const hasEndedClass = playControlButton && playControlButton.classList.contains('vjs-ended');
      
      // 方法2：检查大播放按钮是否重新出现
      const bigPlayButton = document.querySelector('.vjs-big-play-button');
      const isBigPlayButtonVisible = bigPlayButton && (
        bigPlayButton.offsetParent !== null ||
        window.getComputedStyle(bigPlayButton).display !== 'none'
      );
      
      // 方法3：检查视频状态
      const isVideoEnded = video.ended || (video.duration > 0 && video.currentTime >= video.duration - 1);
      
      // 方法4：检查是否暂停且接近结尾
      const isPausedAtEnd = video.paused && video.duration > 0 && video.currentTime >= video.duration - 2;
      
      // 综合判断：控制按钮显示ended 或 大播放按钮出现 或 视频结束 或 暂停在结尾
      const isCompleted = hasEndedClass || isBigPlayButtonVisible || isVideoEnded || isPausedAtEnd;
      
      if (isCompleted) {
        // 输出详细的完成信息
        console.log('%c[自动学习助手] 🎬 视频学习完成！', 'color: green; font-size: 14px; font-weight: bold');
        console.log(`%c[自动学习助手] 完成判断依据:`, 'color: blue');
        console.log(`  - 播放控制按钮有vjs-ended类: ${hasEndedClass} ⭐`);
        console.log(`  - 大播放按钮可见: ${isBigPlayButtonVisible}`);
        console.log(`  - 视频ended: ${video.ended}`);
        console.log(`  - 当前时间: ${video.currentTime.toFixed(2)}s / ${video.duration.toFixed(2)}s`);
        console.log(`  - 视频暂停: ${video.paused}`);
        
        log('视频播放完成');
        
        // 增加学习计数
        try {
          const result = await chrome.storage.local.get(['learnedCount']);
          const newCount = (result.learnedCount || 0) + 1;
          await updateStatus({ learnedCount: newCount });
        } catch (error) {
          console.log('%c[自动学习助手] ⚠️ 更新学习计数失败', 'color: orange');
        }
        
        // 返回列表页面
        const settings = await getSettings();
        if (settings.autoNext) {
          log('准备返回课程列表...');
          console.log('%c[自动学习助手] 🔙 准备返回课程列表...', 'color: blue; font-weight: bold');
          clearInterval(videoCheckInterval);
          videoCheckInterval = null;
          
          setTimeout(() => {
            goBackToCourseList();
          }, 2000);
        } else {
          stop();
        }
      } else {
        // 定期输出播放进度（每10秒）
        if (video.duration > 0 && Math.floor(video.currentTime) % 10 === 0) {
          const progress = ((video.currentTime / video.duration) * 100).toFixed(1);
          console.log(`%c[自动学习助手] 播放进度: ${progress}% (${video.currentTime.toFixed(0)}s / ${video.duration.toFixed(0)}s)`, 'color: gray');
        }
      }
    }, 2000);
  }
}

// 处理课程列表页面
async function handleCourseListPage(courseCards) {
  log(`检测到课程列表页面，共 ${courseCards.length} 个课程`);
  console.log('%c[自动学习助手] 📚 找到课程:', 'color: blue; font-weight: bold', courseCards.length + '个');
  
  const settings = await getSettings();
  const learnedCourses = settings.learnedCourses || [];
  console.log('%c[自动学习助手] 已学习课程数:', 'color: blue', learnedCourses.length);
  
  // 查找未学习完成的课程
  let unlearnedCourse = null;
  let completedCount = 0;
  let skippedCount = 0;
  
  for (const card of courseCards) {
    const courseId = getCourseId(card);
    
    // 检查课程是否已经100%完成
    if (isCourseCompleted(card)) {
      completedCount++;
      console.log('%c[自动学习助手] ⏭️ 跳过已完成课程:', 'color: orange', getCourseCardTitle(card));
      continue;
    }
    
    // 检查是否在已学习列表中（插件记录的）
    if (courseId && learnedCourses.includes(courseId)) {
      skippedCount++;
      console.log('%c[自动学习助手] ⏭️ 跳过已记录课程:', 'color: orange', getCourseCardTitle(card));
      continue;
    }
    
    // 找到未完成的课程
    unlearnedCourse = card;
    break;
  }
  
  console.log('%c[自动学习助手] 📊 统计:', 'color: blue', `总数${courseCards.length}, 已完成${completedCount}, 已记录${skippedCount}`);
  
  if (unlearnedCourse) {
    const courseId = getCourseId(unlearnedCourse);
    const title = getCourseCardTitle(unlearnedCourse);
    
    log(`准备学习: ${title}`);
    console.log('%c[自动学习助手] 🎯 准备学习:', 'color: green; font-weight: bold', title);
    console.log('%c[自动学习助手] 课程元素:', 'color: blue', unlearnedCourse);
    await updateStatus({ currentCourse: title });
    
    // 记录已学习课程
    learnedCourses.push(courseId);
    try {
      await chrome.storage.local.set({ learnedCourses });
    } catch (error) {
      console.log('%c[自动学习助手] ⚠️ 保存学习记录失败', 'color: orange');
    }
    
    // 设置跳转标志，防止重复点击
    isNavigating = true;
    console.log('%c[自动学习助手] 🚀 设置跳转标志，暂停检测', 'color: orange; font-weight: bold');
    
    // 点击课程卡片
    setTimeout(() => {
      console.log('%c[自动学习助手] 🖱️ 即将点击课程...', 'color: orange; font-weight: bold');
      clickCourseCard(unlearnedCourse);
    }, 1000);
    
  } else {
    // 当前页所有课程都学完了
    log('当前页所有课程已完成');
    console.log('%c[自动学习助手] ✅ 当前页所有课程已完成', 'color: green; font-weight: bold');
    
    // 尝试翻到下一页
    const hasNextPage = goToNextPage();
    
    if (!hasNextPage) {
      // 没有下一页了，所有课程都学完了
      log('所有课程已学习完毕！');
      console.log('%c[自动学习助手] 🎉 所有课程已学习完毕！', 'color: green; font-size: 16px; font-weight: bold');
      
      if (settings.loopLearning) {
        log('开启循环学习，重置进度...');
        try {
          await chrome.storage.local.set({ learnedCourses: [] });
        } catch (error) {
          console.log('%c[自动学习助手] ⚠️ 重置学习记录失败', 'color: orange');
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

// 检测课程卡片（需要根据实际页面结构调整）
function detectCourseCards() {
  // 优先匹配特定平台的选择器
  const selectors = [
    '.item.hover-shadow',          // 您的学习平台
    '.item',                       // 通用item
    '.course-card',
    '.course-item',
    '.video-item',
    '.lesson-item',
    '[class*="course"]',
    '[class*="card"]',
    'a[href*="course"]',
    'a[href*="video"]',
    'a[href*="learn"]'
  ];
  
  for (const selector of selectors) {
    const cards = document.querySelectorAll(selector);
    if (cards.length > 0) {
      // 过滤出可能是课程的元素
      const validCards = Array.from(cards).filter(card => {
        // 检查是否包含课程特征元素
        const hasImage = card.querySelector('img');
        const hasTitle = card.querySelector('h1, h2, h3, h4, h5, .title, [class*="title"]');
        const hasCover = card.querySelector('.cover');
        const hasInfoBox = card.querySelector('.info-box');
        const hasSpeaker = card.querySelector('.speaker, [class*="speaker"]');
        const hasProgress = card.querySelector('.progress');
        
        // 如果包含这些特征之一，就认为是课程卡片
        return hasImage || hasTitle || hasCover || hasInfoBox || hasSpeaker || hasProgress;
      });
      
      if (validCards.length > 0) {
        log(`使用选择器 "${selector}" 找到 ${validCards.length} 个课程`);
        console.log(`%c[自动学习助手] ✅ 使用选择器 "${selector}" 找到 ${validCards.length} 个课程`, 'color: green; font-weight: bold');
        return validCards;
      }
    }
  }
  
  return null;
}

// 获取课程ID
function getCourseId(card) {
  // 尝试从图片URL获取唯一标识（最可靠）
  const img = card.querySelector('img');
  if (img && img.src) {
    return img.src;
  }
  
  // 尝试从href获取
  const link = card.tagName === 'A' ? card : card.querySelector('a');
  if (link && link.href) {
    return link.href;
  }
  
  // 尝试从data属性获取
  if (card.dataset.id) {
    return card.dataset.id;
  }
  
  // 使用多个特征组合作为ID
  const title = getCourseCardTitle(card);
  const studyTime = card.querySelector('.cover-box span');
  const studyTimeText = studyTime ? studyTime.textContent.trim() : '';
  
  return `${title}_${studyTimeText}`;
}

// 获取课程卡片标题
function getCourseCardTitle(card) {
  // 尝试从主讲人信息获取（您的平台特征）
  const speakerEl = card.querySelector('.speaker .c-text');
  if (speakerEl) {
    const speakerText = speakerEl.textContent.trim();
    // 如果有讲师信息，使用讲师信息作为标识
    if (speakerText) {
      return speakerText;
    }
  }
  
  // 尝试从标题标签获取
  const titleEl = card.querySelector('h1, h2, h3, h4, h5, .title, [class*="title"]');
  if (titleEl) {
    return titleEl.textContent.trim();
  }
  
  // 尝试从图片src获取（作为唯一标识）
  const img = card.querySelector('img');
  if (img) {
    // 优先使用alt
    if (img.alt && img.alt.trim()) {
      return img.alt.trim();
    }
    // 使用图片URL的一部分作为标识
    if (img.src) {
      const urlParts = img.src.split('/');
      const filename = urlParts[urlParts.length - 1];
      return filename;
    }
  }
  
  // 尝试获取学时信息作为标识
  const studyTime = card.querySelector('.cover-box span');
  if (studyTime && studyTime.textContent.includes('学时数')) {
    return studyTime.textContent.trim();
  }
  
  // 返回部分文本
  const text = card.textContent.trim().substring(0, 50).replace(/\s+/g, ' ');
  return text || '未命名课程';
}

// 获取当前页面课程标题
function getCourseTitle() {
  const selectors = [
    'h1',
    '.title',
    '.course-title',
    '[class*="title"]',
    'h2',
    'h3'
  ];
  
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim()) {
      return el.textContent.trim().substring(0, 50);
    }
  }
  
  return document.title;
}

// 点击课程卡片
function clickCourseCard(card) {
  log('点击课程卡片');
  console.log('%c[自动学习助手] 🖱️ 点击课程卡片', 'color: orange; font-weight: bold', card);
  
  // 高亮显示即将点击的元素
  card.style.outline = '3px solid red';
  card.style.outlineOffset = '2px';
  setTimeout(() => {
    card.style.outline = '';
  }, 2000);
  
  // 尝试点击链接
  const link = card.tagName === 'A' ? card : card.querySelector('a');
  if (link && link.href) {
    console.log('%c[自动学习助手] ✅ 找到链接，准备跳转', 'color: green', link.href);
    
    // 重要：移除 target="_blank" 避免打开新标签页
    const originalTarget = link.getAttribute('target');
    if (originalTarget === '_blank') {
      console.log('%c[自动学习助手] ⚠️ 检测到 target="_blank"，已移除（避免打开新标签）', 'color: orange; font-weight: bold');
      link.removeAttribute('target');
    }
    
    // 在当前页面打开
    link.click();
    log('已点击链接（当前页面）');
    return;
  }
  
  // 尝试点击封面
  const cover = card.querySelector('.cover');
  if (cover) {
    console.log('%c[自动学习助手] ✅ 找到封面，点击封面', 'color: green');
    
    // 检查封面内是否有链接
    const coverLink = cover.querySelector('a');
    if (coverLink && coverLink.href) {
      console.log('%c[自动学习助手] 封面内有链接，使用链接跳转', 'color: blue');
      const originalTarget = coverLink.getAttribute('target');
      if (originalTarget === '_blank') {
        console.log('%c[自动学习助手] ⚠️ 移除 target="_blank"', 'color: orange');
        coverLink.removeAttribute('target');
      }
      coverLink.click();
      log('已点击封面链接（当前页面）');
    } else {
      cover.click();
      log('已点击封面');
    }
    return;
  }
  
  // 直接点击卡片
  console.log('%c[自动学习助手] ✅ 直接点击卡片', 'color: green');
  card.click();
  log('已点击卡片');
}

// 检查课程是否已完成
function isCourseCompleted(card) {
  // 检查进度条是否100%
  const progressBar = card.querySelector('.el-progress-bar__inner');
  if (progressBar) {
    const width = progressBar.style.width;
    console.log('%c[自动学习助手] 检查进度:', 'color: gray', getCourseCardTitle(card), '进度:', width);
    
    // 如果宽度是100%，说明已完成
    if (width === '100%') {
      return true;
    }
  }
  
  // 检查进度文本是否显示已完成（例如：0.59学时/0.59学时）
  const progressText = card.querySelector('.progress .c_red');
  if (progressText) {
    const currentProgress = progressText.textContent.trim();
    const totalProgress = card.querySelector('.progress .c_999');
    
    if (totalProgress) {
      const totalText = totalProgress.textContent.trim();
      // 提取数字进行比较
      const currentMatch = currentProgress.match(/[\d.]+/);
      const totalMatch = totalText.match(/\/([\d.]+)/);
      
      if (currentMatch && totalMatch) {
        const current = parseFloat(currentMatch[0]);
        const total = parseFloat(totalMatch[1]);
        
        console.log('%c[自动学习助手] 学时对比:', 'color: gray', `${current}/${total}`);
        
        // 如果当前学时等于总学时，说明已完成
        if (current >= total) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// 翻到下一页
function goToNextPage() {
  log('尝试翻到下一页...');
  console.log('%c[自动学习助手] 📄 尝试翻到下一页...', 'color: blue; font-weight: bold');
  
  // 设置跳转标志，避免在翻页过程中重复操作
  isNavigating = true;
  console.log('%c[自动学习助手] ⏸️ 设置翻页标志，暂停检测', 'color: orange; font-weight: bold');
  
  // 方法1：查找"下一页"按钮
  const nextBtnSelectors = [
    '.ivu-page-next',
    '.el-pagination__next',
    '.next',
    '[class*="next"]',
    'a:contains("下一页")',
    'button:contains("下一页")'
  ];
  
  for (const selector of nextBtnSelectors) {
    const btn = document.querySelector(selector);
    if (btn && !btn.classList.contains('disabled') && !btn.disabled) {
      console.log('%c[自动学习助手] ✅ 找到下一页按钮，准备点击', 'color: green', btn);
      setTimeout(() => {
        btn.click();
        log('已点击下一页按钮');
        console.log('%c[自动学习助手] ✅ 已点击下一页', 'color: green; font-weight: bold');
        
        // 等待页面内容加载后，清除跳转标志
        setTimeout(() => {
          isNavigating = false;
          console.log('%c[自动学习助手] 🔄 页面内容已加载，恢复检测', 'color: blue; font-weight: bold');
        }, 3000);
      }, 2000);
      return true;
    }
  }
  
  // 方法2：查找当前页码，点击下一个页码
  const activePage = document.querySelector('.ivu-page-item-active, .el-pagination__current, [class*="active"][class*="page"]');
  if (activePage) {
    const currentPageNum = parseInt(activePage.textContent.trim());
    console.log('%c[自动学习助手] 当前页码:', 'color: blue', currentPageNum);
    
    // 查找所有页码按钮
    const pageItems = document.querySelectorAll('.ivu-page-item, .el-pagination__item, [class*="page-item"]');
    
    for (const item of pageItems) {
      const pageNum = parseInt(item.textContent.trim());
      if (pageNum === currentPageNum + 1) {
        console.log('%c[自动学习助手] ✅ 找到下一页页码，准备点击', 'color: green', item);
        setTimeout(() => {
          item.click();
          log(`已点击第${pageNum}页`);
          console.log('%c[自动学习助手] ✅ 已点击页码', 'color: green; font-weight: bold', pageNum);
          
          // 等待页面内容加载后，清除跳转标志
          setTimeout(() => {
            isNavigating = false;
            console.log('%c[自动学习助手] 🔄 页面内容已加载，恢复检测', 'color: blue; font-weight: bold');
          }, 3000);
        }, 2000);
        return true;
      }
    }
  }
  
  // 没有找到下一页
  log('没有找到下一页');
  console.log('%c[自动学习助手] ⚠️ 没有找到下一页，可能已经是最后一页', 'color: orange; font-weight: bold');
  
  // 清除跳转标志
  isNavigating = false;
  
  return false;
}

// 返回课程列表
function goBackToCourseList() {
  // 尝试点击返回按钮
  const backBtnSelectors = [
    '.back-btn',
    '[class*="back"]',
    'a[href*="list"]',
    'a[href*="index"]'
  ];
  
  for (const selector of backBtnSelectors) {
    const btn = document.querySelector(selector);
    if (btn) {
      log('点击返回按钮');
      console.log('%c[自动学习助手] 🔙 点击返回按钮', 'color: blue', btn);
      btn.click();
      return;
    }
  }
  
  // 使用浏览器返回
  log('使用浏览器后退');
  console.log('%c[自动学习助手] 🔙 使用浏览器后退', 'color: blue');
  history.back();
}

// 更新视频倍速
function updateVideoSpeed(speed) {
  const video = document.querySelector('video');
  if (video) {
    video.playbackRate = speed;
    log(`已更新视频倍速: ${speed}x`);
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
    // 如果扩展上下文失效，忽略错误
    if (error.message && error.message.includes('Extension context invalidated')) {
      console.log('%c[自动学习助手] ⚠️ 扩展已重新加载，跳过状态更新', 'color: orange');
    }
  }
}

// 获取设置
async function getSettings() {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        // 检查chrome.runtime.lastError
        if (chrome.runtime.lastError) {
          console.log('%c[自动学习助手] ⚠️ 获取设置失败，使用默认值', 'color: orange');
          resolve({ videoSpeed: 1, loopLearning: false });
          return;
        }
        resolve(response || { videoSpeed: 1, loopLearning: false });
      });
    } catch (error) {
      // 如果扩展上下文失效，返回默认设置
      console.log('%c[自动学习助手] ⚠️ 扩展已重新加载，使用默认设置', 'color: orange');
      resolve({ videoSpeed: 1, loopLearning: false });
    }
  });
}

// 记录日志
async function log(message) {
  console.log(`[自动学习助手] ${message}`);
  try {
    await chrome.runtime.sendMessage({
      action: 'addLog',
      message: message
    });
  } catch (error) {
    // 如果扩展上下文失效（比如扩展被重新加载），只在控制台输出，不中断执行
    if (error.message && error.message.includes('Extension context invalidated')) {
      console.log('%c[自动学习助手] ⚠️ 扩展已重新加载，请刷新页面以继续使用', 'color: orange; font-weight: bold');
    }
  }
}

