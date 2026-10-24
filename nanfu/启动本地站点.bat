@echo off
chcp 65001 >nul
title 南孚全球官网 - 本地镜像
cd /d "%~dp0"
echo.
echo  ============================================
echo   南孚全球官网 本地学习镜像
echo  ============================================
echo.
echo  正在启动本地服务器，浏览器请访问：
echo.
echo      http://localhost:8000/
echo.
echo  首页：http://localhost:8000/
echo  电池：http://localhost:8000/batteries
echo  充电宝：http://localhost:8000/power-bank
echo  关于：http://localhost:8000/about
echo  联系：http://localhost:8000/contact
echo.
echo  关闭此窗口即可停止服务器。
echo.
start "" "http://localhost:8000/"
python -m http.server 8000
pause
