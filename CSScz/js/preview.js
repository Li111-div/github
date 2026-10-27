/* ==========================================================================
   Preview — 在沙箱 iframe 中渲染属性示例
   ========================================================================== */
(function () {
  'use strict';

  const BASE_CSS = `
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      padding: 16px;
      overflow: auto;
      background: #f6f8fc;
      color: #1f2937;
      font-family: "PingFang SC", "Microsoft YaHei", -apple-system, "Segoe UI", sans-serif;
      font-size: 13px;
      line-height: 1.6;
    }
    .demo {
      min-height: 56px;
      padding: 12px;
      border: 1px solid #dbe3ef;
      border-radius: 8px;
      background: #ffffff;
      color: #1f2937;
    }
    .text {
      display: inline-block;
      margin: 2px 6px 2px 0;
      font-size: 13px;
    }
    .item {
      display: inline-block;
      min-width: 30px;
      margin: 3px;
      padding: 6px 10px;
      border-radius: 5px;
      background: #dbe7f7;
      color: #1e3a5f;
      font-family: ui-monospace, Consolas, monospace;
      font-size: 12px;
      text-align: center;
    }
  `;

  const DEMO_HTML = `
    <div class="demo">
      <span class="text">Aa 文字示例</span>
      <div class="item">1</div>
      <div class="item">2</div>
      <div class="item">3</div>
    </div>
  `;

  function sanitizeCSS(css) {
    return String(css || '')
      .replace(/<\/style/gi, '<\\/style')
      .replace(/@import[^;]*;/gi, '');
  }

  function buildSrcdoc(example) {
    return (
      '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>' + BASE_CSS + '</style>' +
      '<style>' + sanitizeCSS(example) + '</style>' +
      '</head><body>' + DEMO_HTML + '</body></html>'
    );
  }

  function mount(frame, example) {
    if (!frame) return;
    frame.setAttribute('sandbox', '');
    frame.setAttribute('title', '属性示例实时预览');
    frame.srcdoc = buildSrcdoc(example);
  }

  window.CSSPreview = { buildSrcdoc, mount, DEMO_HTML };
})();
