/**
 * 俄罗斯方块 - 主入口文件
 */

// ==================== 初始化 ====================

/**
 * 页面加载完成后初始化
 */
window.addEventListener('DOMContentLoaded', () => {
    // 获取 Canvas 元素
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('nextCanvas');
    nextCtx = nextCanvas.getContext('2d');

    // 绑定键盘事件
    document.addEventListener('keydown', handleKeyPress);

    // 加载历史记录
    loadHistory();
    
    // 加载设置
    loadSettings();

    // 初始化首页展示
    initHomeScreen();
    
    // 显示首页
    document.getElementById('homeScreen').style.display = 'flex';
    
    // 初始化显示历史记录（前 3 条）
    showHistory();
});

// 导出 API 供外部调用
window.tetris = {
    startGame,
    pauseGame,
    resumeGame
};
