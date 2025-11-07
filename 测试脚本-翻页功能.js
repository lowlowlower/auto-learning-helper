// ============================================
// 自动学习助手 - 翻页功能测试脚本
// ============================================
// 使用方法：
// 1. 打开学习平台课程列表页
// 2. 按F12打开Console
// 3. 复制整个脚本粘贴到Console并回车
// ============================================

console.log('%c===========================================', 'color: #667eea; font-weight: bold');
console.log('%c  自动学习助手 - 翻页功能测试', 'color: #667eea; font-size: 16px; font-weight: bold');
console.log('%c===========================================\n', 'color: #667eea; font-weight: bold');

// 测试1：检测所有课程及其完成状态
console.log('%c【测试1】检测课程完成状态', 'color: blue; font-size: 14px; font-weight: bold');
console.log('-------------------------------------------');

const cards = document.querySelectorAll('.item.hover-shadow');
console.log(`找到 ${cards.length} 个课程\n`);

let completedCount = 0;
let uncompletedCount = 0;

cards.forEach((card, index) => {
  // 获取课程标题
  const speakerEl = card.querySelector('.speaker .c-text');
  const title = speakerEl ? speakerEl.textContent.trim() : '未知课程';
  
  // 检查进度条
  const progressBar = card.querySelector('.el-progress-bar__inner');
  const progressWidth = progressBar ? progressBar.style.width : '0%';
  
  // 检查学时
  const progressText = card.querySelector('.progress .c_red');
  const totalText = card.querySelector('.progress .c_999');
  
  let studyTime = '未知';
  if (progressText && totalText) {
    const current = progressText.textContent.match(/[\d.]+/);
    const total = totalText.textContent.match(/\/([\d.]+)/);
    if (current && total) {
      studyTime = `${current[0]}/${total[1]}`;
    }
  }
  
  // 判断是否完成
  const isCompleted = progressWidth === '100%';
  
  if (isCompleted) {
    completedCount++;
    console.log(`%c课程${index + 1}: ${title}`, 'color: green; font-weight: bold');
    console.log(`  ✅ 已完成 | 进度: ${progressWidth} | 学时: ${studyTime}\n`);
  } else {
    uncompletedCount++;
    console.log(`%c课程${index + 1}: ${title}`, 'color: orange; font-weight: bold');
    console.log(`  ⏳ 未完成 | 进度: ${progressWidth} | 学时: ${studyTime}\n`);
  }
});

console.log('%c📊 统计结果:', 'color: blue; font-weight: bold');
console.log(`总课程数: ${cards.length}`);
console.log(`✅ 已完成: ${completedCount}`);
console.log(`⏳ 未完成: ${uncompletedCount}\n\n`);

// 测试2：检测分页信息
console.log('%c【测试2】检测分页信息', 'color: blue; font-size: 14px; font-weight: bold');
console.log('-------------------------------------------');

// 查找当前页码
const activePage = document.querySelector('.ivu-page-item-active, .el-pagination__current');
if (activePage) {
  const currentPage = activePage.textContent.trim();
  console.log(`%c📄 当前页码: ${currentPage}`, 'color: green; font-weight: bold');
} else {
  console.log('%c⚠️ 未找到当前页码元素', 'color: orange');
}

// 查找所有页码
const pageItems = document.querySelectorAll('.ivu-page-item, .el-pagination__item');
if (pageItems.length > 0) {
  console.log(`\n找到 ${pageItems.length} 个页码按钮:`);
  pageItems.forEach((item, index) => {
    const pageNum = item.textContent.trim();
    const isActive = item.classList.contains('ivu-page-item-active') || 
                     item.classList.contains('el-pagination__current');
    if (isActive) {
      console.log(`  ${index + 1}. [页码 ${pageNum}] ← 当前页`);
    } else {
      console.log(`  ${index + 1}. [页码 ${pageNum}]`);
    }
  });
} else {
  console.log('%c⚠️ 未找到页码元素', 'color: orange');
}

// 查找下一页按钮
console.log('\n查找下一页按钮:');
const nextBtnSelectors = [
  '.ivu-page-next',
  '.el-pagination__next',
  '.next',
  'button:contains("下一页")'
];

let foundNextBtn = false;
nextBtnSelectors.forEach(selector => {
  const btn = document.querySelector(selector);
  if (btn) {
    const isDisabled = btn.classList.contains('disabled') || btn.disabled;
    console.log(`  ✅ 找到: ${selector}`);
    console.log(`     状态: ${isDisabled ? '已禁用（最后一页）' : '可点击'}`);
    console.log('     元素:', btn);
    foundNextBtn = true;
  }
});

if (!foundNextBtn) {
  console.log('%c  ⚠️ 未找到下一页按钮', 'color: orange');
}

