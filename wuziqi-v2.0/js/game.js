/* ============================================================
   game.js — 五子棋核心逻辑（纯数据层，不碰 DOM）
   棋盘坐标约定：x 为列（0..size-1，左→右）
                 y 为行（0..size-1，上→下）
                 board[y][x] 存放棋子颜色
   颜色：0 = 空，1 = 黑（先手），2 = 白（后手）
   ------------------------------------------------------------ */
(function (GM) {
  'use strict';

  const C = GM.CONFIG;
  const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];   // 横 / 竖 / 撇 / 捺

  function Game(size, winCount) {
    this.size = size || C.BOARD_SIZE;
    this.winCount = winCount || C.WIN_COUNT;
    this.reset();
  }

  Game.prototype = {

    /* ---------- 重置为初始状态 ---------- */
    reset: function () {
      const n = this.size;
      this.board = [];
      for (let y = 0; y < n; y++) {
        this.board.push(new Array(n).fill(0));
      }
      this.turn = 1;          // 当前该谁落子
      this.moves = [];        // 落子历史 [{x, y, c}]
      this.winner = 0;        // 0=未结束 1=黑胜 2=白胜 3=和棋
      this.winLine = null;    // 获胜的连线坐标数组
      this.ended = false;
      return this;
    },

    /* ---------- 查询 ---------- */
    inside: function (x, y) {
      return x >= 0 && y >= 0 && x < this.size && y < this.size;
    },

    at: function (x, y) {
      return this.inside(x, y) ? this.board[y][x] : -1;
    },

    get moveCount() { return this.moves.length; },

    lastMove: function () {
      return this.moves.length ? this.moves[this.moves.length - 1] : null;
    },

    /* ---------- 落子 ----------
       返回 { ok, reason?, winLine?, winner?, ended? } */
    place: function (x, y, color) {
      if (this.ended) return { ok: false, reason: 'ended' };
      if (!this.inside(x, y)) return { ok: false, reason: 'outside' };
      if (this.board[y][x] !== 0) return { ok: false, reason: 'occupied' };
      if (color !== this.turn) return { ok: false, reason: 'not-turn' };

      this.board[y][x] = color;
      this.moves.push({ x: x, y: y, c: color });

      const line = this._findLine(x, y, color);

      if (line) {
        this.winner = color;
        this.winLine = line;
        this.ended = true;
      } else if (this.moves.length >= this.size * this.size) {
        this.winner = 3;                      // 棋盘填满，和棋
        this.ended = true;
      } else {
        this.turn = 3 - color;                // 轮到对方
      }

      return {
        ok: true,
        winLine: this.winLine,
        winner: this.winner,
        ended: this.ended
      };
    },

    /* 从刚落下的一子出发，向四个方向延伸，寻找是否连成五子 */
    _findLine: function (x, y, color) {
      for (let d = 0; d < DIRS.length; d++) {
        const dx = DIRS[d][0];
        const dy = DIRS[d][1];
        const pts = [[x, y]];

        for (let s = 1; s >= -1; s -= 2) {
          let nx = x + dx * s;
          let ny = y + dy * s;
          while (this.inside(nx, ny) && this.board[ny][nx] === color) {
            pts.push([nx, ny]);
            nx += dx * s;
            ny += dy * s;
          }
        }

        if (pts.length >= this.winCount) {
          // 只保留最靠近落子点的连续五子（处理长连情形）
          return this._trimLine(pts, x, y, dx, dy);
        }
      }
      return null;
    },

    /* 当连线长度超过 winCount（长连）时，截取包含落子点的一段 */
    _trimLine: function (pts, x, y, dx, dy) {
      if (pts.length <= this.winCount) return pts;

      const key = function (p) { return dx !== 0 ? p[0] : p[1]; };
      const sorted = pts.slice().sort(function (a, b) { return key(a) - key(b); });
      const anchor = sorted.findIndex(function (p) { return p[0] === x && p[1] === y; });

      let start = anchor - Math.floor(this.winCount / 2);
      start = GM.clamp(start, 0, sorted.length - this.winCount);
      return sorted.slice(start, start + this.winCount);
    },

    /* ---------- 悔棋：撤回 n 步 ---------- */
    undo: function (steps) {
      let count = steps || 1;
      let removed = 0;

      while (removed < count && this.moves.length) {
        const m = this.moves.pop();
        this.board[m.y][m.x] = 0;
        this.turn = m.c;          // 轮到刚被撤回的那一方重下
        removed++;
      }

      if (removed) {
        this.winner = 0;
        this.winLine = null;
        this.ended = false;
      }
      return removed;
    },

    /* ---------- 序列化（用于全量同步） ---------- */
    serialize: function () {
      return {
        size: this.size,
        winCount: this.winCount,
        turn: this.turn,
        winner: this.winner,
        ended: this.ended,
        moves: this.moves.map(function (m) { return [m.x, m.y, m.c]; })
      };
    },

    /* ---------- 从序列化数据恢复 ---------- */
    deserialize: function (data) {
      this.size = data.size || this.size;
      this.winCount = data.winCount || this.winCount;
      this.reset();
      const list = data.moves || [];
      for (let i = 0; i < list.length; i++) {
        this.place(list[i][0], list[i][1], list[i][2]);
      }
      return this;
    }
  };

  GM.Game = Game;

})(window.GM = window.GM || {});
