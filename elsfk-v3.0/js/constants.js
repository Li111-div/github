/**
 * 经典俄罗斯方块 - 核心游戏逻辑
 * 遵循原版 Game Boy 版俄罗斯方块机制
 */

// ==================== 常量定义 ====================

// 游戏区域尺寸（标准 20 行 x10 列）
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30; // 每个方块的像素大小

// 预览区尺寸（4x4）
const PREVIEW_SIZE = 4;
const PREVIEW_BLOCK_SIZE = 25;

// 7 种经典方块定义（使用简化版 SRS 旋转系统）
// 每种方块有 4 个旋转状态，按顺时针排列
// Lv0 - 经典初始配色（原生配色）
const TETROMINOES = {
    I: {
        shapes: [
            [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // 状态 0
            [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]], // 状态 1
            [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]], // 状态 2
            [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]  // 状态 3
        ],
        color: '#00FFFF' // 浅青色 - 经典配色
    },
    O: {
        shapes: [
            [[1,1], [1,1]], // O 方块只有 1 个状态（旋转不变）
            [[1,1], [1,1]],
            [[1,1], [1,1]],
            [[1,1], [1,1]]
        ],
        color: '#FFFF00' // 亮黄色 - 经典配色
    },
    T: {
        shapes: [
            [[0,1,0], [1,1,1], [0,0,0]], // 状态 0
            [[0,1,0], [0,1,1], [0,1,0]], // 状态 1
            [[0,0,0], [1,1,1], [0,1,0]], // 状态 2
            [[0,1,0], [1,1,0], [0,1,0]]  // 状态 3
        ],
        color: '#800080' // 紫色 - 经典配色
    },
    L: {
        shapes: [
            [[0,0,1], [1,1,1], [0,0,0]], // 状态 0
            [[0,1,0], [0,1,0], [0,1,1]], // 状态 1
            [[0,0,0], [1,1,1], [1,0,0]], // 状态 2
            [[1,1,0], [0,1,0], [0,1,0]]  // 状态 3
        ],
        color: '#FFA500' // 橙色 - 经典配色
    },
    J: {
        shapes: [
            [[1,0,0], [1,1,1], [0,0,0]], // 状态 0
            [[0,1,0], [0,1,0], [1,1,0]], // 状态 1
            [[0,0,0], [1,1,1], [0,0,1]], // 状态 2
            [[0,1,1], [0,1,0], [0,1,0]]  // 状态 3
        ],
        color: '#0000FF' // 深蓝色 - 经典配色
    },
    S: {
        shapes: [
            [[0,1,1], [1,1,0], [0,0,0]], // 状态 0
            [[0,1,0], [0,1,1], [0,0,1]], // 状态 1
            [[0,0,0], [0,1,1], [1,1,0]], // 状态 2
            [[1,0,0], [1,1,0], [0,1,0]]  // 状态 3
        ],
        color: '#00FF00' // 亮绿色 - 经典配色
    },
    Z: {
        shapes: [
            [[1,1,0], [0,1,1], [0,0,0]], // 状态 0
            [[0,0,1], [0,1,1], [0,1,0]], // 状态 1
            [[0,0,0], [1,1,0], [0,1,1]], // 状态 2
            [[0,1,0], [1,1,0], [1,0,0]]  // 状态 3
        ],
        color: '#FF0000' // 正红色 - 经典配色
    }
};

