/* 严格 file:// 环境验证：不加 --allow-file-access-from-files，并切断所有网络请求 */
const { chromium } = require('playwright-core');
const path = require('path');
const EXE = 'C:/Users/31009/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const URL = 'file:///' + path.join(__dirname, 'OPEN_ME.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: EXE });   // 只保留默认参数
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [], net = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  // 拦截一切非 file:// 的请求
  await p.route('**/*', route => {
    const u = route.request().url();
    if (!u.startsWith('file://')) { net.push(u); return route.abort(); }
    return route.continue();
  });
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__FL_APP__ && window.__FL_APP__.model, null, { timeout: 30000 });
  await p.waitForTimeout(3000);
  const st = await p.evaluate(() => {
    const a = window.__FL_APP__;
    return { parts: a.model.stats.parts, tris: a.model.stats.tris,
             fps: document.getElementById('fps').textContent,
             fridge: +a.thermal.fridgeTemp.toFixed(2), bad: !isFinite(a.thermal.cop) };
  });
  // 写到系统临时目录，避免污染交付用的 qa/ 目录
  const os = require('os');
  await p.screenshot({ path: path.join(os.tmpdir(), 'fridge-offline-check.png') });
  console.log('严格 file:// 结果:', JSON.stringify(st));
  console.log('外部网络请求:', net.length ? net.join(', ') : '无（0 个）');
  console.log('控制台错误:', errs.length ? errs.join(' | ') : '无');
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
