/* ============================================================
   app.js — 主控制器：串联界面、棋局、渲染与网络
   ============================================================ */
(function (GM) {
  'use strict';

  const C = GM.CONFIG;
  const MSG = GM.MSG;
  const $ = GM.$;
  const $$ = GM.$$;

  const App = {

    /* ---------------- 状态 ---------------- */
    mode: 'idle',          // idle | host | guest | local
    myColor: 1,            // 1 黑 / 2 白
    game: null,
    renderer: null,
    link: null,
    pending: null,         // 已发出、等待对方回应的请求
    _reqTimer: null,
    _press: null,
    _leaving: false,
    _n: null,              // DOM 节点缓存
    _ro: null,             // ResizeObserver 实例
    _logScrollRaf: null,   // 对局记录滚动合并
    _chatScrollRaf: null,  // 聊天滚动合并
    _lastSyncReq: 0,       // 上次请求全量同步的时间
    _orientationTimer: null,

    /* ================= 初始化 ================= */
    init: function () {
      this.game = new GM.Game();
      this.renderer = new GM.Renderer($('#board'), this.game);

      this._buildNodeCache();
      this._initTheme();
      this._initSound();
      this._initCoords();
      this._bindNav();
      this._bindTopbar();
      this._bindModeCards();
      this._bindHostView();
      this._bindGuestView();
      this._bindGameView();
      this._bindBoard();
      this._bindBoardResize();
      this._bindMessageInput();
      this._initViewGuard();

      GM.Views.show('home', true);
    },

    /* ================= 节点缓存与最小化写入 =================
       _updateConn / _syncControls 会在 ICE 状态变化时被高频调用，
       每次都查询 DOM 并写属性会造成不必要的重排，因此这里统一缓存节点，
       并且只在值真正变化时才写回。 */
    _buildNodeCache: function () {
      const connPill = $('#conn-pill');

      this._n = {
        connPill: connPill,
        connText: connPill ? $('.conn-text', connPill) : null,
        chatDot: $('#chat-dot'),
        chatPeer: $('#chat-peer'),
        msgInput: $('#msg-input'),
        msgSend: $('#btn-send-msg'),
        btnSurrender: $('#btn-surrender'),
        btnUndo: $('#btn-undo'),
        btnRestart: $('#btn-restart'),
        statMoves: $('#stat-moves'),
        statTurn: $('#stat-turn'),
        gameLog: $('#game-log'),
        chatBody: $('#chat-body'),
        me: this._cachePlayer($('#p-me')),
        op: this._cachePlayer($('#p-op'))
      };
    },

    _cachePlayer: function (card) {
      if (!card) return null;
      return {
        card: card,
        name: $('.player-name', card),
        color: $('.player-color', card),
        pill: $('.turn-pill', card)
      };
    },

    _setText: function (node, text) {
      if (node && node.textContent !== text) node.textContent = text;
    },

    _setClass: function (node, cls, on) {
      if (!node) return;
      const want = !!on;
      if (node.classList.contains(cls) !== want) node.classList.toggle(cls, want);
    },

    _setClassName: function (node, name) {
      if (node && node.className !== name) node.className = name;
    },

    _setDisabled: function (node, disabled) {
      if (node && node.disabled !== disabled) node.disabled = disabled;
    },

    /* ================= 主题 ================= */
    _initTheme: function () {
      let theme = GM.store.get(C.KEY_THEME, null);
      if (!theme) {
        theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
          ? 'dark' : 'light';
      }
      this._applyTheme(theme);
    },

    _applyTheme: function (theme) {
      document.documentElement.setAttribute('data-theme', theme);
      this.theme = theme;
      this.renderer.setTheme(theme);
      GM.store.set(C.KEY_THEME, theme);
    },

    /* ================= 音效 ================= */
    _initSound: function () {
      GM.Sound.enabled = GM.store.get(C.KEY_SOUND, '1') === '1';
      this._syncSoundButton();
    },

    _syncSoundButton: function () {
      $('#btn-sound').classList.toggle('is-off', !GM.Sound.enabled);
      $('#btn-sound').title = GM.Sound.enabled ? '音效：开' : '音效：关';
    },

    /* ================= 坐标开关 ================= */
    _initCoords: function () {
      const on = GM.store.get(C.KEY_COORDS, '1') === '1';
      $('#chk-coords').checked = on;
      this.renderer.setCoords(on);
    },

    /* ================= 导航绑定 ================= */
    _bindNav: function () {
      const self = this;
      $$('[data-nav]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          GM.Views.show(btn.getAttribute('data-nav'));
        });
      });
    },

    _bindTopbar: function () {
      const self = this;

      $('#btn-theme').addEventListener('click', function () {
        self._applyTheme(self.theme === 'dark' ? 'light' : 'dark');
        GM.Sound.play('click');
      });

      $('#btn-sound').addEventListener('click', function () {
        GM.Sound.enabled = !GM.Sound.enabled;
        GM.store.set(C.KEY_SOUND, GM.Sound.enabled ? '1' : '0');
        self._syncSoundButton();
        if (GM.Sound.enabled) GM.Sound.play('click');
      });
    },

    _bindModeCards: function () {
      const self = this;
      $$('[data-mode]').forEach(function (card) {
        card.addEventListener('click', function () {
          const mode = card.getAttribute('data-mode');
          GM.Sound.play('click');
          if (mode === 'host') self._startHost();
          else if (mode === 'guest') self._startGuest();
          else self._startLocal();
        });
      });
    },

    /* ================= 创建房间 ================= */
    _startHost: function () {
      this._resetHostView();
      this.mode = 'host';
      this.myColor = 1;
      GM.Views.show('host', true);
    },

    _bindHostView: function () {
      const self = this;

      $('#btn-gen-offer').addEventListener('click', function () { self._hostGenerateInvite(); });

      $('#btn-copy-offer').addEventListener('click', function () {
        const text = $('#offer-text').value;
        if (!text) return;
        GM.copyText(text).then(function (ok) {
          GM.UI.toast(ok ? '邀请码已复制，快去发给好友吧' : '复制失败，请长按文本框手动复制',
            ok ? 'ok' : 'warn');
          if (ok) GM.Sound.play('click');
        });
      });

      $('#btn-accept-answer').addEventListener('click', function () { self._hostAcceptAnswer(); });

      $('#answer-input').addEventListener('input', function () {
        GM.setStatus($('#answer-status'), '', '');
      });
    },

    _resetHostView: function () {
      $('#offer-text').value = '';
      $('#answer-input').value = '';
      GM.show($('#offer-box'), false);
      GM.setStatus($('#offer-status'), '', '');
      GM.setStatus($('#answer-status'), '', '');
      $('#btn-accept-answer').disabled = false;
      $('#btn-gen-offer').disabled = false;
      this._setGenOfferLabel(false);
      this._setStage('host', 1);
    },

    /* 切换「生成邀请码 / 重新生成」两种按钮状态 */
    _setGenOfferLabel: function (isRedo) {
      $('#btn-gen-offer').classList.toggle('is-redo', !!isRedo);
      $('#btn-gen-offer-label').textContent = isRedo ? '重新生成' : '生成邀请码';
    },

    _hostGenerateInvite: function () {
      const self = this;
      const btn = $('#btn-gen-offer');
      const status = $('#offer-status');

      btn.disabled = true;
      GM.setStatus(status, 'loading', '正在本机生成邀请码…');

      this._ensureLink();

      this.link.createInvite().then(function (code) {
        $('#offer-text').value = code;
        $('#offer-count').textContent = code.length + ' 个字符';
        GM.show($('#offer-box'), true);
        GM.setStatus(status, 'ok', '邀请码已生成，点「复制邀请码」发给好友');
        self._setGenOfferLabel(true);
        self._setStage('host', 2);
        GM.Sound.play('click');
      }).catch(function (err) {
        GM.setStatus(status, 'err', '生成失败：' + (err.message || '未知错误'));
        GM.Sound.play('error');
      }).then(function () {
        btn.disabled = false;
      });
    },

    _hostAcceptAnswer: function () {
      const self = this;
      const text = $('#answer-input').value.trim();
      const btn = $('#btn-accept-answer');
      const status = $('#answer-status');

      if (!text) {
        GM.UI.toast('请先粘贴好友发来的回传码', 'warn');
        return;
      }
      if (!this.link || !this.link.pc) {
        GM.UI.toast('请先点「生成邀请码」', 'warn');
        return;
      }

      btn.disabled = true;
      GM.setStatus(status, 'loading', '正在建立点对点连接…');

      this.link.finishWithAnswer(text).then(function () {
        self._setStage('host', 4);
        GM.setStatus(status, 'ok', '握手完成，正在打通数据通道…');
      }).catch(function (err) {
        GM.setStatus(status, 'err',
          '连接失败：' + (err.message || '未知错误') + '。请确认回传码完整复制。');
        GM.Sound.play('error');
        btn.disabled = false;
      });
    },

    /* ================= 加入房间 ================= */
    _startGuest: function () {
      this._resetGuestView();
      this.mode = 'guest';
      this.myColor = 2;
      GM.Views.show('guest', true);
    },

    _bindGuestView: function () {
      const self = this;

      $('#btn-gen-answer').addEventListener('click', function () { self._guestGenerateAnswer(); });

      $('#btn-copy-answer').addEventListener('click', function () {
        const text = $('#guest-answer-text').value;
        if (!text) return;
        GM.copyText(text).then(function (ok) {
          GM.UI.toast(ok ? '回传码已复制，请发回给房主' : '复制失败，请长按文本框手动复制',
            ok ? 'ok' : 'warn');
          if (ok) GM.Sound.play('click');
        });
      });

      $('#offer-input').addEventListener('input', function () {
        GM.setStatus($('#guest-status'), '', '');
      });
    },

    _resetGuestView: function () {
      $('#offer-input').value = '';
      $('#guest-answer-text').value = '';
      GM.show($('#guest-answer-box'), false);
      GM.setStatus($('#guest-status'), '', '');
      $('#btn-gen-answer').disabled = false;
      this._setStage('guest', 1);
    },

    _guestGenerateAnswer: function () {
      const self = this;
      const text = $('#offer-input').value.trim();
      const btn = $('#btn-gen-answer');
      const status = $('#guest-status');

      if (!text) {
        GM.UI.toast('请先粘贴房主发来的邀请码', 'warn');
        return;
      }

      btn.disabled = true;
      GM.setStatus(status, 'loading', '正在解析邀请码并生成回传码…');

      this._ensureLink();

      this.link.joinWithInvite(text).then(function (code) {
        $('#guest-answer-text').value = code;
        $('#guest-answer-count').textContent = code.length + ' 个字符';
        GM.show($('#guest-answer-box'), true);
        GM.setStatus(status, 'ok', '回传码已生成，复制后发回给房主即可');
        self._setStage('guest', 3);
        GM.Sound.play('click');
      }).catch(function (err) {
        GM.setStatus(status, 'err', '生成失败：' + (err.message || '未知错误') +
          '。请确认粘贴的是完整的邀请码。');
        GM.Sound.play('error');
      }).then(function () {
        btn.disabled = false;
      });
    },

    /* ================= 本机双人 ================= */
    _startLocal: function () {
      this._teardownLink();
      this.mode = 'local';
      this.myColor = 1;
      this.game.reset();
      this._enterGame();
      this._logSys('本机双人模式，黑方先行');
    },

    /* ================= 连接管理 ================= */
    _ensureLink: function () {
      const self = this;
      this._teardownLink();
      this._leaving = false;

      this.link = new GM.PeerLink({
        onOpen: function () { self._onChannelOpen(); },
        onMessage: function (m) { self._onMessage(m); },
        onClose: function (why) { self._onChannelClose(why); },
        onError: function () {},
        onState: function (s) { self._onPeerState(s); }
      });
      return this.link;
    },

    _teardownLink: function () {
      if (!this.link) return;
      this._leaving = true;
      try { this.link.dispose(); } catch (e) {}
      this.link = null;
    },

    _onChannelOpen: function () {
      this._leaving = false;
      GM.Sound.play('connect');

      /* 双方各自重置棋盘 → 状态天然一致 */
      this.game.reset();

      this._enterGame();
      this._logSys('连接已建立，对局开始');

      this.link.send({ t: MSG.HELLO, role: this.link.role });

      /* 房主作为权威方，补发一次全量同步，确保万无一失 */
      if (this.link.role === 'host') {
        this.link.send({ t: MSG.SYNC, data: this.game.serialize() });
      }
    },

    _onChannelClose: function () {
      if (this._leaving) return;
      this._updateConn();
      if (!GM.Views.inGame()) return;

      if (!this.game.ended) {
        this._showBanner('🔌', '连接已断开', '对方可能已关闭页面或网络中断',
          '返回首页', this._leaveToHome.bind(this));
      }
      GM.Sound.play('error');
    },

    _onPeerState: function (s) {
      this._updateConn(s);
      if (s.connection === 'failed') {
        if (!this.game || !this.game.ended) {
          this._showBanner('⚠️', '连接异常', '网络似乎不稳定，可以尝试重新创建房间',
            '返回首页', this._leaveToHome.bind(this));
        }
      }
    },

    _updateConn: function (s) {
      const n = this._n;
      if (!n || !n.connPill) return;

      if (this.mode === 'local') {
        this._setClassName(n.connPill, 'conn-pill is-on');
        this._setText(n.connText, '本机双人');
      } else {
        const connected = this.link && this.link.connected;
        if (connected) {
          this._setClassName(n.connPill, 'conn-pill is-on');
          this._setText(n.connText, '已连接');
        } else if (s && (s.connection === 'connecting' || s.ice === 'checking')) {
          this._setClassName(n.connPill, 'conn-pill is-warn');
          this._setText(n.connText, '连接中…');
        } else {
          this._setClassName(n.connPill, 'conn-pill is-off');
          this._setText(n.connText, '未连接');
        }
      }

      this._syncControls();
    },

    /* ================= 进入对局 ================= */
    _enterGame: function () {
      const self = this;
      GM.Views.show('game', true);

      this.renderer.setGame(this.game);
      this._hideBanner();
      this._clearLog();
      this._clearChat();
      this._updateStats();
      this._updatePlayers();
      this._updateConn();
      this._syncControls();

      requestAnimationFrame(function () { self._resizeBoard(); });
    },

    /* 先集中读取尺寸，之后再统一写入，避免读写交替触发多次重排 */
    _resizeBoard: function () {
      const shell = $('#board-shell');
      if (!shell) return;

      const w = shell.getBoundingClientRect().width;
      if (w <= 0) return;

      this.renderer.layout(w);
      /* 棋盘恒为正方形，高度即宽度，无需再读一次 DOM */
      this._syncGridHeight(w);
    },

    /* 把网格行高设为棋盘的实际高度，使左右两栏拉伸到与棋盘底部齐平，
       整体呈现一个整齐的长方形。
       窄屏（单列 / 多行布局）不需要强制等高，直接清除约束。 */
    _syncGridHeight: function (boardSize) {
      const grid = $('.game-grid');
      if (!grid) return;

      const next = (window.innerWidth <= 1040 || !boardSize)
        ? ''
        : Math.round(boardSize) + 'px';

      if (grid.style.gridTemplateRows !== next) {
        grid.style.gridTemplateRows = next;
      }
    },

    /* 监听棋盘尺寸变化。
       这些监听是应用级单例，只会注册一次，因此用 _ro 作为幂等守卫，
       防止将来重复调用造成监听叠加。 */
    _bindBoardResize: function () {
      if (this._ro) return;

      const self = this;
      const shell = $('#board-shell');
      if (!shell) return;

      this._onResize = function () { self._resizeBoard(); };
      this._onOrientation = function () {
        clearTimeout(self._orientationTimer);
        self._orientationTimer = setTimeout(function () { self._resizeBoard(); }, 220);
      };

      if (typeof ResizeObserver === 'function') {
        this._ro = new ResizeObserver(this._onResize);
        this._ro.observe(shell);
      }
      window.addEventListener('resize', this._onResize);
      window.addEventListener('orientationchange', this._onOrientation);
    },

    /* ================= 棋盘交互 ================= */
    _bindBoard: function () {
      const self = this;
      const canvas = $('#board');

      canvas.addEventListener('pointerdown', function (e) {
        if (!self._canPlay()) return;
        self._press = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
      });

      canvas.addEventListener('pointerup', function (e) {
        const p = self._press;
        self._press = null;
        if (!p || p.id !== e.pointerId) return;

        /* 位移过大或按太久，视为拖拽 / 长按，不落子 */
        const moved = Math.sqrt(
          Math.pow(e.clientX - p.x, 2) + Math.pow(e.clientY - p.y, 2)
        );
        if (moved > 12 || Date.now() - p.t > 800) return;

        const point = self.renderer.pointFromEvent(e.clientX, e.clientY);
        if (point) self._handleTap(point.x, point.y);
      });

      canvas.addEventListener('pointercancel', function () { self._press = null; });

      canvas.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        if (!self._canPlay()) { self.renderer.setHover(null); return; }
        const point = self.renderer.pointFromEvent(e.clientX, e.clientY);
        self.renderer.setHover(point, self.mode === 'local' ? self.game.turn : self.myColor);
      });

      canvas.addEventListener('pointerleave', function () {
        self.renderer.setHover(null);
      });

      canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    },

    _canPlay: function () {
      if (!this.game || this.game.ended) return false;
      if (this.mode === 'local') return true;
      if (!this.link || !this.link.connected) return false;
      return this.game.turn === this.myColor;
    },

    _handleTap: function (x, y) {
      if (this.game.ended) return;

      if (this.mode !== 'local' && this.game.turn !== this.myColor) {
        GM.UI.toast('还没轮到你落子', 'warn');
        return;
      }
      if (!this.link && this.mode !== 'local') {
        GM.UI.toast('尚未连接到对手', 'warn');
        return;
      }
      if (this.game.at(x, y) !== 0) {
        GM.UI.toast('这个位置已经有棋子了', 'warn');
        return;
      }

      const color = this.mode === 'local' ? this.game.turn : this.myColor;
      this._applyMove(x, y, color);

      /* 关键：无论这一步是否分出胜负，都如实把坐标发给对方，
         由双方各自在本地算出完全相同的结果 —— 从根上避免不同步 */
      if (this.mode !== 'local' && this.link) {
        this.link.send({ t: MSG.MOVE, x: x, y: y });
      }
    },

    _applyMove: function (x, y, color) {
      const res = this.game.place(x, y, color);
      if (!res.ok) {
        if (res.reason === 'not-turn' || res.reason === 'ended') this._requestSync();
        return res;
      }

      this.renderer.setHover(null);
      this.renderer.draw();
      this._appendMoveLog(x, y, color);
      this._updateStats();
      this._updatePlayers();
      GM.Sound.play(color === 1 ? 'place' : 'place2');

      if (res.ended) this._onGameEnd();
      return res;
    },

    /* 请求全量同步。对端消息异常时可能被连续触发，这里做频率限制，
       避免形成「互相请求同步」的风暴。 */
    _requestSync: function () {
      if (!this.link || !this.link.connected || this.link.role !== 'guest') return;

      const now = Date.now();
      if (now - (this._lastSyncReq || 0) < C.SYNC_REQUEST_INTERVAL) return;
      this._lastSyncReq = now;

      this.link.send({ t: MSG.SYNC, want: true });
    },

    /* ================= 网络消息 ================= */
    _onMessage: function (msg) {
      if (!msg || typeof msg !== 'object' || !msg.t) return;

      switch (msg.t) {

        case MSG.HELLO:
          break;

        case MSG.MOVE: {
          const opp = 3 - this.myColor;
          /* 不信任对端数据：坐标必须是整数，非法则请求全量同步 */
          if (!Number.isInteger(msg.x) || !Number.isInteger(msg.y)) {
            this._requestSync();
            break;
          }
          const res = this._applyMove(msg.x, msg.y, opp);
          if (res && !res.ok) this._requestSync();
          break;
        }

        case MSG.SYNC:
          if (msg.want) {
            this.link.send({ t: MSG.SYNC, data: this.game.serialize() });
          } else if (msg.data) {
            this.game.deserialize(msg.data);
            this.renderer.setGame(this.game);
            this.renderer.draw();
            this._rebuildLog();
            this._updateStats();
            this._updatePlayers();
            this._syncControls();
            if (this.game.ended) this._onGameEnd(); else this._hideBanner();
            this._logSys('已与对方同步棋局');
          }
          break;

        case MSG.RESTART:
          this._askPermission('重新开始', '对方希望重新开始这一局，是否同意？', MSG.RESTART, '🔄');
          break;

        case MSG.UNDO:
          this._askPermission('悔棋', '对方请求悔棋，是否同意？', MSG.UNDO, '↩️');
          break;

        case MSG.RESULT:
          this._handleResult(msg);
          break;

        case MSG.SURRENDER:
          this.game.ended = true;
          this.game.winner = this.myColor;
          this._hideBanner();
          this._onGameEnd();
          this._logSys('对方认输了');
          this._updatePlayers();
          this._syncControls();
          break;

        case MSG.CHAT: {
          /* 不信任对端数据：强制裁剪到长度上限，空内容直接忽略 */
          const text = String(msg.text == null ? '' : msg.text)
            .trim().slice(0, C.CHAT_MAX_LENGTH);
          if (!text) break;

          this._appendChat('peer', text);
          GM.Sound.play('msg');
          /* 只有用户没在聊天时才弹提示，避免连续对话时刷屏 */
          if (document.activeElement !== this._n.msgInput) {
            GM.UI.toast('对手：' + text);
          }
          break;
        }

        case MSG.TYPING:
          this._showTyping();
          break;

        case MSG.BYE:
          this._leaving = true;
          this._logSys('对方退出了对局');
          this._showBanner('👋', '对方已离开', '本局对局到此结束', '返回首页',
            this._leaveToHome.bind(this));
          this._syncControls();
          break;
      }
    },

    /* 收到请求 → 弹窗征求同意 → 回复结果 */
    _askPermission: function (title, text, kind, icon) {
      const self = this;
      GM.UI.dialog({
        icon: icon, title: '收到请求', text: text,
        okText: '同意', cancelText: '拒绝'
      }).then(function (ok) {
        if (!self.link || !self.link.connected) return;
        self.link.send({ t: MSG.RESULT, for: kind, accept: !!ok });

        if (ok) {
          if (kind === MSG.RESTART) self._doRestart('对方发起了重新开始');
          else self._doUndo(2, '已按对方请求悔棋');
        } else {
          GM.UI.toast('已拒绝对方请求');
        }
      });
    },

    /* 收到对方的回应 */
    _handleResult: function (msg) {
      clearTimeout(this._reqTimer);
      this.pending = null;

      if (msg.accept) {
        if (msg.for === MSG.RESTART) this._doRestart('重新开始');
        else this._doUndo(2, '悔棋成功');
      } else {
        GM.UI.toast('对方拒绝了你的请求', 'warn');
        GM.Sound.play('error');
      }
    },

    /* ================= 对局操作 ================= */
    _bindGameView: function () {
      const self = this;

      $('#btn-restart').addEventListener('click', function () { self.requestRestart(); });
      $('#btn-undo').addEventListener('click', function () { self.requestUndo(); });
      $('#btn-surrender').addEventListener('click', function () { self.surrender(); });
      $('#btn-leave').addEventListener('click', function () { self.leaveGame(); });

      $('#chk-coords').addEventListener('change', function () {
        const on = this.checked;
        self.renderer.setCoords(on);
        GM.store.set(C.KEY_COORDS, on ? '1' : '0');
      });
    },

    requestRestart: function () {
      const self = this;

      if (this.mode === 'local') {
        this._doRestart('本机重新开始');
        return;
      }
      if (!this.link || !this.link.connected) {
        GM.UI.toast('尚未连接到对手', 'warn');
        return;
      }
      if (this.pending) {
        GM.UI.toast('上一个请求还在等待回应', 'warn');
        return;
      }

      this.pending = { type: MSG.RESTART };
      this.link.send({ t: MSG.RESTART });
      GM.UI.toast('已发送「重新开始」请求');
      GM.Sound.play('click');

      this._reqTimer = setTimeout(function () {
        if (self.pending && self.pending.type === MSG.RESTART) {
          self.pending = null;
          GM.UI.toast('对方迟迟没有回应，请求已取消', 'warn');
        }
      }, C.REQUEST_TIMEOUT);
    },

    requestUndo: function () {
      const self = this;

      if (this.game.moveCount === 0) {
        GM.UI.toast('还没有落子，无法悔棋', 'warn');
        return;
      }
      if (this.mode === 'local') {
        this._doUndo(1, '悔棋一步');
        return;
      }
      if (!this.link || !this.link.connected) {
        GM.UI.toast('尚未连接到对手', 'warn');
        return;
      }
      if (this.pending) {
        GM.UI.toast('上一个请求还在等待回应', 'warn');
        return;
      }
      if (this.game.moveCount < 2) {
        GM.UI.toast('至少需要双方各走一步才能悔棋', 'warn');
        return;
      }

      this.pending = { type: MSG.UNDO };
      this.link.send({ t: MSG.UNDO });
      GM.UI.toast('已发送「悔棋」请求');
      GM.Sound.play('click');

      this._reqTimer = setTimeout(function () {
        if (self.pending && self.pending.type === MSG.UNDO) {
          self.pending = null;
          GM.UI.toast('对方迟迟没有回应，请求已取消', 'warn');
        }
      }, C.REQUEST_TIMEOUT);
    },

    surrender: function () {
      const self = this;

      GM.UI.dialog({
        icon: '🏳️', title: '确认认输',
        text: this.mode === 'local'
          ? '本机模式下将直接结束本局，确定吗？'
          : '认输后本局将判对方获胜，确定吗？',
        okText: '认输', cancelText: '再想想', danger: true
      }).then(function (ok) {
        if (!ok) return;

        if (self.mode === 'local') {
          self._doRestart('本机对局已结束');
          return;
        }

        if (self.link && self.link.connected) {
          self.link.send({ t: MSG.SURRENDER });
        }
        self.game.ended = true;
        self.game.winner = 3 - self.myColor;
        self._hideBanner();
        self._onGameEnd();
        self._logSys('你认输了');
        self._updatePlayers();
        self._syncControls();
      });
    },

    leaveGame: function () {
      const self = this;

      if (this.mode === 'local') {
        this._leaveToHome();
        return;
      }

      GM.UI.dialog({
        icon: '🚪', title: '退出对局？',
        text: '退出后当前连接会断开，需要重新走一遍联机流程。',
        okText: '退出', cancelText: '继续对局', danger: true
      }).then(function (ok) {
        if (!ok) return;
        if (self.link && self.link.connected) self.link.send({ t: MSG.BYE });
        self._leaving = true;
        self._leaveToHome();
      });
    },

    /* 结束当前会话：断开连接并复位全部对局状态。
       不涉及视图切换，供「返回首页」与视图守卫共用，
       避免两处各自复位导致 pending / 定时器残留。 */
    _teardownSession: function () {
      this._teardownLink();
      this.mode = 'idle';
      this.pending = null;
      clearTimeout(this._reqTimer);
      this._hideTyping();
      this.game.reset();
      this.renderer.setGame(this.game);
      this._hideBanner();
      this._clearChat();
    },

    _leaveToHome: function () {
      this._teardownSession();
      GM.Views.show('home', true);
    },

    /* ================= 对局状态变化 ================= */
    _doRestart: function (reason) {
      this.game.reset();
      this.renderer.setGame(this.game);
      this.renderer.draw();
      this._hideBanner();
      this._clearLog();
      this._updateStats();
      this._updatePlayers();
      this._syncControls();
      this._logSys(reason || '重新开始');
      GM.Sound.play('click');
    },

    _doUndo: function (steps, reason) {
      const removed = this.game.undo(steps);
      if (!removed) return;

      this.renderer.draw();
      this._hideBanner();
      this._rebuildLog();
      this._updateStats();
      this._updatePlayers();
      this._syncControls();
      this._logSys(reason || '悔棋');
      GM.Sound.play('click');
    },

    _onGameEnd: function () {
      const g = this.game;
      let emoji, title, sub, sound;

      if (g.winner === 3) {
        emoji = '🤝'; title = '和棋'; sub = '棋盘已满，势均力敌';
        sound = 'msg';
      } else if (this.mode === 'local') {
        emoji = g.winner === 1 ? '⚫' : '⚪';
        title = (g.winner === 1 ? '黑方' : '白方') + '获胜';
        sub = '连成五子，恭喜！';
        sound = 'win';
      } else {
        const iWin = g.winner === this.myColor;
        emoji = iWin ? '🎉' : '😵';
        title = iWin ? '你赢了！' : '你输了';
        sub = iWin ? '连成五子，漂亮！' : '对方先连成五子，再来一局？';
        sound = iWin ? 'win' : 'lose';
      }

      GM.Sound.play(sound);
      this._showBanner(emoji, title, sub, '再来一局', this.requestRestart.bind(this));
      this._updatePlayers();
      this._syncControls();
    },

    /* ================= 覆盖层 ================= */
    _showBanner: function (emoji, title, sub, actionText, actionFn) {
      $('#banner-emoji').textContent = emoji || '';
      $('#banner-title').textContent = title || '';
      $('#banner-sub').textContent = sub || '';

      const btn = $('#banner-action');
      if (actionText && actionFn) {
        btn.textContent = actionText;
        btn.hidden = false;
        btn.onclick = actionFn;
      } else {
        btn.hidden = true;
        btn.onclick = null;
      }
      GM.show($('#board-banner'), true);
    },

    _hideBanner: function () {
      GM.show($('#board-banner'), false);
    },

    /* ================= 界面刷新 ================= */
    _updateStats: function () {
      const g = this.game;
      const n = this._n || {};

      this._setText(n.statMoves, String(g.moveCount));

      let turnText;
      if (g.ended) turnText = g.winner === 3 ? '和棋' : (g.winner === 1 ? '黑方胜' : '白方胜');
      else turnText = g.turn === 1 ? '黑方' : '白方';
      this._setText(n.statTurn, turnText);
    },

    _updatePlayers: function () {
      const g = this.game;
      const n = this._n;
      if (!n || !n.me || !n.op) return;

      const local = this.mode === 'local';

      if (local) {
        this._setPlayer(n.me, 1, '黑方', '先手');
        this._setPlayer(n.op, 2, '白方', '后手');
      } else {
        this._setPlayer(n.me, this.myColor, '你',
          this.myColor === 1 ? '黑方 · 先手' : '白方 · 后手');
        this._setPlayer(n.op, 3 - this.myColor, '对手',
          this.myColor === 1 ? '白方 · 后手' : '黑方 · 先手');
      }

      /* 高亮当前该落子的一方 */
      const activeColor = g.ended ? 0 : g.turn;
      this._setPlayerState(n.me, local ? 1 : this.myColor, activeColor, g);
      this._setPlayerState(n.op, local ? 2 : 3 - this.myColor, activeColor, g);
    },

    _setPlayer: function (p, color, name, colorLabel) {
      const want = String(color);
      if (p.card.getAttribute('data-color') !== want) {
        p.card.setAttribute('data-color', want);
      }
      this._setText(p.name, name);
      this._setText(p.color, colorLabel);
    },

    _setPlayerState: function (p, color, activeColor, g) {
      const isTurn = activeColor === color;
      this._setClass(p.card, 'is-turn', isTurn);
      this._setClass(p.card, 'is-win', g.ended && g.winner === color);

      const label = g.ended
        ? (g.winner === color ? '获胜' : (g.winner === 3 ? '和棋' : '落败'))
        : (isTurn ? '落子中' : '等待中');
      this._setText(p.pill, label);
    },

    _syncControls: function () {
      const n = this._n;
      if (!n) return;

      const local = this.mode === 'local';
      this._setDisabled(n.btnSurrender, local || this.game.ended);
      this._setDisabled(n.btnUndo, local ? this.game.moveCount === 0 : false);
      this._setDisabled(n.btnRestart, false);

      /* 消息输入框：本机模式或尚未连接时不可用 */
      const canMsg = !local && !!this.link && this.link.connected;

      if (n.msgInput) {
        this._setDisabled(n.msgInput, !canMsg);
        const ph = local ? '本机模式无需发消息' : (canMsg ? '说点什么…' : '等待连接…');
        if (n.msgInput.placeholder !== ph) n.msgInput.placeholder = ph;
        if (!canMsg && n.msgInput.value) {
          n.msgInput.value = '';
          n.msgInput.classList.remove('is-error');
        }
      }
      this._setDisabled(n.msgSend, !canMsg);

      /* 聊天面板状态 */
      this._setClass(n.chatDot, 'is-on', canMsg);
      this._setText(n.chatPeer,
        local ? '本机双人'
          : (canMsg ? (this.myColor === 1 ? '白方' : '黑方') + ' · 在线' : '未连接'));

      if (!canMsg) this._hideTyping();
    },

    /* ================= 对局记录 ================= */
    _logNode: function () {
      return (this._n && this._n.gameLog) || $('#game-log');
    },

    _chatNode: function () {
      return (this._n && this._n.chatBody) || $('#chat-body');
    },

    _clearLog: function () {
      this._logNode().replaceChildren(GM.el('div', 'log-empty', '暂无记录'));
    },

    _ensureLogReady: function () {
      const log = this._logNode();
      const first = log.firstElementChild;
      if (first && first.classList.contains('log-empty')) first.remove();
      return log;
    },

    /* 滚动用 rAF 合并。
       直接写 scrollTop 会读取 scrollHeight，在批量追加（重放记录、长对局）
       时形成「读→写→读→写」的强制重排链，实测 300 条会耗时 500ms 以上。
       合并到一帧里只需一次重排。 */
    _scrollLog: function () {
      if (this._logScrollRaf) return;
      const self = this;
      this._logScrollRaf = requestAnimationFrame(function () {
        self._logScrollRaf = null;
        const log = self._logNode();
        if (log) log.scrollTop = log.scrollHeight;
      });
    },

    _appendMoveLog: function (x, y, color) {
      const log = this._ensureLogReady();
      const n = this.game.moveCount;

      const item = GM.el('div', 'log-item');
      item.appendChild(GM.el('span', 'idx', n + '.'));

      const dot = GM.el('span');
      dot.style.cssText = 'width:10px;height:10px;border-radius:50%;flex-shrink:0;' +
        (color === 1
          ? 'background:#23272f;box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)'
          : 'background:#f2f2ee;box-shadow:inset 0 0 0 1px rgba(0,0,0,.22)');
      item.appendChild(dot);

      item.appendChild(GM.el('span', 'coord', GM.coordName(x, y)));
      log.appendChild(item);
      this._scrollLog();
    },

    _rebuildLog: function () {
      const self = this;
      this._clearLog();
      const log = this._ensureLogReady();
      this.game.moves.forEach(function (m, i) {
        const item = GM.el('div', 'log-item');
        item.appendChild(GM.el('span', 'idx', (i + 1) + '.'));
        const dot = GM.el('span');
        dot.style.cssText = 'width:10px;height:10px;border-radius:50%;flex-shrink:0;' +
          (m.c === 1
            ? 'background:#23272f;box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)'
            : 'background:#f2f2ee;box-shadow:inset 0 0 0 1px rgba(0,0,0,.22)');
        item.appendChild(dot);
        item.appendChild(GM.el('span', 'coord', GM.coordName(m.x, m.y)));
        log.appendChild(item);
      });
      this._scrollLog();
    },

    _logSys: function (text) {
      const log = this._ensureLogReady();
      log.appendChild(GM.el('div', 'log-item sys', text));
      this._scrollLog();
    },

    /* ================= 聊天（微信风格） ================= */
    _bindMessageInput: function () {
      const self = this;
      const input = $('#msg-input');
      const btn = $('#btn-send-msg');
      if (!input || !btn) return;

      btn.addEventListener('click', function () { self._sendChat(input.value); });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.isComposing) {
          e.preventDefault();
          self._sendChat(input.value);
        }
      });

      input.addEventListener('input', function () {
        input.classList.remove('is-error');
        self._notifyTyping();
      });
    },

    /* 打字时低频通知对方，用于展示「正在输入」 */
    _notifyTyping: function () {
      if (this.mode === 'local') return;
      if (!this.link || !this.link.connected) return;

      const now = Date.now();
      if (now - (this._lastTypingSent || 0) < 1600) return;
      this._lastTypingSent = now;
      this.link.send({ t: MSG.TYPING });
    },

    _sendChat: function (text) {
      const input = this._n ? this._n.msgInput : $('#msg-input');
      /* 强制裁剪到长度上限，不依赖 HTML 的 maxlength */
      const value = String(text == null ? '' : text).trim().slice(0, C.CHAT_MAX_LENGTH);

      if (this.mode === 'local') {
        GM.UI.toast('本机模式下无需发送消息', 'warn');
        return;
      }
      if (!this.link || !this.link.connected) {
        GM.UI.toast('尚未连接到对手', 'warn');
        return;
      }
      if (!value) {
        if (input) {
          input.classList.add('is-error');
          input.focus();
        }
        GM.UI.toast('请先输入要发送的内容', 'warn');
        return;
      }

      this.link.send({ t: MSG.CHAT, text: value });
      this._appendChat('me', value);
      GM.Sound.play('msg');

      if (input) {
        input.value = '';
        input.classList.remove('is-error');
        input.focus();
      }
    },

    /* 清空聊天面板（仅在新对局建立时调用） */
    _clearChat: function () {
      const body = this._chatNode();
      if (!body) return;

      const empty = GM.el('div', 'chat-empty');
      empty.appendChild(document.createTextNode('还没有消息'));
      empty.appendChild(GM.el('br'));
      empty.appendChild(document.createTextNode('打个招呼吧'));

      body.replaceChildren(empty);
      this._lastChatAt = 0;
      this._hideTyping();
    },

    _chatEmpty: function () {
      const body = this._chatNode();
      const first = body && body.firstElementChild;
      return (first && first.classList.contains('chat-empty')) ? first : null;
    },

    /* 与 _scrollLog 同理：合并到一帧，避免连续发消息时反复强制重排 */
    _scrollChat: function () {
      if (this._chatScrollRaf) return;
      const self = this;
      this._chatScrollRaf = requestAnimationFrame(function () {
        self._chatScrollRaf = null;
        const body = self._chatNode();
        if (body) body.scrollTop = body.scrollHeight;
      });
    },

    _chatAtBottom: function () {
      const body = this._chatNode();
      if (!body) return true;
      return body.scrollHeight - body.scrollTop - body.clientHeight < 24;
    },

    /* 超过 5 分钟插入一条时间分隔 */
    _maybeChatTime: function () {
      const body = this._chatNode();
      const now = Date.now();
      if (!this._lastChatAt || now - this._lastChatAt > 5 * 60 * 1000) {
        const d = new Date(now);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        body.appendChild(GM.el('div', 'chat-time', hh + ':' + mm));
      }
      this._lastChatAt = now;
    },

    /* side: 'me' 自己发的（右侧） | 'peer' 对方发的（左侧） */
    _appendChat: function (side, text) {
      const body = this._chatNode();
      if (!body) return;

      const stick = this._chatAtBottom();
      const empty = this._chatEmpty();
      if (empty) empty.remove();
      this._hideTyping();

      this._maybeChatTime();

      const row = GM.el('div', 'chat-row' + (side === 'me' ? ' is-me' : ''));
      row.appendChild(GM.el('span', 'chat-avatar', side === 'me' ? '我' : '对'));
      row.appendChild(GM.el('div', 'chat-bubble', text));
      body.appendChild(row);

      /* 若用户正在翻看历史消息，就不强行拉到底部 */
      if (stick || side === 'me') this._scrollChat();
    },

    _showTyping: function () {
      const body = this._chatNode();
      if (!body) return;

      if ($('#chat-typing')) {
        clearTimeout(this._typingTimer);
        this._typingTimer = setTimeout(this._hideTyping.bind(this), 2600);
        return;
      }

      const empty = this._chatEmpty();
      if (empty) empty.remove();

      const row = GM.el('div', 'chat-row chat-typing');
      row.id = 'chat-typing';
      row.appendChild(GM.el('span', 'chat-avatar', '对'));

      const bubble = GM.el('div', 'chat-bubble');
      for (let i = 0; i < 3; i++) bubble.appendChild(GM.el('i'));
      row.appendChild(bubble);

      body.appendChild(row);
      this._scrollChat();

      clearTimeout(this._typingTimer);
      this._typingTimer = setTimeout(this._hideTyping.bind(this), 2600);
    },

    _hideTyping: function () {
      clearTimeout(this._typingTimer);
      const node = $('#chat-typing');
      if (node) node.remove();
    },

    /* ================= 步骤条 / 面板 ================= */
    _setStage: function (view, step) {
      const sec = $('#view-' + view);
      if (!sec) return;

      const stepper = $('.stepper', sec);
      if (stepper) {
        $$('li', stepper).forEach(function (li) {
          const s = Number(li.getAttribute('data-step'));
          li.classList.toggle('is-done', s < step);
          li.classList.toggle('is-active', s === step);
        });
      }

      $$('.panel', sec).forEach(function (p) {
        const n = Number(p.getAttribute('data-panel'));
        /* 当前步骤及其下一步都可操作：例如房主生成邀请码后（第 2 步），
           需要能立刻粘贴好友回传的答案（第 3 步），否则会卡住无法继续。 */
        p.classList.toggle('is-locked', n > step + 1);
        p.classList.toggle('is-highlight', n === step);
      });
    },

    /* ================= 离开拦截 ================= */
    _initViewGuard: function () {
      const self = this;
      GM.Views.setGuard(function (from, to) {
        if (from !== 'game') return Promise.resolve(true);

        /* 本机对局无需征询对方 */
        if (self.mode === 'local') {
          self._teardownSession();
          return Promise.resolve(true);
        }

        return GM.UI.dialog({
          icon: '🚪', title: '退出对局？',
          text: '当前连接将会断开，需要重新走一遍联机流程。',
          okText: '退出', cancelText: '继续对局', danger: true
        }).then(function (ok) {
          if (!ok) return false;
          /* 先告知对方再断开，否则消息发不出去 */
          if (self.link && self.link.connected) self.link.send({ t: MSG.BYE });
          self._teardownSession();
          return true;
        });
      });
    }
  };

  GM.App = App;

  document.addEventListener('DOMContentLoaded', function () { App.init(); });

})(window.GM = window.GM || {});