// 10 个等级的主题配色方案
const LEVEL_THEMES = [
    // Lv0 - 经典初始配色
    {
        name: 'classic',
        colors: {
            I: '#00FFFF', // 浅青色
            O: '#FFFF00', // 亮黄色
            T: '#800080', // 紫色
            L: '#FFA500', // 橙色
            J: '#0000FF', // 深蓝色
            S: '#00FF00', // 亮绿色
            Z: '#FF0000'  // 正红色
        },
        uiColors: {
            gameBg: '#000000',
            gameBorder: '#FFFFFF',
            panelBg: '#333333',
            panelBorder: '#666666',
            textPrimary: '#FFFFFF',
            textSecondary: '#CCCCCC',
            themePrimary: '#FFFFFF',
            themeAccent1: '#00FFFF',
            themeAccent2: '#FF00FF',
            themeAccent3: '#FFFF00',
            themeAccent4: '#00FF00'
        }
    },
    // Lv1 - 暖红橙主题
    {
        name: 'warm-red-orange',
        colors: {
            I: '#FF6B6B', // 浅红（降低青色饱和度）
            O: '#FFD93D', // 暖黄（提升亮度）
            T: '#FF8E72', // 粉紫（暖调）
            L: '#FF9F45', // 橙色（提升亮度）
            J: '#6BB6FF', // 浅蓝（降低蓝色饱和度）
            S: '#95E1D3', // 浅绿（降低饱和度）
            Z: '#FF4757'  // 红色（提升亮度）
        },
        uiColors: {
            gameBg: '#1a0a0a',
            gameBorder: '#FF6B6B',
            panelBg: '#2a1510',
            panelBorder: '#FF8E72',
            textPrimary: '#FFE5E5',
            textSecondary: '#FFB5B5',
            themePrimary: '#FFD93D',
            themeAccent1: '#FF6B6B',
            themeAccent2: '#FF8E72',
            themeAccent3: '#FFD93D',
            themeAccent4: '#FF9F45'
        }
    },
    // Lv2 - 大地棕绿主题
    {
        name: 'earth-brown-green',
        colors: {
            I: '#A8D5BA', // 橄榄绿（低亮度）
            O: '#E8D5B5', // 土黄（低亮度）
            T: '#B58974', // 棕色（沉稳）
            L: '#D4A574', // 暗橙（厚重）
            J: '#8B7355', // 褐蓝（暗调）
            S: '#6B8E23', // 橄榄绿（沉稳）
            Z: '#A0522D'  // 赭色（厚重）
        },
        uiColors: {
            gameBg: '#0f0f0a',
            gameBorder: '#A8D5BA',
            panelBg: '#1a1815',
            panelBorder: '#8B7355',
            textPrimary: '#E8D5B5',
            textSecondary: '#B5A890',
            themePrimary: '#D4A574',
            themeAccent1: '#A8D5BA',
            themeAccent2: '#B58974',
            themeAccent3: '#E8D5B5',
            themeAccent4: '#6B8E23'
        }
    },
    // Lv3 - 冷蓝深海主题
    {
        name: 'cold-blue-deep-sea',
        colors: {
            I: '#87CEEB', // 天蓝色（冷调）
            O: '#B0E0E6', // 浅蓝（冷感）
            T: '#4682B4', // 钢蓝（冷色系）
            L: '#5F9EA0', // 青蓝（冷调）
            J: '#00008B', // 深蓝（主导）
            S: '#20B2AA', // 浅海绿（冷调）
            Z: '#8B0000'  // 暗红（低饱和）
        },
        uiColors: {
            gameBg: '#0a0f1a',
            gameBorder: '#87CEEB',
            panelBg: '#101820',
            panelBorder: '#4682B4',
            textPrimary: '#E5F0FF',
            textSecondary: '#B5D0FF',
            themePrimary: '#87CEEB',
            themeAccent1: '#87CEEB',
            themeAccent2: '#4682B4',
            themeAccent3: '#B0E0E6',
            themeAccent4: '#20B2AA'
        }
    },
    // Lv4 - 橙黄暖阳主题
    {
        name: 'orange-yellow-warm-sun',
        colors: {
            I: '#FFE4B5', // 浅橙（柔和）
            O: '#FFD700', // 金黄（核心）
            T: '#DDA0DD', // 梅红（点缀）
            L: '#FF8C00', // 深橙（核心）
            J: '#BDB76B', // 暗黄绿（暗调）
            S: '#556B2F', // 暗橄榄绿（暗调）
            Z: '#CD5C5C'  // 印度红（暗调）
        },
        uiColors: {
            gameBg: '#1a120a',
            gameBorder: '#FFD700',
            panelBg: '#251810',
            panelBorder: '#FF8C00',
            textPrimary: '#FFF5E0',
            textSecondary: '#FFD5A0',
            themePrimary: '#FFD700',
            themeAccent1: '#FFE4B5',
            themeAccent2: '#FF8C00',
            themeAccent3: '#FFD700',
            themeAccent4: '#DDA0DD'
        }
    },
    // Lv5 - 粉紫洋红主题
    {
        name: 'pink-purple-magenta',
        colors: {
            I: '#FFB6C1', // 浅粉（柔和）
            O: '#FFC0CB', // 粉色（艳丽）
            T: '#DA70D6', // 兰花紫（核心）
            L: '#EE82EE', // 紫罗兰（核心）
            J: '#8B008B', // 深洋红（主导）
            S: '#2F4F4F', // 暗岩灰（暗调）
            Z: '#C71585'  // 中紫红（艳丽）
        },
        uiColors: {
            gameBg: '#1a0a15',
            gameBorder: '#EE82EE',
            panelBg: '#201018',
            panelBorder: '#DA70D6',
            textPrimary: '#FFE5F5',
            textSecondary: '#FFB5E0',
            themePrimary: '#EE82EE',
            themeAccent1: '#FFB6C1',
            themeAccent2: '#DA70D6',
            themeAccent3: '#FFC0CB',
            themeAccent4: '#C71585'
        }
    },
    // Lv6 - 亮绿清新主题
    {
        name: 'bright-green-fresh',
        colors: {
            I: '#98FB98', // 柠檬绿（明亮）
            O: '#FAFAD2', // 浅金黄（提亮）
            T: '#BA55D3', // 中兰花紫（点缀）
            L: '#32CD32', // 酸橙绿（核心）
            J: '#00FA9A', // 中春绿（清新）
            S: '#7CFC00', // 草地绿（最亮）
            Z: '#B22222'  // 砖红（低饱和）
        },
        uiColors: {
            gameBg: '#0a150a',
            gameBorder: '#7CFC00',
            panelBg: '#101810',
            panelBorder: '#32CD32',
            textPrimary: '#E5FFE5',
            textSecondary: '#B5FFB5',
            themePrimary: '#7CFC00',
            themeAccent1: '#98FB98',
            themeAccent2: '#32CD32',
            themeAccent3: '#FAFAD2',
            themeAccent4: '#00FA9A'
        }
    },
    // Lv7 - 青蓝冷冽主题
    {
        name: 'cyan-blue-cold',
        colors: {
            I: '#00FFFF', // 青色（主导）
            O: '#ADD8E6', // 浅蓝（清爽）
            T: '#5F9EA0', // 军服蓝（冷调）
            L: '#48D1CC', // 中绿松石（冷冽）
            J: '#00BFFF', // 深天蓝（主导）
            S: '#40E0D0', // 绿松石（冷色）
            Z: '#FF6347'  // 番茄红（极低饱和）
        },
        uiColors: {
            gameBg: '#0a151a',
            gameBorder: '#00FFFF',
            panelBg: '#101820',
            panelBorder: '#00BFFF',
            textPrimary: '#E5F5FF',
            textSecondary: '#B5E0FF',
            themePrimary: '#00FFFF',
            themeAccent1: '#00FFFF',
            themeAccent2: '#00BFFF',
            themeAccent3: '#ADD8E6',
            themeAccent4: '#48D1CC'
        }
    },
    // Lv8 - 深紫暗调主题
    {
        name: 'deep-purple-dark',
        colors: {
            I: '#9370DB', // 中紫（暗调）
            O: '#FFD700', // 金黄（高亮点缀）
            T: '#8A2BE2', // 蓝紫（核心）
            L: '#9932CC', // 暗兰花紫（核心）
            J: '#4B0082', // 靛蓝（深邃）
            S: '#8B008B', // 深洋红（暗调）
            Z: '#483D8B'  // 深板岩蓝（暗调）
        },
        uiColors: {
            gameBg: '#0f0a15',
            gameBorder: '#8A2BE2',
            panelBg: '#181020',
            panelBorder: '#4B0082',
            textPrimary: '#F0E5FF',
            textSecondary: '#D0B5FF',
            themePrimary: '#8A2BE2',
            themeAccent1: '#9370DB',
            themeAccent2: '#8A2BE2',
            themeAccent3: '#FFD700',
            themeAccent4: '#9932CC'
        }
    },
    // Lv9 - 深绿沉稳主题
    {
        name: 'deep-green-steady',
        colors: {
            I: '#2F4F4F', // 暗岩灰（沉稳）
            O: '#DAA520', // 金麒麟（少量点缀）
            T: '#556B2F', // 暗橄榄绿（主导）
            L: '#696969', // 暗灰（低调）
            J: '#006400', // 深绿（核心）
            S: '#808000', // 橄榄色（沉稳）
            Z: '#8B4513'  // 鞍褐（暗调）
        },
        uiColors: {
            gameBg: '#0a0f0a',
            gameBorder: '#556B2F',
            panelBg: '#101510',
            panelBorder: '#006400',
            textPrimary: '#D5E5D5',
            textSecondary: '#A5C0A5',
            themePrimary: '#556B2F',
            themeAccent1: '#2F4F4F',
            themeAccent2: '#556B2F',
            themeAccent3: '#DAA520',
            themeAccent4: '#006400'
        }
    }
];

