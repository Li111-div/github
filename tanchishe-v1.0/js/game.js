/**
 * 360°贪吃蛇大作战 - 游戏主文件
 */

// ===== 游戏配置 =====
const CONFIG = {
    // 蛇相关配置
    SNAKE: {
        INITIAL_LENGTH: 10,
        SEGMENT_SIZE: 12,
        MIN_SPEED: 1,
        MAX_SPEED: 8,
        TURN_SPEED: 0.024,
        HEAD_RADIUS: 8
    },

    // AI配置
    AI: {
        COUNT: 9,
        THINK_INTERVAL: 500,
        AVOID_DISTANCE: 50,
        HUNT_FOOD_RADIUS: 200
    },

    // 食物配置
    FOOD: {
        COUNT: 30,
        RADIUS: 6,
        GROWTH: 3,
        SPAWN_INTERVAL: 2000
    },

    // 道具配置
    ITEM: {
        COUNT: 5,
        RADIUS: 12,
        SPAWN_INTERVAL: 5000,
        DURATION: 5000
    },

    // 画布配置
    CANVAS: {
        MIN_WIDTH: 800,
        MIN_HEIGHT: 600
    }
};

// ===== 游戏状态 =====
const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// ===== 游戏模式 =====
const GameMode = {
    CLASSIC: 'classic',
    FAST: 'fast',
    ITEM: 'item'
};

// ===== 背景定义 =====
const BACKGROUNDS = [
    { id: 'star', name: '星空', colors: ['#0f0c29', '#302b63', '#24243e'] },
    { id: 'pixel_grass', name: '像素草地', colors: ['#1a472a', '#2d5a3f', '#3d6b52'] },
    { id: 'cyberpunk', name: '赛博朋克', colors: ['#0d0221', '#261447', '#541388'] },
    { id: 'ocean', name: '深海', colors: ['#0a192f', '#112d4e', '#205295'] },
    { id: 'sunset', name: '日落', colors: ['#2d1b4e', '#6b2c5b', '#d6568f'] },
    { id: 'forest', name: '森林', colors: ['#1a3318', '#2a4d26', '#3d6b35'] }
];

// ===== 皮肤定义 =====
const SKINS = [
    { id: 'pixel', name: '像素风', colors: ['#2ECC71', '#27AE60', '#1E8449'] },
    { id: 'cartoon', name: '卡通', colors: ['#FF6B6B', '#EE5A5A', '#D94040'] },
    { id: 'tech', name: '科技感', colors: ['#3498DB', '#2980B9', '#1A5276'] },
    { id: 'gradient', name: '渐变彩', colors: ['#E91E63', '#9C27B0', '#673AB7'] },
    { id: 'golden', name: '黄金', colors: ['#F1C40F', '#F39C12', '#D68910'] },
    { id: 'neon', name: '霓虹', colors: ['#00FFC6', '#00D4AA', '#00A080'] },
    { id: 'fire', name: '火焰', colors: ['#FF4500', '#DC143C', '#B22222'] },
    { id: 'ice', name: '冰霜', colors: ['#87CEEB', '#5DADE2', '#3498DB'] },
    { id: 'purple', name: '紫罗兰', colors: ['#8E44AD', '#7D3C98', '#6C3483'] },
    { id: 'rainbow', name: '彩虹', colors: ['#FF6B6B', '#FFE66D', '#4ECDC4'] },
    { id: 'dark', name: '暗夜', colors: ['#34495E', '#2C3E50', '#1A252F'] },
    { id: 'candy', name: '糖果', colors: ['#FF69B4', '#FF1493', '#DB7093'] },
    { id: 'nature', name: '自然', colors: ['#228B22', '#006400', '#004d00'] },
    { id: 'galaxy', name: '银河', colors: ['#4B0082', '#3A006F', '#2A0050'] },
    { id: 'crystal', name: '水晶', colors: ['#E0F7FA', '#B2EBF2', '#80DEEA'] }
];

