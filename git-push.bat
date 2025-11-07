@echo off
chcp 65001 >nul
echo ========================================
echo 开始初始化和推送到GitHub
echo ========================================

REM 初始化Git仓库
echo.
echo [1/5] 初始化Git仓库...
git init

REM 添加所有文件
echo.
echo [2/5] 添加所有文件...
git add .

REM 查看状态
echo.
echo [3/5] 查看文件状态...
git status

REM 提交
echo.
echo [4/5] 提交到本地仓库...
git commit -m "🎉 初始提交：自动学习助手浏览器插件

主要功能：
- ✅ 自动播放课程
- ✅ 跳过已完成课程（100%%进度检测）
- ✅ 自动翻页
- ✅ 倍速播放（1-2x）
- ✅ 在当前标签页打开（避免开新标签）
- ✅ 视频完成检测（vjs-ended类）
- ✅ 防止连续点击
- ✅ 详细Console日志
- ✅ 进度保存与恢复

技术栈：Chrome Extension Manifest V3, Content Scripts, Storage API"

REM 创建GitHub仓库并推送
echo.
echo [5/5] 创建GitHub仓库并推送...
echo.
echo 仓库名称: auto-learning-helper
echo 描述: 🎓 自动学习助手 - Chrome浏览器扩展
echo.
gh repo create auto-learning-helper --public --source=. --remote=origin --description "🎓 自动学习助手 - Chrome浏览器扩展，支持自动播放课程、跳过已完成、自动翻页、倍速播放等功能" --push

echo.
echo ========================================
echo ✅ 完成！
echo ========================================
echo.
echo 你的仓库地址：
gh repo view --web

pause