// 方块类型数组（用于随机生成）
const TETROMINO_TYPES = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];

// 经典计分规则（Game Boy 版）
const SCORE_TABLE = {
    1: 100,   // 单行
    2: 300,   // 双行
    3: 500,   // 三行
    4: 800    // 四行 (Tetris)
};

// Game Boy 版速度曲线（每帧下落间隔，单位毫秒）
// 等级越高，间隔越短，下落越快
let SPEED_CURVE = [
    800, 750, 700, 650, 600, 550, 500, 450, 400, 350, // Level 0-9
    300, 280, 260, 240, 220, 200, 180, 160, 140, 120, // Level 10-19
    100, 90, 80, 70, 60, 50, 40, 30, 20, 10           // Level 20-29
];

// 当前难度
let currentDifficulty = 'normal';

// ==================== 游戏状态变量 ====================

let canvas, ctx;           // 主画布
let nextCanvas, nextCtx;   // 预览画布
let nextNextCanvas, nextNextCtx; // 下下一个预览画布
let board = [];            // 游戏面板数据（20x10）
let currentPiece = null;   // 当前方块
let nextPieceType = null;  // 下一个方块类型
let nextNextPieceType = null; // 下下一个方块类型
let score = 0;             // 得分
let level = 0;             // 等级
let lines = 0;             // 消除行数
let isPaused = false;      // 暂停状态
let isGameOver = false;    // 游戏结束状态
let dropTimer = null;      // 下落定时器 ID
let animationFrameId = null; // 动画帧 ID
let gameHistory = [];      // 历史记录

// 游戏设置
let gameSettings = {
    background: 'grid',    // 背景类型
    volume: 50,            // 音量 0-100
    blockStyle: 'classic'  // 方块样式
};
