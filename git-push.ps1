# PowerShell 脚本 - 推送到 GitHub
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始初始化和推送到GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 初始化Git仓库
Write-Host "`n[1/5] 初始化Git仓库..." -ForegroundColor Yellow
git init

# 添加所有文件
Write-Host "`n[2/5] 添加所有文件..." -ForegroundColor Yellow
git add .

# 查看状态
Write-Host "`n[3/5] 查看文件状态..." -ForegroundColor Yellow
git status

# 提交
Write-Host "`n[4/5] 提交到本地仓库..." -ForegroundColor Yellow
git commit -m "🎉 初始提交：自动学习助手浏览器插件

主要功能：
- ✅ 自动播放课程
- ✅ 跳过已完成课程（100%进度检测）
- ✅ 自动翻页
- ✅ 倍速播放（1-2x）
- ✅ 在当前标签页打开（避免开新标签）
- ✅ 视频完成检测（vjs-ended类）
- ✅ 防止连续点击
- ✅ 详细Console日志
- ✅ 进度保存与恢复

技术栈：Chrome Extension Manifest V3, Content Scripts, Storage API"

# 创建GitHub仓库并推送
Write-Host "`n[5/5] 创建GitHub仓库并推送..." -ForegroundColor Yellow
Write-Host "`n仓库名称: auto-learning-helper" -ForegroundColor Green
Write-Host "描述: 🎓 自动学习助手 - Chrome浏览器扩展`n" -ForegroundColor Green

gh repo create auto-learning-helper `
  --public `
  --source=. `
  --remote=origin `
  --description "🎓 自动学习助手 - Chrome浏览器扩展，支持自动播放课程、跳过已完成、自动翻页、倍速播放等功能" `
  --push

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ 完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n打开仓库网页..." -ForegroundColor Yellow
gh repo view --web

Read-Host "`n按回车键退出"

