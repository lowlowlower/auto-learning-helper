// ============================================
// 检查播放控制按钮状态（vjs-ended 类）
// ============================================
// 使用方法：
// 1. 打开视频播放页面
// 2. 按F12打开Console
// 3. 复制整个脚本粘贴到Console并回车
// ============================================

console.log('%c===========================================', 'color: #667eea; font-weight: bold');
console.log('%c  检查播放控制按钮状态', 'color: #667eea; font-size: 16px; font-weight: bold');
console.log('%c===========================================\n', 'color: #667eea; font-weight: bold');

// 查找播放控制按钮
const playControlButton = document.querySelector('.vjs-play-control');
const video = document.querySelector('video');

if (!playControlButton) {
  console.log('%c❌ 未找到播放控制按钮 (.vjs-play-control)', 'color: red; font-weight: bold');
  console.log('可能选择器不匹配，查找所有可能的按钮：\n');
  
  const possibleButtons = document.querySelectorAll('[class*="play"][class*="control"]');
  if (possibleButtons.length > 0) {
    console.log(`找到 ${possibleButtons.length} 个可能的按钮：`);
    possibleButtons.forEach((btn, i) => {
      console.log(`  ${i + 1}. ${btn.className}`);
      console.log('     ', btn);
    });
  }
} else if (!video) {
  console.log('%c❌ 未找到视频元素', 'color: red; font-weight: bold');
} else {
  console.log('%c✅ 找到播放控制按钮和视频', 'color: green; font-weight: bold\n');
  
  // 显示当前状态
  console.log('%c【当前状态】', 'color: blue; font-size: 14px; font-weight: bold');
  console.log('-------------------------------------------');
  
  // 播放控制按钮信息
  console.log('播放控制按钮:');
  console.log('  元素:', playControlButton);
  console.log('  完整className:', playControlButton.className);
  console.log('  所有类名:');
  playControlButton.classList.forEach(cls => {
    console.log(`    - ${cls}`);
  });
  
  // 检查关键类
  const hasVjsEnded = playControlButton.classList.contains('vjs-ended');
  const hasVjsPaused = playControlButton.classList.contains('vjs-paused');
  const hasVjsPlaying = playControlButton.classList.contains('vjs-playing');
  
  console.log('\n  关键类检查:');
  console.log(`%c    vjs-ended: ${hasVjsEnded} ${hasVjsEnded ? '← 视频播放完成！' : ''}`, hasVjsEnded ? 'color: green; font-weight: bold' : 'color: gray');
  console.log(`%c    vjs-paused: ${hasVjsPaused}`, hasVjsPaused ? 'color: orange' : 'color: gray');
  console.log(`%c    vjs-playing: ${hasVjsPlaying}`, hasVjsPlaying ? 'color: blue' : 'color: gray');
  
  // 按钮文本
  const buttonText = playControlButton.querySelector('.vjs-control-text');
  if (buttonText) {
    console.log(`\n  按钮文本: "${buttonText.textContent}"`);
    if (buttonText.textContent === 'Replay') {
      console.log('%c  → 显示"Replay"说明视频已结束！', 'color: green; font-weight: bold');
    }
  }
  
  // 视频状态
  console.log('\n视频状态:');
  console.log(`  - 当前时间: ${video.currentTime.toFixed(2)}s`);
  console.log(`  - 总时长: ${video.duration.toFixed(2)}s`);
  console.log(`  - 进度: ${((video.currentTime / video.duration) * 100).toFixed(1)}%`);
  console.log(`  - 已结束: ${video.ended}`);
  console.log(`  - 暂停中: ${video.paused}`);
  
  console.log('\n');
  
  // 判断是否完成
  if (hasVjsEnded) {
    console.log('%c✅ 视频已完成！（播放控制按钮有 vjs-ended 类）', 'color: green; font-size: 16px; font-weight: bold');
  } else {
    console.log('%c⏸️ 视频未完成（播放控制按钮没有 vjs-ended 类）', 'color: orange; font-size: 14px; font-weight: bold');
  }
  
  console.log('\n');
  
  // 开始实时监控
  console.log('%c【开始实时监控】', 'color: blue; font-size: 14px; font-weight: bold');
  console.log('-------------------------------------------');
  console.log('每3秒检查一次播放控制按钮的 vjs-ended 类\n');
  
  let lastState = hasVjsEnded;
  let checkCount = 0;
  
  const monitor = setInterval(() => {
    checkCount++;
    
    // 检查按钮状态
    const currentHasEnded = playControlButton.classList.contains('vjs-ended');
    const currentHasPaused = playControlButton.classList.contains('vjs-paused');
    const currentHasPlaying = playControlButton.classList.contains('vjs-playing');
    const buttonText = playControlButton.querySelector('.vjs-control-text')?.textContent || '';
    
    // 视频状态
    const currentTime = video.currentTime;
    const duration = video.duration;
    const progress = ((currentTime / duration) * 100).toFixed(1);
    const ended = video.ended;
    const paused = video.paused;
    
    console.log(`%c检查 #${checkCount} (${new Date().toLocaleTimeString()})`, 'color: gray');
    console.log(`  按钮类: ended:${currentHasEnded} paused:${currentHasPaused} playing:${currentHasPlaying} | 文本:"${buttonText}"`);
    console.log(`  视频: ${progress}% | ${currentTime.toFixed(0)}s/${duration.toFixed(0)}s | 暂停:${paused} | 结束:${ended}`);
    
    // 检测状态变化
    if (currentHasEnded !== lastState) {
      if (currentHasEnded) {
        console.log('%c\n🎬 播放控制按钮出现 vjs-ended 类！', 'color: green; font-size: 16px; font-weight: bold');
        console.log('%c视频播放完成！插件会在此时返回列表', 'color: green; font-size: 14px; font-weight: bold\n');
        
        if (confirm('检测到视频完成！是否停止监控？')) {
          clearInterval(monitor);
          console.log('%c✅ 监控已停止', 'color: blue; font-weight: bold');
        }
      } else {
        console.log('%c\n▶️ vjs-ended 类消失（重新开始播放）', 'color: blue; font-size: 14px; font-weight: bold\n');
      }
      lastState = currentHasEnded;
    }
  }, 3000);
  
  // 保存监控器ID
  window._playControlMonitor = monitor;
  
  console.log('%c💡 提示:', 'color: blue; font-weight: bold');
  console.log('- 等待视频播放到结束');
  console.log('- 观察按钮何时出现 vjs-ended 类');
  console.log('- 手动停止监控: clearInterval(window._playControlMonitor)\n');
  
  // 快捷操作
  console.log('%c【快捷操作】', 'color: blue; font-size: 14px; font-weight: bold');
  console.log('-------------------------------------------\n');
  
  console.log('%c// 1. 跳到视频最后5秒（测试完成检测）', 'color: gray');
  console.log(`video.currentTime = video.duration - 5;\n`);
  
  console.log('%c// 2. 查看按钮当前状态', 'color: gray');
  console.log(`const btn = document.querySelector('.vjs-play-control');
console.log('类名:', btn.className);
console.log('有vjs-ended:', btn.classList.contains('vjs-ended'));\n`);
  
  console.log('%c// 3. 手动检查按钮文本', 'color: gray');
  console.log(`document.querySelector('.vjs-play-control .vjs-control-text').textContent;\n`);
  
  console.log('%c// 4. 停止监控', 'color: gray');
  console.log(`clearInterval(window._playControlMonitor);\n`);
}

console.log('%c===========================================', 'color: #667eea; font-weight: bold');
console.log('%c  监控已启动', 'color: #667eea; font-size: 16px; font-weight: bold');
console.log('%c===========================================', 'color: #667eea; font-weight: bold');

