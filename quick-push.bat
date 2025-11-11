@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo 当前目录：%cd%
echo.
git add .
echo.
git commit -m "关键修复：检测循环无法启动的bug"
echo.
git push
echo.
echo 推送完成！
pause

