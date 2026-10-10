/* ============================================================
   views.js — 多界面路由（单页应用，无需刷新）
   ============================================================ */
(function (GM) {
  'use strict';

  const VIEWS = ['home', 'host', 'guest', 'game', 'help'];

  const Views = {
    current: 'home',
    _guard: null,       // 离开视图前的拦截函数 (from, to) => Promise<bool>

    /* 注册离开拦截（例如对局中确认退出） */
    setGuard: function (fn) { this._guard = fn; },

    /* 切换视图 */
    show: function (name, force) {
      const self = this;
      if (VIEWS.indexOf(name) < 0) name = 'home';

      const proceed = function () {
        self.current = name;

        GM.$$('.view').forEach(function (v) {
          v.classList.toggle('is-active', v.id === 'view-' + name);
        });

        GM.$$('.navlink').forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-nav') === name);
        });

        /* 切到新视图时滚回顶部 */
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      if (!force && this._guard && name !== this.current) {
        Promise.resolve(this._guard(this.current, name)).then(function (ok) {
          if (ok) proceed();
        });
        return;
      }
      proceed();
    },

    /* 是否处于对局界面 */
    inGame: function () { return this.current === 'game'; }
  };

  GM.Views = Views;

})(window.GM = window.GM || {});
