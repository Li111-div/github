/* ==========================================================================
   Search Engine — 多字段加权 + 英文子序列模糊匹配
   支持按属性名、JS 驼峰名、中文名、别名、关键字、描述、语法与取值搜索
   ========================================================================== */
(function () {
  'use strict';

  const normalize = (s) =>
    String(s == null ? '' : s)
      .toLowerCase()
      .replace(/[，。；：、！？]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  function tokenize(query) {
    const q = normalize(query);
    if (!q) return [];
    const tokens = q.split(' ').filter(Boolean);
    // 单个长词保持整体；中文没有空格时用整体匹配
    return tokens.slice(0, 8);
  }

  function fuzzyScore(haystack, needle) {
    if (needle.length < 2) return 0;
    let pos = 0;
    let streak = 0;
    let lastIndex = -2;
    let score = 0;
    for (let i = 0; i < needle.length; i++) {
      const ch = needle[i];
      const idx = haystack.indexOf(ch, pos);
      if (idx === -1) return 0;
      if (idx === lastIndex + 1) {
        streak += 1;
        score += 10 + streak * 4;
      } else {
        streak = 0;
        score += 6 - Math.min(idx - pos, 8);
      }
      lastIndex = idx;
      pos = idx + 1;
    }
    if (haystack.startsWith(needle[0])) score += 6;
    return Math.max(score, 1);
  }

  // Damerau-Levenshtein 编辑距离（相邻字符交换算一次），用于英文拼写容错
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 99;
    const rows = a.length + 1;
    const cols = b.length + 1;
    const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
    for (let i = 0; i < rows; i++) dp[i][0] = i;
    for (let j = 0; j < cols; j++) dp[0][j] = j;
    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
        }
      }
    }
    return dp[a.length][b.length];
  }

  function scoreToken(item, token) {
    const name = item._name;
    const js = item._js;
    const zh = item._zh;
    let best = 0;

    if (name === token || js === token) best = 1400;
    else if (zh === token) best = 1320;
    else if (item._aliases.includes(token)) best = 1200;

    if (best < 1200) {
      if (name.startsWith(token)) best = Math.max(best, 1080);
      if (js.startsWith(token)) best = Math.max(best, 1060);
      if (zh.startsWith(token)) best = Math.max(best, 1040);
      if (item._compact === token) best = Math.max(best, 1120);
      else if (item._compact.startsWith(token)) best = Math.max(best, 1010);
      if (item._aliases.some((a) => a.startsWith(token))) best = Math.max(best, 980);
    }

    const nameIdx = name.indexOf(token);
    if (nameIdx !== -1) best = Math.max(best, 900 - Math.min(nameIdx, 40));
    const compactIdx = item._compact.indexOf(token);
    if (compactIdx !== -1) best = Math.max(best, 870 - Math.min(compactIdx, 40));
    const zhIdx = zh.indexOf(token);
    if (zhIdx !== -1) best = Math.max(best, 820 - Math.min(zhIdx, 30));
    if (item._aliases.some((a) => a.includes(token))) best = Math.max(best, 760);
    if (item._keywords.some((k) => k.includes(token))) best = Math.max(best, 600);
    if (item._summary.includes(token)) best = Math.max(best, 470);
    if (item._description.includes(token)) best = Math.max(best, 360);
    if (item._tags.some((t) => t === token)) best = Math.max(best, 320);
    if (item._syntax.includes(token)) best = Math.max(best, 280);
    if (item._category.includes(token)) best = Math.max(best, 250);
    if (item._status.includes(token)) best = Math.max(best, 220);
    if (item._values.includes(token)) best = Math.max(best, 180);
    if (item._initial.includes(token)) best = Math.max(best, 160);

    if (best === 0) {
      const fuzzyName = fuzzyScore(name, token);
      if (fuzzyName > 0) best = 120 + fuzzyName;
      else if (token.length >= 2) {
        const fuzzyJs = fuzzyScore(js, token);
        if (fuzzyJs > 0) best = 110 + fuzzyJs;
      }
    }

    // 英文拼写容错：例如 dispaly → display、trasform → transform
    if (best === 0 && token.length >= 3 && /^[a-z0-9-]+$/.test(token)) {
      const compact = token.replace(/-/g, '');
      const dist = editDistance(compact, item._compact);
      const allowed = compact.length >= 6 ? 2 : 1;
      if (dist <= allowed) best = 100 - dist * 12;
    }

    return best;
  }

  class SearchEngine {
    constructor(items) {
      this.items = items.map((item) => {
        const aliases = (item.aliases || []).map(normalize);
        item._name = normalize(item.name);
        item._compact = item._name.replace(/-/g, '');
        item._js = normalize(item.js || '');
        item._zh = normalize(item.zh || '');
        item._aliases = aliases;
        item._keywords = (item.keywords || []).map(normalize);
        item._summary = normalize(item.summary || '');
        item._description = normalize(item.description || '');
        item._tags = (item.tags || []).map(normalize);
        item._syntax = normalize(item.syntax || '');
        item._category = normalize(item.categoryName || '');
        item._status = normalize(item.statusLabel || '');
        item._values = normalize((item.values || []).map((v) => v.v + ' ' + v.d).join(' '));
        item._initial = normalize(item.initial || '');
        return item;
      });
    }

    search(query) {
      const tokens = tokenize(query);
      if (!tokens.length) {
        return { items: this.items.slice(), tokens: [], scores: new Map() };
      }

      const results = [];
      const scores = new Map();
      for (const item of this.items) {
        let total = 0;
        let matchedAll = true;
        for (const token of tokens) {
          const s = scoreToken(item, token);
          if (!s) {
            matchedAll = false;
            break;
          }
          total += s;
        }
        if (!matchedAll) continue;
        // 整体短语命中额外加分
        const phrase = tokens.join(' ');
        if (tokens.length > 1 && item._name.includes(phrase)) total += 500;
        if (tokens.length > 1 && item._zh.includes(phrase)) total += 400;
        total += Math.max(0, 120 - item.order / 10) * 0.1;
        scores.set(item.name, total);
        results.push(item);
      }

      results.sort((a, b) => {
        const diff = scores.get(b.name) - scores.get(a.name);
        return diff || a.order - b.order;
      });

      return { items: results, tokens, scores };
    }

    /** 供搜索建议面板使用：按评分取前 N 个 */
    suggest(query, limit) {
      return this.search(query).items.slice(0, limit || 6);
    }
  }

  function highlightHTML(text, tokens, escapeHTML) {
    const safe = escapeHTML(String(text == null ? '' : text));
    if (!tokens || !tokens.length) return safe;
    const pattern = tokens
      .filter((t) => t.length > 0)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length)
      .join('|');
    if (!pattern) return safe;
    try {
      return safe.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark>$1</mark>');
    } catch (e) {
      return safe;
    }
  }

  window.CSSSearch = { SearchEngine, tokenize, normalize, highlightHTML, fuzzyScore };
})();
