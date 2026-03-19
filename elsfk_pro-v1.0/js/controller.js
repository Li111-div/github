/**
 * 俄罗斯方块 - 游戏控制与循环
 */

// ==================== 初始化设备类型 ====================

/**
 * 页面加载时检查设备类型
 */
window.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，检查设备类型...');
    const savedDevice = localStorage.getItem('tetrisDeviceType');
    
    if (savedDevice) {
        console.log('已保存的设备类型:', savedDevice);
        // 如果已经选择过设备，隐藏设备选择界面
        document.getElementById('deviceSelect').style.display = 'none';
        
        if (savedDevice === 'mobile') {
            console.log('移动端模式：显示控制面板');
            // 移动端：显示控制面板
            document.getElementById('mobileControls').style.display = 'flex';
            initMobileControls();
        } else {
            console.log('PC 端模式：隐藏控制面板');
            // PC 端：隐藏控制面板
            document.getElementById('mobileControls').style.display = 'none';
        }
    } else {
        console.log('首次访问，显示设备选择界面');
    }
});

// ==================== 游戏循环 ====================

/**
 * 获取当前等级的下落速度
 * @returns {number} 下落间隔（毫秒）
 */
function getDropInterval() {
    const index = Math.min(level, SPEED_CURVE.length - 1);
    return SPEED_CURVE[index];
}

/**
 * 方块下落
 */
function drop() {
    // 如果正在锁定方块，跳过此次下落
    if (isLocking) return;
    
    if (!softDrop()) {
        // 无法继续下落，锁定方块
        lockPiece();
    }
    drawBoard();
}

/**
 * 启动下落定时器
 */
function startDropTimer() {
    if (dropTimer) clearInterval(dropTimer);
    const interval = getDropInterval();
    dropTimer = setInterval(() => {
        if (!isPaused && !isGameOver) {
            drop();
        }
    }, interval);
}

/**
 * 游戏主循环（仅负责渲染动画）
 */
function gameLoop() {
    if (isPaused || isGameOver) return;
    drawBoard();
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * 更新游戏速度
 */
function updateGameSpeed() {
    if (!isPaused && !isGameOver) {
        startDropTimer();
    }
}

/**
 * 应用当前等级的主题颜色到已存在的方块
 */
function applyLevelTheme() {
    // 遍历整个游戏面板，更新已锁定方块的颜色
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x] !== null) {
                // 找到这个方块对应的类型（通过颜色反推）
                const blockType = getBlockTypeByColor(board[y][x]);
                if (blockType) {
                    board[y][x] = getBlockColorByLevel(blockType);
                }
            }
        }
    }
    
    // 更新当前正在下落的方块颜色
    if (currentPiece) {
        currentPiece.color = getBlockColorByLevel(currentPiece.type);
    }
    
    // 应用 UI 主题颜色
    applyUITheme();
    
    // 重绘画面（不再显示升级提示）
    drawBoard();
}

/**
 * 应用 UI 主题颜色
 */
function applyUITheme() {
    const themeIndex = Math.min(level, LEVEL_THEMES.length - 1);
    const theme = LEVEL_THEMES[themeIndex];
    const uiColors = theme.uiColors;
    
    // 设置 CSS 变量
    const root = document.documentElement;
    root.style.setProperty('--game-bg', uiColors.gameBg);
    root.style.setProperty('--game-border', uiColors.gameBorder);
    root.style.setProperty('--panel-bg', uiColors.panelBg);
    root.style.setProperty('--panel-border', uiColors.panelBorder);
    root.style.setProperty('--text-primary', uiColors.textPrimary);
    root.style.setProperty('--text-secondary', uiColors.textSecondary);
    root.style.setProperty('--theme-primary', uiColors.themePrimary);
    root.style.setProperty('--theme-accent1', uiColors.themeAccent1);
    root.style.setProperty('--theme-accent2', uiColors.themeAccent2);
    root.style.setProperty('--theme-accent3', uiColors.themeAccent3);
    root.style.setProperty('--theme-accent4', uiColors.themeAccent4);
    
    // 更新 body 背景色
    document.body.style.backgroundColor = uiColors.gameBg || '#000';
}

/**
 * 根据颜色值反推方块类型（用于主题切换）
 * @param {string} color - 颜色值（十六进制）
 * @returns {string|null} 方块类型
 */
function getBlockTypeByColor(color) {
    // 遍历所有等级的主题配色，找到匹配的方块类型
    for (let i = 0; i < LEVEL_THEMES.length; i++) {
        const theme = LEVEL_THEMES[i];
        for (const [type, themeColor] of Object.entries(theme.colors)) {
            if (themeColor.toUpperCase() === color.toUpperCase()) {
                return type;
            }
        }
    }
    
    // 如果找不到匹配，返回 null
    return null;
}

/**
 * 显示升级主题提示
 */
function showLevelUpNotification() {
    const notification = document.getElementById('levelUpNotification');
    const themeNameElement = document.getElementById('levelUpThemeName');
    
    // 获取当前等级主题名称
    const themeIndex = Math.min(level, LEVEL_THEMES.length - 1);
    const themeName = getThemeNameByIndex(themeIndex);
    
    themeNameElement.textContent = themeName;
    notification.style.display = 'block';
    
    // 2 秒后隐藏
    setTimeout(() => {
        notification.style.display = 'none';
    }, 2000);
}

/**
 * 根据等级索引获取主题名称
 * @param {number} index - 等级索引 (0-9)
 * @returns {string} 主题名称
 */
function getThemeNameByIndex(index) {
    const themeNames = [
        '经典初始配色',      // Lv0
        '暖红橙主题',        // Lv1
        '大地棕绿主题',      // Lv2
        '冷蓝深海主题',      // Lv3
        '橙黄暖阳主题',      // Lv4
        '粉紫洋红主题',      // Lv5
        '亮绿清新主题',      // Lv6
        '青蓝冷冽主题',      // Lv7
        '深紫暗调主题',      // Lv8
        '深绿沉稳主题'       // Lv9
    ];
    return themeNames[index] || '经典初始配色';
}
