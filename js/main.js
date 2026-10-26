/* ==========================================================================
   阜阳职业技术学校 · 官网交互脚本
   原生 JS（IIFE）· 无依赖 · 滚动监听 passive + rAF · 重复初始化幂等
   模块：页头收缩 / 导航指示器 / 进度条 / 抽屉 / 网格入场 / odometer
        / 筛选滑块 / 灯箱双图交叉 / 视频原位播放 / 表单校验 / 返回顶部 / 指针高光
   ========================================================================== */
(function () {
  'use strict';

  if (window.__fySiteInit) return;
  window.__fySiteInit = true;

  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var root = doc.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js-on');

  /* 统一的滚动/尺寸调度器：一帧只跑一次 */
  var frameQueued = false;
  var frameTasks = [];
  function onFrame(fn) {
    if (frameTasks.indexOf(fn) === -1) frameTasks.push(fn);
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(function () {
      frameQueued = false;
      var list = frameTasks;
      frameTasks = [];
      for (var i = 0; i < list.length; i++) list[i]();
    });
  }
  function schedule() { onFrame(tick); }

  /* ------------------------------------------------------------------------
     1. 页头收缩 + 滚动进度条 + 返回顶部
     ---------------------------------------------------------------------- */
  var hdr = $('#hdr');
  var progress = $('#progress');
  var toTop = $('#toTop');
  var lastY = -1;

  function tick() {
    var y = window.pageYOffset || root.scrollTop || 0;
    if (y !== lastY) {
      lastY = y;
      if (hdr) {
        var was = hdr.classList.contains('is-solid');
        if (was !== hdr.classList.toggle('is-solid', y > 24) && navInd) moveNavInd(navActive, false);
      }
      if (toTop) toTop.classList.toggle('is-show', y > 600);
      if (progress) {
        var max = doc.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(y / max, 1) : 0;
        progress.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      }
    }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { lastY = -1; schedule(); }, { passive: true });

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------------------
     2. 导航滑动指示器
     ---------------------------------------------------------------------- */
  var nav = $('.nav');
  var navInd = $('.nav__ind');
  var navLinks = nav ? $$('a', nav) : [];
  var navActive = nav ? $('a.is-active', nav) : null;

  function moveNavInd(target, preview) {
    if (!navInd) return;
    if (!target) {
      navInd.classList.remove('is-ready', 'is-preview');
      return;
    }
    var left = target.offsetLeft;
    var width = target.offsetWidth;
    navInd.style.transform = 'translateX(' + left + 'px) scaleX(' + (width / 100) + ')';
    navInd.classList.add('is-ready');
    navInd.classList.toggle('is-preview', !!preview);
  }
  if (nav && navInd) {
    navLinks.forEach(function (a) {
      a.addEventListener('mouseenter', function () { moveNavInd(a, true); });
      a.addEventListener('focus', function () { moveNavInd(a, true); });
    });
    nav.addEventListener('mouseleave', function () { moveNavInd(navActive, false); });
    nav.addEventListener('blur', function () { moveNavInd(navActive, false); }, true);
    window.addEventListener('resize', function () { moveNavInd(navActive, false); }, { passive: true });
    onFrame(function () { moveNavInd(navActive, false); });
    window.addEventListener('load', function () { moveNavInd(navActive, false); });
  }

  /* ------------------------------------------------------------------------
     3. 移动端抽屉
     ---------------------------------------------------------------------- */
  var drawer = $('#drawer');
  var scrim = $('#scrim');
  var burger = $('#burger');
  var drawerClose = $('#drawerClose');

  function lockBody(on) {
    var anyOpen = (drawer && drawer.classList.contains('is-open')) ||
      (lb && lb.classList.contains('is-open')) ||
      (vbox && vbox.classList.contains('is-open')) ||
      (search && search.classList.contains('is-open')) ||
      (newsModal && newsModal.classList.contains('is-open'));
    var lock = on ? true : anyOpen;
    if (lock && !doc.body.classList.contains('is-locked')) {
      var gap = window.innerWidth - root.clientWidth;
      doc.body.style.paddingRight = gap > 0 ? gap + 'px' : '';
      doc.body.classList.add('is-locked');
    } else if (!lock && doc.body.classList.contains('is-locked')) {
      doc.body.classList.remove('is-locked');
      doc.body.style.paddingRight = '';
    }
  }
  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    if (scrim) scrim.classList.add('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    lockBody(true);
    var first = $('a', drawer);
    if (first) setTimeout(function () { first.focus(); }, 300);
  }
  function closeDrawer() {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    if (scrim) scrim.classList.remove('is-open');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.focus();
    }
    lockBody(false);
  }
  if (burger) burger.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (scrim) scrim.addEventListener('click', closeDrawer);
  if (drawer) {
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', closeDrawer); });
  }

  /* ------------------------------------------------------------------------
     4. 网格 stagger + 入场
     ---------------------------------------------------------------------- */
  var staggerHosts = '.grid, .major-grid, .stat-grid, .honor-grid, .mosaic, .awards__list, .steps, .filters-bar';
  $$(staggerHosts).forEach(function (host) {
    Array.prototype.forEach.call(host.children, function (child, i) {
      if (!child.classList || !child.classList.contains('reveal')) return;
      if (child.style.getPropertyValue('--d')) return;
      child.style.setProperty('--d', Math.min(i, 8) * 60 + 'ms');
    });
  });

  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------------------
     5. 数字 odometer
     ---------------------------------------------------------------------- */
  var odoEls = $$('.odo');
  var odoReady = [];

  odoEls.forEach(function (el) {
    var raw = (el.getAttribute('data-value') || el.textContent || '').trim();
    if (!/^[\d.]+$/.test(raw)) return;
    el.textContent = '';
    el.setAttribute('aria-label', raw);
    var cols = [];
    for (var i = 0; i < raw.length; i++) {
      var ch = raw.charAt(i);
      if (ch === '.') {
        var dot = doc.createElement('span');
        dot.className = 'odo__dot';
        dot.textContent = '.';
        el.appendChild(dot);
        continue;
      }
      var d = doc.createElement('span');
      d.className = 'odo__d';
      var c = doc.createElement('span');
      c.className = 'odo__c';
      c.style.setProperty('--n', '0');
      for (var n = 0; n <= 9; n++) {
        var b = doc.createElement('b');
        b.textContent = String(n);
        c.appendChild(b);
      }
      d.appendChild(c);
      el.appendChild(d);
      cols.push({ node: c, digit: parseInt(ch, 10), idx: cols.length });
    }
    odoReady.push({ el: el, cols: cols, raw: raw });
  });

  function runOdo(item) {
    item.cols.forEach(function (col) {
      col.node.style.setProperty('--dd', (col.idx * 40) + 'ms');
      col.node.style.setProperty('--n', String(col.digit));
    });
  }
  if (odoReady.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var oio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var item = null;
          for (var i = 0; i < odoReady.length; i++) {
            if (odoReady[i].el === en.target) { item = odoReady[i]; break; }
          }
          if (item) runOdo(item);
          oio.unobserve(en.target);
        });
      }, { threshold: 0.35 });
      odoReady.forEach(function (item) { oio.observe(item.el); });
    } else {
      odoReady.forEach(runOdo);
    }
  }

  /* ------------------------------------------------------------------------
     6. 进度条（师资 / 升学 / 就业）
     ---------------------------------------------------------------------- */
  var bars = $$('[data-fill]');
  function runBar(el) {
    var v = parseFloat(el.getAttribute('data-fill')) || 0;
    el.style.width = Math.max(0, Math.min(100, v)) + '%';
  }
  if (bars.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var bio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          setTimeout(function () { runBar(en.target); }, 120);
          bio.unobserve(en.target);
        });
      }, { threshold: 0.4 });
      bars.forEach(function (el) { bio.observe(el); });
    } else {
      bars.forEach(runBar);
    }
  }

  /* ------------------------------------------------------------------------
     7. 分类筛选（滑块 + 淡入淡出）
     ---------------------------------------------------------------------- */
  $$('[data-filter-group]').forEach(function (group) {
    var btns = $$('.fbtn', group);
    var ind = $('.filters__ind', group);
    var target = $(group.getAttribute('data-filter-group'));
    if (!target) return;
    var items = $$('[data-cat]', target);
    var timer = null;

    function place(btn) {
      if (!ind || !btn) return;
      ind.style.transform = 'translateX(' + btn.offsetLeft + 'px) scaleX(' + (btn.offsetWidth / 100) + ')';
    }
    function apply(key) {
      items.forEach(function (it) { it.classList.add('is-fading'); });
      clearTimeout(timer);
      timer = setTimeout(function () {
        items.forEach(function (it) {
          var cat = it.getAttribute('data-cat') || '';
          var show = key === 'all' || cat.indexOf(key) > -1;
          it.classList.toggle('is-hidden', !show);
        });
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            items.forEach(function (it) { it.classList.remove('is-fading'); });
          });
        });
      }, reduce ? 0 : 160);
    }

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        place(btn);
        apply(btn.getAttribute('data-filter') || 'all');
      });
    });

    var active = $('.fbtn.is-active', group) || btns[0];
    if (active) {
      active.setAttribute('aria-pressed', 'true');
      place(active);
    }
    window.addEventListener('resize', function () {
      var a = $('.fbtn.is-active', group) || btns[0];
      place(a);
    }, { passive: true });
    window.addEventListener('load', function () {
      var a = $('.fbtn.is-active', group) || btns[0];
      place(a);
    });
  });

  /* ------------------------------------------------------------------------
     8. 灯箱（双图交叉淡入）
     ---------------------------------------------------------------------- */
  var lb = $('#lightbox');
  var lbLayers = lb ? $$('.lb__img', lb) : [];
  var lbCap = $('#lbCap');
  var lbPrev = $('#lbPrev');
  var lbNext = $('#lbNext');
  var lbList = [];
  var lbIndex = 0;
  var lbActive = 0;
  var lbFirst = true;

  function paintLb() {
    if (!lbList.length || !lbLayers.length) return;
    var item = lbList[lbIndex];
    var incoming = lbLayers[1 - lbActive];
    var outgoing = lbLayers[lbActive];
    var commit = function () {
      incoming.classList.remove('is-out');
      outgoing.classList.add('is-out');
      lbActive = 1 - lbActive;
    };
    incoming.src = item.src;
    incoming.alt = item.cap || '';
    if (lbFirst) {
      incoming.classList.remove('is-out');
      outgoing.classList.add('is-out');
      lbActive = 1 - lbActive;
      lbFirst = false;
    } else if (incoming.decode) {
      incoming.decode().then(commit).catch(commit);
    } else {
      commit();
    }
    if (lbCap) lbCap.textContent = item.cap || '';
    var multi = lbList.length > 1;
    if (lbPrev) lbPrev.hidden = !multi;
    if (lbNext) lbNext.hidden = !multi;
  }

  function openLb(items, index) {
    if (!lb || !items.length) return;
    lbList = items;
    lbIndex = index;
    lbFirst = true;
    paintLb();
    lb.classList.add('is-open');
    lockBody(true);
    var closeBtn = $('.lb__close', lb);
    if (closeBtn) closeBtn.focus();
  }
  function closeLb() {
    if (!lb || !lb.classList.contains('is-open')) return;
    lb.classList.remove('is-open');
    lockBody(false);
  }
  function stepLb(dir) {
    if (lbList.length < 2) return;
    lbIndex = (lbIndex + dir + lbList.length) % lbList.length;
    paintLb();
  }

  $$('[data-lightbox]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var scope = el.closest('[data-gallery]') || doc;
      var nodes = $$('[data-lightbox]', scope).filter(function (n) { return n.offsetParent !== null; });
      var items = nodes.map(function (n) {
        return { src: n.getAttribute('data-lightbox'), cap: n.getAttribute('data-cap') || '' };
      });
      openLb(items, Math.max(0, nodes.indexOf(el)));
    });
  });
  if (lbPrev) lbPrev.addEventListener('click', function () { stepLb(-1); });
  if (lbNext) lbNext.addEventListener('click', function () { stepLb(1); });
  if (lb) {
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb__stage')) closeLb();
    });
    var lbClose = $('.lb__close', lb);
    if (lbClose) lbClose.addEventListener('click', closeLb);
  }

  /* ------------------------------------------------------------------------
     9. 视频（原位播放）
     ---------------------------------------------------------------------- */
  var vbox = $('#videobox');
  var vStage = $('#videoStage');

  function stopAllVideos(except) {
    $$('video').forEach(function (v) {
      if (v === except) return;
      if (v.closest('.vcard')) {
        var card = v.closest('.vcard');
        v.pause();
        v.remove();
        card.classList.remove('is-playing');
        var x = $('.vcard__x', card);
        if (x) x.remove();
      }
    });
  }

  function playInPlace(card) {
    if (!card || card.classList.contains('is-playing')) return;
    var src = card.getAttribute('data-video');
    if (!src) return;
    stopAllVideos(null);
    var video = doc.createElement('video');
    video.className = 'vcard__video';
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'metadata';
    card.appendChild(video);
    card.classList.add('is-playing');

    var x = doc.createElement('button');
    x.className = 'vcard__x';
    x.type = 'button';
    x.setAttribute('aria-label', '关闭视频');
    x.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    x.addEventListener('click', function (e) {
      e.stopPropagation();
      video.pause();
      video.remove();
      x.remove();
      card.classList.remove('is-playing');
    });
    card.appendChild(x);
  }

  $$('.vcard[data-video]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.vcard__x')) return;
      if (card.classList.contains('is-playing')) return;
      playInPlace(card);
    });
  });

  /* 旧式视频弹层（保留兼容，若页面存在 #videobox） */
  function openVbox(src, title) {
    if (!vbox || !vStage) return;
    vStage.innerHTML = '<video src="' + src + '" controls autoplay playsinline></video>';
    var cap = $('#videoCap');
    if (cap) cap.textContent = title || '';
    vbox.classList.add('is-open');
    lockBody(true);
  }
  function closeVbox() {
    if (!vbox || !vbox.classList.contains('is-open')) return;
    vbox.classList.remove('is-open');
    if (vStage) vStage.innerHTML = '';
    lockBody(false);
  }
  $$('[data-video-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openVbox(btn.getAttribute('data-video-modal'), btn.getAttribute('data-title'));
    });
  });
  if (vbox) {
    vbox.addEventListener('click', function (e) {
      if (e.target === vbox || e.target.classList.contains('lb__stage')) closeVbox();
    });
    var vClose = $('.lb__close', vbox);
    if (vClose) vClose.addEventListener('click', closeVbox);
  }

  /* ------------------------------------------------------------------------
     10. 全局键盘
     ---------------------------------------------------------------------- */
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDrawer();
      closeLb();
      closeVbox();
    }
    if (!lb || !lb.classList.contains('is-open')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepLb(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); stepLb(1); }
  });

  /* ------------------------------------------------------------------------
     11. Toast
     ---------------------------------------------------------------------- */
  var toast = $('#toast');
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    var txt = $('.toast__t', toast);
    if (txt) txt.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-show'); }, 3600);
  }
  if (toast) {
    toast.addEventListener('click', function () { toast.classList.remove('is-show'); });
  }

  /* ------------------------------------------------------------------------
     12. 表单校验
     ---------------------------------------------------------------------- */
  var form = $('#contactForm');
  if (form) {
    form.setAttribute('novalidate', 'novalidate');
    var fields = [
      { input: $('#fname'), test: function (v) { return v.trim().length > 0; }, msg: '请填写姓名' },
      {
        input: $('#fphone'),
        test: function (v) { return /^1\d{10}$/.test(v.replace(/\s|-/g, '')); },
        msg: '请填写 11 位手机号码'
      }
    ];

    function setError(input, msg) {
      var field = input.closest('.field');
      if (!field) return;
      field.classList.add('is-error');
      field.classList.remove('is-shake');
      var err = $('.field__err', field);
      if (err) err.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      void field.offsetWidth;
      field.classList.add('is-shake');
      setTimeout(function () { field.classList.remove('is-shake'); }, 820);
    }
    function clearError(input) {
      var field = input.closest('.field');
      if (!field) return;
      field.classList.remove('is-error', 'is-shake');
      input.removeAttribute('aria-invalid');
    }

    fields.forEach(function (f) {
      if (!f.input) return;
      f.input.addEventListener('input', function () { clearError(f.input); });
      f.input.addEventListener('blur', function () {
        if (f.input.value.trim() && !f.test(f.input.value)) setError(f.input, f.msg);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      fields.forEach(function (f) {
        if (!f.input) return;
        if (!f.test(f.input.value)) {
          setError(f.input, f.msg);
          if (!bad) bad = f.input;
        } else {
          clearError(f.input);
        }
      });
      if (bad) {
        bad.focus();
        return;
      }
      showToast('留言已记录，招生办将在工作时间与你联系');
      form.reset();
      fields.forEach(function (f) { if (f.input) clearError(f.input); });
    });
  }

  /* ------------------------------------------------------------------------
     13. 指针高光（仅精确指针设备）
     ---------------------------------------------------------------------- */
  if (fine && !reduce) {
    $$('.hl').forEach(function (card) {
      var raf = null, tx = 0, ty = 0, cx = 0, cy = 0, active = false;
      function loop() {
        cx += (tx - cx) * 0.2;
        cy += (ty - cy) * 0.2;
        card.style.setProperty('--mx', cx + 'px');
        card.style.setProperty('--my', cy + 'px');
        if (Math.abs(tx - cx) > 0.6 || Math.abs(ty - cy) > 0.6) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = null;
        }
      }
      card.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = card.getBoundingClientRect();
        tx = e.clientX - r.left;
        ty = e.clientY - r.top;
        if (!active) {
          active = true;
          cx = tx;
          cy = ty;
          card.classList.add('is-hl');
        }
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener('pointerleave', function () {
        if (!active) return;
        active = false;
        card.classList.remove('is-hl');
        tx = card.offsetWidth / 2;
        ty = card.offsetHeight / 2;
        if (!raf) raf = requestAnimationFrame(loop);
      });
    });
  }

  /* ------------------------------------------------------------------------
     14. 年份 + 首帧
     ---------------------------------------------------------------------- */
  $$('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  onFrame(tick);
  window.addEventListener('load', function () {
    onFrame(tick);
    if (nav && navInd) moveNavInd(navActive, false);
  });

  /* ------------------------------------------------------------------------
     15. 站内搜索
     ---------------------------------------------------------------------- */
  var search = $('#search');
  var searchInput = $('#searchInput');
  var searchRes = $('#searchRes');
  var searchOpener = null;

  var SEARCH_PAGES = [
    { t: '首页', d: '学校简介、办学数据、专业速览、新闻动态', u: 'index.html', k: '主页 招生 概况' },
    { t: '学校概况', d: '历史沿革、办学条件、荣誉资质、师资力量', u: 'about.html', k: '关于 历史 荣誉' },
    { t: '新闻动态', d: '校园要闻、教学教研、德育天地、通知公告', u: 'news.html', k: '新闻 资讯 通知' },
    { t: '专业设置', d: '25 个专业、15 个品牌专业方向、1+X 证书', u: 'majors.html', k: '专业 课程 方向' },
    { t: '师资队伍', d: '442 名教职工、双师型教师、教学团队', u: 'teachers.html', k: '老师 教师 师资' },
    { t: '校园风采', d: '校园风光、实训掠影、技能大赛、学生活动', u: 'campus.html', k: '图片 视频 校园' },
    { t: '招生就业', d: '报名指南、招生计划、升学与就业', u: 'admission.html', k: '报名 招生 就业 升学' },
    { t: '联系我们', d: '地址、电话、公交路线、在线留言', u: 'contact.html', k: '电话 地址 地图' },
    { t: '常见问题', d: '报名条件、学费、住宿、升学、资助政策', u: 'faq.html', k: 'FAQ 问答 疑问' },
    { t: '资料下载', d: '质量年报、省赛获奖名单等文件下载', u: 'downloads.html', k: 'PDF 文件 下载' }
  ];

  var SEARCH_MAJORS = [
    ['计算机应用技术', '电子与信息', '国家级教学资源库在建专业，1+X 证书试点'],
    ['网络信息安全', '电子与信息', '网络安防实训室支撑，面向系统运维与安全服务'],
    ['物联网技术应用', '电子与信息', '对接智能家居与物联网安装维护岗位'],
    ['影像与影视技术', '文化艺术', '省级在线精品课程，1+X 考证通过率 100%'],
    ['机电技术应用', '装备制造', '省级在建精品课程，对接海尔、美的等企业'],
    ['智能化生产线安装与运维', '装备制造', '面向智能制造产线安装、调试与运维'],
    ['机械加工技术', '装备制造', '车工、铣工、装配全流程实训'],
    ['数控技术应用', '装备制造', '数控车、加工中心全流程实训'],
    ['汽车运用与维修', '交通运输', '1+X 证书试点专业，考证通过率 100%'],
    ['汽车美容与装潢', '交通运输', '汽车美容、车身修复实训'],
    ['新能源汽车制造与检测', '交通运输', '面向新能源汽车装配与检测岗位'],
    ['会计', '财经商贸', '电算化实训室 + 企业真账实操'],
    ['电子商务', '财经商贸', '网店运营、直播电商与客户服务'],
    ['幼儿保育', '教育与体育', '舞蹈房、琴房、美工室配套齐全'],
    ['食品加工工艺', '食品药品', '食品加工与检验实训'],
    ['服装设计与工艺', '轻工纺织', '服装设计、制版与缝制实训'],
    ['护理', '医药卫生', '基础护理与健康照护方向'],
    ['导游服务', '旅游服务', '导游讲解、旅行社运营方向']
  ];

  var SEARCH_NEWS = [
    ['学校召开 2026 年春季学期开学工作会议', '校园要闻'],
    ['2026 年招生咨询工作全面启动', '招生就业'],
    ['学校在省职业院校技能大赛再获佳绩', '教学教研'],
    ['装备制造专业部开展企业实践教学活动', '教学教研'],
    ['学校举行“技能成才 强国有我”主题教育活动', '德育天地'],
    ['2026 年校园开放日暨职业教育活动周安排', '通知公告'],
    ['学校开展春季校园安全隐患排查', '校园要闻'],
    ['幼儿保育专业举办毕业汇报演出', '德育天地'],
    ['关于 2026 年端午节放假安排的通知', '通知公告']
  ];

  var SEARCH_FAQ = [
    ['报名需要什么条件？', '应往届初中毕业生均可报名'],
    ['学费和住宿费多少？', '公办中职免学费，住宿费按物价部门标准'],
    ['毕业后能升学吗？', '可参加对口升学、分类考试等'],
    ['学校地址和乘车路线？', '颍东区富强路与众兴路交汇处，66 路公交直达']
  ];

  var SEARCH_FILES = [
    ['中等职业教育质量年度报告（2024 年）', 'PDF · 约 14.1 MB'],
    ['2025—2026 安徽省赛中职组获奖名单（学生赛）', 'PDF · 约 544 KB'],
    ['2025—2026 安徽省赛中职组获奖名单（教师赛）', 'PDF · 约 247 KB']
  ];

  var searchIndex = (function () {
    var list = [];
    SEARCH_PAGES.forEach(function (p) {
      list.push({ t: p.t, d: p.d, u: p.u, k: p.k, type: '页面' });
    });
    SEARCH_MAJORS.forEach(function (m) {
      list.push({ t: m[0], d: m[1] + ' · ' + m[2], u: 'majors.html', k: '专业 ' + m[1], type: '专业' });
    });
    SEARCH_NEWS.forEach(function (n) {
      list.push({ t: n[0], d: n[1] + ' · 校园新闻示例稿件', u: 'news.html', k: '新闻 资讯 ' + n[1], type: '资讯' });
    });
    SEARCH_FAQ.forEach(function (f) {
      list.push({ t: f[0], d: f[1], u: 'faq.html', k: 'FAQ 问答 常见问题', type: '问答' });
    });
    SEARCH_FILES.forEach(function (f) {
      list.push({ t: f[0], d: f[1], u: 'downloads.html', k: '下载 文件 PDF 资料', type: '下载' });
    });
    return list;
  })();

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function markHtml(s, tokens) {
    var out = escHtml(s);
    tokens.forEach(function (tk) {
      if (!tk) return;
      var re = new RegExp('(' + tk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }
  function renderSearch(raw) {
    if (!searchRes) return;
    var q = (raw || '').trim();
    var tokens = q ? q.toLowerCase().split(/\s+/) : [];
    var hits = searchIndex.filter(function (it) {
      if (!tokens.length) return it.type === '页面';
      var hay = (it.t + ' ' + it.d + ' ' + it.k).toLowerCase();
      return tokens.every(function (tk) { return hay.indexOf(tk) > -1; });
    });
    if (tokens.length) {
      hits.sort(function (a, b) {
        var at = a.t.toLowerCase().indexOf(tokens[0]) > -1 ? 0 : 1;
        var bt = b.t.toLowerCase().indexOf(tokens[0]) > -1 ? 0 : 1;
        return at - bt;
      });
      hits = hits.slice(0, 8);
    } else {
      hits = hits.slice(0, 6);
    }
    if (!hits.length) {
      searchRes.innerHTML = '<div class="search__empty"><b>没有找到“' + escHtml(q) + '”</b>' +
        '试试“招生”“数控”“升学”“学费”等关键词，或直接拨打 0558-2315697 咨询。</div>';
      return;
    }
    searchRes.innerHTML = hits.map(function (it) {
      return '<a class="sres" href="' + it.u + '">' +
        '<span class="sres__k">' + escHtml(it.type) + '</span>' +
        '<span class="sres__b"><span class="sres__t">' + markHtml(it.t, tokens) + '</span>' +
        '<span class="sres__d">' + markHtml(it.d, tokens) + '</span></span></a>';
    }).join('');
  }
  function openSearch() {
    if (!search) return;
    var active = doc.activeElement;
    searchOpener = (active && active !== doc.body && !(active.closest && active.closest('.drawer'))) ? active : null;
    closeDrawer();
    renderSearch(searchInput ? searchInput.value : '');
    search.classList.add('is-open');
    lockBody(true);
    setTimeout(function () {
      if (searchInput) { searchInput.focus(); searchInput.select(); }
    }, reduce ? 0 : 80);
  }
  function closeSearch() {
    if (!search || !search.classList.contains('is-open')) return;
    search.classList.remove('is-open');
    if (search.contains(doc.activeElement)) doc.activeElement.blur();
    if (searchOpener && doc.contains(searchOpener) && searchOpener.offsetParent !== null) searchOpener.focus();
    searchOpener = null;
    lockBody(false);
  }
  $$('[data-search-open]').forEach(function (btn) {
    btn.addEventListener('click', openSearch);
  });
  $$('[data-search-close]').forEach(function (btn) {
    btn.addEventListener('click', closeSearch);
  });
  if (searchInput) {
    searchInput.addEventListener('input', function () { renderSearch(searchInput.value); });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var first = $('.sres', searchRes);
      if (first) {
        e.preventDefault();
        window.location.href = first.getAttribute('href');
      }
    });
  }
  $$('[data-search-q]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var q = btn.getAttribute('data-search-q') || '';
      if (searchInput) {
        searchInput.value = q;
        searchInput.focus();
      }
      renderSearch(q);
    });
  });
  doc.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) ||
        (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') closeSearch();
  });

  /* ------------------------------------------------------------------------
     16. 新闻详情弹窗
     ---------------------------------------------------------------------- */
  var newsModal = $('#newsModal');
  var newsDataEl = $('#newsData');
  var NEWS = {};
  if (newsDataEl) {
    try { NEWS = JSON.parse(newsDataEl.textContent || '{}'); } catch (err) { NEWS = {}; }
  }
  var nmImg = $('#nmImg');
  var nmCat = $('#nmCat');
  var nmDate = $('#nmDate');
  var nmTitle = $('#nmTitle');
  var nmBody = $('#nmBody');
  var newsOpener = null;

  function openNews(id) {
    var item = NEWS[id];
    if (!item || !newsModal) return;
    newsOpener = doc.activeElement;
    if (nmImg) { nmImg.src = item.img || ''; nmImg.alt = item.title || ''; }
    if (nmCat) nmCat.textContent = item.cat || '校园新闻';
    if (nmDate) nmDate.textContent = item.date || '';
    if (nmTitle) nmTitle.textContent = item.title || '';
    if (nmBody) {
      nmBody.innerHTML = '';
      if (item.lead) {
        var lead = doc.createElement('p');
        lead.className = 'nmodal__lead';
        lead.textContent = item.lead;
        nmBody.appendChild(lead);
      }
      (item.body || []).forEach(function (txt) {
        var p = doc.createElement('p');
        p.textContent = txt;
        nmBody.appendChild(p);
      });
      if (item.sign) {
        var sign = doc.createElement('p');
        sign.className = 'nmodal__sign';
        sign.textContent = item.sign;
        nmBody.appendChild(sign);
      }
    }
    newsModal.classList.add('is-open');
    lockBody(true);
    var closeBtn = $('.nmodal__close', newsModal);
    if (closeBtn) setTimeout(function () { closeBtn.focus(); }, reduce ? 0 : 70);
  }
  function closeNews() {
    if (!newsModal || !newsModal.classList.contains('is-open')) return;
    newsModal.classList.remove('is-open');
    if (newsModal.contains(doc.activeElement)) doc.activeElement.blur();
    if (newsOpener && doc.contains(newsOpener) && newsOpener.offsetParent !== null) newsOpener.focus();
    newsOpener = null;
    lockBody(false);
  }
  $$('[data-news]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      openNews(card.getAttribute('data-news'));
    });
  });
  if (newsModal) {
    newsModal.addEventListener('click', function (e) {
      if (e.target === newsModal || e.target.classList.contains('nmodal__bd')) closeNews();
    });
    var newsClose = $('.nmodal__close', newsModal);
    if (newsClose) newsClose.addEventListener('click', closeNews);
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNews();
  });

  /* ------------------------------------------------------------------------
     17. 新闻筛选计数
     ---------------------------------------------------------------------- */
  var newsGrid = $('#newsGrid');
  if (newsGrid) {
    var newsCount = $('#newsCount');
    var newsEmpty = $('#newsEmpty');
    var countNews = function () {
      var shown = $$('.ncard', newsGrid).filter(function (c) {
        return !c.classList.contains('is-hidden');
      }).length;
      if (newsCount) newsCount.innerHTML = '共 <b>' + shown + '</b> 条';
      if (newsEmpty) newsEmpty.classList.toggle('is-show', shown === 0);
    };
    var newsFilterGroup = $('[data-filter-group="#newsGrid"]');
    if (newsFilterGroup) {
      $$('.fbtn', newsFilterGroup).forEach(function (btn) {
        btn.addEventListener('click', function () {
          setTimeout(countNews, reduce ? 0 : 220);
        });
      });
    }
    countNews();
  }

  /* ------------------------------------------------------------------------
     18. 常见问题手风琴
     ---------------------------------------------------------------------- */
  $$('.faq__i').forEach(function (item) {
    var q = $('.faq__q', item);
    if (!q) return;
    q.addEventListener('click', function () {
      var willOpen = !item.classList.contains('is-open');
      $$('.faq__i').forEach(function (other) {
        if (other === item) return;
        other.classList.remove('is-open');
        var oq = $('.faq__q', other);
        if (oq) oq.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', willOpen);
      q.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  });

  /* ------------------------------------------------------------------------
     19. 按钮涟漪
     ---------------------------------------------------------------------- */
  if (!reduce) {
    $$('.btn--primary, .btn--ghost').forEach(function (btn) {
      btn.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 1.8;
        var span = doc.createElement('span');
        span.className = 'ripple';
        span.style.width = size + 'px';
        span.style.height = size + 'px';
        span.style.left = (e.clientX - rect.left - size / 2) + 'px';
        span.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(span);
        setTimeout(function () { span.remove(); }, 700);
      });
    });
  }
})();
