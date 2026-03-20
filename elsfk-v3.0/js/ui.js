/**
 * 俄罗斯方块 - 首页、历史记录与设置功能
 */

// ==================== 首页功能 ====================

/**
 * 从首页开始游戏
 */
function startGameFromHome() {
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('gameInterface').style.display = 'block';
    startGame();
}

/**
 * 显示难度选择界面
 */
function showDifficultySelect() {
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('difficultyScreen').style.display = 'flex';
    
    // 默认选择第一个选项卡（简单模式）
    selectDifficultyTab('easy');
}

/**
 * 选择难度
 * @param {string} difficulty - 难度级别 ('easy', 'normal', 'hard', 'challenge')
 */
function selectDifficulty(difficulty) {
    // 设置当前难度
    currentDifficulty = difficulty;
    
    // 根据难度设置速度曲线
    setDifficultySpeedCurve(difficulty);
    
    // 隐藏难度选择界面，显示游戏界面
    document.getElementById('difficultyScreen').style.display = 'none';
    document.getElementById('gameInterface').style.display = 'block';
}

/**
 * 根据难度设置速度曲线
 * @param {string} difficulty - 难度级别
 */
function setDifficultySpeedCurve(difficulty) {
    if (difficulty === 'easy') {
        // 简单：所有等级都是慢速（基础速度的 1.5 倍时间）
        SPEED_CURVE = [1000, 950, 900, 850, 800, 750, 700, 650, 600, 550, 500, 450, 400, 350, 300, 250, 200, 150, 100, 50];
    } else if (difficulty === 'normal') {
        // 普通：中等速度（介于简单和困难之间）
        SPEED_CURVE = [500, 450, 400, 350, 300, 250, 200, 160, 130, 100, 80, 65, 52, 42, 33, 26, 20, 16, 12, 9];
    } else if (difficulty === 'hard') {
        // 困难：极速（标准速度的 0.2 倍，再增加 400% 速度）
        SPEED_CURVE = [160, 144, 128, 112, 96, 80, 64, 56, 48, 40, 36, 32, 28, 24, 20, 16, 12, 10, 8, 6];
    } else if (difficulty === 'challenge') {
        // 挑战：动态速度，随等级提升逐渐加快
        // Lv0-Lv9: 简单速度，Lv10-Lv19: 困难速度×1.5（最快达到极致速度）
        SPEED_CURVE = [1000, 900, 800, 700, 600, 500, 450, 400, 350, 300, 54, 36, 24, 16, 8, 5, 3, 2, 1.5, 1];
    } else if (difficulty === 'extreme') {
        // 爆爽模式：中等速度，适合解压
        SPEED_CURVE = [400, 380, 360, 340, 320, 300, 280, 260, 240, 220, 200, 180, 160, 140, 120, 100, 80, 60, 40, 20];
    }
}

/**
 * 从难度选择界面返回首页
 */
function returnHomeFromDifficulty() {
    document.getElementById('difficultyScreen').style.display = 'none';
    document.getElementById('homeScreen').style.display = 'flex';
}

/**
 * 选择难度选项卡
 */
