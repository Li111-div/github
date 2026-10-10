/* ============================================================
   config.js — 全局配置与常量
   ============================================================ */
(function (GM) {
  'use strict';

  GM.CONFIG = {
    /* 棋盘规格 */
    BOARD_SIZE: 15,          // 15 × 15
    WIN_COUNT: 5,            // 连成 5 子获胜

    /* 星位坐标 [x, y]（0 起算） */
    STARS: [[3, 3], [11, 3], [3, 11], [11, 11], [7, 7]],

    /* ------------------------------------------------------------
       ICE 服务器
       局域网直连只需 host candidate，无需 STUN，因此默认为空数组，
       ICE 收集可瞬间完成、建连最快。
       如需跨网络（不在同一 Wi-Fi）使用，请填入 STUN / TURN，例如：
         ICE_SERVERS: [
           { urls: 'stun:stun.l.google.com:19302' },
           { urls: 'turn:你的服务器:3478', username: 'user', credential: 'pass' }
         ]
       ------------------------------------------------------------ */
    ICE_SERVERS: [],

    /* 等待 ICE 收集完成的超时（毫秒） */
    ICE_GATHER_TIMEOUT: 2500,

    /* 信令文本前缀与版本 */
    SIGNAL_TAG: 'GOMOKU',
    SIGNAL_VERSION: 1,

    /* 本地存储键名 */
    KEY_THEME: 'gomoku.theme',
    KEY_SOUND: 'gomoku.sound',
    KEY_COORDS: 'gomoku.coords',

    /* 单条消息最大长度 */
    CHAT_MAX_LENGTH: 60,

    /* 请求全量同步的最小间隔（毫秒），防止同步风暴 */
    SYNC_REQUEST_INTERVAL: 3000,

    /* 等待对手响应请求的超时（毫秒） */
    REQUEST_TIMEOUT: 15000
  };

  /* 棋盘配色：随主题切换 */
  GM.BOARD_THEMES = {
    light: {
      bgFrom:  '#f2dcb8',
      bgTo:    '#e0bd8c',
      grain:   'rgba(150, 108, 60, .10)',
      line:    'rgba(126, 88, 46, .55)',
      border:  'rgba(104, 70, 34, .70)',
      star:    'rgba(104, 70, 34, .85)',
      coord:   'rgba(112, 78, 42, .70)',
      winRing: 'rgba(224, 75, 75, .95)',
      winGlow: 'rgba(224, 75, 75, .28)',
      markOnDark:  '#f5f5f2',
      markOnLight: '#20242e'
    },
    dark: {
      bgFrom:  '#3a3227',
      bgTo:    '#2a2419',
      grain:   'rgba(255, 220, 170, .045)',
      line:    'rgba(214, 180, 132, .26)',
      border:  'rgba(214, 180, 132, .40)',
      star:    'rgba(214, 180, 132, .55)',
      coord:   'rgba(206, 176, 134, .50)',
      winRing: 'rgba(255, 118, 118, .95)',
      winGlow: 'rgba(255, 118, 118, .26)',
      markOnDark:  '#f5f5f2',
      markOnLight: '#20242e'
    }
  };

  /* 消息类型常量（网络协议） */
  GM.MSG = {
    HELLO:    'hello',      // 握手：告知身份
    MOVE:     'move',       // 落子 {x, y}
    RESTART:  'restart',    // 重新开始请求
    UNDO:     'undo',       // 悔棋请求
    RESULT:   'result',     // 对请求的回应 {accept}
    SURRENDER:'surrender',  // 认输
    CHAT:     'chat',       // 聊天消息 {text}
    TYPING:   'typing',     // 正在输入提示
    SYNC:     'sync',       // 全量同步（异常恢复用）
    BYE:      'bye'         // 主动退出
  };

})(window.GM = window.GM || {});
