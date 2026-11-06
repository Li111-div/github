/* ==========================================================================
   Render — 卡片、分类分组、详情面板与筛选控件的 HTML 生成
   ========================================================================== */
(function () {
  'use strict';

  const CAT_COLORS = {
    layout: '#60a5fa',
    flexgrid: '#34d399',
    box: '#fbbf24',
    typography: '#f472b6',
    color: '#f87171',
    border: '#a78bfa',
    effect: '#22d3ee',
    animation: '#fb923c',
    transform: '#e879f9',
    list: '#a3e635',
    scroll: '#38bdf8',
    fragmentation: '#facc15',
    mask: '#c084fc',
    content: '#2dd4bf',
    svg: '#f0abfc',
    ext: '#94a3b8',
    other: '#64748b',
  };

  const STATUS_CLASS = {
    standard: 'badge--standard',
    experimental: 'badge--experimental',
    nonstandard: 'badge--nonstandard',
    obsolete: 'badge--obsolete',
  };

  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(s) {
    return escapeHTML(s).replace(/\n/g, '&#10;');
  }

  function catColor(id) {
    return CAT_COLORS[id] || CAT_COLORS.other;
  }

  function highlight(text, tokens) {
    return window.CSSSearch.highlightHTML(text, tokens, escapeHTML);
  }

  function statusBadge(item, always) {
    if (!item.status || item.status === 'standard') {
      if (!always) return '';
      return `<span class="badge badge--standard">标准</span>`;
    }
    return `<span class="badge ${STATUS_CLASS[item.status] || ''}">${escapeHTML(item.statusLabel)}</span>`;
  }

  function icon(id, cls) {
    return `<svg class="icon ${cls || ''}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  }

  /* ------------------------------- 卡片 ---------------------------------- */
  function cardHTML(item, tokens) {
    const color = catColor(item.category);
    const tags = [];
    if (item.inherited === '是') tags.push('可继承');
    if (item.animation && !/不可动画/.test(item.animation)) tags.push('可动画');
    const tagHTML = tags
      .slice(0, 2)
      .map((t) => `<span class="card__tag">${t}</span>`)
      .join('');
    return `<article class="card" tabindex="0" role="button" data-name="${escapeAttr(item.name)}"
      aria-label="${escapeAttr(item.name)}，${escapeAttr(item.zh)}，${escapeAttr(item.categoryName)}" style="--cat:${color}">
      <div class="card__head">
        <span class="card__cat"><i class="card__cat-dot"></i>${escapeHTML(item.categoryName)}</span>
        ${statusBadge(item, false)}
      </div>
      <h3 class="card__name">${highlight(item.name, tokens)}</h3>
      <p class="card__zh">${highlight(item.zh, tokens)}</p>
      <p class="card__summary">${highlight(item.summary, tokens)}</p>
      <div class="card__foot">
        ${tagHTML}
        <span class="card__syntax" title="语法：${escapeAttr(item.syntax)}">${escapeHTML(item.syntax)}</span>
      </div>
    </article>`;
  }

  function sectionHTML(cat, items, tokens) {
    const color = catColor(cat.id);
    const cards = items.map((item) => cardHTML(item, tokens)).join('');
    return `<section class="cat-section" id="cat-${cat.id}" style="--cat:${color}">
      <div class="cat-section__head">
        <span class="cat-section__dot"></span>
        <h2 class="cat-section__title">${escapeHTML(cat.name)}</h2>
        <span class="cat-section__count">${items.length}</span>
        <span class="cat-section__line"></span>
      </div>
      <div class="cards-grid">${cards}</div>
    </section>`;
  }

  /* ------------------------------- 详情 ---------------------------------- */
  function valueRows(values) {
    return values
      .map(
        (v) => `<div class="value-row"><code>${escapeHTML(v.v)}</code><p>${escapeHTML(v.d)}</p></div>`
      )
      .join('');
  }

  function specItems(item) {
    const specs = [
      ['初始值', item.initial, true],
      ['继承', item.inherited, false],
      ['动画', item.animation, false],
      ['百分比', item.percentages, false],
      ['适用元素', item.appliesTo, false],
      ['计算值', item.computed, false],
    ];
    return specs
      .map(
        ([label, value, mono]) =>
          `<div class="spec-item"><dt>${label}</dt><dd class="${mono ? 'is-mono' : ''}">${escapeHTML(value)}</dd></div>`
      )
      .join('');
  }

  function browserCell(value) {
    if (value == null || value === '') {
      return '<span class="browser-ver is-unknown">—</span>';
    }
    if (value === '✗') {
      return '<span class="browser-ver is-no">不支持</span>';
    }
    if (value === '支持') {
      return '<span class="browser-ver is-yes">支持</span>';
    }
    return `<span class="browser-ver is-yes">${escapeHTML(value)}</span>`;
  }

  function browserSection(item) {
    const b = item.browser || {};
    return `<section class="detail-section">
      <h3 class="detail-section__title">浏览器支持 <small>Browser Support</small></h3>
      <div class="browser-scroll">
        <table class="browser-table">
          <thead><tr><th>Chrome</th><th>Firefox</th><th>Safari</th><th>Edge</th></tr></thead>
          <tbody><tr>
            <td>${browserCell(b.chrome)}</td>
            <td>${browserCell(b.firefox)}</td>
            <td>${browserCell(b.safari)}</td>
            <td>${browserCell(b.edge)}</td>
          </tr></tbody>
        </table>
      </div>
      <p class="browser-note">数字为对应浏览器首次支持该属性的版本；“不支持”表示兼容数据缺失或明确不支持；带前缀的版本表示需要浏览器私有前缀。</p>
    </section>`;
  }

  function detailHTML(item, related) {
    const color = catColor(item.category);
    const groups = (item.specGroups || []).join(' · ');
    const values = item.values && item.values.length
      ? `<section class="detail-section">
          <h3 class="detail-section__title">取值 <small>Values</small></h3>
          <div class="value-list">${valueRows(item.values)}</div>
        </section>`
      : '';
    const notes = item.notes && item.notes.length
      ? `<section class="detail-section">
          <h3 class="detail-section__title">注意事项 <small>Notes</small></h3>
          <div class="notes">${item.notes.map((n) => `<div class="note">${escapeHTML(n)}</div>`).join('')}</div>
        </section>`
      : '';
    const relatedHTML = related && related.length
      ? `<section class="detail-section">
          <h3 class="detail-section__title">相关属性 <small>Related</small></h3>
          <div class="related-list">${related
            .map(
              (p) =>
                `<button class="related-chip" type="button" data-open="${escapeAttr(p.name)}">${escapeHTML(p.name)}<span>${escapeHTML(p.zh)}</span></button>`
            )
            .join('')}</div>
        </section>`
      : '';

    return `<header class="detail__head">
        <div class="detail__eyebrow">
          <span class="detail__cat" style="--cat:${color}"><i class="detail__cat-dot"></i>${escapeHTML(item.categoryName)}</span>
          ${groups ? `<span class="detail__spec-group" title="${escapeAttr(groups)}">${escapeHTML(groups)}</span>` : ''}
        </div>
        <h2 class="detail__title" id="detailTitle">${escapeHTML(item.name)}</h2>
        <div class="detail__sub">
          <span class="detail__zh">${escapeHTML(item.zh)}</span>
          <code class="detail__js">JS: ${escapeHTML(item.js)}</code>
          ${statusBadge(item, true)}
        </div>
        <div class="detail__actions">
          <button class="btn btn--primary" type="button" data-copy-example>${icon('copy')}复制示例</button>
          <button class="btn" type="button" data-copy-name>${icon('copy')}复制属性名</button>
          ${item.mdn ? `<a class="btn" href="${escapeAttr(item.mdn)}" target="_blank" rel="noopener noreferrer">MDN 文档${icon('external')}</a>` : ''}
        </div>
      </header>
      <p class="detail__desc">${escapeHTML(item.description)}</p>

      <section class="detail-section">
        <h3 class="detail-section__title">语法 <small>Syntax</small></h3>
        <div class="syntax-box">${escapeHTML(item.syntax)}</div>
      </section>

      ${values}

      <section class="detail-section">
        <h3 class="detail-section__title">技术细节 <small>Specification</small></h3>
        <dl class="spec-grid">${specItems(item)}</dl>
      </section>

      <section class="detail-section">
        <h3 class="detail-section__title">示例 <small>Example</small></h3>
        <div class="codeblock">
          <div class="codeblock__bar">
            <span>CSS</span>
            <button class="copy-btn" type="button" data-copy-example>${icon('copy')}复制</button>
          </div>
          <pre id="detailExample"><code>${escapeHTML(item.example)}</code></pre>
        </div>
        <div class="preview" style="margin-top:10px">
          <div class="preview__bar">
            <span><strong>实时预览</strong> · .demo 示例结构</span>
            <button class="copy-btn" type="button" data-preview-reload>重新运行</button>
          </div>
          <iframe class="preview__frame" id="detailPreview" loading="lazy"></iframe>
        </div>
      </section>

      ${notes}
      ${browserSection(item)}
      ${relatedHTML}

      <footer class="detail__source">
        <span>数据整理自 MDN / W3C 规范</span>
        ${item.mdn ? `<a href="${escapeAttr(item.mdn)}" target="_blank" rel="noopener noreferrer">查看完整文档${icon('external')}</a>` : ''}
      </footer>`;
  }

  window.CSSRender = {
    escapeHTML,
    escapeAttr,
    catColor,
    highlight,
    icon,
    cardHTML,
    sectionHTML,
    detailHTML,
    statusBadge,
  };
})();
