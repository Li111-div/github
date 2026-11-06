/* ==========================================================================
   App — 状态、筛选、搜索交互、详情抽屉、主题与键盘操作
   ========================================================================== */
(function () {
  'use strict';

  const DATA = Array.isArray(window.CSS_DATA) ? window.CSS_DATA : [];
  const META = window.CSS_META || { total: DATA.length, categories: [], statuses: [], stats: {} };
  const R = window.CSSRender;
  const engine = DATA.length ? new window.CSSSearch.SearchEngine(DATA) : null;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const byName = new Map(DATA.map((item) => [item.name, item]));

  const els = {
    body: document.body,
    hero: $('#hero'),
    heroTotal: $('#heroTotal'),
    heroCatCount: $('#heroCatCount'),
    heroStats: $('#heroStats'),
    heroTags: $('#heroTags'),
    searchBox: $('#searchBox'),
    searchInput: $('#searchInput'),
    searchClear: $('#searchClear'),
    searchPanel: $('#searchPanel'),
    categoryNav: $('#categoryNav'),
    statusFilters: $('#statusFilters'),
    tagFilters: $('#tagFilters'),
    results: $('#results'),
    empty: $('#emptyState'),
    resultTitle: $('#resultTitle'),
    resultCount: $('#resultCount'),
    searchSummary: $('#searchSummary'),
    activeFilters: $('#activeFilters'),
    sortSelect: $('#sortSelect'),
    headerCount: $('#headerCount'),
    footerTotal: $('#footerTotal'),
    themeToggle: $('#themeToggle'),
    menuToggle: $('#menuToggle'),
    sidebar: $('#sidebar'),
    sidebarClose: $('#sidebarClose'),
    sidebarScrim: $('#sidebarScrim'),
    detailPanel: $('#detailPanel'),
    detailBody: $('#detailBody'),
    detailClose: $('#detailClose'),
    detailScrim: $('#detailScrim'),
    toTop: $('#toTop'),
    toast: $('#toast'),
    emptyReset: $('#emptyReset'),
  };

  const state = {
    query: '',
    category: 'all',
    status: 'all',
    tags: new Set(),
    sort: 'relevance',
    results: [],
    tokens: [],
    detailName: null,
    lastFocused: null,
    searchOpen: false,
  };

  const TAG_DEFS = [
    { id: '可继承', label: '可继承', count: META.stats.inherited },
    { id: '可动画', label: '可动画', count: META.stats.animatable },
    { id: '逻辑属性', label: '逻辑属性', count: DATA.filter((p) => p.tags.includes('逻辑属性')).length },
  ];

  const HOT_TAGS = ['flex', 'grid', '居中', '背景', '动画', '圆角', '滚动', '隐藏'];

  /* ------------------------------ 初始化 --------------------------------- */
  function init() {
    if (!DATA.length) {
      els.results.innerHTML = '<div class="empty"><h3>数据加载失败</h3><p>请确认 data/ 目录下的属性数据文件存在，并且 index.html 中的脚本顺序正确。</p></div>';
      return;
    }

    els.headerCount.innerHTML = `${META.total}<em>属性</em>`;
    els.footerTotal.textContent = META.total;
    if (els.heroTotal) els.heroTotal.textContent = META.total;
    if (els.heroCatCount) els.heroCatCount.textContent = META.categories.length;

    initTheme();
    renderHero();
    renderCategoryNav();
    renderStatusFilters();
    renderTagFilters();
    bindEvents();
    syncHeaderHeight();

    const hashName = parseHash();
    render();
    if (hashName) openDetail(hashName, { fromHistory: true });

    // 首屏入场
    document.documentElement.classList.add('is-ready');
  }

  /* -------------------------------- 主题 --------------------------------- */
  function initTheme() {
    let theme = null;
    try {
      theme = localStorage.getItem('css-atlas-theme');
    } catch (e) {}
    if (!theme) {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('css-atlas-theme', next);
    } catch (e) {}
    toast(next === 'dark' ? '已切换到深色主题' : '已切换到浅色主题');
  }

  /* -------------------------------- 首屏 --------------------------------- */
  function renderHero() {
    const stats = META.stats || {};
    const items = [
      { label: '标准属性', value: stats.standard, color: 'var(--good)' },
      { label: '实验性', value: stats.experimental, color: 'var(--warn)' },
      { label: '可继承', value: stats.inherited, color: 'var(--info)' },
      { label: '可动画', value: stats.animatable, color: 'var(--accent-2)' },
      { label: '分类', value: META.categories.length, color: 'var(--accent)' },
    ];
    els.heroStats.innerHTML = items
      .map(
        (s) =>
          `<div class="hero__stat" style="--stat-color:${s.color}"><i></i><b>${s.value}</b>${s.label}</div>`
      )
      .join('');
    els.heroTags.innerHTML = HOT_TAGS.map(
      (t) => `<button class="hero__tag" type="button" role="listitem" data-query="${R.escapeAttr(t)}">${R.escapeHTML(t)}</button>`
    ).join('');
  }

  /* ------------------------------ 侧栏筛选 -------------------------------- */
  function renderCategoryNav() {
    const all = `<button class="category-link is-active" type="button" data-category="all" style="--cat:var(--accent)">
        ${R.icon('grid')}<span class="category-link__dot" style="opacity:0"></span>
        <span class="category-link__name">全部属性</span><span class="category-link__count">${META.total}</span>
      </button>`;
    const cats = META.categories
      .map(
        (c) => `<button class="category-link" type="button" data-category="${R.escapeAttr(c.id)}" style="--cat:${R.catColor(c.id)}" title="${R.escapeAttr(c.desc || '')}">
          ${R.icon(c.icon || 'grid')}
          <span class="category-link__dot"></span>
          <span class="category-link__name">${R.escapeHTML(c.name)}</span>
          <span class="category-link__count">${c.count}</span>
        </button>`
      )
      .join('');
    els.categoryNav.innerHTML = all + cats;
  }

  function renderStatusFilters() {
    const all = `<button class="chip is-active" type="button" data-status="all">全部</button>`;
    const chips = (META.statuses || [])
      .map(
        (s) =>
          `<button class="chip" type="button" data-status="${R.escapeAttr(s.id)}" data-status-key="${R.escapeAttr(s.id)}"><span class="chip__dot"></span>${R.escapeHTML(s.label)}</button>`
      )
      .join('');
    els.statusFilters.innerHTML = all + chips;
  }

  function renderTagFilters() {
    els.tagFilters.innerHTML = TAG_DEFS.map(
      (t) => `<label class="check">
        <input type="checkbox" value="${R.escapeAttr(t.id)}">
        <span class="check__box">${R.icon('check')}</span>
        <span>${R.escapeHTML(t.label)}</span>
        <span class="check__count">${t.count}</span>
      </label>`
    ).join('');
  }

  /* ------------------------------ 过滤与排序 ------------------------------ */
  function filteredItems() {
    let items;
    let tokens = [];
    if (state.query) {
      const res = engine.search(state.query);
      items = res.items;
      tokens = res.tokens;
    } else {
      items = DATA.slice();
    }

    if (state.category !== 'all') items = items.filter((p) => p.category === state.category);
    if (state.status !== 'all') items = items.filter((p) => p.status === state.status);
    if (state.tags.size) items = items.filter((p) => Array.from(state.tags).every((t) => p.tags.includes(t)));

    if (state.query) {
      // 搜索时默认保持相关度；显式选择其他排序时覆盖
      if (state.sort === 'category') items.sort((a, b) => a.order - b.order);
      else if (state.sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
      else if (state.sort === 'status') items.sort(statusSorter);
    } else {
      if (state.sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
      else if (state.sort === 'status') items.sort(statusSorter);
      else items.sort((a, b) => a.order - b.order);
    }

    state.tokens = tokens;
    return items;
  }

  const STATUS_RANK = { experimental: 0, standard: 1, nonstandard: 2, obsolete: 3 };
  function statusSorter(a, b) {
    const diff = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    return diff || a.name.localeCompare(b.name);
  }

  /* -------------------------------- 渲染 --------------------------------- */
  function render() {
    const items = filteredItems();
    state.results = items;
    const n = items.length;

    const hasFilters = state.category !== 'all' || state.status !== 'all' || state.tags.size > 0;
    const isSearch = !!state.query;

    // 首屏仅在完全未筛选时显示
    if (els.hero) els.hero.hidden = isSearch || hasFilters;

    // 标题与计数
    if (isSearch) els.resultTitle.textContent = '搜索结果';
    else if (state.category !== 'all') {
      const cat = META.categories.find((c) => c.id === state.category);
      els.resultTitle.textContent = cat ? cat.name : '筛选结果';
    } else if (hasFilters) els.resultTitle.textContent = '筛选结果';
    else els.resultTitle.textContent = '全部属性';

    els.resultCount.textContent = `${n} 个属性`;

    // 搜索摘要
    if (isSearch || hasFilters) {
      const parts = [];
      if (isSearch) parts.push(`找到 <b>${n}</b> 个与 “${R.escapeHTML(state.query)}” 匹配的属性`);
      else parts.push(`筛选出 <b>${n}</b> 个属性`);
      els.searchSummary.innerHTML = `${R.icon('search')} ${parts.join('，')}`;
      els.searchSummary.hidden = false;
    } else {
      els.searchSummary.hidden = true;
    }

    // 结果
    const grouped = state.sort === 'category' || (state.sort === 'relevance' && !isSearch);
    if (!n) {
      els.results.innerHTML = '';
      els.empty.hidden = false;
    } else {
      els.empty.hidden = true;
      if (grouped) {
        const groups = new Map();
        for (const item of items) {
          if (!groups.has(item.category)) groups.set(item.category, []);
          groups.get(item.category).push(item);
        }
        els.results.classList.remove('is-flat');
        els.results.innerHTML = META.categories
          .filter((c) => groups.has(c.id))
          .map((c) => R.sectionHTML(c, groups.get(c.id), state.tokens))
          .join('');
      } else {
        els.results.classList.add('is-flat');
        els.results.innerHTML = `<div class="cards-grid">${items.map((item) => R.cardHTML(item, state.tokens)).join('')}</div>`;
      }
    }

    renderActiveFilters();
    syncSidebar();
    syncSearchBox();
    updateHashTitle();
  }

  function renderActiveFilters() {
    const pills = [];
    if (state.category !== 'all') {
      const cat = META.categories.find((c) => c.id === state.category);
      if (cat) pills.push(pill('分类：' + cat.name, `data-clear-category`));
    }
    if (state.status !== 'all') {
      const st = (META.statuses || []).find((s) => s.id === state.status);
      if (st) pills.push(pill('状态：' + st.label, `data-clear-status`));
    }
    for (const tag of state.tags) pills.push(pill('特性：' + tag, `data-clear-tag="${R.escapeAttr(tag)}"`));
    if (pills.length) {
      pills.push(`<button class="filter-pill" type="button" data-clear-all style="border-style:dashed">清除筛选${R.icon('close')}</button>`);
    }
    els.activeFilters.innerHTML = pills.join('');

    function pill(label, attrs) {
      return `<span class="filter-pill">${R.escapeHTML(label)}<button type="button" ${attrs} aria-label="移除筛选">${R.icon('close')}</button></span>`;
    }
  }

  function syncSidebar() {
    $$('.category-link', els.categoryNav).forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.category === state.category);
    });
    $$('.chip[data-status]', els.statusFilters).forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.status === state.status);
    });
    $$('input[type="checkbox"]', els.tagFilters).forEach((input) => {
      input.checked = state.tags.has(input.value);
    });
    els.sortSelect.value = state.sort;
  }

  function syncSearchBox() {
    if (els.searchInput.value !== state.query) els.searchInput.value = state.query;
    els.searchBox.classList.toggle('has-value', !!state.query);
  }

  /* -------------------------------- 搜索 --------------------------------- */
  let searchTimer = null;
  function onSearchInput() {
    const value = els.searchInput.value;
    els.searchBox.classList.toggle('has-value', !!value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = value.trim();
      render();
      if (state.searchOpen) renderSearchPanel();
      scrollToResultsIfNeeded();
    }, 90);
  }

  function scrollToResultsIfNeeded() {
    const top = els.results.getBoundingClientRect().top;
    if (top < 0) {
      const y = window.scrollY + top - 90;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  function openSearchPanel() {
    state.searchOpen = true;
    els.searchInput.setAttribute('aria-expanded', 'true');
    renderSearchPanel();
  }

  function closeSearchPanel() {
    state.searchOpen = false;
    els.searchInput.setAttribute('aria-expanded', 'false');
    els.searchPanel.hidden = true;
  }

  function renderSearchPanel() {
    if (!state.searchOpen) return;
    const q = els.searchInput.value.trim();
    let html = '';
    if (!q) {
      html += `<div class="search-panel__label">热门搜索</div><div class="search-panel__chips">`;
      html += HOT_TAGS.map((t) => `<button class="search-hot" type="button" data-query="${R.escapeAttr(t)}">${R.escapeHTML(t)}</button>`).join('');
      html += `</div>`;
      const recent = getRecent();
      if (recent.length) {
        html += `<div class="search-panel__label">最近搜索</div><div class="search-panel__chips">`;
        html += recent.map((t) => `<button class="search-hot" type="button" data-query="${R.escapeAttr(t)}">${R.escapeHTML(t)}</button>`).join('');
        html += `</div>`;
      }
    } else {
      const suggestions = engine.suggest(q, 6);
      if (!suggestions.length) {
        html += `<div class="search-panel__label">没有匹配项</div><div style="padding:6px 8px 10px;color:var(--text-3);font-size:.78rem">换一个更短的关键词试试，例如 <button class="link-btn" data-query="flex">flex</button> 或 <button class="link-btn" data-query="背景">背景</button>。</div>`;
      } else {
        html += `<div class="search-panel__label">属性建议</div>`;
        html += suggestions
          .map(
            (item) =>
              `<button class="search-suggest" type="button" data-open="${R.escapeAttr(item.name)}">
                <code>${R.highlight(item.name, [q])}</code>
                <span class="search-suggest__zh">${R.escapeHTML(item.zh)}</span>
                <span class="search-suggest__cat">${R.escapeHTML(item.categoryName)}</span>
              </button>`
          )
          .join('');
      }
    }
    els.searchPanel.innerHTML = html;
    els.searchPanel.hidden = false;
  }

  function getRecent() {
    try {
      const raw = localStorage.getItem('css-atlas-recent');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0, 6) : [];
    } catch (e) {
      return [];
    }
  }

  function pushRecent(q) {
    if (!q) return;
    try {
      const arr = getRecent().filter((x) => x !== q);
      arr.unshift(q);
      localStorage.setItem('css-atlas-recent', JSON.stringify(arr.slice(0, 6)));
    } catch (e) {}
  }

  function setQuery(q) {
    state.query = q;
    els.searchInput.value = q;
    els.searchBox.classList.toggle('has-value', !!q);
    closeSearchPanel();
    render();
    if (q) pushRecent(q);
  }

  /* ------------------------------ 详情抽屉 -------------------------------- */
  function parseHash() {
    const h = location.hash || '';
    if (!h.startsWith('#/')) return '';
    try {
      return decodeURIComponent(h.slice(2));
    } catch (e) {
      return '';
    }
  }

  function openDetail(name, opts) {
    const item = byName.get(name);
    if (!item) return;
    const options = opts || {};
    if (!state.detailName) state.lastFocused = document.activeElement;
    state.detailName = name;
    closeSearchPanel();

    els.detailBody.innerHTML = R.detailHTML(item, getRelated(item));
    els.detailPanel.classList.add('is-open');
    els.detailPanel.setAttribute('aria-hidden', 'false');
    els.body.classList.add('is-locked');
    els.detailBody.scrollTop = 0;

    const frame = $('#detailPreview');
    if (frame) window.CSSPreview.mount(frame, item.example);

    const panel = $('.detail__panel', els.detailPanel);
    if (panel) panel.focus({ preventScroll: true });

    if (!options.fromHistory) {
      try {
        history.pushState({ property: name }, '', '#/' + encodeURIComponent(name));
      } catch (e) {
        location.hash = '/' + encodeURIComponent(name);
      }
    }
    if (state.query) pushRecent(state.query);
  }

  function closeDetail(opts) {
    const options = opts || {};
    if (!state.detailName) return;
    state.detailName = null;
    els.detailPanel.classList.remove('is-open');
    els.detailPanel.setAttribute('aria-hidden', 'true');
    els.body.classList.remove('is-locked');
    if (!options.fromHistory) {
      try {
        history.replaceState({}, '', location.pathname + location.search);
      } catch (e) {
        location.hash = '';
      }
    }
    const back = state.lastFocused && document.contains(state.lastFocused) ? state.lastFocused : els.searchInput;
    if (back && back.focus) {
      try {
        back.focus({ preventScroll: true });
      } catch (e) {}
    }
    state.lastFocused = null;
  }

  function getRelated(item) {
    let prefix;
    if (item.name.startsWith('--')) prefix = '--';
    else if (item.name.startsWith('-')) prefix = item.name.split('-').slice(0, 3).join('-');
    else prefix = item.name.split('-')[0];

    const scored = [];
    for (const p of DATA) {
      if (p.name === item.name) continue;
      let score = 0;
      if (prefix.length >= 3 && p.name.startsWith(prefix + '-')) score += 100;
      else if (p.name.split('-')[0] === item.name.split('-')[0]) score += 45;
      if (p.category === item.category) score += 30;
      if (p.specGroups.some((g) => item.specGroups.includes(g))) score += 14;
      if (p.zh && item.zh && (p.zh.includes(item.zh) || item.zh.includes(p.zh))) score += 10;
      if (score > 0) scored.push({ p, score });
    }
    scored.sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));
    return scored.slice(0, 8).map((x) => x.p);
  }

  /* ------------------------------ 交互绑定 -------------------------------- */
  function bindEvents() {
    els.searchInput.addEventListener('input', onSearchInput);
    els.searchInput.addEventListener('focus', openSearchPanel);
    els.searchInput.addEventListener('keydown', onSearchKeydown);
    els.searchClear.addEventListener('click', () => {
      state.query = '';
      els.searchInput.value = '';
      els.searchBox.classList.remove('has-value');
      closeSearchPanel();
      render();
      els.searchInput.focus();
    });

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onGlobalKeydown);
    document.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('popstate', onPopState);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', closeSearchPanelOnScroll, { passive: true });

    els.themeToggle.addEventListener('click', toggleTheme);
    els.sortSelect.addEventListener('change', () => {
      state.sort = els.sortSelect.value;
      render();
    });

    els.categoryNav.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-category]');
      if (!btn) return;
      state.category = btn.dataset.category;
      closeSidebar();
      render();
      scrollToResultsIfNeeded();
    });

    els.statusFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-status]');
      if (!btn) return;
      state.status = btn.dataset.status;
      render();
    });

    els.tagFilters.addEventListener('change', () => {
      const checked = $$('input[type="checkbox"]:checked', els.tagFilters).map((i) => i.value);
      state.tags = new Set(checked);
      render();
    });

    els.results.addEventListener('click', (e) => {
      const card = e.target.closest('.card[data-name]');
      if (card) openDetail(card.dataset.name);
    });
    els.results.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.card[data-name]');
      if (card) {
        e.preventDefault();
        openDetail(card.dataset.name);
      }
    });

    els.detailClose.addEventListener('click', () => closeDetail());
    els.detailScrim.addEventListener('click', () => closeDetail());

    els.menuToggle.addEventListener('click', () => toggleSidebar());
    els.sidebarClose.addEventListener('click', () => closeSidebar());
    els.sidebarScrim.addEventListener('click', () => closeSidebar());

    els.toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    els.emptyReset.addEventListener('click', resetAll);
  }

  function onDocumentClick(e) {
    // 复制按钮
    const copyExample = e.target.closest('[data-copy-example]');
    if (copyExample) {
      const pre = $('#detailExample');
      if (pre) copyText(pre.textContent || '', copyExample);
      return;
    }
    const copyName = e.target.closest('[data-copy-name]');
    if (copyName && state.detailName) {
      copyText(state.detailName, copyName);
      return;
    }
    const reload = e.target.closest('[data-preview-reload]');
    if (reload && state.detailName) {
      const item = byName.get(state.detailName);
      const frame = $('#detailPreview');
      if (item && frame) window.CSSPreview.mount(frame, item.example);
      return;
    }

    // 相关属性 / 搜索建议：打开详情
    const openBtn = e.target.closest('[data-open]');
    if (openBtn) {
      const name = openBtn.dataset.open;
      if (state.detailName) {
        openDetail(name, { fromHistory: false });
        els.detailBody.scrollTop = 0;
        if (state.searchOpen) closeSearchPanel();
      } else {
        openDetail(name);
      }
      return;
    }

    // 热门 / 最近搜索 / 空状态关键字
    const queryBtn = e.target.closest('[data-query]');
    if (queryBtn) {
      setQuery(queryBtn.dataset.query);
      els.searchInput.focus();
      return;
    }

    // 清除单条筛选
    if (e.target.closest('[data-clear-category]')) {
      state.category = 'all';
      render();
      return;
    }
    if (e.target.closest('[data-clear-status]')) {
      state.status = 'all';
      render();
      return;
    }
    const clearTag = e.target.closest('[data-clear-tag]');
    if (clearTag) {
      state.tags.delete(clearTag.dataset.clearTag);
      render();
      return;
    }
    if (e.target.closest('[data-clear-all]')) {
      state.category = 'all';
      state.status = 'all';
      state.tags.clear();
      render();
      return;
    }

    // 点击搜索框以外关闭建议面板
    if (state.searchOpen && !els.searchBox.contains(e.target)) closeSearchPanel();
  }

  function copyText(text, trigger) {
    const done = () => {
      toast('已复制到剪贴板');
      if (trigger) {
        trigger.classList.add('is-copied');
        const old = trigger.innerHTML;
        trigger.innerHTML = trigger.innerHTML.replace(/复制.*/, '已复制');
        setTimeout(() => {
          trigger.classList.remove('is-copied');
          trigger.innerHTML = old;
        }, 1400);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (e) {
      toast('复制失败，请手动选择文本');
    }
  }

  let toastTimer = null;
  function toast(message) {
    els.toast.innerHTML = `${R.icon('check')}${R.escapeHTML(message)}`;
    els.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('is-visible'), 1800);
  }

  function onSearchKeydown(e) {
    if (e.key === 'Escape') {
      if (state.searchOpen) {
        closeSearchPanel();
      } else {
        els.searchInput.value = '';
        state.query = '';
        els.searchBox.classList.remove('has-value');
        render();
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      const active = document.activeElement;
      if (active && active.classList && active.classList.contains('search-suggest')) return;
      if (state.results.length) {
        e.preventDefault();
        openDetail(state.results[0].name);
        closeSearchPanel();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      const first = $('.search-suggest', els.searchPanel);
      if (state.searchOpen && first) {
        e.preventDefault();
        first.focus();
      } else if (!state.searchOpen) {
        e.preventDefault();
        const firstCard = $('.card', els.results);
        if (firstCard) firstCard.focus();
      }
    }
  }

  function onGlobalKeydown(e) {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement.isContentEditable;

    // 详情打开时把焦点限制在抽屉内，避免快捷键把焦点移到遮罩后的页面
    if (state.detailName) {
      if (e.key === 'Tab') trapDetailFocus(e);
      else if (e.key === 'Escape') {
        e.preventDefault();
        closeDetail();
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      els.searchInput.focus();
      els.searchInput.select();
      openSearchPanel();
      return;
    }
    if (e.key === '/' && !isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      els.searchInput.focus();
      openSearchPanel();
      return;
    }
    if (e.key === 'Escape' && state.searchOpen) {
      closeSearchPanel();
    }
    if (!isTyping && !state.detailName && e.key === 'ArrowDown' && state.results.length) {
      const firstCard = $('.card', els.results);
      if (firstCard) {
        e.preventDefault();
        firstCard.focus();
      }
    }
    // 在建议面板内导航
    if (state.searchOpen) {
      const items = $$('.search-suggest', els.searchPanel);
      if (!items.length) return;
      const idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && idx >= 0) {
        e.preventDefault();
        (items[idx + 1] || items[0]).focus();
      } else if (e.key === 'ArrowUp' && idx >= 0) {
        e.preventDefault();
        if (idx === 0) els.searchInput.focus();
        else items[idx - 1].focus();
      }
    }
  }

  function trapDetailFocus(e) {
    const panel = $('.detail__panel', els.detailPanel);
    if (!panel) return;
    const nodes = $$(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
      panel
    );
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || !panel.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onPopState() {
    const name = parseHash();
    if (name) openDetail(name, { fromHistory: true });
    else closeDetail({ fromHistory: true });
  }

  function onResize() {
    if (window.innerWidth > 1024) closeSidebar();
    syncHeaderHeight();
  }

  function syncHeaderHeight() {
    const topbar = $('.topbar');
    if (!topbar) return;
    const h = topbar.getBoundingClientRect().height;
    if (h > 0) document.documentElement.style.setProperty('--topbar-h', h + 'px');
  }

  function onScroll() {
    els.toTop.classList.toggle('is-visible', window.scrollY > 700);
  }

  let lastScrollY = 0;
  function closeSearchPanelOnScroll() {
    if (!state.searchOpen) return;
    if (Math.abs(window.scrollY - lastScrollY) > 80) closeSearchPanel();
    lastScrollY = window.scrollY;
  }

  /* ------------------------------ 侧栏抽屉 -------------------------------- */
  function toggleSidebar() {
    const open = els.sidebar.classList.toggle('is-open');
    els.menuToggle.setAttribute('aria-expanded', String(open));
    els.sidebarScrim.hidden = !open;
    els.body.classList.toggle('is-locked', open);
  }

  function closeSidebar() {
    els.sidebar.classList.remove('is-open');
    els.menuToggle.setAttribute('aria-expanded', 'false');
    els.sidebarScrim.hidden = true;
    if (!state.detailName) els.body.classList.remove('is-locked');
  }

  /* -------------------------------- 工具 --------------------------------- */
  function resetAll() {
    state.query = '';
    state.category = 'all';
    state.status = 'all';
    state.tags.clear();
    state.sort = 'relevance';
    els.searchInput.value = '';
    els.searchBox.classList.remove('has-value');
    els.sortSelect.value = 'relevance';
    closeSearchPanel();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateHashTitle() {
    const base = 'CSS 属性图谱';
    if (state.detailName) {
      document.title = `${state.detailName} · ${base}`;
    } else {
      document.title = `${base} · ${META.total} 个 CSS 属性中文速查`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