// ===== 音效定义 =====
const SOUNDS = {
    bgm: ['bgm1', 'bgm2', 'bgm3'],
    sfx: {
        turn: 'turn',
        eat: 'eat',
        collision: 'collision',
        win: 'win',
        lose: 'lose'
    }
};

// ===== 游戏类 =====
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.state = GameState.MENU;
        this.mode = GameMode.CLASSIC;
        this.timeLimit = 120;
        this.elapsedTime = 0;

        // 玩家设置
        this.settings = {
            skin: 0,
            background: 0,
            bgmVolume: 50,
            sfxVolume: 70,
            bgmEnabled: true,
            speed: 2
        };

        // 游戏对象
        this.playerSnake = null;
        this.aiSnakes = [];
        this.foods = [];
        this.items = [];

        // 游戏数据
        this.lastTime = 0;
        this.foodSpawnTimer = 0;
        this.itemSpawnTimer = 0;
        this.isPaused = false;

        // 虚拟摇杆
        this.joystick = {
            active: false,
            angle: 0,
            power: 0,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };

        // 背景音乐
        this.bgm = null;
        this.bgmIndex = 0;

        // 初始化
        this.init();
    }

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.initUI();
        this.initJoystick();
        this.initAudio();
        this.loadSettings();

        // 开始游戏循环
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    resizeCanvas() {
        const container = document.getElementById('game-page');
        const rect = container.getBoundingClientRect();
        this.canvas.width = Math.max(rect.width, CONFIG.CANVAS.MIN_WIDTH);
        this.canvas.height = Math.max(rect.height, CONFIG.CANVAS.MIN_HEIGHT);

        // 更新边界
        this.bounds = {
            x: CONFIG.SNAKE.SEGMENT_SIZE,
            y: CONFIG.SNAKE.SEGMENT_SIZE,
            width: this.canvas.width - CONFIG.SNAKE.SEGMENT_SIZE * 2,
            height: this.canvas.height - CONFIG.SNAKE.SEGMENT_SIZE * 2
        };
    }

    initUI() {
        // 页面导航
        document.querySelectorAll('.back-to-start').forEach(btn => {
            btn.addEventListener('click', () => this.showPage('start-page'));
        });

        // 开始按钮
        document.getElementById('start-btn').addEventListener('click', () => {
            this.showPage('mode-page');
        });

        // 设置按钮
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showPage('settings-page');
            this.renderSettings();
        });

        // 模式选择
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.mode = card.dataset.mode;
            });
        });
        document.querySelector('.mode-card').classList.add('selected');

        // 模式确认
        document.getElementById('mode-confirm-btn').addEventListener('click', () => {
            this.timeLimit = parseInt(document.getElementById('game-time').value);
            this.startGame();
        });

        // 暂停按钮
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());

        // 暂停菜单
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitGame());

        // 结算页按钮
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startGame();
        });

        // 音效设置
        document.getElementById('bgm-volume').addEventListener('input', (e) => {
            this.settings.bgmVolume = parseInt(e.target.value);
            document.getElementById('bgm-value').textContent = e.target.value + '%';
            this.updateVolume();
        });

        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            this.settings.sfxVolume = parseInt(e.target.value);
            document.getElementById('sfx-value').textContent = e.target.value + '%';
        });

        document.getElementById('bgm-mute').addEventListener('change', (e) => {
            this.settings.bgmEnabled = e.target.checked;
            this.updateVolume();
        });
    }

    renderSettings() {
        // 渲染皮肤
        const skinGrid = document.getElementById('skin-grid');
        skinGrid.innerHTML = '';
        SKINS.forEach((skin, index) => {
            const item = document.createElement('div');
            item.className = 'skin-item' + (index === this.settings.skin ? ' selected' : '');
            item.style.background = `linear-gradient(135deg, ${skin.colors.join(', ')})`;
            item.textContent = skin.name;
            item.addEventListener('click', () => {
                document.querySelectorAll('.skin-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                this.settings.skin = index;
                this.saveSettings();
            });
            skinGrid.appendChild(item);
        });

        // 渲染背景
        const bgGrid = document.getElementById('bg-grid');
        bgGrid.innerHTML = '';
        BACKGROUNDS.forEach((bg, index) => {
            const item = document.createElement('div');
            item.className = 'bg-item' + (index === this.settings.background ? ' selected' : '');
            item.style.background = `linear-gradient(135deg, ${bg.colors.join(', ')})`;
            item.title = bg.name;
            item.addEventListener('click', () => {
                document.querySelectorAll('.bg-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                this.settings.background = index;
                this.saveSettings();
            });
            bgGrid.appendChild(item);
        });

        // 渲染速度
        const speedBtns = document.getElementById('speed-buttons');
        speedBtns.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('selected', parseInt(btn.dataset.speed) === this.settings.speed);
            btn.addEventListener('click', () => {
                speedBtns.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.settings.speed = parseInt(btn.dataset.speed);
                this.saveSettings();
            });
        });
    }

    initJoystick() {
        const container = document.getElementById('joystick-container');
        const base = document.getElementById('joystick-base');
        const stick = document.getElementById('joystick-stick');

        const getJoystickCenter = () => {
            const rect = base.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        };

        const updateStick = (clientX, clientY) => {
            const center = getJoystickCenter();
            let dx = clientX - center.x;
            let dy = clientY - center.y;

            const maxRadius = base.offsetWidth / 2 - stick.offsetWidth / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > maxRadius) {
                dx = (dx / distance) * maxRadius;
                dy = (dy / distance) * maxRadius;
            }

            stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

            this.joystick.currentX = center.x + dx;
            this.joystick.currentY = center.y + dy;
            this.joystick.power = Math.min(distance / maxRadius, 1);
            this.joystick.angle = Math.atan2(dy, dx);
        };

        const resetStick = () => {
            stick.style.transform = 'translate(-50%, -50%)';
            stick.classList.remove('active');
            this.joystick.active = false;
            this.joystick.power = 0;
        };

        // 触摸事件
        base.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.joystick.active = true;
            stick.classList.add('active');
            const touch = e.touches[0];
            updateStick(touch.clientX, touch.clientY);
        });

        base.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.joystick.active) {
                const touch = e.touches[0];
                updateStick(touch.clientX, touch.clientY);
            }
        });

        base.addEventListener('touchend', resetStick);
        base.addEventListener('touchcancel', resetStick);

        // 鼠标事件
        base.addEventListener('mousedown', (e) => {
            this.joystick.active = true;
            stick.classList.add('active');
            updateStick(e.clientX, e.clientY);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.joystick.active) {
                updateStick(e.clientX, e.clientY);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.joystick.active) {
                resetStick();
            }
        });
    }

    initAudio() {
        // 创建音频上下文
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // 生成简单的音效
        this.generateSounds();
    }

    generateSounds() {
        // 生成简单的beep音效作为占位符
        this.soundEffects = {};

        // 创建振荡器生成音效
        const createTone = (freq, duration, type = 'sine') => {
            return () => {
                if (!this.settings.bgmEnabled && type === 'bgm') return;

                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

                gain.gain.setValueAtTime(this.settings.sfxVolume / 100 * 0.3, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start();
                osc.stop(this.audioCtx.currentTime + duration);
            };
        };

        // 设置音效
        this.soundEffects.turn = createTone(440, 0.1);
        this.soundEffects.eat = createTone(880, 0.15);
        this.soundEffects.collision = createTone(220, 0.3, 'square');
        this.soundEffects.win = createTone(523, 0.2);
        this.soundEffects.lose = createTone(262, 0.4);
    }

    playSound(name) {
        if (this.soundEffects[name]) {
            this.soundEffects[name]();
        }
    }

    updateVolume() {
        if (this.bgm && this.settings.bgmEnabled) {
            this.bgm.volume = this.settings.bgmVolume / 100;
        }
    }

    loadSettings() {
        const saved = localStorage.getItem('snakeGameSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            } catch (e) {
                console.warn('Failed to load settings');
            }
        }
    }

    saveSettings() {
        localStorage.setItem('snakeGameSettings', JSON.stringify(this.settings));
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    }

    // ===== 游戏逻辑 =====
    startGame() {
        this.resizeCanvas();
        this.state = GameState.PLAYING;
        this.elapsedTime = 0;
        this.isPaused = false;

        // 创建玩家蛇
        this.playerSnake = new Snake(
            this.canvas.width / 2,
            this.canvas.height / 2,
            0,
            CONFIG.SNAKE.INITIAL_LENGTH,
            this.settings.skin,
            true
        );

        // 创建AI蛇
        this.aiSnakes = [];
        for (let i = 0; i < CONFIG.AI.COUNT; i++) {
            const angle = (Math.PI * 2 * i) / CONFIG.AI.COUNT;
            const dist = 150 + Math.random() * 100;
            const x = this.canvas.width / 2 + Math.cos(angle) * dist;
            const y = this.canvas.height / 2 + Math.sin(angle) * dist;
            const skinIndex = (this.settings.skin + i + 1) % SKINS.length;

            const ai = new Snake(x, y, angle, CONFIG.SNAKE.INITIAL_LENGTH + Math.floor(Math.random() * 5), skinIndex, false);
            ai.targetAngle = angle;
            this.aiSnakes.push(ai);
        }

        // 创建食物
        this.foods = [];
        for (let i = 0; i < CONFIG.FOOD.COUNT; i++) {
            this.spawnFood();
        }

        // 清空道具
        this.items = [];
        this.foodSpawnTimer = 0;
        this.itemSpawnTimer = 0;

        // 显示游戏页面
        this.showPage('game-page');
        this.playSound('turn');
    }

    spawnFood() {
        const margin = 50;
        const food = {
            x: margin + Math.random() * (this.canvas.width - margin * 2),
            y: margin + Math.random() * (this.canvas.height - margin * 2),
            radius: CONFIG.FOOD.RADIUS,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            pulse: Math.random() * Math.PI * 2
        };
        this.foods.push(food);
    }

    spawnItem() {
        const margin = 50;
        const itemTypes = ['speed_up', 'speed_down', 'shrink', 'invincible', 'grow'];
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];

        const item = {
            x: margin + Math.random() * (this.canvas.width - margin * 2),
            y: margin + Math.random() * (this.canvas.height - margin * 2),
            radius: CONFIG.ITEM.RADIUS,
            type: type,
            pulse: 0
        };
        this.items.push(item);
    }

    pauseGame() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            document.getElementById('pause-menu').classList.remove('hidden');
        }
    }

    resumeGame() {
        if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            document.getElementById('pause-menu').classList.add('hidden');
            this.lastTime = performance.now();
        }
    }

    quitGame() {
        this.state = GameState.MENU;
        document.getElementById('pause-menu').classList.add('hidden');
        this.showPage('start-page');
    }

    gameOver() {
        this.state = GameState.GAME_OVER;

        // 计算排名
        const allSnakes = [this.playerSnake, ...this.aiSnakes];
        allSnakes.sort((a, b) => b.length - a.length);
        const rank = allSnakes.indexOf(this.playerSnake) + 1;

        // 显示结算
        document.getElementById('final-rank').textContent = '#' + rank;
        document.getElementById('final-rank').className = 'rank-' + rank;
        document.getElementById('final-length').textContent = this.playerSnake.length;
        document.getElementById('final-time').textContent = Math.floor(this.elapsedTime) + '秒';

        const messages = ['恭喜获得第一名！', '太棒了！获得第二名', '不错！获得第三名', '继续努力！'];
        document.getElementById('result-message').textContent = messages[Math.min(rank - 1, 3)];

        this.playSound(rank === 1 ? 'win' : 'lose');

        this.showPage('result-page');
    }

    // ===== 游戏循环 =====
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.state === GameState.PLAYING && !this.isPaused) {
            this.update(deltaTime);
            this.render();
        } else if (this.state === GameState.PLAYING) {
            // 保持渲染但暂停更新
            this.render();
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        // 更新计时器
        this.elapsedTime += deltaTime / 1000;
        const remainingTime = Math.max(0, this.timeLimit - Math.floor(this.elapsedTime));
        document.getElementById('game-timer').textContent = remainingTime;

        if (remainingTime <= 0) {
            this.gameOver();
            return;
        }

        // 更新玩家
        this.updatePlayer(deltaTime);

        // 更新AI
        this.aiSnakes.forEach(ai => this.updateAI(ai, deltaTime));

        // 碰撞检测
        this.checkCollisions();

        // 生成食物
        this.foodSpawnTimer += deltaTime;
        if (this.foodSpawnTimer >= CONFIG.FOOD.SPAWN_INTERVAL && this.foods.length < CONFIG.FOOD.COUNT) {
            this.spawnFood();
            this.foodSpawnTimer = 0;
        }

        // 生成道具（仅道具模式）
        if (this.mode === GameMode.ITEM) {
            this.itemSpawnTimer += deltaTime;
            if (this.itemSpawnTimer >= CONFIG.ITEM.SPAWN_INTERVAL && this.items.length < CONFIG.ITEM.COUNT) {
                this.spawnItem();
                this.itemSpawnTimer = 0;
            }
        }

        // 更新UI
        this.updateHUD();
    }

    updatePlayer(deltaTime) {
        // 根据摇杆更新方向
        if (this.joystick.active && this.joystick.power > 0.1) {
            const targetAngle = this.joystick.angle;
            let angleDiff = targetAngle - this.playerSnake.angle;

            // 处理角度差
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            // 平滑转向
            const turnSpeed = CONFIG.SNAKE.TURN_SPEED * this.settings.speed;
            this.playerSnake.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);

            // 保持角度在-PI到PI之间
            while (this.playerSnake.angle > Math.PI) this.playerSnake.angle -= Math.PI * 2;
            while (this.playerSnake.angle < -Math.PI) this.playerSnake.angle += Math.PI * 2;
        }

        // 计算速度
        let speed = (CONFIG.SNAKE.MIN_SPEED + (CONFIG.SNAKE.MAX_SPEED - CONFIG.SNAKE.MIN_SPEED) * 0.4) * 0.2;
        speed *= this.settings.speed;

        // 极速模式增加基础速度
        if (this.mode === GameMode.FAST) {
            speed *= 1.5;
        }

        // 检查加速道具
        if (this.playerSnake.speedBoost > 0) {
            speed *= 1.5;
            this.playerSnake.speedBoost -= deltaTime;
        }

        // 移动蛇
        this.playerSnake.move(speed, this.bounds);
    }

    updateAI(ai, deltaTime) {
        // AI决策
        if (!ai.thinkTimer || ai.thinkTimer <= 0) {
            this.aiThink(ai);
            ai.thinkTimer = CONFIG.AI.THINK_INTERVAL;
        }
        ai.thinkTimer -= deltaTime;

        // 平滑转向
        let angleDiff = ai.targetAngle - ai.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const turnSpeed = CONFIG.SNAKE.TURN_SPEED * (0.7 + Math.random() * 0.3);
        ai.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);

        while (ai.angle > Math.PI) ai.angle -= Math.PI * 2;
        while (ai.angle < -Math.PI) ai.angle += Math.PI * 2;

        // 速度
        let speed = (CONFIG.SNAKE.MIN_SPEED + (CONFIG.SNAKE.MAX_SPEED - CONFIG.SNAKE.MIN_SPEED) * 0.35) * 0.2;
        if (this.mode === GameMode.FAST) speed *= 1.5;

        // 检查加速道具
        if (ai.speedBoost > 0) {
            speed *= 1.5;
            ai.speedBoost -= deltaTime;
        }

        ai.move(speed, this.bounds);
    }

    aiThink(ai) {
        // 寻找最近的食物
        let closestFood = null;
        let closestDist = Infinity;

        this.foods.forEach(food => {
            const dx = food.x - ai.x;
            const dy = food.y - ai.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist && dist < CONFIG.AI.HUNT_FOOD_RADIUS) {
                closestDist = dist;
                closestFood = food;
            }
        });

        // 寻找最近的食物作为目标
        if (closestFood) {
            ai.targetAngle = Math.atan2(closestFood.y - ai.y, closestFood.x - ai.x);
        } else {
            // 随机方向
            ai.targetAngle += (Math.random() - 0.5) * Math.PI;
        }

        // 避免碰撞
        const allSnakes = [this.playerSnake, ...this.aiSnakes].filter(s => s !== ai);

        allSnakes.forEach(other => {
            // 检查头部
            const dx = other.x - ai.x;
            const dy = other.y - ai.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.AI.AVOID_DISTANCE) {
                // 转向相反方向
                const avoidAngle = Math.atan2(-dy, -dx);
                ai.targetAngle = avoidAngle;
            }
        });

        // 边界检测 - 靠近边界时转向
        const margin = 80;
        if (ai.x < margin) ai.targetAngle = 0;
        if (ai.x > this.canvas.width - margin) ai.targetAngle = Math.PI;
        if (ai.y < margin) ai.targetAngle = Math.PI / 2;
        if (ai.y > this.canvas.height - margin) ai.targetAngle = -Math.PI / 2;
    }

    checkCollisions() {
        // 玩家吃食物
        this.foods = this.foods.filter(food => {
            const dx = food.x - this.playerSnake.x;
            const dy = food.y - this.playerSnake.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.SNAKE.HEAD_RADIUS + food.radius) {
                this.playerSnake.grow(CONFIG.FOOD.GROWTH);
                this.playSound('eat');
                return false;
            }
            return true;
        });

        // AI吃食物
        this.aiSnakes.forEach(ai => {
            this.foods = this.foods.filter(food => {
                const dx = food.x - ai.x;
                const dy = food.y - ai.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.SNAKE.HEAD_RADIUS + food.radius) {
                    ai.grow(CONFIG.FOOD.GROWTH);
                    return false;
                }
                return true;
            });
        });

        // 玩家吃道具
        if (this.mode === GameMode.ITEM) {
            this.items = this.items.filter(item => {
                const dx = item.x - this.playerSnake.x;
                const dy = item.y - this.playerSnake.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.SNAKE.HEAD_RADIUS + item.radius) {
                    this.applyItem(this.playerSnake, item.type);
                    this.playSound('eat');
                    return false;
                }
                return true;
            });
        }

        // 玩家撞墙
        if (this.playerSnake.x < 0 || this.playerSnake.x > this.canvas.width ||
            this.playerSnake.y < 0 || this.playerSnake.y > this.canvas.height) {
            this.gameOver();
            return;
        }

        // 玩家撞蛇
        const allSnakes = [...this.aiSnakes];
        allSnakes.forEach(snake => {
            // 检查头部碰撞
            for (let i = 0; i < snake.segments.length; i++) {
                const seg = snake.segments[i];
                const dx = seg.x - this.playerSnake.x;
                const dy = seg.y - this.playerSnake.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.SNAKE.SEGMENT_SIZE) {
                    if (this.playerSnake.invincible) {
                        return; // 无敌状态
                    }
                    this.playSound('collision');
                    this.gameOver();
                    return;
                }
            }
        });

        // AI撞墙 - 重置位置
        this.aiSnakes.forEach(ai => {
            if (ai.x < 0 || ai.x > this.canvas.width || ai.y < 0 || ai.y > this.canvas.height) {
                ai.x = Math.max(50, Math.min(this.canvas.width - 50, ai.x));
                ai.y = Math.max(50, Math.min(this.canvas.height - 50, ai.y));
                ai.targetAngle = Math.random() * Math.PI * 2;
            }
        });

        // AI撞蛇 - 重新规划
        this.aiSnakes.forEach(ai => {
            const otherSnakes = [this.playerSnake, ...this.aiSnakes].filter(s => s !== ai);
            otherSnakes.forEach(other => {
                for (let i = 0; i < other.segments.length; i++) {
                    const seg = other.segments[i];
                    const dx = seg.x - ai.x;
                    const dy = seg.y - ai.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONFIG.SNAKE.SEGMENT_SIZE * 1.5) {
                        ai.targetAngle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * Math.PI;
                        break;
                    }
                }
            });
        });
    }

    applyItem(snake, type) {
        switch (type) {
            case 'speed_up':
                snake.speedBoost = CONFIG.ITEM.DURATION;
                break;
            case 'speed_down':
                // 对其他蛇减速（仅玩家有效）
                if (snake.isPlayer) {
                    this.aiSnakes.forEach(ai => {
                        ai.speedBoost = -CONFIG.ITEM.DURATION;
                    });
                }
                break;
            case 'shrink':
                // 缩短最长的AI蛇
                const longestAi = this.aiSnakes.reduce((a, b) => a.length > b.length ? a : b);
                if (longestAi) {
                    longestAi.shrink(10);
                }
                break;
            case 'invincible':
                snake.invincible = CONFIG.ITEM.DURATION;
                break;
            case 'grow':
                snake.grow(5);
                break;
        }
    }

    updateHUD() {
        document.getElementById('player-length').textContent = this.playerSnake.length;

        // 更新排名
        const allSnakes = [this.playerSnake, ...this.aiSnakes];
        allSnakes.sort((a, b) => b.length - a.length);
        const rank = allSnakes.indexOf(this.playerSnake) + 1;
        document.getElementById('player-rank').textContent = rank + '/' + allSnakes.length;
    }

    render() {
        const ctx = this.ctx;
        const bg = BACKGROUNDS[this.settings.background];

        // 绘制背景
        const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, bg.colors[0]);
        gradient.addColorStop(0.5, bg.colors[1]);
        gradient.addColorStop(1, bg.colors[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格（增加视觉层次）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        // 绘制边界
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);

        // 绘制食物
        this.foods.forEach(food => {
            food.pulse += 0.1;
            const pulseScale = 1 + Math.sin(food.pulse) * 0.2;

            ctx.beginPath();
            ctx.arc(food.x, food.y, food.radius * pulseScale, 0, Math.PI * 2);
            ctx.fillStyle = food.color;
            ctx.fill();

            // 发光效果
            ctx.shadowBlur = 10;
            ctx.shadowColor = food.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // 绘制道具
        if (this.mode === GameMode.ITEM) {
            this.items.forEach(item => {
                item.pulse += 0.15;
                const pulseScale = 1 + Math.sin(item.pulse) * 0.3;

                const colors = {
                    'speed_up': '#00FF00',
                    'speed_down': '#FF0000',
                    'shrink': '#FF00FF',
                    'invincible': '#FFD700',
                    'grow': '#00FFFF'
                };

                ctx.beginPath();
                ctx.arc(item.x, item.y, item.radius * pulseScale, 0, Math.PI * 2);
                ctx.fillStyle = colors[item.type] || '#FFFFFF';
                ctx.fill();

                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        }

        // 绘制蛇
        [...this.aiSnakes, this.playerSnake].forEach(snake => {
            this.drawSnake(snake);
        });
    }

    drawSnake(snake) {
        const ctx = this.ctx;
        const skin = SKINS[snake.skin];

        // 绘制身体
        for (let i = snake.segments.length - 1; i >= 0; i--) {
            const seg = snake.segments[i];
            const progress = i / snake.segments.length;
            const colorIndex = Math.floor(progress * (skin.colors.length - 1));

            ctx.beginPath();
            ctx.arc(seg.x, seg.y, CONFIG.SNAKE.SEGMENT_SIZE * (1 - progress * 0.2), 0, Math.PI * 2);
            ctx.fillStyle = skin.colors[colorIndex];
            ctx.fill();

            // 边框效果
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 绘制头部
        ctx.beginPath();
        ctx.arc(snake.x, snake.y, CONFIG.SNAKE.HEAD_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = skin.colors[0];
        ctx.fill();

        // 眼睛
        const eyeOffset = 4;
        const eyeAngle1 = snake.angle - 0.5;
        const eyeAngle2 = snake.angle + 0.5;

        ctx.beginPath();
        ctx.arc(
            snake.x + Math.cos(eyeAngle1) * eyeOffset,
            snake.y + Math.sin(eyeAngle1) * eyeOffset,
            2, 0, Math.PI * 2
        );
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
            snake.x + Math.cos(eyeAngle2) * eyeOffset,
            snake.y + Math.sin(eyeAngle2) * eyeOffset,
            2, 0, Math.PI * 2
        );
        ctx.fillStyle = 'white';
        ctx.fill();

        // 无敌效果
        if (snake.invincible > 0) {
            ctx.beginPath();
            ctx.arc(snake.x, snake.y, CONFIG.SNAKE.HEAD_RADIUS + 8, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // 玩家标记
        if (snake.isPlayer) {
            ctx.beginPath();
            ctx.arc(snake.x, snake.y, CONFIG.SNAKE.HEAD_RADIUS + 4, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 230, 109, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

// ===== 蛇类 =====
class Snake {
    constructor(x, y, angle, length, skin, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.length = length;
        this.skin = skin;
        this.isPlayer = isPlayer;
        this.segments = [];

        // 初始化身体段
        for (let i = 0; i < length; i++) {
            this.segments.push({
                x: x - Math.cos(angle) * i * CONFIG.SNAKE.SEGMENT_SIZE,
                y: y - Math.sin(angle) * i * CONFIG.SNAKE.SEGMENT_SIZE
            });
        }

        // 状态
        this.speedBoost = 0;
        this.invincible = 0;
    }

    move(speed, bounds) {
        // 计算新位置
        const newX = this.x + Math.cos(this.angle) * speed;
        const newY = this.y + Math.sin(this.angle) * speed;

        // 更新身体段
        if (this.segments.length > 0) {
            // 移动身体
            for (let i = this.segments.length - 1; i > 0; i--) {
                this.segments[i].x = this.segments[i - 1].x;
                this.segments[i].y = this.segments[i - 1].y;
            }
            // 第一个身体段跟随头部
            this.segments[0].x = this.x;
            this.segments[0].y = this.y;
        }

        // 更新头部位置
        this.x = newX;
        this.y = newY;

        // 边界检查
        this.x = Math.max(bounds.x, Math.min(bounds.x + bounds.width, this.x));
        this.y = Math.max(bounds.y, Math.min(bounds.y + bounds.height, this.y));

        // 更新状态
        if (this.speedBoost < 0) this.speedBoost += 16;
        if (this.invincible > 0) this.invincible -= 16;
    }

    grow(amount) {
        this.length += amount;

        // 添加新的身体段
        const lastSeg = this.segments[this.segments.length - 1] || { x: this.x, y: this.y };
        for (let i = 0; i < amount; i++) {
            this.segments.push({
                x: lastSeg.x,
                y: lastSeg.y
            });
        }
    }

    shrink(amount) {
        this.length = Math.max(5, this.length - amount);
        this.segments = this.segments.slice(0, this.length);
    }
}

// ===== 启动游戏 =====
window.addEventListener('load', () => {
    new Game();
});
