// ============================================
// 检查课程链接是否会打开新标签页
// ============================================
// 使用方法：
// 1. 打开学习平台课程列表页
// 2. 按F12打开Console
// 3. 复制整个脚本粘贴到Console并回车
// ============================================

console.log('%c===========================================', 'color: #667eea; font-weight: bold');
console.log('%c  检查课程链接 - 是否会打开新标签页', 'color: #667eea; font-size: 16px; font-weight: bold');
console.log('%c===========================================\n', 'color: #667eea; font-weight: bold');

const cards = document.querySelectorAll('.item.hover-shadow');

if (cards.length === 0) {
  console.log('%c❌ 未找到课程卡片', 'color: red; font-weight: bold');
  console.log('请确保您在课程列表页面');
} else {
  console.log(`%c✅ 找到 ${cards.length} 个课程`, 'color: green; font-weight: bold\n');
  
  let hasTargetBlank = 0;
  let hasNoLink = 0;
  let normalLinks = 0;
  
  cards.forEach((card, index) => {
    const speakerEl = card.querySelector('.speaker .c-text');
    const title = speakerEl ? speakerEl.textContent.trim() : '未知课程';
    
    // 检查卡片内的所有链接
    const allLinks = card.querySelectorAll('a');
    
    console.log(`%c课程${index + 1}: ${title}`, 'color: blue; font-weight: bold');
    
    if (allLinks.length === 0) {
      console.log('  ⚠️ 卡片内没有链接');
      console.log('  → 可能通过点击事件跳转\n');
      hasNoLink++;
    } else {
      allLinks.forEach((link, linkIndex) => {
        const href = link.href;
        const target = link.getAttribute('target');
        const text = link.textContent.trim().substring(0, 20);
        
        console.log(`  链接${linkIndex + 1}:`);
        console.log(`    文本: ${text || '(无文本)'}`);
        console.log(`    地址: ${href}`);
        
        if (target === '_blank') {
          console.log(`%c    ⚠️ target="_blank" - 会打开新标签页！`, 'color: red; font-weight: bold');
          console.log(`%c    → 插件会自动移除这个属性`, 'color: orange');
          hasTargetBlank++;
        } else if (target) {
          console.log(`    target="${target}"`);
        } else {
          console.log(`%c    ✅ 无target属性 - 在当前页打开`, 'color: green');
          normalLinks++;
        }
      });
      console.log('');
    }
  });
  
  // 统计结果
  console.log('%c===========================================', 'color: #667eea; font-weight: bold');
  console.log('%c  统计结果', 'color: #667eea; font-size: 14px; font-weight: bold');
  console.log('%c===========================================', 'color: #667eea; font-weight: bold');
  console.log(`总课程数: ${cards.length}`);
  console.log(`%c有 target="_blank": ${hasTargetBlank}`, hasTargetBlank > 0 ? 'color: red; font-weight: bold' : 'color: gray');
  console.log(`%c正常链接: ${normalLinks}`, 'color: green');
  console.log(`无链接: ${hasNoLink}\n`);
  
  if (hasTargetBlank > 0) {
    console.log('%c⚠️ 警告：检测到 target="_blank"', 'color: orange; font-size: 14px; font-weight: bold');
    console.log('%c这些链接会打开新标签页！', 'color: orange; font-weight: bold');
    console.log('\n%c✅ 好消息：插件已经修复了这个问题', 'color: green; font-size: 14px; font-weight: bold');
    console.log('插件会在点击前自动移除 target="_blank" 属性');
    console.log('这样就会在当前页打开，不会打开新标签页\n');
    
    // 提供测试代码
    console.log('%c【测试代码】手动测试移除 target="_blank"', 'color: blue; font-size: 14px; font-weight: bold');
    console.log('-------------------------------------------');
    console.log('复制以下代码到Console运行，测试点击效果：\n');
    console.log('%c// 找到第一个有 target="_blank" 的链接', 'color: gray');
    console.log(`const card = document.querySelector('.item.hover-shadow');
const link = card.querySelector('a[target="_blank"]');

if (link) {
  console.log('原target:', link.getAttribute('target'));
  
  // 移除 target="_blank"
  link.removeAttribute('target');
  
  console.log('移除后target:', link.getAttribute('target'));
  console.log('✅ 已移除，现在点击会在当前页打开');
  
  // 3秒后自动点击测试
  console.log('⏱️ 3秒后自动点击测试...');
  setTimeout(() => {
    link.click();
    console.log('✅ 已点击！应该在当前页打开');
  }, 3000);
} else {
  console.log('❌ 未找到有 target="_blank" 的链接');
}\n`);
    
  } else if (normalLinks > 0) {
    console.log('%c✅ 太好了！所有链接都正常', 'color: green; font-size: 14px; font-weight: bold');
    console.log('这些链接都会在当前页打开，不会打开新标签页');
    
  } else {
    console.log('%c⚠️ 所有课程都没有链接元素', 'color: orange; font-size: 14px; font-weight: bold');
    console.log('可能使用JavaScript事件来跳转');
    console.log('\n建议：测试手动点击课程卡片，看是否会打开新标签页');
  }
}

console.log('\n%c===========================================', 'color: #667eea; font-weight: bold');
console.log('%c  测试完成', 'color: #667eea; font-size: 16px; font-weight: bold');
console.log('%c===========================================', 'color: #667eea; font-weight: bold');

console.log('\n%c💡 下一步：', 'color: blue; font-weight: bold');
console.log('1. 重新加载插件（chrome://extensions/ → 刷新）');
console.log('2. 点击"开始学习"');
console.log('3. 观察标签页数量（应该始终只有1个）');
console.log('4. 如果还是打开多个标签，请截图Console日志反馈\n');

