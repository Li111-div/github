/**
 * 俄罗斯方块 - 游戏核心逻辑
 */

// ==================== 工具函数 ====================

/**
 * 创建空的游戏面板
 * @returns {Array} 20x10 的二维数组，初始为 null
 */
function createEmptyBoard() {
    const board = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        board[y] = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            board[y][x] = null;
        }
    }
    return board;
}

/**
 * 随机获取一个方块类型
 * @returns {string} 方块类型（I/O/T/L/J/S/Z）
 */
function getRandomTetrominoType() {
    return TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
}

/**
 * 创建新方块对象
 * @param {string} type - 方块类型
 * @returns {Object} 方块对象
 */
function createPiece(type) {
    const tetromino = TETROMINOES[type];
    return {
        type: type,
        shape: tetromino.shapes[0], // 初始状态 0
        rotation: 0,                 // 初始旋转状态
        color: getBlockColorByLevel(type), // 根据等级获取颜色
        x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(tetromino.shapes[0][0].length / 2),
        y: 0
    };
}

/**
 * 根据当前等级获取方块颜色
 * @param {string} type - 方块类型 (I/O/T/L/J/S/Z)
 * @returns {string} 颜色值（十六进制）
 */
function getBlockColorByLevel(type) {
    const themeIndex = Math.min(level, LEVEL_THEMES.length - 1);
    const theme = LEVEL_THEMES[themeIndex];
    return theme.colors[type] || TETROMINOES[type].color;
}

// ==================== 核心游戏逻辑 ====================

/**
 * 碰撞检测
 * @param {Object} piece - 方块对象
 * @param {number} offsetX - X 轴偏移量
 * @param {number} offsetY - Y 轴偏移量
 * @returns {boolean} 是否发生碰撞
 */
function checkCollision(piece, offsetX, offsetY) {
    if (!piece || !piece.shape) return false;
    
    const dx = offsetX || 0;
    const dy = offsetY || 0;
    
    const shape = piece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = piece.x + x + dx;
                const newY = piece.y + y + dy;

                // 边界检测
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return true;
                }

                // 与已锁定方块碰撞检测（newY < 0 时不检测）
                if (newY >= 0 && board[newY][newX] !== null) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * 检查当前方块的碰撞
 * @param {number} offsetX - X 轴偏移量
 * @param {number} offsetY - Y 轴偏移量
 * @returns {boolean} 是否发生碰撞
 */
function checkCurrentCollision(offsetX, offsetY) {
    return checkCollision(currentPiece, offsetX, offsetY);
}

/**
 * 方块旋转（顺时针）
 * 使用简化版 SRS 系统，支持 4 个旋转状态
 */
function rotatePiece() {
    if (!currentPiece) return;

    const tetromino = TETROMINOES[currentPiece.type];
    const newRotation = (currentPiece.rotation + 1) % 4;
    const newShape = tetromino.shapes[newRotation];

    // 临时保存旧状态
    const oldShape = currentPiece.shape;
    const oldRotation = currentPiece.rotation;
    const oldX = currentPiece.x;

    // 应用新旋转
    currentPiece.shape = newShape;
    currentPiece.rotation = newRotation;

    // 墙踢检测（简化版）- 如果旋转后碰撞，尝试左右移动
    if (checkCurrentCollision()) {
        // 尝试向左踢
        currentPiece.x = oldX - 1;
        if (checkCurrentCollision()) {
            // 尝试向右踢
            currentPiece.x = oldX + 1;
            if (checkCurrentCollision()) {
                // 尝试向右踢 2 格
                currentPiece.x = oldX + 2;
                if (checkCurrentCollision()) {
                    // 所有踢墙都失败，恢复原状态
                    currentPiece.x = oldX;
                    currentPiece.shape = oldShape;
                    currentPiece.rotation = oldRotation;
                }
            }
        }
    }
}

/**
 * 方块左移
 */
function moveLeft() {
    if (currentPiece && !checkCurrentCollision(-1, 0)) {
        currentPiece.x -= 1;
    }
}

/**
 * 方块右移
 */
function moveRight() {
    if (currentPiece && !checkCurrentCollision(1, 0)) {
        currentPiece.x += 1;
    }
}

/**
 * 通用移动函数（供移动端使用）
 * @param {number} dx - X 方向移动距离 (-1: 左，1: 右)
 * @param {number} dy - Y 方向移动距离 (1: 下)
 */