function selectDifficultyTab(mode) {
    // 设置当前难度
    currentDifficulty = mode;
    setDifficultySpeedCurve(mode);
    
    // 移除所有选项卡的 active 类
    document.querySelectorAll('.difficulty-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 移除所有详细内容的 active 类
    document.querySelectorAll('.difficulty-detail').forEach(detail => {
        detail.classList.remove('active');
    });
    
    // 添加当前选项卡的 active 类
    document.querySelector(`.difficulty-tab[data-mode="${mode}"]`).classList.add('active');
    document.getElementById(`detail-${mode}`).classList.add('active');
    
    // 绘制预览方块
    setTimeout(() => {
        drawDifficultyPreview(mode);
    }, 50);
}

/**
 * 绘制难度预览方块
 */
function drawDifficultyPreview(mode) {
    const canvas = document.getElementById(`preview-${mode}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const blockSize = 40; // ✅ 进一步增加方块尺寸
    
    // 清空画布
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 根据不同难度绘制不同的方块图案
    const patterns = {
        easy: [
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [1, 1, 1, 1, 0]
        ],
        normal: [
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        hard: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        challenge: [
            [1, 0, 1, 0, 1],
            [0, 1, 0, 1, 0],
            [1, 0, 1, 0, 1],
            [0, 1, 0, 1, 0],
            [1, 0, 1, 0, 1]
        ],
        extreme: [
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1]
        ]
    };
    
    const colors = {
        easy: '#00FFFF',
        normal: '#FFA500',
        hard: '#FF0000',
        challenge: '#FF00FF',
        extreme: '#FF6600'
    };
    
    const pattern = patterns[mode];
    const color = colors[mode];
    
    // 计算居中位置
    const shapeWidth = pattern[0].length * blockSize;
    const shapeHeight = pattern.length * blockSize;
    const offsetX = (canvas.width - shapeWidth) / 2;
    const offsetY = (canvas.height - shapeHeight) / 2;
    
    // 绘制方块
    for (let y = 0; y < pattern.length; y++) {
        for (let x = 0; x < pattern[y].length; x++) {
            if (pattern[y][x]) {
                drawBlock(
                    ctx,
                    offsetX + x * blockSize,
                    offsetY + y * blockSize,
                    blockSize,
                    color,
                    gameSettings.blockStyle
                );
            }
        }
    }
}

/**
 * 绘制展示方块
 */
function drawShowcaseBlock(canvasId, color, shape) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const blockSize = 20;
    
    // 清空画布
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 计算居中位置
    const shapeWidth = shape[0].length * blockSize;
    const shapeHeight = shape.length * blockSize;
    const offsetX = (canvas.width - shapeWidth) / 2;
    const offsetY = (canvas.height - shapeHeight) / 2;
    
    // 绘制方块
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                drawBlock(
                    ctx,
                    offsetX + x * blockSize,
                    offsetY + y * blockSize,
                    blockSize,
                    color
                );
            }
        }
    }
}

/**
 * 初始化首页展示
 */
function initHomeScreen() {
    // 绘制 4 个经典方块
    drawShowcaseBlock('showcaseI', TETROMINOES.I.color, TETROMINOES.I.shapes[0]);
    drawShowcaseBlock('showcaseT', TETROMINOES.T.color, TETROMINOES.T.shapes[0]);
    drawShowcaseBlock('showcaseL', TETROMINOES.L.color, TETROMINOES.L.shapes[0]);
    drawShowcaseBlock('showcaseZ', TETROMINOES.Z.color, TETROMINOES.Z.shapes[0]);
}

// ==================== 历史记录功能 ====================

/**
 * 加载历史记录
 */
function loadHistory() {
    const saved = localStorage.getItem('tetrisHistory');
    if (saved) {
        gameHistory = JSON.parse(saved);
    }
}

/**
 * 保存历史记录
 */
function saveHistory() {
    localStorage.setItem('tetrisHistory', JSON.stringify(gameHistory));
}

/**
 * 添加新的游戏记录
 */
function addHistoryRecord(finalScore, finalLevel, finalLines) {
    const record = {
        score: finalScore,
        level: finalLevel,
        lines: finalLines,
        date: new Date().toLocaleString('zh-CN'),
        difficulty: currentDifficulty || 'normal', // 难度
        timestamp: Date.now(), // 时间戳用于排序
        // ✅ 开挂模式记录使用的方块类型
        extremeTypes: currentDifficulty === 'extreme' ? getExtremeBlockTypes() : []
    };
    
    gameHistory.push(record);
    // 按分数降序排序
    gameHistory.sort((a, b) => b.score - a.score);
    // 只保留前 10 名
    gameHistory = gameHistory.slice(0, 10);
    
    saveHistory();
    
    // 检查是否是新纪录
    return gameHistory.length === 1 || finalScore >= gameHistory[0].score;
}

/**
 * 显示历史记录（首页预览，只显示前 3 条）
 */
function showHistory() {
    const preview = document.getElementById('historyPreview');
    const listDisplay = document.getElementById('historyListDisplay');
    
    // 如果元素不存在，直接返回
    if (!preview || !listDisplay) return;
    
    if (preview.style.display === 'none' || preview.style.display === '') {
        // 显示历史列表（只显示前 3 条）
        if (gameHistory.length === 0) {
            listDisplay.innerHTML = '<li class="no-history">暂无记录</li>';
        } else {
            let html = '';
            const displayCount = Math.min(3, gameHistory.length);
            for (let i = 0; i < displayCount; i++) {
                const record = gameHistory[i];
                const rankClass = i < 3 ? 'style="color: #ffff00;"' : '';
                
                // 难度图标
                const difficultyIcon = {
                    'easy': '🌟',
                    'normal': '⚡',
                    'hard': '🔥',
                    'challenge': '💀'
                }[record.difficulty] || '⚡';
                
                html += `<li class="history-item">
                    <span ${rankClass}>${i + 1}. ${record.score.toString().padStart(8, '0')}</span>
                    <span class="history-date">${difficultyIcon} Lv.${record.level}</span>
                </li>`;
            }
            listDisplay.innerHTML = html;
        }
        preview.style.display = 'block';
    } else {
        // 隐藏历史列表
        preview.style.display = 'none';
    }
}

/**
 * 显示历史记录界面（完整列表）
 */
function showHistoryScreen() {
    const historyScreen = document.getElementById('historyScreen');
    const extremeTableBody = document.getElementById('extremeTableBody');
    const normalTableBody = document.getElementById('historyTableBody');
    
    // 分离开挂模式和其他模式的记录
    const extremeRecords = gameHistory.filter(record => record.difficulty === 'extreme');
    const normalRecords = gameHistory.filter(record => record.difficulty !== 'extreme');
    
    // 渲染开挂模式表格
    if (extremeRecords.length === 0) {
        extremeTableBody.innerHTML = '<tr><td colspan="6" class="no-history">暂无记录</td></tr>';
    } else {
        let html = '';
        extremeRecords.forEach((record, index) => {
            let rankHtml = '';
            if (index === 0) rankHtml = '<span class="rank-badge rank-1">1</span>';
            else if (index === 1) rankHtml = '<span class="rank-badge rank-2">2</span>';
            else if (index === 2) rankHtml = '<span class="rank-badge rank-3">3</span>';
            else rankHtml = `<span class="rank-badge">${index + 1}</span>`;
            
            // 显示使用的方块类型
            const typeNames = {
                'I': '竖条',
                'O': '方块',
                'T': 'T 形',
                'L': 'L 形',
                'J': 'J 形',
                'S': 'S 形',
                'Z': 'Z 形'
            };
            // ✅ 安全检查：处理旧记录可能没有 extremeTypes 的情况
            const typesHtml = record.extremeTypes && record.extremeTypes.length > 0 ? 
                record.extremeTypes.map(t => 
                    `<span style="color: #ff6600; margin: 0 3px;">${typeNames[t]}</span>`
                ).join(' + ') : 
                '未知';
            
            html += `<tr>
                <td>${rankHtml}</td>
                <td style="color: #00ff00; font-weight: bold;">${record.score.toString().padStart(8, '0')}</td>
                <td style="color: #ffff00;">${record.level.toString().padStart(2, '0')}</td>
                <td style="color: #00ffff;">${record.lines.toString().padStart(4, '0')}</td>
                <td>${typesHtml}</td>
                <td style="color: #888;">${record.date}</td>
            </tr>`;
        });
        extremeTableBody.innerHTML = html;
    }
    
    // 渲染其他模式表格
    if (normalRecords.length === 0) {
        normalTableBody.innerHTML = '<tr><td colspan="6" class="no-history">暂无记录</td></tr>';
    } else {
        let html = '';
        normalRecords.forEach((record, index) => {
            let rankHtml = '';
            if (index === 0) rankHtml = '<span class="rank-badge rank-1">1</span>';
            else if (index === 1) rankHtml = '<span class="rank-badge rank-2">2</span>';
            else if (index === 2) rankHtml = '<span class="rank-badge rank-3">3</span>';
            else rankHtml = `<span class="rank-badge">${index + 1}</span>`;
            
            // 难度显示
            const difficultyMap = {
                'easy': '<span style="color: #00ff00;">简单</span>',
                'normal': '<span style="color: #00ffff;">普通</span>',
                'hard': '<span style="color: #ffaa00;">困难</span>',
                'challenge': '<span style="color: #ff00ff;">挑战</span>'
            };
            const difficultyHtml = difficultyMap[record.difficulty] || '<span style="color: #888;">普通</span>';
            
            html += `<tr>
                <td>${rankHtml}</td>
                <td style="color: #00ff00; font-weight: bold;">${record.score.toString().padStart(8, '0')}</td>
                <td style="color: #ffff00;">${record.level.toString().padStart(2, '0')}</td>
                <td style="color: #00ffff;">${record.lines.toString().padStart(4, '0')}</td>
                <td>${difficultyHtml}</td>
                <td style="color: #888;">${record.date}</td>
            </tr>`;
        });
        normalTableBody.innerHTML = html;
    }
    
    historyScreen.style.display = 'flex';
}

/**
 * 关闭历史记录界面
 */
function closeHistoryScreen() {
    document.getElementById('historyScreen').style.display = 'none';
}

/**
 * 显示设置界面
 */
function showSettings() {
    // 加载当前设置
    document.getElementById('bgSelect').value = gameSettings.background;
    document.getElementById('volumeSlider').value = gameSettings.volume;
    document.getElementById('blockStyleSelect').value = gameSettings.blockStyle;
    document.getElementById('volumeValue').textContent = gameSettings.volume + '%';
    
    // 显示设置界面
    document.getElementById('settingsScreen').style.display = 'flex';
}

/**
 * 关闭设置界面
 */
function closeSettingsScreen() {
    document.getElementById('settingsScreen').style.display = 'none';
}

/**
 * 更改背景
 */
function changeBackground() {
    const select = document.getElementById('bgSelect');
    gameSettings.background = select.value;
    saveSettings();
    applySettings();
}

/**
 * 更改音量
 */
function changeVolume() {
    const slider = document.getElementById('volumeSlider');
    gameSettings.volume = parseInt(slider.value);
    document.getElementById('volumeValue').textContent = gameSettings.volume + '%';
    saveSettings();
    // TODO: 实际游戏中实现音效时应用音量
}

/**
 * 更改方块样式
 */
function changeBlockStyle() {
    const select = document.getElementById('blockStyleSelect');
    gameSettings.blockStyle = select.value;
    saveSettings();
    applySettings();
}

/**
 * 保存设置到 localStorage
 */
function saveSettings() {
    localStorage.setItem('tetrisSettings', JSON.stringify(gameSettings));
}

/**
 * 加载设置
 */
function loadSettings() {
    const saved = localStorage.getItem('tetrisSettings');
    if (saved) {
        gameSettings = JSON.parse(saved);
    }
    applySettings();
}

/**
 * 应用设置
 */
function applySettings() {
    const homeScreen = document.getElementById('homeScreen');
    
    // 移除所有背景类
    homeScreen.classList.remove('bg-classic', 'bg-grid', 'bg-stars', 'bg-matrix');
    
    // 添加新背景类
    homeScreen.classList.add('bg-' + gameSettings.background);
    
    // 根据方块样式调整渲染（这里只是标记，实际渲染逻辑需要修改 drawBlock 函数）
    // 在 drawBlock 函数中会根据 gameSettings.blockStyle 来绘制不同风格
}

/**
 * 退出游戏，返回首页
 */
function quitGame() {
    // 停止游戏循环
    if (dropTimer) clearInterval(dropTimer);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    // 保存记录
    if (score > 0) {
        addHistoryRecord(score, level, lines);
    }
    
    // 返回首页
    returnHome();
}

/**
 * 返回主页
 */
function backToHome() {
    // 停止游戏循环
    if (dropTimer) clearInterval(dropTimer);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    // 保存记录
    if (score > 0) {
        addHistoryRecord(score, level, lines);
    }
    
    // 返回首页
    returnHome();
}

/**
 * 结束游戏，显示结算画面
 */
function endGame() {
    // 停止游戏循环
    if (dropTimer) clearInterval(dropTimer);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    // 保存记录
    if (score > 0) {
        addHistoryRecord(score, level, lines);
    }
    
    // 显示结算画面
    showGameOverScreen();
}

/**
 * 返回首页
 */
function returnHome() {
    // 隐藏游戏界面和结算画面（包括独立界面）
    document.getElementById('gameInterface').style.display = 'none';
    document.getElementById('gameOverScreenFixed').style.display = 'none';
    
    // 显示首页
    document.getElementById('homeScreen').style.display = 'flex';
    
    // 重置游戏状态
    isGameOver = false;
    isPaused = false;
}

/**
 * 显示结算画面（独立界面）
 */
function showGameOverScreen() {
    // 停止游戏循环
    if (dropTimer) clearInterval(dropTimer);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    // 更新统计数据
    document.getElementById('finalScore').textContent = score.toString().padStart(8, '0');
    document.getElementById('finalLevel').textContent = level.toString().padStart(2, '0');
    document.getElementById('finalLines').textContent = lines.toString().padStart(4, '0');
    
    // 检查是否为新纪录
    const isNewRecord = addHistoryRecord(score, level, lines);
    if (isNewRecord && gameHistory[0].score === score) {
        document.getElementById('newRecordMsg').style.display = 'block';
    } else {
        document.getElementById('newRecordMsg').style.display = 'none';
    }
    
    // 隐藏游戏界面，显示独立的结算画面
    document.getElementById('gameInterface').style.display = 'none';
    document.getElementById('gameOverScreenFixed').style.display = 'flex';
}

// ==================== 爆爽模式功能 ====================

/**
 * 爆爽模式选择的方块类型（支持多选）
 */
let extremeBlockTypes = new Set(); // Set 存储多个方块类型 'I', 'O', 'T', 'L', 'J', 'S', 'Z'

/**
 * 切换爆爽模式的方块类型（多选）
 * @param {string} type - 方块类型 'I', 'O', 'T', 'L', 'J', 'S', 'Z'
 */
function toggleExtremeType(type) {
    if (extremeBlockTypes.has(type)) {
        // 如果已选择，取消选择
        extremeBlockTypes.delete(type);
    } else {
        // 如果未选择，添加选择
        extremeBlockTypes.add(type);
    }
    
    // 更新按钮选中状态
    document.querySelectorAll('.extreme-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 添加所有已选中按钮的样式
    document.querySelectorAll('.extreme-btn').forEach(btn => {
        const btnType = Array.from(extremeBlockTypes).find(t => 
            btn.getAttribute('onclick').includes(`'${t}'`)
        );
        if (btnType) {
            btn.classList.add('selected');
        }
    });
    
    // 更新显示文本
    updateSelectedTypesDisplay();
    
    // 隐藏警告提示
    const warning = document.getElementById('extremeWarning');
    if (warning) {
        warning.style.display = 'none';
    }
}

/**
 * 更新已选择方块类型的显示
 */
function updateSelectedTypesDisplay() {
    const display = document.getElementById('selectedTypesDisplay');
    if (!display) return;
    
    if (extremeBlockTypes.size === 0) {
        display.textContent = '已选择：无';
    } else {
        const typeNames = {
            'I': '竖条',
            'O': '方块',
            'T': 'T 形',
            'L': 'L 形',
            'J': 'J 形',
            'S': 'S 形',
            'Z': 'Z 形'
        };
        const selectedNames = Array.from(extremeBlockTypes).map(t => typeNames[t]);
        display.textContent = '已选择：' + selectedNames.join(' + ');
    }
}

/**
 * 获取爆爽模式的方块类型列表
 * @returns {string[]} 方块类型数组 ['I', 'O', 'T', 'L', 'J', 'S', 'Z']
 */
function getExtremeBlockTypes() {
    return Array.from(extremeBlockTypes);
}

/**
 * 开挂模式开始游戏（带验证）
 */
function startGameWithExtreme() {
    // 检查是否选择了方块类型
    if (currentDifficulty === 'extreme' && extremeBlockTypes.size === 0) {
        // 显示警告提示
        const warning = document.getElementById('extremeWarning');
        if (warning) {
            warning.style.display = 'block';
        }
        return; // 不进入游戏
    }
    
    // 开始游戏
    window.startGame();
}

// 导出函数供全局访问
window.toggleExtremeType = toggleExtremeType;
window.getExtremeBlockTypes = getExtremeBlockTypes;
window.startGameWithExtreme = startGameWithExtreme;
window.showHistoryScreen = showHistoryScreen;
window.closeHistoryScreen = closeHistoryScreen;
window.showHistory = showHistory;

console.log('ui.js 已加载，开挂模式 API 已导出');
