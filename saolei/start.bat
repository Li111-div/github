@echo off
chcp 65001 >nul
echo ========================================
echo   无垠扫雷：全域探索
echo   正在启动本地服务器...
echo ========================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

echo [信息] Node.js 已安装，正在启动服务器...
echo.
echo 游戏将在浏览器中打开：
echo http://localhost:8080
echo.
echo 按 Ctrl+C 可停止服务器
echo ========================================
echo.

REM 使用 npx http-server 启动
npx http-server -p 8080 -o index.html

pause
