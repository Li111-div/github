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
