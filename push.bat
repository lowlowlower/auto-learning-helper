@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 当前目录：%cd%
git commit -m "新增自动连续学习和确认对话框功能"
git push
pause

