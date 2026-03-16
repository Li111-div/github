/**
 * 无垠扫雷：全域探索 - 核心游戏逻辑
 */

// ==================== 游戏配置 ====================
const GAME_CONFIG = {
    modes: {
        beginner: { rows: 20, cols: 15, mines: 20 },      // 难度降低 50%：30×20/50 雷 → 20×15/20 雷
        advanced: { rows: 40, cols: 25, mines: 120 },     // 难度降低 50%：60×40/300 雷 → 40×25/120 雷
        master: { rows: 60, cols: 40, mines: 400 },       // 难度降低 50%：100×80/1000 雷 → 60×40/400 雷
        timed: { rows: 30, cols: 25, mines: 100, timeLimit: 1200 }, // 难度降低 50%：50×50/400 雷 → 30×25/100 雷
        infinite: { initialRows: 20, initialCols: 15, minesPerArea: 0.08 }, // 密度从 15% 降至 8%
        coop: { rows: 50, cols: 30, mines: 200 }          // 难度降低 50%：80×60/600 雷 → 50×30/200 雷
    },
    cellSize: 30,
    maxZoom: 2,
    minZoom: 0.5,
    dragInertia: 0.95
};

// ==================== 游戏状态 ====================
let gameState = {
    currentMode: null,
    board: null,
    revealed: null,
    flagged: null,
    mines: null,
    gameOver: false,
    gameWon: false,
    startTime: null,
    timer: null,
    elapsedTime: 0,
    remainingMines: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    velocityX: 0,
    velocityY: 0,
    settings: {
        background: 'solid',
        themeColor: '#5B9BD5'
    },
    // 性能优化：可见区域缓存
    visibleRows: { start: 0, end: 0 },
    visibleCols: { start: 0, end: 0 },
    cellCache: new Map()
};

// ==================== DOM 元素 ====================
const elements = {
    screens: {
        home: document.getElementById('home-screen'),
        customize: document.getElementById('customize-screen'),
        game: document.getElementById('game-screen')
    },
    board: document.getElementById('board'),
    boardWrapper: document.getElementById('board-wrapper'),
    boardContainer: document.getElementById('board-container'),
    modal: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalConfirm: document.getElementById('modal-confirm')
};

// ==================== 初始化 ====================
function init() {
    loadSettings();
    applySettings();
    loadSavedTheme();  // 加载保存的主题
    bindEvents();
    renderAchievementsPreview();
}

// ==================== 设置管理 ====================
function loadSettings() {
    const saved = localStorage.getItem('minesweeper_settings');
    if (saved) {
        gameState.settings = JSON.parse(saved);
    }
}

function saveSettings() {
    localStorage.setItem('minesweeper_settings', JSON.stringify(gameState.settings));
}

function applySettings() {
    // 应用背景
    document.body.className = `bg-${gameState.settings.background}`;
    
    // 应用主题色
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', gameState.settings.themeColor);
    
    // 计算主题的浅色和深色版本
    const color = gameState.settings.themeColor;
    root.style.setProperty('--theme-primary-light', adjustColorBrightness(color, 20));
    root.style.setProperty('--theme-primary-dark', adjustColorBrightness(color, -20));
}

function adjustColorBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// ==================== 事件绑定 ====================
function bindEvents() {
    // 首页事件
    document.getElementById('btn-start').addEventListener('click', () => {
        if (gameState.currentMode) {
            startGame();
        } else {
            showModal('提示', '请先选择一个游戏模式');
        }
    });
    
    document.getElementById('btn-customize').addEventListener('click', () => {
        switchScreen('customize');
    });
    
    // 模式选择
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            gameState.currentMode = card.dataset.mode;
            updateGameInfo();
        });
    });
    
    // 自定义页面事件
    document.getElementById('btn-back-home').addEventListener('click', () => {
        switchScreen('home');
    });
    
    document.querySelectorAll('.bg-option').forEach(option => {
        option.addEventListener('click', () => {
            if (option.dataset.bg === 'upload') {
                document.getElementById('bg-upload').click();
            } else {
                document.querySelectorAll('.bg-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                gameState.settings.background = option.dataset.bg;
            }
        });
    });
    
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            gameState.settings.themeColor = getComputedStyle(option).getPropertyValue('--theme-color').trim();
            document.getElementById('custom-color-picker').value = rgbToHex(gameState.settings.themeColor);
        });
    });
    
    document.getElementById('custom-color-picker').addEventListener('input', (e) => {
        gameState.settings.themeColor = e.target.value;
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('selected'));
    });
    
    document.getElementById('bg-upload').addEventListener('change', handleBackgroundUpload);
    
    document.getElementById('btn-save-settings').addEventListener('click', () => {
        saveSettings();
        applySettings();
        showModal('设置已保存', '您的个性化设置已应用');
    });
    
    // 游戏界面事件
    document.getElementById('btn-home').addEventListener('click', confirmBackToHome);
    document.getElementById('btn-pause').addEventListener('click', togglePause);
    document.getElementById('btn-theme').addEventListener('click', toggleThemePanel);
    document.getElementById('btn-help').addEventListener('click', showHelp);
    document.getElementById('btn-reset').addEventListener('click', resetGame);
    document.getElementById('btn-giveup').addEventListener('click', giveUp);
    
    // 主题面板事件
    document.getElementById('btn-close-theme').addEventListener('click', () => {
        document.getElementById('theme-panel').classList.remove('active');
    });
    
    // 主题选择
    document.querySelectorAll('.theme-item').forEach(item => {
        item.addEventListener('click', () => {
            const theme = item.dataset.theme;
            setTheme(theme);
            document.querySelectorAll('.theme-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            // 保存主题选择
            localStorage.setItem('minesweeper_theme', theme);
        });
    });
    
    // 点击外部关闭主题面板
    document.addEventListener('click', (e) => {
        const themePanel = document.getElementById('theme-panel');
        const btnTheme = document.getElementById('btn-theme');
        if (themePanel && themePanel.classList.contains('active') && 
            !themePanel.contains(e.target) && !btnTheme.contains(e.target)) {
            themePanel.classList.remove('active');
        }
    });
    
    // 棋盘交互
    setupBoardInteraction();
    
    // 弹窗事件
    document.getElementById('modal-confirm').addEventListener('click', hideModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) hideModal();
    });
}

// ==================== 屏幕切换 ====================
function switchScreen(screenName) {
    Object.values(elements.screens).forEach(screen => screen.classList.remove('active'));
    elements.screens[screenName].classList.add('active');
}

// ==================== 背景上传 ====================
function handleBackgroundUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.body.style.backgroundImage = `url(${event.target.result})`;
            document.body.classList.add('bg-custom');
            document.querySelectorAll('.bg-option').forEach(o => o.classList.remove('selected'));
        };
        reader.readAsDataURL(file);
    }
}

// ==================== 游戏逻辑 ====================
function startGame() {
    const config = GAME_CONFIG.modes[gameState.currentMode];
    if (!config) return;
    
    // 重置状态
    gameState.gameOver = false;
    gameState.gameWon = false;
    gameState.startTime = Date.now();
    gameState.elapsedTime = 0;
    gameState.flagged = new Set();
    gameState.revealed = new Set();
    
    // 初始化棋盘
    initBoard(config);
    
    // 开始计时
    if (gameState.timer) clearInterval(gameState.timer);
    gameState.timer = setInterval(updateTimer, 1000);
    
    // 更新 UI
    updateGameInfo();
    renderBoard();
    switchScreen('game');
    
    // 重置视图
    resetView();
}

function initBoard(config) {
    // 支持不同模式的配置结构
    const rows = config.rows || config.initialRows || 30;
    const cols = config.cols || config.initialCols || 30;
    const mines = config.mines || Math.floor(rows * cols * (config.minesPerArea || 0.15));
    
    gameState.board = { rows, cols };
    gameState.mines = new Set();
    
    // 生成地雷（保证第一个点击的位置不是雷）
    while (gameState.mines.size < mines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        gameState.mines.add(`${row},${col}`);
    }
    
    gameState.remainingMines = mines;
}

function renderBoard() {
    const { rows, cols } = gameState.board;
    elements.board.style.gridTemplateColumns = `repeat(${cols}, ${GAME_CONFIG.cellSize}px)`;
    elements.board.style.gridTemplateRows = `repeat(${rows}, ${GAME_CONFIG.cellSize}px)`;
    
    // 使用 DocumentFragment 批量渲染
    const fragment = document.createDocumentFragment();
    elements.board.innerHTML = '';
    
    // 清空缓存
    gameState.cellCache.clear();
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = createCell(row, col);
            fragment.appendChild(cell);
            gameState.cellCache.set(`${row},${col}`, cell);
        }
    }
    
    elements.board.appendChild(fragment);
    updateBoardTransform();
}


