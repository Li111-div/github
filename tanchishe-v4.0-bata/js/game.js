/**
 * 360°贪吃蛇大作战 - 游戏主文件
 */

// ===== 游戏配置 =====
const CONFIG = {
    // 蛇相关配置
    SNAKE: {
        INITIAL_LENGTH: 80,  // 初始长度提升至 80 节
        SEGMENT_SIZE: 12,
        MIN_SPEED: 1,
        MAX_SPEED: 8,
        TURN_SPEED: 0.024,
        HEAD_RADIUS: 8
    },

    // 地图配置（500%扩大）
    MAP: {
        WIDTH: 4000,
        HEIGHT: 4000
    },

    // AI 配置
    AI: {
        COUNT: 9,
        THINK_INTERVAL: 300,  // AI 思考更频繁
        AVOID_DISTANCE: 80,   // 避障距离增加
        HUNT_FOOD_RADIUS: 350,
        INTERCEPT_RADIUS: 500, // 抢食预判距离
        RESPAWN_TIME: 5      // AI 复活时间（秒）
    },
        
    // 不同难度的 AI 数量
    AI_COUNTS: {
        easy: 5,    // 简单：5 条 AI
        normal: 9,  // 普通：9 条 AI
        hard: 15    // 困难：15 条 AI
    },

    // 食物配置
    FOOD: {
        COUNT: 450,  // 增加到 300%（原 150）
        RADIUS: 6,
        GROWTH: 3,
        SPAWN_INTERVAL: 800,  // 生成速度提升至 2 倍以上
        BIG_FOOD_RATIO: 0.1,  // 大豆豆比例
        BIG_FOOD_GROWTH: 8    // 大豆豆增加长度
    },
        
    // 特殊食物配置
    SPECIAL_FOOD: {
        ICE: {      // 寒冰豆豆
            COLOR: '#00BFFF',
            RADIUS: 8,
            FREEZE_DURATION: 3,  // 静止 3 秒
            CHANCE: 0.02  // 2% 概率
        },
        SPEED: {    // 速度豆豆
            COLOR: '#FF1493',
            RADIUS: 7,
            SPEED_BOOST: 1.5,  // 速度提升 50%
            DURATION: 5,  // 持续 5 秒
            CHANCE: 0.03  // 3% 概率
        },
        REVERSE: {  // 反向豆豆
            COLOR: '#FF4500',
            RADIUS: 8,
            REVERSE_DURATION: 3,  // 反向 3 秒
            CHANCE: 0.02  // 2% 概率
        },
        INVINCIBLE: {  // 无敌豆豆
            COLOR: '#FFD700',
            RADIUS: 9,
            INVINCIBLE_DURATION: 5,  // 无敌 5 秒
            CHANCE: 0.015  // 1.5% 概率
        }
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
    },

    // 视角配置
    CAMERA: {
        SMOOTH_SPEED: 0.08,  // 视角跟随平滑度
        OFFSET: 0.1  // 玩家蛇在视野中心的偏移比例（±10%）
    },

    // 粒子配置
    PARTICLE: {
        COUNT: 20,
        LIFE: 1000,
        SPEED: 3,
        MAX_COUNT: 200  // 最大粒子数量，避免过多导致卡顿
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
    ITEM: 'item',
    ENDLESS: 'endless'  // 新增无尽模式
};

// ===== 难度等级 =====
const Difficulty = {
    EASY: 'easy',
    NORMAL: 'normal',
    HARD: 'hard'
};

// ===== 背景定义 =====
const BACKGROUNDS = [
    // 经典系列
    { id: 'star', name: '星空', colors: ['#0f0c29', '#302b63', '#24243e'] },
    { id: 'pixel_grass', name: '像素草地', colors: ['#1a472a', '#2d5a3f', '#3d6b52'] },
    { id: 'cyberpunk', name: '赛博朋克', colors: ['#0d0221', '#261447', '#541388'] },
    { id: 'ocean', name: '深海', colors: ['#0a192f', '#112d4e', '#205295'] },
    { id: 'sunset', name: '日落', colors: ['#2d1b4e', '#6b2c5b', '#d6568f'] },
    { id: 'forest', name: '森林', colors: ['#1a3318', '#2a4d26', '#3d6b35'] },
    
    // 自然系列
    { id: 'aurora', name: '极光', colors: ['#003333', '#006666', '#009999'] },
    { id: 'desert', name: '沙漠', colors: ['#EDC9AF', '#D2B48C', '#C4A574'] },
    { id: 'cherry_blossom', name: '樱花', colors: ['#FFB7C5', '#FF69B4', '#FF1493'] },
    { id: 'midnight', name: '午夜', colors: ['#191970', '#000080', '#00008B'] },
    { id: 'volcano', name: '火山', colors: ['#4B0000', '#8B0000', '#B22222'] },
    { id: 'ice_age', name: '冰川', colors: ['#E0FFFF', '#AFEEEE', '#5F9EA0'] },
    
    // 梦幻系列
    { id: 'rainbow', name: '彩虹', colors: ['#FF0000', '#FFFF00', '#00FF00'] },
    { id: 'galaxy', name: '银河', colors: ['#4B0082', '#8B00FF', '#DA70D6'] },
    { id: 'cotton_candy', name: '棉花糖', colors: ['#FFB6C1', '#DDA0DD', '#87CEEB'] },
    { id: 'fire_sky', name: '火烧云', colors: ['#FF4500', '#FF6347', '#FF7F50'] },
    { id: 'mystic', name: '神秘', colors: ['#2F4F4F', '#708090', '#778899'] },
    { id: 'neon_night', name: '霓虹之夜', colors: ['#191970', '#4B0082', '#800080'] }
];

// ===== 皮肤定义 =====
const SKINS = [
    // 基础风格
    { id: 'pixel', name: '像素风', colors: ['#2ECC71', '#27AE60', '#1E8449'], effect: 'none' },
    { id: 'cartoon', name: '卡通', colors: ['#FF6B6B', '#EE5A5A', '#D94040'], effect: 'bounce' },
    { id: 'tech', name: '科技感', colors: ['#3498DB', '#2980B9', '#1A5276'], effect: 'glow' },
    { id: 'gradient', name: '渐变彩', colors: ['#E91E63', '#9C27B0', '#673AB7'], effect: 'gradient' },

    // 赛博朋克风格
    { id: 'neon', name: '霓虹', colors: ['#00FFC6', '#00D4AA', '#00A080'], effect: 'neon' },
    { id: 'cyber_pink', name: '赛博粉', colors: ['#FF1493', '#FF69B4', '#FFB6C1'], effect: 'neon' },
    { id: 'cyber_blue', name: '赛博蓝', colors: ['#00BFFF', '#1E90FF', '#4169E1'], effect: 'neon' },
    { id: 'matrix', name: '矩阵', colors: ['#00FF00', '#32CD32', '#006400'], effect: 'matrix' },

    // 国风系列
    { id: 'dragon', name: '中国龙', colors: ['#DC143C', '#FF0000', '#8B0000'], effect: 'fire' },
    { id: 'phoenix', name: '凤凰', colors: ['#FFD700', '#FFA500', '#FF4500'], effect: 'fire' },
    { id: 'jade', name: '翡翠', colors: ['#50C878', '#3CB371', '#228B22'], effect: 'shimmer' },
    { id: 'ink', name: '水墨', colors: ['#2C2C2C', '#1A1A1A', '#000000'], effect: 'ink' },
    { id: 'cherry', name: '樱花', colors: ['#FFB7C5', '#FF69B4', '#FF1493'], effect: 'petal' },

    // 卡通萌系
    { id: 'kitty', name: '喵喵', colors: ['#FFC0CB', '#FF69B4', '#FF1493'], effect: 'bounce' },
    { id: 'puppy', name: '汪汪', colors: ['#DEB887', '#D2691E', '#8B4513'], effect: 'bounce' },
    { id: 'bunny', name: '兔兔', colors: ['#FFFFFF', '#F5F5F5', '#E0E0E0'], effect: 'bounce' },
    { id: 'panda', name: '熊猫', colors: ['#000000', '#333333', '#666666'], effect: 'panda' },
    { id: 'unicorn', name: '独角兽', colors: ['#E6E6FA', '#DDA0DD', '#BA55D3'], effect: 'sparkle' },

    // 元素系列
    { id: 'fire', name: '火焰', colors: ['#FF4500', '#DC143C', '#B22222'], effect: 'fire' },
    { id: 'ice', name: '冰霜', colors: ['#87CEEB', '#5DADE2', '#3498DB'], effect: 'ice' },
    { id: 'thunder', name: '闪电', colors: ['#FFD700', '#FFFF00', '#FFA500'], effect: 'thunder' },
    { id: 'earth', name: '大地', colors: ['#8B4513', '#A0522D', '#CD853F'], effect: 'shake' },
    { id: 'wind', name: '风', colors: ['#E0FFFF', '#AFEEEE', '#7FFFD4'], effect: 'wind' },

    // 光影特效
    { id: 'golden', name: '黄金', colors: ['#F1C40F', '#F39C12', '#D68910'], effect: 'gold' },
    { id: 'silver', name: '白银', colors: ['#C0C0C0', '#A9A9A9', '#808080'], effect: 'silver' },
    { id: 'rainbow', name: '彩虹', colors: ['#FF6B6B', '#FFE66D', '#4ECDC4'], effect: 'rainbow' },
    { id: 'purple', name: '紫罗兰', colors: ['#8E44AD', '#7D3C98', '#6C3483'], effect: 'glow' },
    { id: 'dark', name: '暗夜', colors: ['#34495E', '#2C3E50', '#1A252F'], effect: 'dark' },
    { id: 'galaxy', name: '银河', colors: ['#4B0082', '#3A006F', '#2A0050'], effect: 'stars' },
    { id: 'aurora', name: '极光', colors: ['#00FF7F', '#00CED1', '#9370DB'], effect: 'aurora' },

    // 特殊效果
    { id: 'crystal', name: '水晶', colors: ['#E0F7FA', '#B2EBF2', '#80DEEA'], effect: 'crystal' },
    { id: 'candy', name: '糖果', colors: ['#FF69B4', '#FF1493', '#DB7093'], effect: 'sparkle' },
    { id: 'nature', name: '自然', colors: ['#228B22', '#006400', '#004d00'], effect: 'leaves' },
    { id: 'lava', name: '熔岩', colors: ['#FF4500', '#FF6347', '#FF0000'], effect: 'lava' }
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
        this.difficulty = Difficulty.NORMAL;  // 默认难度

        // 玩家设置
        this.settings = {
            skin: 0,
            background: 0,
            bgmVolume: 50,
            sfxVolume: 70,
            bgmEnabled: true,
            speed: 2,
            // 新增自定义设置
            joystickColor: '#4ECDC4',
            joystickSize: 120,
            joystickOpacity: 0.8,
            homeBackground: 0,
            // 功能豆豆开关
            enableReverse: true,
            enableInvincible: true,
            enableIce: true,
            enableSpeed: true
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
        this.lastUpdateTime = -1;  // 用于减少 DOM 更新频率
        this.lastRankingKey = '';  // 用于减少排名更新频率

        // 摄像机/视角
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0
        };

        // 粒子系统
        this.particles = [];

        // 历史记录
        this.history = this.loadHistory();

        // 复活次数（根据难度决定）
        this.reviveCount = 0;
        // 简单模式 3 次，中等 2 次，困难 1 次
        if (this.difficulty === Difficulty.EASY) {
            this.maxRevives = 3;
        } else if (this.difficulty === Difficulty.NORMAL) {
            this.maxRevives = 2;
        } else if (this.difficulty === Difficulty.HARD) {
            this.maxRevives = 1;
        }

        // 虚拟摇杆
        this.joystick = {
            active: false,
            angle: 0,
            power: 0,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            visible: false,  // 是否显示
            baseX: 0,  // 摇杆底座位置
            baseY: 0
        };
        
        // 小地图
        this.minimap = {
            canvas: null,
            ctx: null,
            scale: 0.1,  // 缩放比例
            cellSize: 3  // 单元格大小
        };
        
        // 加速状态
        this.isBoosting = false;

        // 背景音乐
        this.bgm = null;
        this.bgmIndex = 0;

        // 初始化
        this.init();
    }

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // 初始化小地图
        const minimapCanvas = document.getElementById('minimap-canvas');
        if (minimapCanvas) {
            this.minimap.canvas = minimapCanvas;
            this.minimap.ctx = minimapCanvas.getContext('2d');
            // 设置小地图尺寸（150x150）
            minimapCanvas.width = 150;
            minimapCanvas.height = 150;
            // 设置缩放比例：150 / 3000 = 0.05
            this.minimap.scale = minimapCanvas.width / CONFIG.MAP.WIDTH;
        }

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.initUI();
        this.initJoystick();
        this.loadSettings(); // 先加载设置
        this.initAudio();    // 再初始化音频（需要 settings）
        
        // 检查是否首次运行
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial) {
            console.log('🎓 欢迎！检测到首次运行，请点击"新手教程"了解游戏玩法');
        }

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
        
        // 切换战服按钮 - 跳转到设置界面
        document.getElementById('change-skin-btn').addEventListener('click', () => {
            this.showPage('settings-page');
            this.renderSettings();
        });
        
        // 查看全部按钮 - 打开历史记录弹窗
        document.getElementById('view-history-btn').addEventListener('click', () => {
            this.showHistoryModal();
        });
        
        // 关闭历史记录弹窗
        document.getElementById('close-history-modal').addEventListener('click', () => {
            this.closeHistoryModal();
        });
        
        // 点击弹窗外部关闭
        document.getElementById('history-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('history-modal')) {
                this.closeHistoryModal();
            }
        });
        
        // 新手教程按钮
        document.getElementById('tutorial-btn').addEventListener('click', () => {
            this.showTutorial();
        });
        
        // 游戏介绍按钮
        document.getElementById('about-btn').addEventListener('click', () => {
            this.showPage('about-page');
        });
        
        // 教程控制按钮
        document.getElementById('tutorial-prev').addEventListener('click', () => {
            this.prevTutorialStep();
        });
        
        document.getElementById('tutorial-next').addEventListener('click', () => {
            this.nextTutorialStep();
        });
        
        document.getElementById('tutorial-finish').addEventListener('click', () => {
            this.showPage('start-page');
        });

        // 模式选择
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.mode = card.dataset.mode;
                
                // 无尽模式隐藏时间选择
                const timeSelectContainer = document.getElementById('time-select-container');
                if (timeSelectContainer) {
                    if (this.mode === GameMode.ENDLESS) {
                        timeSelectContainer.style.display = 'none';
                    } else {
                        timeSelectContainer.style.display = 'flex';
                    }
                }
            });
        });
        document.querySelector('.mode-card').classList.add('selected');

        // 模式确认
        document.getElementById('mode-confirm-btn').addEventListener('click', () => {
            this.timeLimit = parseInt(document.getElementById('game-time').value);
            this.difficulty = document.getElementById('game-difficulty').value;
            console.log('选择的难度:', this.difficulty);
            this.startGame();
        });

        // 暂停按钮
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        
        // 加速按钮
        const boostBtn = document.getElementById('boost-btn');
        if (boostBtn) {
            // 触摸事件
            boostBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.isBoosting = true;
                boostBtn.classList.add('active');
            });
            
            boostBtn.addEventListener('touchend', () => {
                this.isBoosting = false;
                boostBtn.classList.remove('active');
            });
            
            // 鼠标事件
            boostBtn.addEventListener('mousedown', () => {
                this.isBoosting = true;
                boostBtn.classList.add('active');
            });
            
            boostBtn.addEventListener('mouseup', () => {
                this.isBoosting = false;
                boostBtn.classList.remove('active');
            });
            
            boostBtn.addEventListener('mouseleave', () => {
                this.isBoosting = false;
                boostBtn.classList.remove('active');
            });
        }

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

        // 功能豆豆设置
        document.getElementById('enable-reverse').addEventListener('change', (e) => {
            this.settings.enableReverse = e.target.checked;
        });

        document.getElementById('enable-invincible').addEventListener('change', (e) => {
            this.settings.enableInvincible = e.target.checked;
        });

        document.getElementById('enable-ice').addEventListener('change', (e) => {
            this.settings.enableIce = e.target.checked;
        });

        document.getElementById('enable-speed').addEventListener('change', (e) => {
            this.settings.enableSpeed = e.target.checked;
        });

        document.getElementById('bgm-mute').addEventListener('change', (e) => {
            this.settings.bgmEnabled = e.target.checked;
            this.updateVolume();
        });
        
        // 摇杆自定义设置
        document.getElementById('joystick-color').addEventListener('input', (e) => {
            this.settings.joystickColor = e.target.value;
            this.updateJoystickStyle();
            this.saveSettings();
        });
        
        document.getElementById('joystick-size').addEventListener('input', (e) => {
            this.settings.joystickSize = parseInt(e.target.value);
            document.getElementById('joystick-size-value').textContent = this.settings.joystickSize;
            this.updateJoystickStyle();
            this.saveSettings();
        });
        
        document.getElementById('joystick-opacity').addEventListener('input', (e) => {
            this.settings.joystickOpacity = parseInt(e.target.value) / 100;
            document.getElementById('joystick-opacity-value').textContent = e.target.value;
            this.updateJoystickStyle();
            this.saveSettings();
        });
        
        // 主页背景选择
        const homeBgGrid = document.getElementById('home-bg-grid');
        if (homeBgGrid) {
            BACKGROUNDS.forEach((bg, index) => {
                const item = document.createElement('div');
                item.className = 'bg-item' + (index === this.settings.homeBackground ? ' selected' : '');
                item.style.background = `linear-gradient(135deg, ${bg.colors.join(', ')})`;
                item.title = bg.name;
                item.addEventListener('click', () => {
                    document.querySelectorAll('.bg-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    this.settings.homeBackground = index;
                    this.saveSettings();
                    this.applyHomeBackground();
                    
                    // 同时更新设置页面的背景作为预览
                    const settingsPage = document.getElementById('settings-page');
                    if (settingsPage) {
                        settingsPage.style.background = `linear-gradient(135deg, ${bg.colors.join(', ')})`;
                    }
                });
                homeBgGrid.appendChild(item);
            });
        }

        // 清空历史记录（如果元素存在）
        const clearHistoryBtn = document.getElementById('clear-history');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('确定要清空所有历史记录吗？')) {
                    this.clearHistory();
                }
            });
        }

        // 初始化历史记录显示
        this.renderHistory();
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
                // 立即更新首页皮肤显示
                this.updateHomeSkinDisplay();
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

        // 更新摇杆样式
        this.updateJoystickStyle();

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
            // 鼠标松开时，隐藏摇杆并停止移动
            this.joystick.visible = false;
            container.style.opacity = '0';
            container.style.pointerEvents = 'none';
        };

        // 触摸事件（手机端）
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

        // PC 端：在窗口任意位置点击显示摇杆
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // 设置摇杆位置
            this.joystick.baseX = clickX;
            this.joystick.baseY = clickY;
            
            // 显示摇杆
            this.joystick.visible = true;
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
            container.style.left = (clickX - container.offsetWidth / 2) + 'px';
            container.style.top = (clickY - container.offsetHeight / 2) + 'px';
        });

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
    
    updateJoystickStyle() {
        const container = document.getElementById('joystick-container');
        const base = document.getElementById('joystick-base');
        const stick = document.getElementById('joystick-stick');
        
        if (container && base && stick) {
            // 应用自定义样式
            const size = this.settings.joystickSize || 120;
            const opacity = this.settings.joystickOpacity || 0.8;
            const color = this.settings.joystickColor || '#4ECDC4';
            
            container.style.width = size + 'px';
            container.style.height = size + 'px';
            base.style.background = `rgba(${hexToRgb(color)}, ${opacity * 0.3})`;
            base.style.border = `3px solid rgba(${hexToRgb(color)}, ${opacity * 0.6})`;
            base.style.boxShadow = `0 4px 15px rgba(${hexToRgb(color)}, ${opacity * 0.5})`;
            
            stick.style.background = `radial-gradient(circle at 30% 30%, ${color}, ${adjustColor(color, -20)})`;
            stick.style.boxShadow = `0 4px 15px rgba(${hexToRgb(color)}, ${opacity * 0.8})`;
        }
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
        
        // 应用主页背景
        this.applyHomeBackground();
        
        // 更新首页皮肤显示和排行榜
        setTimeout(() => {
            this.updateHomeSkinDisplay();
            this.updateHomeRanking();
        }, 100);
    }
    
    updateHomeSkinDisplay() {
        const display = document.getElementById('current-skin-display');
        const nameEl = document.getElementById('current-skin-name');
        const effectEl = document.getElementById('current-skin-effect');
        
        if (!display || !nameEl || !effectEl) return;
        
        const currentSkin = SKINS[this.settings.skin];
        if (!currentSkin) return;
        
        // 设置渐变色背景
        display.style.background = `linear-gradient(135deg, ${currentSkin.colors[0]}, ${currentSkin.colors[1]})`;
        
        // 渲染完整的蛇身体外观
        display.innerHTML = '';
        const snakeBody = document.createElement('div');
        snakeBody.className = 'snake-full-body';
        
        // 创建蛇的身体（10 节展示）
        const segmentCount = 10;
        const centerX = display.offsetWidth / 2;
        const centerY = display.offsetHeight / 2;
        const segmentSize = 25; // 每节大小
        const spacing = 18; // 节间距
        
        for (let i = 0; i < segmentCount; i++) {
            const segment = document.createElement('div');
            segment.className = 'snake-segment';
            
            // 计算位置（S 形排列）
            const x = centerX + Math.sin(i * 0.8) * spacing * 2;
            const y = centerY - i * spacing + 50;
            
            // 头部大一些
            const size = i === 0 ? segmentSize * 1.3 : segmentSize * (1 - i * 0.05);
            
            segment.style.width = `${size}px`;
            segment.style.height = `${size}px`;
            segment.style.background = `linear-gradient(135deg, ${currentSkin.colors[0]}, ${currentSkin.colors[1]})`;
            segment.style.left = `${x - size/2}px`;
            segment.style.top = `${y - size/2}px`;
            segment.style.boxShadow = `0 0 ${size/2}px ${currentSkin.colors[0]}`;
            
            // 头部添加眼睛
            if (i === 0) {
                const eyes = document.createElement('div');
                eyes.style.cssText = `
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                `;
                eyes.innerHTML = `
                    <div style="position: absolute; width: 6px; height: 6px; background: white; border-radius: 50%; top: 20%; left: 35%; box-shadow: 0 0 3px black;"></div>
                    <div style="position: absolute; width: 6px; height: 6px; background: white; border-radius: 50%; top: 20%; right: 35%; box-shadow: 0 0 3px black;"></div>
                `;
                segment.appendChild(eyes);
            }
            
            snakeBody.appendChild(segment);
        }
        
        display.appendChild(snakeBody);
        nameEl.textContent = currentSkin.name;
        effectEl.textContent = this.getSkinEffectName(currentSkin.effect);
    }
    
    updateHomeRanking() {
        const container = document.getElementById('home-ranking-list');
        if (!container) return;
        
        const history = this.loadHistory();
        if (history.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 20px;">暂无记录</div>';
            return;
        }
        
        // 取前 5 名
        const top5 = history.slice(0, 5);
        
        container.innerHTML = '';
        top5.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'home-ranking-item';
            
            const rankNum = index + 1;
            let rankIcon = rankNum;
            if (rankNum === 1) rankIcon = '🥇';
            else if (rankNum === 2) rankIcon = '🥈';
            else if (rankNum === 3) rankIcon = '🥉';
            
            item.innerHTML = `
                <span class="rank-badge">${rankIcon}</span>
                <span class="snake-info">
                    <span class="snake-length-home">${record.length}</span> 分
                    <span style="font-size: 11px; opacity: 0.7; margin-left: 5px;">${new Date(record.date).toLocaleDateString()}</span>
                </span>
            `;
            
            container.appendChild(item);
        });
    }
    
    getSkinEffectName(effect) {
        const effectNames = {
            'neon': '霓虹闪烁',
            'fire': '火焰特效',
            'glow': '发光效果',
            'gradient': '渐变色彩',
            'ice': '冰霜效果',
            'gold': '金色传说'
        };
        return effectNames[effect] || effect;
    }
    
    showHistoryModal() {
        const modal = document.getElementById('history-modal');
        const list = document.getElementById('history-full-list');
        if (!modal || !list) return;
        
        const history = this.loadHistory();
        
        if (history.length === 0) {
            list.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">暂无游戏记录</div>';
        } else {
            list.innerHTML = '';
            history.forEach((record, index) => {
                const item = document.createElement('div');
                item.className = 'history-record-item';
                
                const rankNum = index + 1;
                let rankIcon = rankNum;
                if (rankNum === 1) rankIcon = '🥇';
                else if (rankNum === 2) rankIcon = '🥈';
                else if (rankNum === 3) rankIcon = '🥉';
                
                item.innerHTML = `
                    <span class="rank-badge">${rankIcon}</span>
                    <span class="snake-info">
                        <span class="snake-length-history">${record.length}</span> 分
                        <span style="font-size: 12px; opacity: 0.7; margin-left: 8px;">${new Date(record.date).toLocaleString()}</span>
                    </span>
                `;
                list.appendChild(item);
            });
        }
        
        modal.classList.add('active');
    }
    
    closeHistoryModal() {
        const modal = document.getElementById('history-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    applyHomeBackground() {
        const startPage = document.getElementById('start-page');
        if (startPage && BACKGROUNDS[this.settings.homeBackground]) {
            const bg = BACKGROUNDS[this.settings.homeBackground];
            startPage.style.background = `linear-gradient(135deg, ${bg.colors.join(', ')})`;
        }
    }

    saveSettings() {
        localStorage.setItem('snakeGameSettings', JSON.stringify(this.settings));
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('snakeGameHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveHistory() {
        localStorage.setItem('snakeGameHistory', JSON.stringify(this.history));
    }

    addToHistory(length, time, mode) {
        const record = {
            length: length,  // 无尽模式下是存活时间
            time: Math.floor(time),
            mode: mode,
            date: new Date().toISOString()
        };
    
        this.history.push(record);
    
        // 排序并只保留 TOP5
        this.history.sort((a, b) => b.length - a.length);
        this.history = this.history.slice(0, 5);
    
        this.saveHistory();
        this.renderHistory();
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        const container = document.getElementById('history-list');
        if (!container) return;

        container.innerHTML = '';
        
        // 确保 history 已初始化
        if (!this.history) {
            this.history = this.loadHistory();
        }

        if (this.history.length === 0) {
            container.innerHTML = '<div class="history-empty">暂无记录</div>';
            return;
        }

        this.history.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';

            const modeNames = {
                'classic': '经典模式',
                'fast': '极速模式',
                'item': '道具模式'
            };

            item.innerHTML = `
                <span class="history-rank">#${index + 1}</span>
                <span class="history-length">${record.length}</span>
                <span class="history-mode">${modeNames[record.mode] || '未知'}</span>
                <span class="history-time">${record.time}秒</span>
            `;
            container.appendChild(item);
        });
    }

    showPage(pageId) {
        // console.log('切换到页面:', pageId);
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // 如果切换到首页，更新皮肤显示和排行榜
            if (pageId === 'start-page') {
                setTimeout(() => {
                    this.updateHomeSkinDisplay();
                    this.updateHomeRanking();
                }, 100);
            }
        } else {
            console.error('页面不存在:', pageId);
        }
    }

    // ===== 游戏逻辑 =====
    startGame() {
        // console.log('⚠️⚠️⚠️ startGame 被调用！ ⚠️⚠️⚠️');
        
        this.resizeCanvas();
        this.state = GameState.PLAYING;
        this.elapsedTime = 0;
        this.isPaused = false;
        
        // console.log('设置后的 state:', this.state);
        
        // 重置 lastTime 以避免第一帧 deltaTime 过大的问题
        this.lastTime = performance.now();
        
        // 重置复活次数
        this.reviveCount = 0;
        
        console.log('=== 游戏开始 ===');
        // console.log('timeLimit:', this.timeLimit);
        // console.log('lastTime:', this.lastTime);
        // console.log('画布尺寸:', this.canvas.width, 'x', this.canvas.height);

        // 初始化摄像机
        this.camera.x = CONFIG.MAP.WIDTH / 2 - this.canvas.width / 2;
        this.camera.y = CONFIG.MAP.HEIGHT / 2 - this.canvas.height / 2;
        this.camera.targetX = this.camera.x;
        this.camera.targetY = this.camera.y;
        
        // console.log('摄像机初始位置:', this.camera.x, this.camera.y);
        // console.log('地图尺寸:', CONFIG.MAP.WIDTH, 'x', CONFIG.MAP.HEIGHT);
        // console.log('画布尺寸:', this.canvas.width, 'x', this.canvas.height);

        // 更新边界为更大的地图
        this.bounds = {
            x: CONFIG.SNAKE.SEGMENT_SIZE,
            y: CONFIG.SNAKE.SEGMENT_SIZE,
            width: CONFIG.MAP.WIDTH - CONFIG.SNAKE.SEGMENT_SIZE * 2,
            height: CONFIG.MAP.HEIGHT - CONFIG.SNAKE.SEGMENT_SIZE * 2
        };
        
        // console.log('bounds:', this.bounds);

        // 创建玩家蛇（在地图中心）
        this.playerSnake = new Snake(
            CONFIG.MAP.WIDTH / 2,
            CONFIG.MAP.HEIGHT / 2,
            0,
            CONFIG.SNAKE.INITIAL_LENGTH,
            this.settings.skin,
            true
        );
        
        // console.log('玩家蛇初始位置:', this.playerSnake.x, this.playerSnake.y);
        // console.log('玩家蛇长度:', this.playerSnake.length);
        // console.log('玩家蛇 segments:', this.playerSnake.segments.length);
        // console.log('摄像机应该看向:', this.playerSnake.x - this.canvas.width/2, this.playerSnake.y - this.canvas.height/2);

        // 创建 AI 蛇（根据难度决定数量）
        this.aiSnakes = [];
        const aiCount = CONFIG.AI_COUNTS[this.difficulty] || CONFIG.AI.COUNT;
        
        for (let i = 0; i < aiCount; i++) {
            const angle = (Math.PI * 2 * i) / aiCount;
            // 增加最小距离到 800，避免开局碰撞
            const dist = 800 + Math.random() * 400;
            const x = CONFIG.MAP.WIDTH / 2 + Math.cos(angle) * dist;
            const y = CONFIG.MAP.HEIGHT / 2 + Math.sin(angle) * dist;
            const skinIndex = (this.settings.skin + i + 1) % SKINS.length;
        
            // 为不同 AI 设置不同行为模式
            const aiModes = ['aggressive', 'conservative', 'balanced', 'hunter'];
            const aiMode = aiModes[i % aiModes.length];
        
            const ai = new Snake(x, y, angle, CONFIG.SNAKE.INITIAL_LENGTH + Math.floor(Math.random() * 20), skinIndex, false);
            ai.targetAngle = angle;
            ai.behavior = aiMode;  // AI 行为模式
            this.aiSnakes.push(ai);
        }

        // 创建食物
        this.foods = [];
        for (let i = 0; i < CONFIG.FOOD.COUNT; i++) {
            this.spawnFood();
        }

        console.log('食物生成完毕，总数:', this.foods.length);
        // console.log('第一个食物位置:', this.foods[0]?.x, this.foods[0]?.y);

        // 清空道具和粒子
        this.items = [];
        this.particles = [];
        
        // console.log('=== 准备开始游戏循环 ===');
        // console.log('当前 state:', this.state);
        // console.log('玩家蛇是否存在:', !!this.playerSnake);
        
        // 立即执行一次渲染，确保画面显示
        this.render();

        // 游戏循环由 init 时的 requestAnimationFrame 持续运行
        this.foodSpawnTimer = 0;
        this.itemSpawnTimer = 0;

        // 显示游戏页面
        this.showPage('game-page');
        this.renderHistory();  // 渲染历史记录
        
        // 显示摇杆（初始位置在左下角）
        const joystickContainer = document.getElementById('joystick-container');
        if (joystickContainer) {
            joystickContainer.style.opacity = '1';
            joystickContainer.style.pointerEvents = 'auto';
        }
        
        this.playSound('turn');
    }

    spawnFood() {
        const margin = 50;
            
        // 生成特殊食物（寒冰、速度、反向、无敌豆豆）- 根据设置决定是否生成
        const specialRand = Math.random();
        let cumulativeChance = 0;
            
        // 寒冰豆豆
        if (this.settings.enableIce) {
            cumulativeChance += CONFIG.SPECIAL_FOOD.ICE.CHANCE;
            if (specialRand < cumulativeChance) {
                const food = {
                    x: margin + Math.random() * (CONFIG.MAP.WIDTH - margin * 2),
                    y: margin + Math.random() * (CONFIG.MAP.HEIGHT - margin * 2),
                    radius: CONFIG.SPECIAL_FOOD.ICE.RADIUS,
                    growth: CONFIG.FOOD.GROWTH,
                    color: CONFIG.SPECIAL_FOOD.ICE.COLOR,
                    pulse: Math.random() * Math.PI * 2,
                    isBig: false,
                    type: 'ice'
                };
                this.foods.push(food);
                return;
            }
        }
            
        // 速度豆豆
        if (this.settings.enableSpeed) {
            cumulativeChance += CONFIG.SPECIAL_FOOD.SPEED.CHANCE;
            if (specialRand < cumulativeChance) {
                const food = {
                    x: margin + Math.random() * (CONFIG.MAP.WIDTH - margin * 2),
                    y: margin + Math.random() * (CONFIG.MAP.HEIGHT - margin * 2),
                    radius: CONFIG.SPECIAL_FOOD.SPEED.RADIUS,
                    growth: CONFIG.FOOD.GROWTH,
                    color: CONFIG.SPECIAL_FOOD.SPEED.COLOR,
                    pulse: Math.random() * Math.PI * 2,
                    isBig: false,
                    type: 'speed'
                };
                this.foods.push(food);
                return;
            }
        }
            
        // 反向豆豆
        if (this.settings.enableReverse) {
            cumulativeChance += CONFIG.SPECIAL_FOOD.REVERSE.CHANCE;
            if (specialRand < cumulativeChance) {
                const food = {
                    x: margin + Math.random() * (CONFIG.MAP.WIDTH - margin * 2),
                    y: margin + Math.random() * (CONFIG.MAP.HEIGHT - margin * 2),
                    radius: CONFIG.SPECIAL_FOOD.REVERSE.RADIUS,
                    growth: CONFIG.FOOD.GROWTH,
                    color: CONFIG.SPECIAL_FOOD.REVERSE.COLOR,
                    pulse: Math.random() * Math.PI * 2,
                    isBig: false,
                    type: 'reverse'
                };
                this.foods.push(food);
                return;
            }
        }
            
        // 无敌豆豆
        if (this.settings.enableInvincible) {
            cumulativeChance += CONFIG.SPECIAL_FOOD.INVINCIBLE.CHANCE;
            if (specialRand < cumulativeChance) {
                const food = {
                    x: margin + Math.random() * (CONFIG.MAP.WIDTH - margin * 2),
                    y: margin + Math.random() * (CONFIG.MAP.HEIGHT - margin * 2),
                    radius: CONFIG.SPECIAL_FOOD.INVINCIBLE.RADIUS,
                    growth: CONFIG.FOOD.GROWTH,
                    color: CONFIG.SPECIAL_FOOD.INVINCIBLE.COLOR,
                    pulse: Math.random() * Math.PI * 2,
                    isBig: false,
                    type: 'invincible'
                };
                this.foods.push(food);
                return;
            }
        }
            
        // 普通食物
        const isBigFood = Math.random() < CONFIG.FOOD.BIG_FOOD_RATIO;
    
        const food = {
            x: margin + Math.random() * (CONFIG.MAP.WIDTH - margin * 2),
            y: margin + Math.random() * (CONFIG.MAP.HEIGHT - margin * 2),
            radius: isBigFood ? CONFIG.FOOD.RADIUS * 1.8 : CONFIG.FOOD.RADIUS,
            growth: isBigFood ? CONFIG.FOOD.BIG_FOOD_GROWTH : CONFIG.FOOD.GROWTH,
            color: isBigFood ? `hsl(${Math.random() * 360}, 80%, 70%)` : `hsl(${Math.random() * 360}, 70%, 60%)`,
            pulse: Math.random() * Math.PI * 2,
            isBig: isBigFood,
            type: 'normal'
        };
        this.foods.push(food);
    }

    spawnItem() {
        const margin = 50;
        const itemTypes = ['speed_up', 'speed_down', 'shrink', 'invincible', 'grow'];
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];

        const item = {
            x: margin + Math.random() * (CONFIG.MAP.WIDTH - margin * 2),
            y: margin + Math.random() * (CONFIG.MAP.HEIGHT - margin * 2),
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
        // 显示退出游戏的结算画面
        this.showQuitSummary();
    }
    
    showQuitSummary() {
        // 计算当前排名
        const allSnakes = [this.playerSnake, ...this.aiSnakes];
        allSnakes.sort((a, b) => b.length - a.length);
        const rank = allSnakes.indexOf(this.playerSnake) + 1;

        // 设置结算数据
        document.getElementById('final-rank').textContent = '#' + rank;
        document.getElementById('final-rank').className = 'rank-' + rank;
        document.getElementById('final-length').textContent = this.playerSnake.length;
        
        // 显示游戏时长
        const displayTime = Math.floor(this.elapsedTime);
        document.getElementById('final-time').textContent = displayTime + '秒';

        // 根据退出时的表现显示消息
        let message = '';
        if (rank === 1) {
            message = '🏆 你目前是第一名！\n确定要退出吗？';
        } else if (rank <= 3) {
            message = '⭐ 排名前 3！\n继续加油冲第一！';
        } else if (rank <= 5) {
            message = '💪 进入前 5 名！\n还有提升空间！';
        } else {
            message = '🎮 继续努力！\n下次一定能更好！';
        }
        
        document.getElementById('result-message').textContent = message;
        
        // 显示退出游戏的特殊标题
        const quitTitle = document.getElementById('quit-summary-title');
        if (quitTitle) {
            quitTitle.style.display = 'block';
        }
        
        // 隐藏暂停菜单，显示结算页面
        document.getElementById('pause-menu').classList.add('hidden');
        this.state = GameState.GAME_OVER;  // 设置为结束状态
        this.showPage('result-page');
    }

    gameOver() {
        // 防止重复调用
        if (this.state === GameState.GAME_OVER) {
            return;
        }
        
        this.state = GameState.GAME_OVER;

        // 计算排名
        const allSnakes = [this.playerSnake, ...this.aiSnakes];
        allSnakes.sort((a, b) => b.length - a.length);
        const rank = allSnakes.indexOf(this.playerSnake) + 1;

        // 保存到历史记录（无尽模式按存活时间排序）
        const score = this.mode === GameMode.ENDLESS ? Math.floor(this.elapsedTime) : this.playerSnake.length;
        this.addToHistory(score, this.elapsedTime, this.mode);

        // 显示结算
        document.getElementById('final-rank').textContent = '#' + rank;
        document.getElementById('final-rank').className = 'rank-' + rank;
        document.getElementById('final-length').textContent = this.playerSnake.length;
        
        // 无尽模式显示存活时间
        if (this.mode === GameMode.ENDLESS) {
            document.getElementById('final-time').textContent = Math.floor(this.elapsedTime) + '秒';
        } else {
            document.getElementById('final-time').textContent = Math.floor(this.elapsedTime) + '秒';
        }

        // 根据排名显示不同的消息
        let message = '';
        let showParticles = false;
        
        if (rank === 1) {
            message = '🏆 恭喜获得第一名！\n你是真正的王者！';
            showParticles = true;
        } else if (rank === 2) {
            message = '🥈 太棒了！获得第二名\n离冠军只差一步！';
        } else if (rank === 3) {
            message = '🥉 不错！获得第三名\n继续保持！';
        } else if (rank <= 5) {
            message = '⭐ 进入前五名！\n表现非常出色！';
        } else {
            message = '💪 继续努力！\n下次一定能更好！';
        }
        
        document.getElementById('result-message').textContent = message;

        // 播放音效
        if (rank === 1) {
            this.playSound('win');
            // 第一名胜出时播放粒子特效
            if (showParticles) {
                for (let i = 0; i < 50; i++) {
                    this.spawnParticles(
                        CONFIG.MAP.WIDTH / 2 + (Math.random() - 0.5) * 1000,
                        CONFIG.MAP.HEIGHT / 2 + (Math.random() - 0.5) * 1000,
                        '#FFD700'
                    );
                }
            }
        } else {
            this.playSound('lose');
        }

        console.log('游戏结束，排名:', rank, '长度:', this.playerSnake.length);
        
        // 隐藏退出游戏的特殊标题（正常游戏结束）
        const quitTitle = document.getElementById('quit-summary-title');
        if (quitTitle) {
            quitTitle.style.display = 'none';
        }
        
        this.showPage('result-page');
    }
    
    // 复活玩家
    revivePlayer() {
        // 无尽模式：无限复活，但长度重置
        if (this.mode === GameMode.ENDLESS) {
            // 无尽模式总是可以复活
            this.reviveCount++;  // 仍然计数，用于显示
            
            // 重置玩家位置和状态
            this.playerSnake.x = CONFIG.MAP.WIDTH / 2;
            this.playerSnake.y = CONFIG.MAP.HEIGHT / 2;
            this.playerSnake.angle = 0;
            this.playerSnake.invincible = 3000;  // 复活后 3 秒无敌
            
            // 重置长度为初始长度，并重新构建身体
            const initialLength = CONFIG.SNAKE.INITIAL_LENGTH;
            const currentLength = this.playerSnake.length;
            
            if (currentLength !== initialLength) {
                console.log(`无尽模式复活！长度从 ${currentLength} 重置为 ${initialLength}`);
            }
            
            // 完全重置蛇的身体结构
            this.playerSnake.length = initialLength;
            this.playerSnake.segments = [];
            
            // 重新初始化身体段（从头部向后排列）
            for (let i = 0; i < initialLength; i++) {
                this.playerSnake.segments.push({
                    x: this.playerSnake.x - Math.cos(this.playerSnake.angle) * i * CONFIG.SNAKE.SEGMENT_SIZE,
                    y: this.playerSnake.y - Math.sin(this.playerSnake.angle) * i * CONFIG.SNAKE.SEGMENT_SIZE
                });
            }
            
            // 播放复活音效
            this.playSound('turn');
            
            console.log(`无尽模式复活！第 ${this.reviveCount} 次，当前长度：${this.playerSnake.length}`);
            return true;
        }
        
        // 其他模式：检查剩余复活次数
        if (this.reviveCount >= this.maxRevives || this.state !== GameState.PLAYING) {
            return false;
        }
        
        this.reviveCount++;
        
        // 重置玩家位置和状态
        this.playerSnake.x = CONFIG.MAP.WIDTH / 2;
        this.playerSnake.y = CONFIG.MAP.HEIGHT / 2;
        this.playerSnake.angle = 0;
        this.playerSnake.invincible = 3000;  // 复活后 3 秒无敌
        
        // 播放复活音效
        this.playSound('turn');
        
        console.log(`复活！剩余次数：${this.maxRevives - this.reviveCount}`);
        return true;
    }

    // ===== 游戏循环 =====
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // 限制 deltaTime 最大值，避免卡顿后时间跳跃
        if (deltaTime > 100 || deltaTime < 0) {
            // 跳过异常帧，但继续下一帧
            requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        // 只在 PLAYING 状态下更新和渲染
        if (this.state === GameState.PLAYING) {
            if (!this.isPaused) {
                this.update(deltaTime);
                this.render();
            } else {
                // 暂停时只渲染不更新
                this.render();
            }
        } else if (this.state === GameState.GAME_OVER) {
            // 游戏结束时仍然渲染最后一帧
            this.render();
        } else {
            // MENU 或其他状态也要渲染，否则页面是空白
            this.render();
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        // 限制 deltaTime 最大值，避免卡顿后时间跳跃
        if (deltaTime > 1000) {
            deltaTime = 1000;  // 最大只计算 1 秒
        }
        
        // 更新计时器（无尽模式不显示时间）- 优化：减少 DOM 操作
        if (this.mode !== GameMode.ENDLESS) {
            this.elapsedTime += deltaTime / 1000;
            const remainingTime = Math.max(0, this.timeLimit - Math.floor(this.elapsedTime));
            
            // 只在时间变化时更新 DOM（每秒更新一次）
            if (remainingTime !== this.lastUpdateTime) {
                document.getElementById('game-timer').textContent = remainingTime;
                this.lastUpdateTime = remainingTime;
            }
    
            if (remainingTime <= 0) {
                this.gameOver();
                return;  // 立即返回，不再执行后续逻辑
            }
        } else {
            // 无尽模式只显示存活时间 - 优化：每秒更新一次
            this.elapsedTime += deltaTime / 1000;
            const displayTime = Math.floor(this.elapsedTime);
            
            if (displayTime !== this.lastUpdateTime) {
                document.getElementById('game-timer').textContent = displayTime;
                this.lastUpdateTime = displayTime;
            }
        }
    
        // 更新玩家
        const baseSpeed = this.mode === GameMode.FAST ? CONFIG.SNAKE.BASE_SPEED * 1.5 : CONFIG.SNAKE.BASE_SPEED;
        // 速度豆豆增益
        const speed = this.playerSnake.hasSpeedBoost ? baseSpeed * CONFIG.SPECIAL_FOOD.SPEED.SPEED_BOOST : baseSpeed;
        this.updatePlayer(deltaTime, speed);
        
        // 更新状态效果显示
        this.updateStatusEffects();
    
        // 更新 AI
        this.aiSnakes.forEach(ai => this.updateAI(ai, deltaTime));
    
        // 碰撞检测（如果游戏已结束则跳过）
        if (this.state === GameState.PLAYING) {
            this.checkCollisions();
        }

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

        // 更新摄像机
        this.updateCamera();

        // 更新粒子
        this.updateParticles(deltaTime);

        // 更新UI
        this.updateHUD();
        this.updateRankingList();  // 更新实时排名
    }

    updateStatusEffects() {
        // 更新反向状态显示
        const reverseEffect = document.getElementById('effect-reverse');
        if (reverseEffect) {
            if (this.playerSnake.reversed > 0) {
                reverseEffect.style.display = 'block';
                const seconds = Math.ceil(this.playerSnake.reversed / 1000);
                reverseEffect.textContent = `🔄 反向 ${seconds}s`;
            } else {
                reverseEffect.style.display = 'none';
            }
        }
        
        // 更新无敌状态显示
        const invincibleEffect = document.getElementById('effect-invincible');
        if (invincibleEffect) {
            if (this.playerSnake.invincibleMode > 0) {
                invincibleEffect.style.display = 'block';
                const seconds = Math.ceil(this.playerSnake.invincibleMode / 1000);
                invincibleEffect.textContent = `👑 无敌 ${seconds}s`;
            } else {
                invincibleEffect.style.display = 'none';
            }
        }
        
        // 更新冰冻状态显示
        const frozenEffect = document.getElementById('effect-frozen');
        if (frozenEffect) {
            if (this.playerSnake.frozen > 0) {
                frozenEffect.style.display = 'block';
                const seconds = Math.ceil(this.playerSnake.frozen * 10) / 10;
                frozenEffect.textContent = `❄️ 冰冻 ${seconds}s`;
            } else {
                frozenEffect.style.display = 'none';
            }
        }
    }

    updatePlayer(deltaTime, speedOverride = null) {
        // 根据摇杆更新方向
        if (this.joystick.active && this.joystick.power > 0.1) {
            let targetAngle = this.joystick.angle;
            
            // 如果处于反向状态，反转角度
            if (this.playerSnake.reversed > 0) {
                targetAngle = targetAngle + Math.PI;  // 反向 180 度
            }
            
            let angleDiff = targetAngle - this.playerSnake.angle;
    
            // 处理角度差
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
            // 平滑转向
            const turnSpeed = CONFIG.SNAKE.TURN_SPEED * this.settings.speed;
            this.playerSnake.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);
    
            // 保持角度在-PI 到 PI 之间
            while (this.playerSnake.angle > Math.PI) this.playerSnake.angle -= Math.PI * 2;
            while (this.playerSnake.angle < -Math.PI) this.playerSnake.angle += Math.PI * 2;
        }
    
        // 计算速度
        let speed = speedOverride || (CONFIG.SNAKE.MIN_SPEED + (CONFIG.SNAKE.MAX_SPEED - CONFIG.SNAKE.MIN_SPEED) * 0.4) * 0.2;
        speed *= this.settings.speed;
    
        // 极速模式增加基础速度
        if (this.mode === GameMode.FAST) {
            speed *= 1.5;
        }
            
        // 加速按钮（已移除）
        // if (this.isBoosting && this.joystick.power > 0.1) {
        //     speed *= 1.8;  // 加速 80%
        // }
    
        // 检查速度豆豆增益
        if (this.playerSnake.hasSpeedBoost) {
            speed *= CONFIG.SPECIAL_FOOD.SPEED.SPEED_BOOST;
        }
    
        // 移动蛇
        // console.log('玩家蛇移动，速度:', speed, '位置:', this.playerSnake.x, this.playerSnake.y);
        this.playerSnake.move(speed, this.bounds, deltaTime);
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

        ai.move(speed, this.bounds, deltaTime);
    }

    aiThink(ai) {
        const behavior = ai.behavior || 'balanced';

        // 优先避障
        let avoidAngle = null;
        const allSnakes = [this.playerSnake, ...this.aiSnakes].filter(s => s !== ai);

        allSnakes.forEach(other => {
            // 检查其他蛇的身体段
            for (let i = 0; i < other.segments.length; i += 3) {  // 每隔几个身体段检查，优化性能
                const seg = other.segments[i];
                const dx = seg.x - ai.x;
                const dy = seg.y - ai.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.AI.AVOID_DISTANCE) {
                    // 转向相反方向
                    avoidAngle = Math.atan2(-dy, -dx);
                }
            }

            // 检查头部碰撞
            const dx = other.x - ai.x;
            const dy = other.y - ai.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONFIG.AI.AVOID_DISTANCE * 0.8) {
                avoidAngle = Math.atan2(-dy, -dx);
            }
        });

        // 边界检测
        const margin = 150;
        if (ai.x < margin) avoidAngle = 0;
        if (ai.x > CONFIG.MAP.WIDTH - margin) avoidAngle = Math.PI;
        if (ai.y < margin) avoidAngle = Math.PI / 2;
        if (ai.y > CONFIG.MAP.HEIGHT - margin) avoidAngle = -Math.PI / 2;

        // 如果需要避障，优先避障
        if (avoidAngle !== null) {
            ai.targetAngle = avoidAngle;
            return;
        }

        // 根据行为模式执行不同策略
        switch (behavior) {
            case 'aggressive':  // 激进型：优先抢食玩家附近的豆豆
                this.aiHuntPlayerFood(ai);
                break;

            case 'conservative':  // 保守型：优先躲避，寻找安全区域的食物
                this.aiConservativeHunt(ai);
                break;

            case 'hunter':  // 猎手型：主动寻找大豆豆
                this.aiBigFoodHunt(ai);
                break;

            default:  // balanced：平衡型
                this.aiBalancedHunt(ai);
        }

        // 拦截逻辑：尝试预判玩家路径并抢食
        if (behavior === 'aggressive' || behavior === 'hunter') {
            this.aiIntercept(ai);
        }
    }

    aiBalancedHunt(ai) {
        // 寻找最近的食物
        let closestFood = null;
        let closestDist = Infinity;
        let highestValueFood = null;
        let highestValue = -1;

        this.foods.forEach(food => {
            const dx = food.x - ai.x;
            const dy = food.y - ai.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 寻找最近的
            if (dist < closestDist && dist < CONFIG.AI.HUNT_FOOD_RADIUS) {
                closestDist = dist;
                closestFood = food;
            }

            // 寻找价值最高的（大豆豆）
            if (food.isBig && dist < CONFIG.AI.HUNT_FOOD_RADIUS * 1.5) {
                const value = food.growth / dist;
                if (value > highestValue) {
                    highestValue = value;
                    highestValueFood = food;
                }
            }
        });

        // 优先价值最高的食物
        if (highestValueFood) {
            ai.targetAngle = Math.atan2(highestValueFood.y - ai.y, highestValueFood.x - ai.x);
        } else if (closestFood) {
            ai.targetAngle = Math.atan2(closestFood.y - ai.y, closestFood.x - ai.x);
        } else {
            // 向地图中心移动
            const centerX = CONFIG.MAP.WIDTH / 2;
            const centerY = CONFIG.MAP.HEIGHT / 2;
            ai.targetAngle = Math.atan2(centerY - ai.y, centerX - ai.x);
        }
    }

    aiHuntPlayerFood(ai) {
        // 激进型：寻找玩家附近的食物
        let targetFood = null;
        let maxPriority = -1;

        this.foods.forEach(food => {
            const dxToFood = food.x - ai.x;
            const dyToFood = food.y - ai.y;
            const distToFood = Math.sqrt(dxToFood * dxToFood + dyToFood * dyToFood);

            const dxToPlayer = food.x - this.playerSnake.x;
            const dyToPlayer = food.y - this.playerSnake.y;
            const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

            // 距离玩家越近、距离自己越近的食物优先级越高
            if (distToFood < CONFIG.AI.INTERCEPT_RADIUS && distToPlayer < 300) {
                const priority = (1 / distToFood) + (1 / distToPlayer) + (food.isBig ? 2 : 0);
                if (priority > maxPriority) {
                    maxPriority = priority;
                    targetFood = food;
                }
            }
        });

        if (targetFood) {
            ai.targetAngle = Math.atan2(targetFood.y - ai.y, targetFood.x - ai.x);
        } else {
            this.aiBalancedHunt(ai);
        }
    }

    aiConservativeHunt(ai) {
        // 保守型：优先远离其他蛇，寻找安全区域的食物
        let safeFood = null;
        let bestSafety = -1;

        this.foods.forEach(food => {
            const dx = food.x - ai.x;
            const dy = food.y - ai.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.AI.HUNT_FOOD_RADIUS) {
                // 计算安全性（距离其他蛇的平均距离）
                let minDistToOther = Infinity;
                const allSnakes = [this.playerSnake, ...this.aiSnakes].filter(s => s !== ai);
                allSnakes.forEach(other => {
                    const dxOther = food.x - other.x;
                    const dyOther = food.y - other.y;
                    const distOther = Math.sqrt(dxOther * dxOther + dyOther * dyOther);
                    if (distOther < minDistToOther) {
                        minDistToOther = distOther;
                    }
                });

                const safety = minDistToOther - (food.isBig ? 100 : 0);  // 大豆豆值得一试
                if (safety > bestSafety) {
                    bestSafety = safety;
                    safeFood = food;
                }
            }
        });

        if (safeFood) {
            ai.targetAngle = Math.atan2(safeFood.y - ai.y, safeFood.x - ai.x);
        } else {
            // 向地图边缘移动（安全区域）
            const margin = 500;
            if (ai.x < CONFIG.MAP.WIDTH - margin) ai.targetAngle = Math.PI;
            else ai.targetAngle += (Math.random() - 0.5) * Math.PI;
        }
    }

    aiBigFoodHunt(ai) {
        // 猎手型：专门寻找大豆豆
        let targetBigFood = null;
        let closestDist = Infinity;

        this.foods.forEach(food => {
            if (food.isBig) {
                const dx = food.x - ai.x;
                const dy = food.y - ai.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < closestDist && dist < CONFIG.AI.HUNT_FOOD_RADIUS * 1.5) {
                    closestDist = dist;
                    targetBigFood = food;
                }
            }
        });

        if (targetBigFood) {
            ai.targetAngle = Math.atan2(targetBigFood.y - ai.y, targetBigFood.x - ai.x);
        } else {
            this.aiBalancedHunt(ai);
        }
    }

    aiIntercept(ai) {
        // 拦截逻辑：预判玩家路径并尝试抢食
        const interceptDistance = 400;

        this.foods.forEach(food => {
            const dxToFood = food.x - this.playerSnake.x;
            const dyToFood = food.y - this.playerSnake.y;
            const distPlayerToFood = Math.sqrt(dxToFood * dxToFood + dyToFood * dyToFood);

            if (distPlayerToFood > 100 && distPlayerToFood < interceptDistance) {
                const dxAi = food.x - ai.x;
                const dyAi = food.y - ai.y;
                const distAiToFood = Math.sqrt(dxAi * dxAi + dyAi * dyAi);

                // 如果AI距离食物更近，则尝试拦截
                if (distAiToFood < distPlayerToFood * 0.8) {
                    const foodAngle = Math.atan2(food.y - this.playerSnake.y, food.x - this.playerSnake.x);
                    if (Math.abs(foodAngle - this.playerSnake.angle) < Math.PI / 2) {
                        // 玩家确实朝向这个食物
                        ai.targetAngle = Math.atan2(food.y - ai.y, food.x - ai.x);
                    }
                }
            }
        });
    }

    checkCollisions() {
        // 如果游戏已经结束或者不在 PLAYING 状态，不再检测
        if (this.state !== GameState.PLAYING || !this.playerSnake) {
            return;
        }
        
        // 玩家吃食物
        this.foods = this.foods.filter(food => {
            const dx = food.x - this.playerSnake.x;
            const dy = food.y - this.playerSnake.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.SNAKE.HEAD_RADIUS + food.radius) {
                this.playerSnake.grow(food.growth);
                this.spawnParticles(this.playerSnake.x, this.playerSnake.y, food.color);
                this.playSound('eat');
                
                // 特殊食物效果
                if (food.type === 'ice') {
                    // 寒冰效果：静止 3 秒
                    this.playerSnake.frozen = CONFIG.SPECIAL_FOOD.ICE.FREEZE_DURATION;
                } else if (food.type === 'speed') {
                    // 速度效果：永久加速（直到死亡）
                    this.playerSnake.hasSpeedBoost = true;
                } else if (food.type === 'reverse') {
                    // 反向效果：操作反向 3 秒
                    this.playerSnake.reversed = CONFIG.SPECIAL_FOOD.REVERSE.REVERSE_DURATION * 1000;
                    console.log('玩家被反向！持续 3 秒');
                } else if (food.type === 'invincible') {
                    // 无敌效果：无敌 5 秒
                    this.playerSnake.invincibleMode = CONFIG.SPECIAL_FOOD.INVINCIBLE.INVINCIBLE_DURATION * 1000;
                    console.log('玩家获得无敌！持续 5 秒');
                }
                
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
                    ai.grow(food.growth);
                    this.spawnParticles(ai.x, ai.y, food.color);
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

        // 玩家撞墙（使用更精确的边界检测）
        if (this.playerSnake.x < this.bounds.x || 
            this.playerSnake.x > this.bounds.x + this.bounds.width ||
            this.playerSnake.y < this.bounds.y || 
            this.playerSnake.y > this.bounds.y + this.bounds.height) {
            
            // 如果处于无敌状态，不触发死亡
            if (this.playerSnake.invincible > 0 || this.playerSnake.invincibleMode > 0) {
                return;  // 无敌期间免疫撞墙
            }
            
            console.log('撞墙检测触发！玩家位置:', this.playerSnake.x, this.playerSnake.y);
            console.log('边界范围:', this.bounds);
            
            // 尝试复活
            if (this.revivePlayer()) {
                return;  // 复活成功，不结束游戏
            }
            
            this.gameOver();
            return;
        }

        // 玩家撞蛇（增加无敌时间保护，避免开局立即死亡）
        const allSnakes = [...this.aiSnakes];
        let collisionDetected = false;
        allSnakes.forEach(snake => {
            // 检查头部碰撞
            for (let i = 0; i < snake.segments.length; i++) {
                const seg = snake.segments[i];
                const dx = seg.x - this.playerSnake.x;
                const dy = seg.y - this.playerSnake.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // 碰撞距离应该是蛇头半径 + 身体节段半径
                const collisionDist = CONFIG.SNAKE.HEAD_RADIUS + CONFIG.SNAKE.SEGMENT_SIZE;
                
                if (dist < collisionDist) {
                    // 如果处于无敌状态，不触发死亡
                    if (this.playerSnake.invincible > 0 || this.playerSnake.invincibleMode > 0) {
                        return; // 无敌状态
                    }
                    
                    console.log('撞蛇检测触发！距离:', dist, '游戏时间:', this.elapsedTime);
                    
                    // 计算击杀奖励（玩家长度的一半给击杀的 AI）
                    const killReward = Math.floor(this.playerSnake.length / 2);
                    snake.grow(killReward);
                    console.log(`AI 击杀玩家！获得 ${killReward} 分奖励`);
                    this.spawnParticles(this.playerSnake.x, this.playerSnake.y, '#FFD700');
                    
                    // 尝试复活
                    if (this.revivePlayer()) {
                        collisionDetected = true;
                        return;
                    }
                    
                    this.playSound('collision');
                    this.gameOver();
                    collisionDetected = true;
                    return;
                }
            }
        });
        if (collisionDetected) return;

        // AI 撞墙 - 重置位置（使用更精确的边界）
        this.aiSnakes.forEach(ai => {
            if (ai.x < this.bounds.x || ai.x > this.bounds.x + this.bounds.width || 
                ai.y < this.bounds.y || ai.y > this.bounds.y + this.bounds.height) {
                ai.x = Math.max(this.bounds.x + 50, Math.min(this.bounds.x + this.bounds.width - 50, ai.x));
                ai.y = Math.max(this.bounds.y + 50, Math.min(this.bounds.y + this.bounds.height - 50, ai.y));
                ai.targetAngle = Math.random() * Math.PI * 2;
            }
        });

        // AI 撞蛇 - 重新规划 + 死亡检测 + 积分奖励
        for (let aiIndex = this.aiSnakes.length - 1; aiIndex >= 0; aiIndex--) {
            const ai = this.aiSnakes[aiIndex];
            const otherSnakes = [this.playerSnake, ...this.aiSnakes].filter(s => s !== ai);
            let aiCollision = false;
                    
            for (const other of otherSnakes) {
                for (let i = 0; i < other.segments.length; i++) {
                    const seg = other.segments[i];
                    const dx = seg.x - ai.x;
                    const dy = seg.y - ai.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                
                    // AI 头部撞到别人的身体 - 死亡
                    if (dist < CONFIG.SNAKE.SEGMENT_SIZE) {
                        // 计算击杀奖励（被击杀蛇长度的一半）
                        const killReward = Math.floor(ai.length / 2);
                        
                        // 将奖励加到击杀者身上
                        if (other.isPlayer) {
                            // 玩家击杀了 AI
                            console.log(`玩家击杀 AI！获得 ${killReward} 分奖励`);
                            this.playerSnake.grow(killReward);
                            this.spawnParticles(ai.x, ai.y, '#FFD700'); // 金色粒子特效
                            this.playSound('kill'); // 击杀音效
                            this.showKillNotice(`+${killReward} 击杀奖励！`);
                        } else {
                            // AI 击杀了其他 AI
                            const killerIndex = this.aiSnakes.indexOf(other);
                            if (killerIndex !== -1) {
                                console.log(`AI 击杀其他 AI！获得 ${killReward} 分奖励`);
                                other.grow(killReward);
                                this.spawnParticles(ai.x, ai.y, '#FFD700');
                            }
                        }
                        
                        // AI 死亡，从地图中移除，但会复活
                        console.log('AI 蛇死亡！撞到', other.isPlayer ? '玩家' : '其他 AI');
                        this.aiSnakes.splice(aiIndex, 1);
                        
                        // 安排复活（5 秒后）
                        setTimeout(() => {
                            if (this.state === GameState.PLAYING) {
                                this.respawnAI();
                            }
                        }, CONFIG.AI.RESPAWN_TIME * 1000);
                        
                        aiCollision = true;
                        break;
                    }
                                    
                    // 如果距离较近但未碰撞，重新规划方向
                    if (dist < CONFIG.SNAKE.SEGMENT_SIZE * 1.5) {
                        ai.targetAngle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * Math.PI;
                    }
                }
                if (aiCollision) break;
            }
        }
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

    spawnParticles(x, y, color) {
        // 优化：限制最大粒子数量，避免过多导致卡顿
        if (this.particles.length >= CONFIG.PARTICLE.MAX_COUNT) {
            return;  // 超过上限，不生成新粒子
        }
        
        const count = Math.min(CONFIG.PARTICLE.COUNT, CONFIG.PARTICLE.MAX_COUNT - this.particles.length);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * CONFIG.PARTICLE.SPEED + 1;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: CONFIG.PARTICLE.LIFE,
                maxLife: CONFIG.PARTICLE.LIFE,
                size: Math.random() * 4 + 2
            });
        }
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime;
            p.vx *= 0.98;  // 摩擦力
            p.vy *= 0.98;

            return p.life > 0;
        });
    }

    renderParticles() {
        const ctx = this.ctx;
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x - this.camera.x, p.y - this.camera.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    renderMinimap() {
        if (!this.minimap.ctx || !this.playerSnake) return;
        
        const minimapCtx = this.minimap.ctx;
        const minimapCanvas = this.minimap.canvas;
        const scale = this.minimap.scale;
        
        // 清空小地图
        minimapCtx.fillStyle = 'rgba(18, 18, 28, 0.95)';
        minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        
        // 绘制整个地图边界（青色边框）
        minimapCtx.strokeStyle = '#4ECDC4';
        minimapCtx.lineWidth = 2;
        minimapCtx.strokeRect(0, 0, CONFIG.MAP.WIDTH * scale, CONFIG.MAP.HEIGHT * scale);
        
        // 绘制玩家位置（绿色圆点）
        minimapCtx.fillStyle = '#00FF00';
        minimapCtx.beginPath();
        minimapCtx.arc(
            this.playerSnake.x * scale,
            this.playerSnake.y * scale,
            4,  // 玩家点大小
            0,
            Math.PI * 2
        );
        minimapCtx.fill();
        
        // 绘制 AI 位置（红色小点）
        minimapCtx.fillStyle = '#FF4444';
        this.aiSnakes.forEach(ai => {
            minimapCtx.beginPath();
            minimapCtx.arc(
                ai.x * scale,
                ai.y * scale,
                3,  // AI 点大小
                0,
                Math.PI * 2
            );
            minimapCtx.fill();
        });
        
        // 绘制摄像机视野范围（半透明矩形）
        minimapCtx.fillStyle = 'rgba(78, 205, 196, 0.2)';
        minimapCtx.fillRect(
            this.camera.x * scale,
            this.camera.y * scale,
            this.canvas.width * scale,
            this.canvas.height * scale
        );
    }

    updateCamera() {
        if (!this.playerSnake) return;

        // 目标位置：让玩家蛇处于视野中心（移除随机偏移，避免晃动）
        const targetX = this.playerSnake.x - this.canvas.width / 2;
        const targetY = this.playerSnake.y - this.canvas.height / 2;

        // 平滑移动摄像机
        this.camera.x += (targetX - this.camera.x) * CONFIG.CAMERA.SMOOTH_SPEED;
        this.camera.y += (targetY - this.camera.y) * CONFIG.CAMERA.SMOOTH_SPEED;

        // 限制摄像机不要超出地图边界太多
        this.camera.x = Math.max(-100, Math.min(CONFIG.MAP.WIDTH - this.canvas.width + 100, this.camera.x));
        this.camera.y = Math.max(-100, Math.min(CONFIG.MAP.HEIGHT - this.canvas.height + 100, this.camera.y));
        
        // 调试信息
        // console.log('摄像机位置:', this.camera.x, this.camera.y);
        // console.log('玩家位置:', this.playerSnake.x, this.playerSnake.y);
    }

    updateHUD() {
        document.getElementById('player-length').textContent = this.playerSnake.length;

        // 更新排名
        const allSnakes = [this.playerSnake, ...this.aiSnakes];
        allSnakes.sort((a, b) => b.length - a.length);
        const rank = allSnakes.indexOf(this.playerSnake) + 1;
        document.getElementById('player-rank').textContent = rank + '/' + allSnakes.length;
        
        // 更新复活次数显示
        const reviveCount = this.maxRevives - this.reviveCount;
        const reviveElement = document.getElementById('revive-count');
        
        if (this.mode === GameMode.ENDLESS) {
            // 无尽模式显示无限符号
            reviveElement.textContent = '∞';
            reviveElement.style.color = '#FFD700';  // 金色
        } else {
            // 其他模式显示剩余次数
            reviveElement.textContent = reviveCount;
            if (reviveCount > 0) {
                reviveElement.style.color = '#2ECC71';  // 绿色
            } else {
                reviveElement.style.color = '#E74C3C';  // 红色
            }
        }
        
        // 无尽模式特殊显示
        if (this.mode === GameMode.ENDLESS) {
            document.getElementById('game-timer').parentElement.querySelector('.hud-label').textContent = '⏱️ 存活';
        } else {
            document.getElementById('game-timer').parentElement.querySelector('.hud-label').textContent = '⏱️ 时间';
        }
    }
    
    // 显示击杀提示
    showKillNotice(message) {
        const notice = document.getElementById('kill-notice');
        if (!notice) return;
        
        notice.textContent = message;
        notice.classList.add('show');
        
        // 清除之前的定时器（如果有）
        if (this.killNoticeTimer) {
            clearTimeout(this.killNoticeTimer);
        }
        
        // 2 秒后隐藏
        this.killNoticeTimer = setTimeout(() => {
            notice.classList.remove('show');
        }, 2000);
    }
    
    // AI 复活
    respawnAI() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 500 + Math.random() * 500;
        const x = CONFIG.MAP.WIDTH / 2 + Math.cos(angle) * dist;
        const y = CONFIG.MAP.HEIGHT / 2 + Math.sin(angle) * dist;
        const skinIndex = Math.floor(Math.random() * SKINS.length);
        
        const ai = new Snake(x, y, angle, CONFIG.SNAKE.INITIAL_LENGTH, skinIndex, false);
        ai.targetAngle = angle;
        ai.behavior = ['aggressive', 'conservative', 'balanced', 'hunter'][Math.floor(Math.random() * 4)];
        this.aiSnakes.push(ai);
        
        console.log('AI 蛇复活！当前位置:', x, y);
    }
    
    // 显示新手教程
    showTutorial() {
        this.showPage('tutorial-page');
        this.currentTutorialStep = 0;
        this.renderTutorial();
        
        // 检查是否是首次运行
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial) {
            // 首次运行，自动显示教程
            localStorage.setItem('hasSeenTutorial', 'true');
        }
    }
    
    // 渲染教程幻灯片
    renderTutorial() {
        const container = document.getElementById('tutorial-slides');
        const indicatorsContainer = document.getElementById('tutorial-indicators');
        
        if (!container || !indicatorsContainer) return;
        
        const step = TUTORIAL_STEPS[this.currentTutorialStep];
        
        // 渲染幻灯片内容
        container.innerHTML = `
            <div class="tutorial-slide">
                <span class="tutorial-icon">${step.icon}</span>
                <h3>${step.title}</h3>
                <p>${step.content.replace(/\n/g, '<br>')}</p>
            </div>
        `;
        
        // 渲染指示器
        indicatorsContainer.innerHTML = '';
        TUTORIAL_STEPS.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'tutorial-dot' + (index === this.currentTutorialStep ? ' active' : '');
            indicatorsContainer.appendChild(dot);
        });
        
        // 更新按钮状态
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');
        
        if (prevBtn) prevBtn.disabled = this.currentTutorialStep === 0;
        if (nextBtn) nextBtn.disabled = this.currentTutorialStep === TUTORIAL_STEPS.length - 1;
    }
    
    // 上一步教程
    prevTutorialStep() {
        if (this.currentTutorialStep > 0) {
            this.currentTutorialStep--;
            this.renderTutorial();
        }
    }
    
    // 下一步教程
    nextTutorialStep() {
        if (this.currentTutorialStep < TUTORIAL_STEPS.length - 1) {
            this.currentTutorialStep++;
            this.renderTutorial();
        }
    }

    updateRankingList() {
        const container = document.getElementById('ranking-list');
        if (!container) return;
    
        const allSnakes = [this.playerSnake, ...this.aiSnakes];
        allSnakes.sort((a, b) => b.length - a.length);
    
        // 根据难度决定显示数量，困难模式显示前 20 条
        const maxDisplay = this.difficulty === Difficulty.HARD ? 20 : 10;
        const topSnakes = allSnakes.slice(0, maxDisplay);
        
        // 优化：只在排名变化时更新 DOM（每 0.5 秒检查一次）
        const rankingKey = topSnakes.map(s => s.length).join('-');
        if (rankingKey === this.lastRankingKey) {
            return;  // 排名未变化，跳过 DOM 更新
        }
        this.lastRankingKey = rankingKey;
        
        container.innerHTML = '';
    
        topSnakes.forEach((snake, index) => {
            const item = document.createElement('div');
            item.className = 'ranking-item' + (snake.isPlayer ? ' player' : '');
    
            item.innerHTML = `
                <span class="rank-number">${index + 1}</span>
                <span class="snake-color" style="background-color: ${SKINS[snake.skin].colors[0]}"></span>
                <span class="snake-name">${snake.isPlayer ? '你' : `AI-${snake.behavior || '平衡'}`}</span>
                <span class="snake-length">${snake.length}</span>
            `;
            container.appendChild(item);
        });
    }

    render() {
        const ctx = this.ctx;
        
        // 根据游戏状态决定使用哪个背景
        let bg;
        if (this.state === GameState.MENU || this.state === GameState.LOADING) {
            // 菜单状态使用主页背景
            bg = BACKGROUNDS[this.settings.homeBackground];
        } else {
            // 游戏状态使用游戏背景
            bg = BACKGROUNDS[this.settings.background];
        }
        
        if (!bg) {
            console.error('[Render] Background not found!');
            return;
        }

        // 绘制背景
        const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, bg.colors[0]);
        gradient.addColorStop(0.5, bg.colors[1]);
        gradient.addColorStop(1, bg.colors[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 先绘制小地图（不受摄像机影响）- 只在游戏状态绘制
        if (this.state === GameState.PLAYING || this.state === GameState.PAUSED || this.state === GameState.GAME_OVER) {
            this.renderMinimap();
        }

        // 应用摄像机变换 - 只在游戏状态应用
        if (this.state === GameState.PLAYING || this.state === GameState.PAUSED || this.state === GameState.GAME_OVER) {
            ctx.save();
            ctx.translate(-this.camera.x, -this.camera.y);

            // 绘制网格（优化：只绘制可见区域）
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            const gridSize = 100;
            const startGridX = Math.floor(this.camera.x / gridSize) * gridSize;
            const startGridY = Math.floor(this.camera.y / gridSize) * gridSize;
            const endGridX = startGridX + Math.ceil(this.canvas.width / gridSize) * gridSize + gridSize;
            const endGridY = startGridY + Math.ceil(this.canvas.height / gridSize) * gridSize + gridSize;

            for (let x = startGridX; x <= endGridX && x <= CONFIG.MAP.WIDTH; x += gridSize) {
                if (x >= 0) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, CONFIG.MAP.HEIGHT);
                    ctx.stroke();
                }
            }
            for (let y = startGridY; y <= endGridY && y <= CONFIG.MAP.HEIGHT; y += gridSize) {
                if (y >= 0) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(CONFIG.MAP.WIDTH, y);
                    ctx.stroke();
                }
            }

            // 绘制地图边界
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 5;
            ctx.strokeRect(0, 0, CONFIG.MAP.WIDTH, CONFIG.MAP.HEIGHT);

            // 绘制食物（优化：只绘制可见区域内的食物）
            const viewportLeft = this.camera.x;
            const viewportRight = this.camera.x + this.canvas.width;
            const viewportTop = this.camera.y;
            const viewportBottom = this.camera.y + this.canvas.height;
            
            this.foods.forEach(food => {
                // 视锥剔除：只绘制屏幕内的食物
                if (food.x < viewportLeft - food.radius || 
                    food.x > viewportRight + food.radius || 
                    food.y < viewportTop - food.radius || 
                    food.y > viewportBottom + food.radius) {
                    return;  // 跳过屏幕外的食物
                }
            
                // 脉冲效果
                const pulse = Math.sin(Date.now() / 200 + food.pulse) * 0.3 + 1;
                const radius = food.radius * pulse;

                // 特殊豆豆有更明显的视觉效果
                if (food.type === 'ice') {
                // ❄️ 寒冰豆豆：外层冰晶光环 + 内部雪花
                ctx.save();
                
                // 外圈冰晶光晕（ pulsing ）
                const iceGlow = Math.sin(Date.now() / 300) * 5 + 15;
                ctx.shadowBlur = iceGlow;
                ctx.shadowColor = '#00BFFF';
                
                // 绘制主体
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius * 1.3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 191, 255, 0.3)';  // 半透明外圈
                ctx.fill();
                
                // 内圈实心
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#00BFFF';
                ctx.shadowBlur = 0;
                ctx.fill();
                
                // 中心白色核心
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
                
                // 旋转的雪花效果
                ctx.translate(food.x, food.y);
                ctx.rotate(Date.now() / 1000);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                for (let i = 0; i < 6; i++) {
                    ctx.beginPath();
                    ctx.rect(-radius * 0.2, -radius * 1.5, radius * 0.4, radius * 3);
                    ctx.fill();
                    ctx.rotate(Math.PI / 3);
                }
                
                ctx.restore();
                
            } else if (food.type === 'speed') {
                // ⚡ 速度豆豆：闪电环绕 + 火焰拖尾
                ctx.save();
                
                // 外圈闪电光晕
                const speedGlow = Math.sin(Date.now() / 200) * 8 + 20;
                ctx.shadowBlur = speedGlow;
                ctx.shadowColor = '#FF1493';
                
                // 绘制主体
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius * 1.2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 20, 147, 0.3)';  // 半透明外圈
                ctx.fill();
                
                // 内圈实心
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#FF1493';
                ctx.shadowBlur = 0;
                ctx.fill();
                
                // 中心黄色核心
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFF00';
                ctx.fill();
                
                // 闪电符号
                ctx.translate(food.x, food.y);
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.moveTo(-radius * 0.3, -radius * 0.8);
                ctx.lineTo(radius * 0.3, -radius * 0.2);
                ctx.lineTo(-radius * 0.1, -radius * 0.2);
                ctx.lineTo(radius * 0.2, radius * 0.8);
                ctx.lineTo(-radius * 0.4, radius * 0.1);
                ctx.lineTo(radius * 0.1, radius * 0.1);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
                
            } else if (food.type === 'reverse') {
                // 🔄 反向豆豆：双向箭头旋转
                ctx.save();
                
                // 外圈红色光晕
                const reverseGlow = Math.sin(Date.now() / 250) * 6 + 18;
                ctx.shadowBlur = reverseGlow;
                ctx.shadowColor = '#FF4500';
                
                // 绘制主体
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius * 1.3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 69, 0, 0.3)';
                ctx.fill();
                
                // 内圈实心
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#FF4500';
                ctx.shadowBlur = 0;
                ctx.fill();
                
                // 旋转的双向箭头
                ctx.translate(food.x, food.y);
                ctx.rotate(Date.now() / 500);  // 缓慢旋转
                ctx.fillStyle = '#FFFFFF';
                
                // 上箭头
                ctx.beginPath();
                ctx.moveTo(0, -radius * 0.8);
                ctx.lineTo(-radius * 0.4, radius * 0.2);
                ctx.lineTo(radius * 0.4, radius * 0.2);
                ctx.closePath();
                ctx.fill();
                
                // 下箭头
                ctx.rotate(Math.PI);
                ctx.beginPath();
                ctx.moveTo(0, -radius * 0.8);
                ctx.lineTo(-radius * 0.4, radius * 0.2);
                ctx.lineTo(radius * 0.4, radius * 0.2);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
                
            } else if (food.type === 'invincible') {
                // 👑 无敌豆豆：皇冠光环 + 金色星星
                ctx.save();
                
                // 外圈金色光晕（ pulsing ）
                const invincibleGlow = Math.sin(Date.now() / 300) * 10 + 25;
                ctx.shadowBlur = invincibleGlow;
                ctx.shadowColor = '#FFD700';
                
                // 绘制主体
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius * 1.4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.fill();
                
                // 内圈实心
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#FFD700';
                ctx.shadowBlur = 0;
                ctx.fill();
                
                // 中心白色核心
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
                
                // 周围的星星
                ctx.translate(food.x, food.y);
                for (let i = 0; i < 4; i++) {
                    ctx.rotate(Math.PI / 2);
                    const starDist = radius * 1.8;
                    ctx.fillStyle = '#FFFF00';
                    ctx.beginPath();
                    // 画小星星
                    for (let j = 0; j < 5; j++) {
                        const angle = (j * 4 * Math.PI / 5) - Math.PI / 2;
                        const x = Math.cos(angle) * 6;
                        const y = Math.sin(angle) * 6;
                        if (j === 0) ctx.moveTo(x, y - starDist);
                        else ctx.lineTo(x, y - starDist);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
                
                ctx.restore();
                
            } else {
                // 🍎 普通豆豆：简单发光
                ctx.beginPath();
                ctx.arc(food.x, food.y, radius, 0, Math.PI * 2);
                
                // 大豆豆有额外光晕
                if (food.isBig) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = food.color;
                }
                
                ctx.fillStyle = food.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
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

        // 绘制蛇（优化：只绘制可见区域内的蛇）
        [...this.aiSnakes, this.playerSnake].forEach(snake => {
            if (!snake) return;  // 跳过 null
            
            // 快速剔除：如果蛇头不在屏幕内，跳过整条蛇
            if (snake.x < viewportLeft - CONFIG.SNAKE.SEGMENT_SIZE * 3 || 
                snake.x > viewportRight + CONFIG.SNAKE.SEGMENT_SIZE * 3 || 
                snake.y < viewportTop - CONFIG.SNAKE.SEGMENT_SIZE * 3 || 
                snake.y > viewportBottom + CONFIG.SNAKE.SEGMENT_SIZE * 3) {
                return;
            }
            
            this.drawSnake(snake);
        });

        // 绘制粒子
        this.renderParticles();

        ctx.restore();
        } // 闭合摄像机变换的 if 语句
    }

    drawSnake(snake) {
        const ctx = this.ctx;
        const skin = SKINS[snake.skin];

        // 玩家蛇视觉强化效果
        if (snake.isPlayer) {
            // 多层发光效果
            ctx.shadowBlur = 30;
            ctx.shadowColor = skin.colors[0];
        }

        // 绘制身体（简化版 - 无鳞片）
        for (let i = snake.segments.length - 1; i >= 0; i--) {
            const seg = snake.segments[i];
            const progress = i / snake.segments.length;
            const colorIndex = Math.floor(progress * (skin.colors.length - 1));

            // 应用皮肤动态效果
            let color = skin.colors[colorIndex];
            let extraSize = 0;
            
            // 彩虹效果 - 所有皮肤都带有一点彩虹渐变（仅玩家蛇）
            if (snake.isPlayer) {
                const rainbowShift = Date.now() / 50;
                const hslColor = hexToHsl(color);
                const newHue = (hslColor.h + rainbowShift) % 360;
                color = `hsl(${newHue}, ${hslColor.s}%, ${hslColor.l}%)`;
            }

            switch (skin.effect) {
                case 'neon':
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = color;
                    break;
                case 'glow':
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = color;
                    break;
                case 'fire':
                    const flicker = Math.sin(Date.now() / 50 + i * 0.1) * 0.2 + 1;
                    ctx.fillStyle = color;
                    extraSize = 4 * flicker;
                    break;
                case 'rainbow':
                    color = `hsl(${(Date.now() / 20 + i * 5) % 360}, 70%, 60%)`;
                    break;
                case 'stars':
                    const starFlicker = Math.sin(Date.now() / 100 + i * 0.3) * 0.5 + 0.5;
                    if (starFlicker > 0.8) {
                        ctx.shadowBlur = 25;
                        ctx.shadowColor = '#FFFFFF';
                    }
                    break;
                case 'shimmer':
                    const shimmer = Math.sin(Date.now() / 200 + i * 0.2) * 0.3;
                    ctx.globalAlpha = 0.7 + shimmer;
                    break;
                case 'sparkle':
                    if (Math.random() < 0.08) {
                        ctx.fillStyle = '#FFFFFF';
                    }
                    break;
                case 'gradient':
                    const gradient = ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, CONFIG.SNAKE.SEGMENT_SIZE);
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(0.6, adjustColor(color, -20));
                    gradient.addColorStop(1, adjustColor(color, -40));
                    ctx.fillStyle = gradient;
                    break;
                case 'aurora':
                    const auroraColor1 = `hsla(${(Date.now() / 30 + i * 2) % 360}, 80%, 60%, 0.8)`;
                    const auroraColor2 = `hsla(${(Date.now() / 30 + i * 2 + 60) % 360}, 80%, 60%, 0.6)`;
                    const auroraGradient = ctx.createLinearGradient(
                        seg.x - CONFIG.SNAKE.SEGMENT_SIZE, 
                        seg.y - CONFIG.SNAKE.SEGMENT_SIZE,
                        seg.x + CONFIG.SNAKE.SEGMENT_SIZE, 
                        seg.y + CONFIG.SNAKE.SEGMENT_SIZE
                    );
                    auroraGradient.addColorStop(0, auroraColor1);
                    auroraGradient.addColorStop(1, auroraColor2);
                    ctx.fillStyle = auroraGradient;
                    break;
            }

            const segmentRadius = CONFIG.SNAKE.SEGMENT_SIZE * (1 - progress * 0.15) + extraSize;
            
            // 绘制光滑的圆形身体
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, segmentRadius, 0, Math.PI * 2);
            
            // 使用渐变色增加立体感（3D 球体效果）
            if (!ctx.fillStyle || skin.effect === 'rainbow' || skin.effect === 'aurora') {
                // 创建径向渐变模拟光照
                const gradient = ctx.createRadialGradient(
                    seg.x - segmentRadius/4,
                    seg.y - segmentRadius/4,
                    0,
                    seg.x,
                    seg.y,
                    segmentRadius
                );
                gradient.addColorStop(0, adjustColor(color, 40));  // 高光
                gradient.addColorStop(0.7, color);                 // 主色
                gradient.addColorStop(1, adjustColor(color, -30)); // 阴影
                ctx.fillStyle = gradient;
            }
            ctx.fill();

            // 添加一层光泽（玩家蛇特有）
            if (snake.isPlayer) {
                ctx.beginPath();
                ctx.arc(seg.x - segmentRadius/3, seg.y - segmentRadius/3, segmentRadius * 0.25, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fill();
            }

            // 边框效果 - 玩家蛇更亮
            ctx.strokeStyle = snake.isPlayer ? 
                'rgba(255, 255, 255, 0.6)' : 
                'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = snake.isPlayer ? 2 : 1.5;
            ctx.stroke();

            // 重置效果
            ctx.globalAlpha = 1;
            ctx.shadowBlur = snake.isPlayer ? 30 : 0;
        }

        // 绘制头部（玩家蛇特别强化）
        const headRadius = CONFIG.SNAKE.HEAD_RADIUS + (snake.isPlayer ? 3 : 0);

        // 头部底层 - 使用渐变增加立体感
        ctx.beginPath();
        ctx.arc(snake.x, snake.y, headRadius, 0, Math.PI * 2);
        
        // 头部渐变色 - 3D 立体效果
        const headGradient = ctx.createRadialGradient(
            snake.x - headRadius/3, 
            snake.y - headRadius/3, 
            0,
            snake.x, 
            snake.y, 
            headRadius
        );
        headGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        headGradient.addColorStop(0.3, skin.colors[0]);
        headGradient.addColorStop(1, adjustColor(skin.colors[0], -30));
        ctx.fillStyle = headGradient;
        ctx.fill();

        // 玩家蛇头部多层光环
        if (snake.isPlayer) {
            // 内层光环
            ctx.beginPath();
            ctx.arc(snake.x, snake.y, headRadius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 230, 109, 0.8)';
            ctx.lineWidth = 4;
            ctx.stroke();

            // 外层动态脉冲光环
            const pulse = Math.sin(Date.now() / 200) * 4;
            ctx.beginPath();
            ctx.arc(snake.x, snake.y, headRadius + 10 + pulse, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 230, 109, ${0.5 + Math.sin(Date.now() / 300) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 最外层光晕
            const outerGlow = ctx.createRadialGradient(
                snake.x, snake.y, headRadius,
                snake.x, snake.y, headRadius + 20
            );
            outerGlow.addColorStop(0, 'rgba(255, 230, 109, 0.3)');
            outerGlow.addColorStop(1, 'rgba(255, 230, 109, 0)');
            ctx.beginPath();
            ctx.arc(snake.x, snake.y, headRadius + 20, 0, Math.PI * 2);
            ctx.fillStyle = outerGlow;
            ctx.fill();
        }

        // 眼睛
        const eyeOffset = 5;
        const eyeAngle1 = snake.angle - 0.5;
        const eyeAngle2 = snake.angle + 0.5;

        // 眼白
        ctx.beginPath();
        ctx.arc(
            snake.x + Math.cos(eyeAngle1) * eyeOffset,
            snake.y + Math.sin(eyeAngle1) * eyeOffset,
            3, 0, Math.PI * 2
        );
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
            snake.x + Math.cos(eyeAngle2) * eyeOffset,
            snake.y + Math.sin(eyeAngle2) * eyeOffset,
            3, 0, Math.PI * 2
        );
        ctx.fillStyle = 'white';
        ctx.fill();

        // 瞳孔（玩家蛇更明显）
        const pupilSize = snake.isPlayer ? 2 : 1.5;
        const pupilOffset = eyeOffset + 1;

        ctx.beginPath();
        ctx.arc(
            snake.x + Math.cos(eyeAngle1) * pupilOffset,
            snake.y + Math.sin(eyeAngle1) * pupilOffset,
            pupilSize, 0, Math.PI * 2
        );
        ctx.fillStyle = snake.isPlayer ? '#FF6B6B' : '#000000';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
            snake.x + Math.cos(eyeAngle2) * pupilOffset,
            snake.y + Math.sin(eyeAngle2) * pupilOffset,
            pupilSize, 0, Math.PI * 2
        );
        ctx.fillStyle = snake.isPlayer ? '#FF6B6B' : '#000000';
        ctx.fill();

        // 无敌效果
        if (snake.invincible > 0) {
            ctx.beginPath();
            ctx.arc(snake.x, snake.y, CONFIG.SNAKE.HEAD_RADIUS + 12, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // 重置阴影
        ctx.shadowBlur = 0;
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
        this.frozen = 0;      // 冰冻状态（秒）
        this.hasSpeedBoost = false;  // 是否有速度豆豆增益
        this.reversed = 0;    // 反向控制状态（毫秒）
        this.invincibleMode = 0;  // 无敌模式（毫秒）
    }

    move(speed, bounds, deltaTime = 16) {
        // 更新状态（使用 deltaTime 保证时间一致性）- 必须在最前面，确保即使冰冻也会更新
        if (this.speedBoost < 0) this.speedBoost += deltaTime;
        if (this.invincible > 0) this.invincible -= deltaTime;
        if (this.reversed > 0) this.reversed -= deltaTime;  // 反向状态递减
        if (this.invincibleMode > 0) this.invincibleMode -= deltaTime;  // 无敌状态递减
        
        // 如果处于冰冻状态，不能移动
        if (this.frozen > 0) {
            this.frozen -= deltaTime / 1000;
            if (this.frozen < 0) this.frozen = 0;
            return;  // 静止不动
        }
        
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

// ===== 辅助函数 =====
// HEX 转 RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '78, 205, 196';
}

// HEX 转 HSL
function hexToHsl(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt('0x' + hex[1] + hex[1]);
        g = parseInt('0x' + hex[2] + hex[2]);
        b = parseInt('0x' + hex[3] + hex[3]);
    } else if (hex.length === 7) {
        r = parseInt('0x' + hex[1] + hex[2]);
        g = parseInt('0x' + hex[3] + hex[4]);
        b = parseInt('0x' + hex[5] + hex[6]);
    }
    r /= 255; g /= 255; b /= 255;
    const cmin = Math.min(r, g, b);
    const cmax = Math.max(r, g, b);
    const delta = cmax - cmin;
    let h = 0, s = 0, l = 0;
    
    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
    
    return { h, s, l };
}

// 调整颜色亮度
function adjustColor(hex, amount) {
    let color = hex.replace(/#/g, '');
    if (color.length === 3) color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    
    let num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    let b = ((num >> 8) & 0x00FF) + amount;
    let g = (num & 0x0000FF) + amount;
    
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    
    return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
}
