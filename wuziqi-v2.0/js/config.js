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
       为什么不能留空：页面没有申请摄像头 / 麦克风权限时，Chrome 会把
       host candidate 里的内网 IP 混淆成 mDNS 名（形如 9c4f1a02-….local）。
       这种候选必须靠局域网多播 DNS 才能解析，一旦路由器开了 AP 隔离、
       屏蔽多播，或两台设备跨网段 / 跨浏览器，就解析失败 → 没有可用候选对。
       配上 STUN 后会额外收集 srflx 候选作为兜底，显著提升建连成功率。

       ⚠️ 只填「实测能响应」的服务器。任何一个不响应的 STUN 都会让
       iceGatheringState 永远停在 gathering，导致每次生成邀请码都要
       干等到 ICE_GATHER_TIMEOUT 才截断（实测混入 stun.qq.com 后，
       生成耗时从 0.6s 涨到 3.8s，且后续候选会被丢弃）。
       下面三个均为实测可达（首个 srflx 约 40~50ms，收集完成约 130ms）。

       跨网络（不在同一 Wi-Fi）对战时还需自备 TURN 中继：
         { urls: 'turn:你的服务器:3478', username: 'user', credential: 'pass' }
       ------------------------------------------------------------ */
    ICE_SERVERS: [
      { urls: 'stun:stun.miwifi.com:3478' },
      { urls: 'stun:stun.chat.bilibili.com:3478' },
      { urls: 'stun:stun.hitv.com:3478' }
    ],

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
    REQUEST_TIMEOUT: 15000,

    /* 房主提交回传码后，等待数据通道打通的最长时间（毫秒）。
       超时即判定两端网络打不通 —— 没有这道闸，用户会永远停在
       「握手完成，正在打通数据通道…」上，看不出是失败还是慢。 */
    HANDSHAKE_TIMEOUT: 15000,

    /* 挑战者生成回传码后，等待房主确认的最长时间（毫秒）。
       比 HANDSHAKE_TIMEOUT 宽松得多：房主得先收到回传码、粘贴、再点确认，
       中间隔着聊天软件，慢一点是正常的，不能过早判失败。 */
    HANDSHAKE_WAIT_HOST: 90000
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