function createCell(row, col) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = row;
    cell.dataset.col = col;
    
    // 事件处理
    cell.addEventListener('click', (e) => handleCellClick(row, col, e));
    cell.addEventListener('contextmenu', (e) => handleCellRightClick(row, col, e));
    cell.addEventListener('dblclick', (e) => handleCellDoubleClick(row, col, e));
    
    return cell;
}

function getCellElement(row, col) {
    // 优先从缓存获取
    const cached = gameState.cellCache.get(`${row},${col}`);
    if (cached) return cached;
    
    // 缓存未命中时查询 DOM
    return elements.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function handleCellClick(row, col, e) {
    if (gameState.gameOver) return;
    
    const key = `${row},${col}`;
    if (gameState.flagged.has(key) || gameState.revealed.has(key)) return;
    
    // 检查是否触雷
    if (gameState.mines.has(key)) {
        gameOver(false, key);
        return;
    }
    
    // 揭示格子
    revealCell(row, col);
    
    // 检查胜利
    checkWin();
}

function handleCellRightClick(row, col, e) {
    e.preventDefault();
    if (gameState.gameOver || gameState.isDragging) return;
    
    const key = `${row},${col}`;
    const cell = getCellElement(row, col);
    
    if (gameState.revealed.has(key)) return;
    
    if (gameState.flagged.has(key)) {
        gameState.flagged.delete(key);
        cell.classList.remove('flagged');
        cell.textContent = '';
        gameState.remainingMines++;
    } else {
        gameState.flagged.add(key);
        cell.classList.add('flagged');
        cell.textContent = '🚩';
        gameState.remainingMines--;
    }
    
    updateGameInfo();
}

function handleCellDoubleClick(row, col, e) {
    if (gameState.gameOver || gameState.isDragging) return;
    
    const key = `${row},${col}`;
    if (!gameState.revealed.has(key)) return;
    
    // 双击快速开格（周围旗帜数等于数字时自动开格）
    const cellData = getCellNumber(row, col);
    const neighbors = getNeighbors(row, col);
    const flaggedNeighbors = neighbors.filter(n => gameState.flagged.has(`${n.row},${n.col}`)).length;
    
    if (flaggedNeighbors === cellData) {
        neighbors.forEach(n => {
            const nKey = `${n.row},${n.col}`;
            if (!gameState.revealed.has(nKey) && !gameState.flagged.has(nKey)) {
                if (gameState.mines.has(nKey)) {
                    gameOver(false, nKey);
                } else {
                    revealCell(n.row, n.col);
                }
            }
        });
        checkWin();
    }
}

function revealCell(row, col) {
    const key = `${row},${col}`;
    if (gameState.revealed.has(key) || gameState.flagged.has(key)) return;
    
    gameState.revealed.add(key);
    const cell = getCellElement(row, col);
    if (!cell) return; // 性能优化：格子可能不存在于 DOM 中
    
    cell.classList.add('revealed');
    
    const number = getCellNumber(row, col);
    if (number > 0) {
        cell.textContent = number;
        cell.dataset.number = number;
    } else {
        // 空白格，递归揭示相邻格子（使用栈避免调用栈溢出）
        const stack = [{ row, col }];
        while (stack.length > 0) {
            const current = stack.pop();
            const neighbors = getNeighbors(current.row, current.col);
            neighbors.forEach(n => {
                const nKey = `${n.row},${n.col}`;
                if (!gameState.revealed.has(nKey) && !gameState.flagged.has(nKey)) {
                    gameState.revealed.add(nKey);
                    const nCell = getCellElement(n.row, n.col);
                    if (nCell) {
                        nCell.classList.add('revealed');
                        const nNumber = getCellNumber(n.row, n.col);
                        if (nNumber > 0) {
                            nCell.textContent = nNumber;
                            nCell.dataset.number = nNumber;
                        } else {
                            stack.push({ row: n.row, col: n.col });
                        }
                    }
                }
            });
        }
    }
}

function getCellNumber(row, col) {
    if (gameState.mines.has(`${row},${col}`)) return -1;
    
    const neighbors = getNeighbors(row, col);
    return neighbors.filter(n => gameState.mines.has(`${n.row},${n.col}`)).length;
}

function getNeighbors(row, col) {
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < gameState.board.rows && nc >= 0 && nc < gameState.board.cols) {
                neighbors.push({ row: nr, col: nc });
            }
        }
    }
    return neighbors;
}

function checkWin() {
    const totalCells = gameState.board.rows * gameState.board.cols;
    const revealedCount = gameState.revealed.size;
    const mineCount = gameState.mines.size;
    
    if (revealedCount === totalCells - mineCount) {
        gameOver(true);
    }
}

