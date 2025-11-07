@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo 自动学习助手 - 推送到GitHub
echo ========================================
echo.

git init
git add .
git commit -m "🎉 自动学习助手 - Chrome浏览器扩展"
gh repo create auto-learning-helper --public --source=. --remote=origin --description "🎓 自动学习助手 - Chrome浏览器扩展，支持自动播放课程、跳过已完成、自动翻页、倍速播放等功能" --push

echo.
echo ========================================
echo ✅ 完成！正在打开仓库...
echo ========================================
gh repo view --web

pause

