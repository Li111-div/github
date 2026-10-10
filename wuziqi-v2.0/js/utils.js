/* ============================================================
   utils.js — DOM 助手 / 剪贴板 / 信令编解码 / 音效 / UI 反馈
   ============================================================ */
(function (GM) {
  'use strict';

  const C = GM.CONFIG;

  /* ------------------------------------------------------------
     一、DOM 助手
     ------------------------------------------------------------ */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function show(node, visible) {
    if (!node) return;
    node.hidden = !visible;
  }
  function setStatus(node, type, text) {
    if (!node) return;
    if (!text) { node.className = 'inline-status'; node.textContent = ''; return; }
    node.className = 'inline-status show ' + type;
    node.textContent = text;
  }

  GM.$ = $;
  GM.$$ = $$;
  GM.el = el;
  GM.show = show;
  GM.setStatus = setStatus;

  /* ------------------------------------------------------------
     二、剪贴板（含降级方案，兼容 file:// 与旧浏览器）
     ------------------------------------------------------------ */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  GM.copyText = copyText;

  /* ------------------------------------------------------------
     三、信令编解码
     流程：JSON → UTF-8 字节 → deflate-raw 压缩 → URL 安全 Base64
     文本格式： "GOMOKU1.<base64>"   1 表示已压缩
               "GOMOKU0.<base64>"   0 表示未压缩（浏览器不支持时降级）
     ------------------------------------------------------------ */
  const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  /* 解码查表：模块级构建一次即可，不必每次解码都重建 */
  const b64Index = (function () {
    const map = {};
    for (let i = 0; i < b64chars.length; i++) map[b64chars[i]] = i;
    return map;
  })();

  function bytesToB64(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i];
      const b1 = bytes[i + 1];
      const b2 = bytes[i + 2];
      out += b64chars[b0 >> 2];
      out += b64chars[((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
      if (b1 === undefined) break;
      out += b64chars[((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
      if (b2 === undefined) break;
      out += b64chars[b2 & 63];
    }
    return out;
  }

  function b64ToBytes(str) {
    const clean = String(str).replace(/[^A-Za-z0-9\-_]/g, '');
    const bytes = [];
    for (let i = 0; i < clean.length; i += 4) {
      const c0 = b64Index[clean[i]];
      const c1 = b64Index[clean[i + 1]];
      const c2 = b64Index[clean[i + 2]];
      const c3 = b64Index[clean[i + 3]];
      if (c0 === undefined || c1 === undefined) break;
      bytes.push((c0 << 2) | (c1 >> 4));
      if (c2 === undefined) break;
      bytes.push(((c1 & 15) << 4) | (c2 >> 2));
      if (c3 === undefined) break;
      bytes.push(((c2 & 3) << 6) | c3);
    }
    return new Uint8Array(bytes);
  }

  const supportsCompression =
    typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

  function packSignal(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    const prefix = C.SIGNAL_TAG;

    if (!supportsCompression) {
      return Promise.resolve(prefix + '0.' + bytesToB64(bytes));
    }
    return new Response(
      new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))
    )
      .arrayBuffer()
      .then(function (buf) {
        return prefix + '1.' + bytesToB64(new Uint8Array(buf));
      })
      .catch(function () {
        return prefix + '0.' + bytesToB64(bytes);
      });
  }

  function unpackSignal(text) {
    if (!text) return Promise.reject(new Error('内容为空'));
    const raw = String(text).trim();
    const tag = C.SIGNAL_TAG;
    const at = raw.indexOf(tag);

    let body;
    if (at >= 0) {
      body = raw.slice(at + tag.length);
    } else {
      // 容忍用户只复制了后半段（缺少前缀）的情况
      body = raw;
    }

    const dot = body.indexOf('.');
    const version = dot > 0 ? body.slice(0, dot) : '0';
    const payload = dot > 0 ? body.slice(dot + 1) : body;

    let bytes;
    try {
      bytes = b64ToBytes(payload);
    } catch (e) {
      return Promise.reject(new Error('内容格式不正确'));
    }
    if (!bytes.length) return Promise.reject(new Error('内容格式不正确'));

    if (version === '1' && supportsCompression) {
      return new Response(
        new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      )
        .arrayBuffer()
        .then(function (buf) {
          return JSON.parse(new TextDecoder().decode(buf));
        })
        .catch(function () {
          throw new Error('内容已损坏或不完整');
        });
    }

    try {
      return Promise.resolve(JSON.parse(new TextDecoder().decode(bytes)));
    } catch (e) {
      return Promise.reject(new Error('内容已损坏或不完整'));
    }
  }

  GM.packSignal = packSignal;
  GM.unpackSignal = unpackSignal;

  /* ------------------------------------------------------------
     四、音效（Web Audio 实时合成，无需任何音频文件）
     ------------------------------------------------------------ */
  const Sound = {
    enabled: true,
    _ctx: null,

    ctx: function () {
      if (!this._ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this._ctx = new AC();
      }
      if (this._ctx.state === 'suspended') this._ctx.resume();
      return this._ctx;
    },

    tone: function (freq, dur, delay, vol, type) {
      const ac = this.ctx();
      if (!ac) return;
      const t0 = ac.currentTime + (delay || 0);
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol || 0.06, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);

      /* 播放结束后断开节点，避免增益节点长期挂在 destination 上 */
      osc.onended = function () {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) { /* 已断开，忽略 */ }
      };
    },

    play: function (name) {
      if (!this.enabled) return;
      try {
        if (name === 'place') {
          this.tone(560, 0.09, 0, 0.055, 'triangle');
          this.tone(840, 0.05, 0.005, 0.03, 'sine');
        } else if (name === 'place2') {
          this.tone(430, 0.09, 0, 0.055, 'triangle');
          this.tone(650, 0.05, 0.005, 0.03, 'sine');
        } else if (name === 'click') {
          this.tone(680, 0.05, 0, 0.035, 'sine');
        } else if (name === 'win') {
          [523, 659, 784, 1047].forEach(function (f, i) {
            this.tone(f, 0.24, i * 0.085, 0.055, 'sine');
          }, this);
        } else if (name === 'lose') {
          [440, 370, 294].forEach(function (f, i) {
            this.tone(f, 0.28, i * 0.11, 0.05, 'sine');
          }, this);
        } else if (name === 'connect') {
          this.tone(660, 0.12, 0, 0.05, 'sine');
          this.tone(990, 0.16, 0.09, 0.045, 'sine');
        } else if (name === 'error') {
          this.tone(200, 0.14, 0, 0.05, 'square');
        } else if (name === 'msg') {
          this.tone(880, 0.08, 0, 0.035, 'sine');
        }
      } catch (e) { /* 忽略音频异常 */ }
    }
  };

  GM.Sound = Sound;

  /* ------------------------------------------------------------
     五、UI 反馈：Toast 与 Modal
     ------------------------------------------------------------ */
  const UI = {
    _queue: [],        // 等待展示的弹窗
    _active: null,     // 当前正在展示的弹窗

    toast: function (text, type, duration) {
      const host = $('#toast-host');
      if (!host) return;
      const node = el('div', 'toast' + (type ? ' ' + type : ''), text);
      host.appendChild(node);
      const life = duration || 2200;
      setTimeout(function () {
        node.classList.add('out');
        setTimeout(function () { node.remove(); }, 240);
      }, life);
    },

    /* 通用弹窗。返回 Promise<true|false>
       opts: { title, text, icon, okText, cancelText, danger }

       注意：全局只有一个 #modal-host，因此弹窗必须排队展示。
       若直接覆盖，先打开的弹窗按钮会被替换掉，其 Promise 将永远不会
       resolve —— 例如对手请求悔棋的弹窗还开着时又点了「认输」，
       悔棋请求就会永远收不到回应。 */
    dialog: function (opts) {
      const self = this;
      return new Promise(function (resolve) {
        self._queue.push({ opts: opts || {}, resolve: resolve });
        self._pump();
      });
    },

    _pump: function () {
      if (this._active || !this._queue.length) return;
      const job = this._queue.shift();
      this._active = job;
      this._render(job.opts, this._settle.bind(this, job));
    },

    _settle: function (job, value) {
      this._active = null;
      job.resolve(value);
      this._pump();
    },

    _render: function (o, done) {
      const host = $('#modal-host');
      const icon = $('#modal-icon');
      const title = $('#modal-title');
      const text = $('#modal-text');
      const actions = $('#modal-actions');
      const mask = $('.modal-mask', host);

      icon.textContent = o.icon || '';
      show(icon, !!o.icon);
      title.textContent = o.title || '';
      text.textContent = o.text || '';
      show(text, !!o.text);

      actions.replaceChildren();

      let settled = false;

      function onKey(e) {
        if (e.key === 'Escape') close(false);
      }

      function onMask() {
        close(false);
      }

      function close(value) {
        if (settled) return;
        settled = true;
        document.removeEventListener('keydown', onKey);
        mask.removeEventListener('click', onMask);
        host.hidden = true;
        done(value);
      }

      if (o.cancelText !== null) {
        const cancel = el('button', 'btn', o.cancelText || '取消');
        cancel.addEventListener('click', function () { close(false); });
        actions.appendChild(cancel);
      }

      const ok = el('button', 'btn ' + (o.danger ? 'btn-danger' : 'btn-primary'),
        o.okText || '确定');
      ok.addEventListener('click', function () { close(true); });
      actions.appendChild(ok);

      mask.addEventListener('click', onMask);
      document.addEventListener('keydown', onKey);
      host.hidden = false;
      setTimeout(function () { ok.focus(); }, 30);
    },

    alert: function (title, text, icon) {
      return this.dialog({
        title: title, text: text, icon: icon || '',
        okText: '知道了', cancelText: null
      });
    }
  };

  GM.UI = UI;

  /* ------------------------------------------------------------
     六、其他小工具
     ------------------------------------------------------------ */
  function coordName(x, y, size) {
    return String.fromCharCode(65 + x) + (y + 1);
  }

  function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }

  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  GM.coordName = coordName;
  GM.clamp = clamp;
  GM.delay = delay;

  /* 存储（容错：隐私模式下 localStorage 可能不可用） */
  GM.store = {
    get: function (k, d) {
      try {
        const v = localStorage.getItem(k);
        return v === null ? d : v;
      } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, v); } catch (e) { /* 忽略 */ }
    }
  };

})(window.GM = window.GM || {});
