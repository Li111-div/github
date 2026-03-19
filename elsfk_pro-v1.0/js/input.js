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
    // 重置游戏状态
    board = createEmptyBoard();
    score = 0;
    level = 0;
    lines = 0;
    isPaused = false;
    isGameOver = false;
    nextPieceType = getRandomTetrominoType();

    // 隐藏覆盖层和结算画面（包括独立界面）
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('gameOverOverlay').style.display = 'none';
    document.getElementById('gameOverScreenFixed').style.display = 'none';

    // 应用初始主题颜色
    applyUITheme();

    // 更新显示
    updateDisplay();

    // 生成第一个方块
    spawnPiece();

    // 停止之前的循环
    if (dropTimer) clearInterval(dropTimer);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    // 启动下落定时器和游戏循环
    startDropTimer();
    gameLoop();
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
