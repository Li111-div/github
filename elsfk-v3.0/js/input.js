/**
 * 俄罗斯方块 - 输入控制与游戏管理
 */

// ==================== 输入控制 ====================

/**
 * 键盘事件处理
 * 严格对应经典操作映射
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyPress(event) {
    // 防止方向键和空格滚动页面
    if ([32, 37, 38, 39, 40].includes(event.keyCode)) {
        event.preventDefault();
    }

    // 游戏结束时按空格重新开始（已禁用，改用按钮）
    if (isGameOver) {
        return; // 不再响应按键，只能通过按钮返回首页
    }

    // P 键暂停/继续
    if (event.keyCode === 80) { // P
        togglePause();
        return;
    }

    // 暂停时忽略其他输入
    if (isPaused) return;

    // 方向键和空格控制
    switch (event.keyCode) {
        case 37: // LEFT
            moveLeft();
            break;
        case 39: // RIGHT
            moveRight();
            break;
        case 40: // DOWN
            if (softDrop()) {
                score += 1; // 软降奖励分
                updateDisplay();
            }
            drawBoard();
            break;
        case 38: // UP
            rotatePiece();
            break;
        case 32: // SPACE
            hardDrop();
            updateDisplay();
            break;
    }
}

/**
 * 切换暂停状态
 */
function togglePause() {
    if (isGameOver) return;

    isPaused = !isPaused;
    const overlay = document.getElementById('pauseOverlay');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (isPaused) {
        overlay.style.display = 'flex';
        if (dropTimer) clearInterval(dropTimer);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        pauseBtn.textContent = '继续';
    } else {
        overlay.style.display = 'none';
        startDropTimer();
        gameLoop();
        pauseBtn.textContent = '暂停';
    }
}

// ==================== 游戏控制 API ====================

/**
 * 启动游戏
 * 初始化所有游戏状态并开始游戏循环
 */
function startGame() {
    console.log('startGame 被调用');
    
    // 隐藏难度选择界面和首页，显示游戏界面
    const difficultyScreen = document.getElementById('difficultyScreen');
    const homeScreen = document.getElementById('homeScreen');
    const gameInterface = document.getElementById('gameInterface');
    
    if (difficultyScreen) difficultyScreen.style.display = 'none';
    if (homeScreen) homeScreen.style.display = 'none';
    if (gameInterface) gameInterface.style.display = 'block';
    console.log('界面已切换到游戏界面');
    
    // 重置游戏状态
    board = createEmptyBoard();
    score = 0;
    level = 0;
    lines = 0;
    isPaused = false;
    isGameOver = false;
    
    // ✅ 开挂模式初始等级为 10 级
    if (currentDifficulty === 'extreme') {
        level = 10;
    }
    
    nextPieceType = getRandomTetrominoType();
    nextNextPieceType = getRandomTetrominoType();
    console.log('游戏状态已重置，nextPieceType:', nextPieceType, 'nextNextPieceType:', nextNextPieceType);

    // 隐藏覆盖层和结算画面（包括独立界面）
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('gameOverOverlay').style.display = 'none';
    document.getElementById('gameOverScreenFixed').style.display = 'none';
    console.log('覆盖层已隐藏');

    // 应用初始主题颜色
    applyUITheme();

    // 更新显示
    updateDisplay();
    console.log('显示已更新');

    // 生成第一个方块
    spawnPiece();
    console.log('方块已生成，currentPiece:', currentPiece);

    // 停止之前的循环
    if (dropTimer) clearInterval(dropTimer);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    // 启动下落定时器和游戏循环
    startDropTimer();
    gameLoop();
    console.log('游戏循环已启动');
}

/**
 * 暂停游戏
 */
function pauseGame() {
    if (!isPaused && !isGameOver) {
        togglePause();
    }
}

/**
 * 继续游戏
 */
function resumeGame() {
    if (isPaused) {
        togglePause();
    }
}

// 导出到全局作用域
window.startGame = startGame;
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;

console.log('input.js 已加载，window.startGame 已导出');