function move(dx, dy) {
    if (currentPiece && !checkCurrentCollision(dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
    }
}

/**
 * 方块软降（加速下落）
 * @returns {boolean} 是否成功下落
 */
function softDrop() {
    if (!currentPiece) return false;

    if (!checkCurrentCollision(0, 1)) {
        currentPiece.y += 1;
        return true;
    }
    return false;
}

/**
 * 方块硬降（直接落底）
 */
function hardDrop() {
    if (!currentPiece) return;

    let dropDistance = 0;
    while (!checkCurrentCollision(0, 1)) {
        currentPiece.y += 1;
        dropDistance++;
    }
    // 硬降奖励分：每格 2 分，最多奖励 10 分
    score += Math.min(dropDistance * 2, 10);
    lockPiece();
}

/**
 * 锁定当前方块到游戏板（异步）
 */
let isLocking = false; // 防止重复锁定

async function lockPiece() {
    // 如果正在锁定中，跳过此次调用
    if (isLocking || !currentPiece) return;
    
    isLocking = true;

    const shape = currentPiece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                
                // 检查是否在游戏区域内
                if (boardY >= 0 && boardY < BOARD_HEIGHT && 
                    boardX >= 0 && boardX < BOARD_WIDTH) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }

    // 检查并消除满行（等待动画完成）
    await clearLines();
    
    // 锁定完成后，重置标志
    isLocking = false;

    // 生成新方块
    spawnPiece();
}

/**
 * 消除满行并计算分数（带动画效果）
 * 还原经典计分规则
 */
async function clearLines() {
    let linesCleared = 0;
    const linesToClear = [];

    // 从底部向上检查每一行
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        let isLineFull = true;
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x] === null) {
                isLineFull = false;
                break;
            }
        }

        if (isLineFull) {
            linesToClear.push(y);
            linesCleared++;
        }
    }

    // 播放消除动画（如果有需要消除的行）
    if (linesToClear.length > 0) {
        // 暂停游戏循环的渲染和下落定时器，避免干扰动画
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (dropTimer) {
            clearInterval(dropTimer);
            dropTimer = null;
        }
        
        // 根据消除行数选择动画类型
        if (linesToClear.length === 1) {
            // 单行消除：从中间往两边破裂的动画效果（这里简化为普通破裂）
            await drawLineClearAnimation(linesToClear[0]);
        } else {
            // 多行消除：炫酷爆炸动画 + 粒子效果
            await drawMultiLineClearAnimation(linesToClear);
        }
    }

    // 实际消除行（动画完成后，从下往上删除）
    for (let i = linesToClear.length - 1; i >= 0; i--) {
        const y = linesToClear[i];
        board.splice(y, 1);
    }
    
    // 在顶部添加相应数量的空行
    for (let i = 0; i < linesCleared; i++) {
        const newRow = new Array(BOARD_WIDTH).fill(null);
        board.unshift(newRow);
    }
    
    // 更新统计
    if (linesCleared > 0) {
        lines += linesCleared;
        // 经典计分：每 10 行升一级
        const oldLevel = level;
        level = Math.floor(lines / 10);
        // 根据消除行数和等级计算分数
        score += SCORE_TABLE[linesCleared] * (level + 1);
        updateDisplay();
        // 如果等级变化，更新下落速度和主题颜色
        if (oldLevel !== level) {
            updateGameSpeed();
            applyLevelTheme(); // 应用新等级主题颜色（不再显示提示）
        }
    }
    
    // 消除完成后，重绘画面显示最终状态
    drawBoard();
}

/**
 * 生成新方块
 * 检查游戏结束条件
 */
function spawnPiece() {
    // 使用预生成的下一个方块
    const type = nextPieceType || getRandomTetrominoType();
    nextPieceType = getRandomTetrominoType();

    currentPiece = createPiece(type);

    // 检查游戏结束：新方块生成时就碰撞
    if (checkCollision(currentPiece, 0, 0)) {
        isGameOver = true;
        // 显示独立的结算画面（不再使用覆盖层）
        showGameOverScreen();
        return; // 游戏结束时不重启循环
    }

    updateNextPreview();
    
    // 重启游戏循环和下落定时器
    if (!isGameOver && !isPaused) {
        gameLoop();
        startDropTimer();
    }
}