console.log('\n\n');

// 测试3：模拟插件行为
console.log('%c【测试3】模拟插件行为', 'color: blue; font-size: 14px; font-weight: bold');
console.log('-------------------------------------------');

if (uncompletedCount > 0) {
  console.log(`%c✅ 当前页有 ${uncompletedCount} 个未完成课程`, 'color: green; font-weight: bold');
  console.log('插件会选择第一个未完成的课程进行学习');
  
  // 找到第一个未完成的课程并高亮
  cards.forEach((card, index) => {
    const progressBar = card.querySelector('.el-progress-bar__inner');
    const progressWidth = progressBar ? progressBar.style.width : '0%';
    
    if (progressWidth !== '100%') {
      const speakerEl = card.querySelector('.speaker .c-text');
      const title = speakerEl ? speakerEl.textContent.trim() : '未知课程';
      
      console.log(`\n%c🎯 将要学习的课程:`, 'color: green; font-size: 14px; font-weight: bold');
      console.log(`   ${title}`);
      console.log(`   进度: ${progressWidth}`);
      
      // 高亮显示
      card.style.outline = '5px solid red';
      card.style.outlineOffset = '3px';
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      console.log('%c   ↑ 已用红色边框高亮显示该课程（页面会自动滚动到该位置）', 'color: red; font-weight: bold');
      
      setTimeout(() => {
        card.style.outline = '';
      }, 5000);
      
      return false; // 只处理第一个
    }
  });
  
} else if (completedCount > 0) {
  console.log(`%c✅ 当前页所有课程都已完成`, 'color: green; font-weight: bold');
  console.log('插件会尝试翻到下一页...\n');
  
  // 测试翻页
  const nextBtn = document.querySelector('.ivu-page-next, .el-pagination__next');
  if (nextBtn && !nextBtn.classList.contains('disabled') && !nextBtn.disabled) {
    console.log('%c✅ 找到可用的下一页按钮', 'color: green; font-weight: bold');
    console.log('   元素:', nextBtn);
    
    // 询问是否要测试点击
    console.log('\n%c⚠️ 如果要测试翻页，请在5秒内按 Ctrl+C 取消，否则将自动点击', 'color: orange; font-size: 14px; font-weight: bold');
    
    let countdown = 5;
    const timer = setInterval(() => {
      console.log(`%c${countdown}...`, 'color: orange; font-size: 16px');
      countdown--;
      
      if (countdown < 0) {
        clearInterval(timer);
        console.log('%c🖱️ 点击下一页按钮...', 'color: blue; font-weight: bold');
        nextBtn.click();
        console.log('%c✅ 已点击！页面应该会跳转到下一页', 'color: green; font-weight: bold');
      }
    }, 1000);
    
  } else {
    console.log('%c⚠️ 没有找到可用的下一页按钮（可能已经是最后一页）', 'color: orange; font-weight: bold');
    console.log('插件会停止运行');
  }
}

console.log('\n\n');

// 测试4：提供手动测试代码
console.log('%c【测试4】手动测试代码', 'color: blue; font-size: 14px; font-weight: bold');
console.log('-------------------------------------------');
console.log('如果需要手动测试，可以运行以下代码：\n');

console.log('%c// 1. 测试点击第一个未完成的课程', 'color: gray');
console.log('document.querySelector(\'.item.hover-shadow\').click();\n');

console.log('%c// 2. 测试点击下一页', 'color: gray');
console.log('document.querySelector(\'.ivu-page-next\').click();\n');

console.log('%c// 3. 测试点击指定页码（例如第2页）', 'color: gray');
console.log('document.querySelector(\'.ivu-page-item[title="2"]\').click();\n');

console.log('%c// 4. 查看所有课程的完成状态', 'color: gray');
console.log(`document.querySelectorAll('.item.hover-shadow').forEach((card, i) => {
  const progress = card.querySelector('.el-progress-bar__inner').style.width;
  console.log(\`课程\${i+1}: 进度\${progress}\`);
});\n`);

console.log('\n%c===========================================', 'color: #667eea; font-weight: bold');
console.log('%c  测试完成！', 'color: #667eea; font-size: 16px; font-weight: bold');
console.log('%c===========================================', 'color: #667eea; font-weight: bold');

console.log('\n%c💡 提示:', 'color: blue; font-weight: bold');
console.log('如果测试结果正常，插件应该能够：');
console.log('  1. ✅ 自动跳过已完成的课程（进度100%）');
console.log('  2. ✅ 学习未完成的课程');
console.log('  3. ✅ 当前页都完成后自动翻页');
console.log('  4. ✅ 继续学习下一页的未完成课程\n');

