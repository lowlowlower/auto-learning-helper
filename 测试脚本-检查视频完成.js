// ============================================
// 检查视频完成状态 - 播放按钮检测
// ============================================
// 使用方法：
// 1. 打开一个正在播放的视频课程页面
// 2. 按F12打开Console
// 3. 复制整个脚本粘贴到Console并回车
// 4. 等待视频播放到接近结束
// 5. 观察播放按钮何时重新出现
// ============================================

console.log('%c===========================================', 'color: #667eea; font-weight: bold');
console.log('%c  视频完成检测测试', 'color: #667eea; font-size: 16px; font-weight: bold');
console.log('%c===========================================\n', 'color: #667eea; font-weight: bold');

const video = document.querySelector('video');
const playButton = document.querySelector('.vjs-big-play-button');

if (!video) {
  console.log('%c❌ 未找到视频元素', 'color: red; font-weight: bold');
  console.log('请确保您在视频播放页面');
} else if (!playButton) {
  console.log('%c⚠️ 未找到播放按钮元素', 'color: orange; font-weight: bold');
  console.log('可能不是Video.js播放器，或选择器不匹配');
  console.log('查找所有可能的播放按钮:');
  
  const possibleButtons = document.querySelectorAll('[class*="play"]');
  possibleButtons.forEach((btn, i) => {
    console.log(`  ${i + 1}. ${btn.className}`);
  });
} else {
  console.log('%c✅ 找到视频和播放按钮', 'color: green; font-weight: bold\n');
  
  // 显示当前状态
  console.log('%c【当前状态】', 'color: blue; font-size: 14px; font-weight: bold');
  console.log('-------------------------------------------');
  console.log('视频信息:');
  console.log(`  - 当前时间: ${video.currentTime.toFixed(2)}s`);
  console.log(`  - 总时长: ${video.duration.toFixed(2)}s`);
  console.log(`  - 进度: ${((video.currentTime / video.duration) * 100).toFixed(1)}%`);
  console.log(`  - 已结束: ${video.ended}`);
  console.log(`  - 暂停中: ${video.paused}`);
  console.log(`  - 播放速度: ${video.playbackRate}x\n`);
  
  console.log('播放按钮信息:');
  console.log(`  - 元素: `, playButton);
  console.log(`  - offsetParent: ${playButton.offsetParent}`);
  console.log(`  - display: ${window.getComputedStyle(playButton).display}`);
  console.log(`  - visibility: ${window.getComputedStyle(playButton).visibility}`);
  console.log(`  - opacity: ${window.getComputedStyle(playButton).opacity}`);
  
  const isVisible = playButton.offsetParent !== null;
  console.log(`%c  - 是否可见: ${isVisible}`, isVisible ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold');
  
  console.log('\n');
  
  // 开始监控
  console.log('%c【开始实时监控】', 'color: blue; font-size: 14px; font-weight: bold');
  console.log('-------------------------------------------');
  console.log('每3秒检查一次视频和播放按钮状态');
  console.log('当播放按钮重新出现时，会有明显提示\n');
  
  let lastVisible = isVisible;
  let checkCount = 0;
  
  const monitor = setInterval(() => {
    checkCount++;
    
    // 检查视频状态
    const currentTime = video.currentTime;
    const duration = video.duration;
    const progress = ((currentTime / duration) * 100).toFixed(1);
    const ended = video.ended;
    const paused = video.paused;
    
    // 检查播放按钮
    const btnVisible = playButton.offsetParent !== null;
    const display = window.getComputedStyle(playButton).display;
    const visibility = window.getComputedStyle(playButton).visibility;
    
    // 综合判断
    const isCompleted = btnVisible || ended || (paused && currentTime >= duration - 2);
    
    console.log(`%c检查 #${checkCount} (${new Date().toLocaleTimeString()})`, 'color: gray');
    console.log(`  视频: ${progress}% | ${currentTime.toFixed(0)}s/${duration.toFixed(0)}s | 暂停:${paused} | 结束:${ended}`);
    console.log(`  播放按钮: 可见:${btnVisible} | display:${display} | visibility:${visibility}`);
    
    // 检测状态变化
    if (btnVisible !== lastVisible) {
      if (btnVisible) {
        console.log('%c\n🎬 播放按钮重新出现了！', 'color: green; font-size: 16px; font-weight: bold');
        console.log('%c视频应该播放完成了！', 'color: green; font-size: 14px; font-weight: bold\n');
      } else {
        console.log('%c\n▶️ 播放按钮消失了（开始播放）', 'color: blue; font-size: 14px; font-weight: bold\n');
      }
      lastVisible = btnVisible;
    }
    
    // 判断是否完成
    if (isCompleted) {
      console.log('%c\n✅ 满足完成条件！', 'color: green; font-size: 16px; font-weight: bold');
      console.log('完成判断依据:');
      console.log(`  - 播放按钮可见: ${btnVisible}`);
      console.log(`  - 视频ended: ${ended}`);
      console.log(`  - 暂停在结尾: ${paused && currentTime >= duration - 2}`);
      console.log('\n插件会在此时返回课程列表\n');
      
      if (confirm('视频已完成！是否停止监控？')) {
        clearInterval(monitor);
        console.log('%c✅ 监控已停止', 'color: blue; font-weight: bold');
      }
    }
  }, 3000); // 每3秒检查一次
  
  // 保存监控器ID，方便手动停止
  window._videoMonitor = monitor;
  
  console.log('%c💡 提示:', 'color: blue; font-weight: bold');
  console.log('- 等待视频播放到接近结束');
  console.log('- 观察播放按钮何时重新出现');
  console.log('- 手动停止监控: clearInterval(window._videoMonitor)\n');
  
  // 快捷操作
  console.log('%c【快捷操作】', 'color: blue; font-size: 14px; font-weight: bold');
  console.log('-------------------------------------------');
  
  console.log('%c// 1. 跳到视频最后10秒（测试完成检测）', 'color: gray');
  console.log(`video.currentTime = video.duration - 10;\n`);
  
  console.log('%c// 2. 暂停视频', 'color: gray');
  console.log(`video.pause();\n`);
  
  console.log('%c// 3. 继续播放', 'color: gray');
  console.log(`video.play();\n`);
  
  console.log('%c// 4. 停止监控', 'color: gray');
  console.log(`clearInterval(window._videoMonitor);\n`);
  
  console.log('%c// 5. 手动触发完成（测试返回逻辑）', 'color: gray');
  console.log(`video.currentTime = video.duration; video.pause();\n`);
}

console.log('%c===========================================', 'color: #667eea; font-weight: bold');
console.log('%c  监控已启动', 'color: #667eea; font-size: 16px; font-weight: bold');
console.log('%c===========================================', 'color: #667eea; font-weight: bold');

