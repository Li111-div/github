/* ============================================================
   peer.js — WebRTC 点对点连接管理
   采用「手动交换信令」模式，全程不需要任何服务器：
     房主：createInvite()  → 得到邀请码 → 发给好友
     好友：joinWithInvite(邀请码) → 得到回传码 → 发回房主
     房主：finishWithAnswer(回传码) → 连接建立
   ============================================================ */
(function (GM) {
  'use strict';

  const C = GM.CONFIG;

  function PeerLink(handlers) {
    this.h = handlers || {};
    this.pc = null;
    this.dc = null;
    this.role = null;         // 'host' | 'guest'
    this._disposed = false;
  }

  /* 把候选列表压成 "host×1 srflx×1" 这样的短串，便于在一行里展示 */
  function summarizeCandidates(list) {
    const byType = {};
    list.forEach(function (c) {
      const t = c.candidateType || 'unknown';
      byType[t] = (byType[t] || 0) + 1;
    });
    const keys = Object.keys(byType);
    if (!keys.length) return '无';
    return keys.map(function (k) { return k + '×' + byType[k]; }).join(' ');
  }

  PeerLink.prototype = {

    /* ---------- 创建底层连接对象 ---------- */
    _createPC: function () {
      const pc = new RTCPeerConnection({ iceServers: C.ICE_SERVERS });

      const self = this;
      pc.oniceconnectionstatechange = function () { self._emitState(); };
      pc.onconnectionstatechange = function () { self._emitState(); };
      pc.onicecandidateerror = function () { /* 局域网场景可忽略 */ };

      return pc;
    },

    _emitState: function () {
      if (!this.pc || !this.h.onState) return;
      this.h.onState({
        connection: this.pc.connectionState,
        ice: this.pc.iceConnectionState,
        channel: this.dc ? this.dc.readyState : 'none'
      });
    },

    /* ---------- 等待 ICE 候选收集完成（带超时兜底） ---------- */
    _waitForIce: function (pc) {
      return new Promise(function (resolve) {
        if (pc.iceGatheringState === 'complete') return resolve();

        let done = false;
        function finish() {
          if (done) return;
          done = true;
          clearTimeout(timer);
          pc.removeEventListener('icegatheringstatechange', onChange);
          resolve();
        }
        function onChange() {
          if (pc.iceGatheringState === 'complete') finish();
        }
        const timer = setTimeout(finish, C.ICE_GATHER_TIMEOUT);
        pc.addEventListener('icegatheringstatechange', onChange);
      });
    },

    /* ---------- 房主：生成邀请码 ---------- */
    createInvite: function () {
      const self = this;
      this.dispose();
      this.role = 'host';

      this.pc = this._createPC();

      /* 房主负责创建数据通道 */
      const dc = this.pc.createDataChannel('gomoku', { ordered: true });
      this._bindChannel(dc);

      return this.pc.createOffer()
        .then(function (offer) { return self.pc.setLocalDescription(offer); })
        .then(function () { return self._waitForIce(self.pc); })
        .then(function () {
          return GM.packSignal({
            v: C.SIGNAL_VERSION,
            kind: 'offer',
            sdp: self.pc.localDescription.sdp
          });
        });
    },

    /* ---------- 好友：用邀请码生成回传码 ---------- */
    joinWithInvite: function (inviteText) {
      const self = this;
      this.dispose();
      this.role = 'guest';

      return GM.unpackSignal(inviteText).then(function (data) {
        if (!data || !data.sdp || data.kind !== 'offer') {
          throw new Error('这不是一段有效的邀请码');
        }

        self.pc = self._createPC();

        /* 好友被动接收数据通道 */
        self.pc.ondatachannel = function (e) { self._bindChannel(e.channel); };

        return self.pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
      })
      .then(function () { return self.pc.createAnswer(); })
      .then(function (answer) { return self.pc.setLocalDescription(answer); })
      .then(function () { return self._waitForIce(self.pc); })
      .then(function () {
        return GM.packSignal({
          v: C.SIGNAL_VERSION,
          kind: 'answer',
          sdp: self.pc.localDescription.sdp
        });
      });
    },

    /* ---------- 房主：用回传码完成握手 ---------- */
    finishWithAnswer: function (answerText) {
      const self = this;
      if (!this.pc) return Promise.reject(new Error('请先生成邀请码'));

      /* 回传码只能喂给「已经发出 offer、正在等 answer」的连接。
         若状态不是 have-local-offer，说明这段回传码对应的邀请码已经作废
         （重新生成过），或者这段回传码本身已经用过一次。
         这里必须提前拦下：否则 setRemoteDescription 会抛出英文的
         "Failed to set remote answer sdp: Called in wrong state: stable"，
         用户完全看不懂，只能看到一串 DOMException。 */
      if (this.pc.signalingState !== 'have-local-offer') {
        return Promise.reject(new Error(
          this.pc.signalingState === 'stable'
            ? '这段回传码已经用过了（或邀请码已被重新生成）。请点「重新生成」，再把新的邀请码发给好友'
            : '连接状态已失效，请点「重新生成」重新开始'
        ));
      }

      return GM.unpackSignal(answerText).then(function (data) {
        if (!data || !data.sdp || data.kind !== 'answer') {
          throw new Error('这不是一段有效的回传码');
        }
        return self.pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
      });
    },

    /* ---------- 绑定数据通道事件 ---------- */
    _bindChannel: function (dc) {
      const self = this;
      this.dc = dc;

      dc.onopen = function () {
        self._emitState();
        if (self.h.onOpen) self.h.onOpen();
      };

      dc.onclose = function () {
        self._emitState();
        if (self.h.onClose) self.h.onClose('closed');
      };

      dc.onerror = function () {
        if (self.h.onError) self.h.onError('channel');
      };

      dc.onmessage = function (e) {
        let msg = null;
        try { msg = JSON.parse(e.data); } catch (err) { return; }
        if (msg && self.h.onMessage) self.h.onMessage(msg);
      };
    },

    /* ---------- 状态查询 ---------- */
    get connected() {
      return !!this.dc && this.dc.readyState === 'open';
    },

    /* ---------- 发送消息 ---------- */
    send: function (obj) {
      if (!this.connected) return false;
      try {
        this.dc.send(JSON.stringify(obj));
        return true;
      } catch (e) {
        return false;
      }
    },

    /* ---------- 连接诊断 ----------
       联机失败时用户只会看到「打不通」，但原因有很多种，解法完全不同：
         · 本机候选里没有 srflx → STUN 没返回，可能被网络拦截
         · 对端候选为「无」       → 对端的候选压根没送达
         · 候选对全部 failed      → 双方互相发包但收不到（AP 隔离 / 防火墙）
       把这几项摊成一行文本，用户截图或复制发出来就能直接定位。 */
    diagnose: function () {
      const self = this;
      const pc = this.pc;
      if (!pc) return Promise.resolve('尚未创建连接');

      return pc.getStats().then(function (stats) {
        const local = [];
        const remote = [];
        let total = 0;
        let failed = 0;
        let succeeded = 0;

        stats.forEach(function (s) {
          if (s.type === 'local-candidate') local.push(s);
          else if (s.type === 'remote-candidate') remote.push(s);
          else if (s.type === 'candidate-pair') {
            total++;
            if (s.state === 'failed') failed++;
            else if (s.state === 'succeeded') succeeded++;
          }
        });

        return [
          '本机候选 ' + summarizeCandidates(local),
          '对端候选 ' + summarizeCandidates(remote),
          '候选对 成功' + succeeded + '/失败' + failed + '/共' + total,
          'ICE ' + pc.iceConnectionState,
          '通道 ' + (self.dc ? self.dc.readyState : 'none')
        ].join('；');
      }).catch(function () {
        return '诊断信息读取失败';
      });
    },

    /* ---------- 释放资源 ---------- */
    dispose: function () {
      this._disposed = true;
      try { if (this.dc) this.dc.close(); } catch (e) {}
      try { if (this.pc) this.pc.close(); } catch (e) {}
      this.dc = null;
      this.pc = null;
    }
  };

  GM.PeerLink = PeerLink;

})(window.GM = window.GM || {});
