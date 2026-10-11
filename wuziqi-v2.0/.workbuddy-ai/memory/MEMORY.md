# 项目长期记忆 · wuziqi-v2.0（双人五子棋 · 局域网联机）

## 项目性质
纯前端零依赖的五子棋，`file://` 直接打开即可玩。联机走 WebRTC DataChannel，
信令靠「邀请码 / 回传码」人工经聊天软件交换，无任何后端。

## 关键约定
- **STUN 列表只填实测能响应的服务器。** 任何一个不响应的 STUN 都会让
  `iceGatheringState` 永远停在 `gathering`，导致每次生成邀请码都要干等到
  `ICE_GATHER_TIMEOUT` 才截断（候选还会被丢弃）。
- 实测可达（2026-10-11，约 40~50ms 返回 srflx）：
  `stun.miwifi.com:3478`、`stun.chat.bilibili.com:3478`、`stun.hitv.com:3478`
- 实测**不可用**（无响应，会让收集永不完成）：`stun.qq.com:3478`、`stun.syncthing.net:3478`
- 为什么不能留空 ICE_SERVERS：页面没有媒体权限时，Chrome 会把 host candidate 的
  内网 IP 混淆成 mDNS 名（`xxxx.local`），跨设备解析依赖多播 DNS，容易被
  AP 隔离 / 屏蔽多播 / 跨网段打断。srflx 是必要的兜底。
  （README 里「局域网不需要 STUN」的说法对现代 Chrome 已过时。）

## 已修问题（2026-10-11，详见 docs/REVIEW_CHECKLIST.md #19~23）
1. ~~连接失败提示不可见~~ → 新增 `_failHandshake()`，提示写进**当前页**内联状态 + Toast
2. ~~`_hostAcceptAnswer` 成功分支不恢复按钮~~ → 立即恢复；并加握手看门狗
   `_startHandshakeTimer()`（`CONFIG.HANDSHAKE_TIMEOUT` 15s / `HANDSHAKE_WAIT_HOST` 90s）
3. ~~旧连接残留导致 `wrong state: stable`~~ → `_startHost` / `_startGuest` 与
   `Views` 守卫（`from === 'host' | 'guest'`）都调用 `_teardownLink()`
4. ~~英文异常直透用户~~ → `peer.js` 前置校验 `signalingState === 'have-local-offer'`；
   `app.js` 新增 `_readableError(err)` 统一翻译

## 新增约定
- **失败提示必须写到用户当前所在的视图**。`#board-banner` 在 `#view-game` 内部，
  非对局页时 `.view` 是 `display:none`，写进去等于没提示。
- **异常不要直接 `err.message` 透给用户**，走 `App._readableError()`。
- 所有定时器都要有清理路径：`_clearHandshakeTimer()` 挂在 `_teardownLink` 上，
  而 `_teardownLink` 又在 `_teardownSession` / `_ensureLink` / `_startHost` / `_startGuest` /
  视图守卫里被调用，因此不会漏清。

## 仍未验证
真实两台设备 + 真实 Wi-Fi。同机回环 ICE 仍选中 `host <-> host`，`srflx` 是备用路径。

## 排查手法（可复用）
本机可用 Playwright（`C:/Users/31009/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe`，
包在 `C:/Users/31009/AppData/Roaming/npm/node_modules/@playwright/mcp/node_modules/playwright`）
起两个独立浏览器进程，脚本化走完「生成邀请码 → 生成回传码 → 确认连接」全流程。
注意：同机回环时 ICE 会选中 `host <-> host`，**真机双设备行为无法在本机验证**。