function gameOver(won, explodedMine = null) {
    gameState.gameOver = true;
    gameState.gameWon = won;
    
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    
    if (won) {
        // 标记所有地雷
        gameState.mines.forEach(key => {
            const [row, col] = key.split(',').map(Number);
            const cell = getCellElement(row, col);
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        });
        
        // 更新成就
        unlockAchievement('全图通关');
        
        showModal('恭喜通关！', `用时：${formatTime(gameState.elapsedTime)}\n步数：${gameState.revealed.size}`);
    } else {
        // 显示所有地雷
        gameState.mines.forEach(key => {
            const [row, col] = key.split(',').map(Number);
            const cell = getCellElement(row, col);
            cell.classList.add('mine');
            if (key === explodedMine) {
                cell.classList.add('exploded');
            }
            cell.textContent = '💣';
        });
        
        // 震动反馈
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        showModal('游戏结束', '很遗憾，你触发了地雷！');
    }
}

// ==================== 棋盘交互（固定式，无拖拽缩放）====================
function setupBoardInteraction() {
    const container = elements.boardContainer;
    
    // 禁用鼠标拖拽
    container.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });
    
    // 禁用滚轮缩放
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // 触摸支持 - 仅保留点击和长按标记
    let longPressTimer;
    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1 && !gameState.gameOver) {
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.classList.contains('cell')) {
                longPressTimer = setTimeout(() => {
                    const row = parseInt(element.dataset.row);
                    const col = parseInt(element.dataset.col);
                    handleCellRightClick(row, col, { preventDefault: () => {} });
                }, 500);
            }
        }
    }, { passive: false });
    
    container.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    container.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });
}

function updateBoardTransform() {
    // 固定棋盘，不进行变换
    elements.boardWrapper.style.transform = 'translate(0px, 0px) scale(1)';
}

function resetView() {
    gameState.zoom = 1;
    gameState.panX = 0;
    gameState.panY = 0;
    updateBoardTransform();
}

function animateInertia() {
    // 固定模式不需要惯性滚动
}

// ==================== 游戏控制 ====================
function updateTimer() {
    if (!gameState.startTime) return;
    gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    updateGameInfo();
    
    // 限时模式检查
    if (gameState.currentMode === 'timed') {
        const config = GAME_CONFIG.modes.timed;
        const remaining = config.timeLimit - gameState.elapsedTime;
        if (remaining <= 0) {
            gameOver(false);
        }
    }
}

function updateGameInfo() {
    const modeNames = {
        beginner: '新手',
        advanced: '进阶',
        master: '大师',
        timed: '限时挑战',
        infinite: '无限扩展',
        coop: '组队协作'
    };
    
    document.getElementById('game-mode').textContent = `模式：${modeNames[gameState.currentMode] || '未知'}`;
    
    // 限时模式显示剩余时间
    if (gameState.currentMode === 'timed') {
        const config = GAME_CONFIG.modes.timed;
        const remaining = Math.max(0, config.timeLimit - gameState.elapsedTime);
        document.getElementById('game-timer').textContent = `剩余：${formatTime(remaining)}`;
    } else {
        document.getElementById('game-timer').textContent = `时间：${formatTime(gameState.elapsedTime)}`;
    }
    
    document.getElementById('game-mines').textContent = `地雷：${gameState.remainingMines}`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function togglePause() {
    if (gameState.gameOver) return;
    
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
        showModal('游戏暂停', '点击确定继续游戏');
    } else {
        gameState.timer = setInterval(updateTimer, 1000);
    }
}

// 主题切换功能
function toggleThemePanel() {
    const themePanel = document.getElementById('theme-panel');
    themePanel.classList.toggle('active');
    
    // 高亮当前主题
    const currentTheme = document.body.className.match(/theme-\w+/)?.[0] || 'theme-classic';
    const themeName = currentTheme.replace('theme-', '');
    document.querySelectorAll('.theme-item').forEach(item => {
        item.classList.toggle('active', item.dataset.theme === themeName);
    });
}

function setTheme(themeName) {
    // 移除所有主题类
    document.body.classList.remove(
        'theme-classic',
        'theme-dark',
        'theme-wood',
        'theme-green',
        'theme-pink',
        'theme-ocean',
        'theme-purple'
    );
    
    // 添加新主题类
    if (themeName && themeName !== 'classic') {
        document.body.classList.add(`theme-${themeName}`);
    } else {
        document.body.classList.add('theme-classic');
    }
    
    // 保存主题选择
    localStorage.setItem('minesweeper_theme', themeName || 'classic');
}

// 加载保存的主题
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('minesweeper_theme');
    if (savedTheme) {
        setTheme(savedTheme);
        // 更新主题面板的高亮状态
        setTimeout(() => {
            document.querySelectorAll('.theme-item').forEach(item => {
                item.classList.toggle('active', item.dataset.theme === savedTheme);
            });
        }, 100);
    }
}

function quickThemeSwitch() {
    const themes = ['classic', 'dark', 'wood', 'green', 'pink', 'ocean', 'purple'];
    const currentTheme = document.body.className.match(/theme-\w+/)?.[0]?.replace('theme-', '') || 'classic';
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
}

function resetGame() {
    if (gameState.currentMode) {
        startGame();
    }
}

function giveUp() {
    if (!gameState.gameOver) {
        showModal('确认放弃', '确定要放弃本局游戏吗？', () => {
            gameOver(false);
        });
    }
}

function confirmBackToHome() {
    if (!gameState.gameOver) {
        showModal('确认返回', '确定要返回首页吗？当前进度将丢失', () => {
            backToHome();
        });
    } else {
        backToHome();
    }
}

function backToHome() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    switchScreen('home');
}

function showHelp() {
    const helpContent = {
        title: '游戏帮助',
        message: `PC 端操作：
• 左键点击：揭开格子
• 右键点击：标记/取消标记地雷
• 双击数字：快速开格（周围旗帜数 = 数字时自动开格）

移动端操作：
• 点击：揭开格子
• 长按：标记地雷

游戏规则：
• 找出所有非地雷格子即可获胜
• 数字表示周围 8 格的地雷数量
• 棋盘固定，可通过浏览器滚动查看完整地图`
    };
    showModal(helpContent.title, helpContent.message);
}

// ==================== 成就系统 ====================
const ACHIEVEMENTS = [
    { id: 'first_win', name: '初次胜利', desc: '赢得第一局游戏', unlocked: false },
    { id: 'speed_run', name: '极速扫雷', desc: '60 秒内完成新手模式', unlocked: false },
    { id: 'perfect_flag', name: '零失误标记', desc: '无错误标记完成一局', unlocked: false },
    { id: 'master_clear', name: '大师之路', desc: '完成大师模式', unlocked: false },
    { id: 'full_map', name: '全图通关', desc: '揭开整个地图', unlocked: false }
];

function loadAchievements() {
    const saved = localStorage.getItem('minesweeper_achievements');
    if (saved) {
        const unlocked = JSON.parse(saved);
        ACHIEVEMENTS.forEach(a => {
            if (unlocked.includes(a.id)) a.unlocked = true;
        });
    }
}

function unlockAchievement(name) {
    const achievement = ACHIEVEMENTS.find(a => a.name === name);
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        saveAchievements();
        // 可以添加解锁通知
    }
}

function saveAchievements() {
    const unlocked = ACHIEVEMENTS.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem('minesweeper_achievements', JSON.stringify(unlocked));
}

function renderAchievementsPreview() {
    loadAchievements();
    const container = document.getElementById('achievements-preview');
    container.innerHTML = ACHIEVEMENTS.slice(0, 4).map(a => `
        <div class="achievement-item ${a.unlocked ? '' : 'locked'}">
            <div style="font-size: 24px; margin-bottom: 4px;">${a.unlocked ? '🏆' : '🔒'}</div>
            <div style="font-size: 12px; font-weight: 500;">${a.name}</div>
            <div style="font-size: 10px; color: #999;">${a.desc}</div>
        </div>
    `).join('');
}

// ==================== 弹窗控制 ====================
let modalCallback = null;

function showModal(title, message, onConfirm) {
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    elements.modal.classList.add('active');
    modalCallback = onConfirm || null;
    
    // 暂停游戏计时器
    if (gameState.timer && !gameState.gameOver) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

function hideModal() {
    elements.modal.classList.remove('active');
    if (modalCallback) {
        const callback = modalCallback;
        modalCallback = null;
        callback();
    }
    
    // 如果暂停后继续（且不是游戏结束状态）
    if (!gameState.gameOver && !gameState.timer) {
        gameState.timer = setInterval(updateTimer, 1000);
    }
}

// ==================== 工具函数 ====================
function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const match = rgb.match(/\d+/g);
    if (!match) return '#5B9BD5';
    return '#' + ((1 << 24) + (parseInt(match[0]) << 16) + (parseInt(match[1]) << 8) + parseInt(match[2])).toString(16).slice(1);
}

// ==================== 启动 ====================
document.addEventListener('DOMContentLoaded', init);
