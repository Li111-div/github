/* QA harness — 用 Playwright 实际运行页面并截图 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const EXE = 'C:/Users/31009/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const URL = 'file:///' + path.join(ROOT, 'OPEN_ME.html').replace(/\\/g, '/');
const QA = path.join(ROOT, 'qa');

const VIEW = process.argv[2] || '1920x1080';
const ONLY = process.argv[3] || 'all';
const [VW, VH] = VIEW.split('x').map(Number);

(async () => {
  if (!fs.existsSync(QA)) fs.mkdirSync(QA, { recursive: true });
  const browser = await chromium.launch({
    executablePath: EXE,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--allow-file-access-from-files', '--disable-lcd-text'],
  });
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });

  const errors = [];
  const logs = [];
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning') errors.push('[' + t + '] ' + m.text());
    else logs.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));

  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });

  // 等待首帧
  await page.waitForFunction(() => window.__FL_APP__ && window.__FL_APP__.model, null, { timeout: 60000 });
  await page.waitForTimeout(2600);

  const stats = await page.evaluate(() => {
    const a = window.__FL_APP__;
    return {
      parts: a.model.stats.parts,
      meshes: a.model.stats.meshes,
      tris: a.model.stats.tris,
      partsList: Array.from(window.FL.parts.keys()),
    };
  });

  async function shot(name, prep, wait) {
    if (prep) await page.evaluate(prep);
    await page.waitForTimeout(wait || 1900);
    // 软件渲染下帧率低，缓动未收敛：强制完成相机过渡以获得确定的构图
    await page.evaluate(() => window.__FL_APP__.rig.settle());
    await page.waitForTimeout(260);
    await page.screenshot({ path: path.join(QA, name + '.png') });
    console.log('  · qa/' + name + '.png');
  }

  async function snap(name) {
    await page.screenshot({ path: path.join(QA, name + '.png') });
  }

  console.log('== parts=' + stats.parts + ' meshes=' + stats.meshes + ' tris=' + stats.tris);

  if (ONLY === 'all' || ONLY === 'core') {
    await shot('product', () => window.__FL_APP__.ui.setMode('product'));
    await shot('open', () => window.__FL_APP__.ui.setMode('open'), 2400);
    await shot('02b_food_full', () => {
      const a = window.__FL_APP__;
      a.thermal.foodOn = true; a.thermal.foodLoad = 1;
      a.ui.syncFood();
    }, 1600);
    await shot('02c_food_off', () => {
      const a = window.__FL_APP__;
      a.thermal.foodOn = false;
      a.ui.syncFood();
    }, 1400);
    await shot('02d_food_back', () => {
      const a = window.__FL_APP__;
      a.thermal.foodOn = true; a.thermal.foodLoad = 0.65;
      a.ui.syncFood();
    }, 1400);
    await shot('03_drawer', () => {
      const a = window.__FL_APP__;
      a.kin.openDrawer('left', 0, true); a.kin.openDrawer('right', 1, true);
    }, 2600);
    await shot('04_explode50', () => {
      const a = window.__FL_APP__;
      a.kin.resetPose();
      a.ui.setMode('explode');
      a.kin.pendingExplode = false;
      a.kin.explodeTarget = 0.5;
      document.getElementById('explodeRange').value = 50;
      document.getElementById('explodeVal').textContent = '50 %';
    }, 2600);
    await shot('explode', () => {
      const a = window.__FL_APP__;
      a.kin.explodeTarget = 1;
      document.getElementById('explodeRange').value = 100;
      document.getElementById('explodeVal').textContent = '100 %';
    }, 2600);
    await shot('section', () => {
      const a = window.__FL_APP__;
      a.kin.resetPose(); a.kin.explodeTarget = 0;
      a.ui.setMode('section');
      document.getElementById('sectionRange').value = 62;
      a.stage.setSection(true, 0.62);
    }, 2400);
    await shot('cycle', () => window.__FL_APP__.ui.setMode('cycle'), 2600);
    await shot('06b_section_zoom', () => {
      const a = window.__FL_APP__;
      a.ui.setMode('section');
      a.stage.setSection(true, 0.58);
      document.getElementById('sectionRange').value = 58;
      a.rig.flyTo(new THREE.Vector3(0.86, 1.86, 1.10), new THREE.Vector3(-0.24, 1.66, 0.02), { fov: 34, lambda: 2.5 });
    }, 2600);
    await shot('inspect_compressor', () => window.__FL_APP__.ui.inspect('compressor'), 2600);
    await shot('09_inspect_condenser', () => window.__FL_APP__.ui.inspect('condenser'), 2400);
    await shot('10_inspect_evaporator', () => window.__FL_APP__.ui.inspect('evaporator'), 2400);
    await shot('11_inspect_pcb', () => window.__FL_APP__.ui.inspect('pcb'), 2400);
    await shot('11b_inspect_food', () => {
      const a = window.__FL_APP__;
      a.thermal.foodOn = true; a.thermal.foodLoad = 1; a.ui.syncFood();
      a.ui.inspect('foodFreshShelf');
    }, 2600);
    await shot('12_dark', () => {
      const a = window.__FL_APP__;
      a.ui.setMode('product');
      a.stage.setBackground(true);
      document.getElementById('btnStage').textContent = '棚拍：深色';
    }, 2400);
    await shot('13_dark_cycle', () => {
      const a = window.__FL_APP__;
      a.stage.setBackground(true);
      a.ui.setMode('cycle');
    }, 2400);
    await page.evaluate(() => window.__FL_APP__.stage.setBackground(false));
  }

  if (ONLY === 'all' || ONLY === 'exp') {
    await shot('20_exp_door', () => {
      const a = window.__FL_APP__;
      a.stage.setBackground(false);
      a.ui.runExp('door');
    }, 4200);
    await shot('21_exp_load', () => {
      const a = window.__FL_APP__;
      a.ui.runExp('doorStop');
      a.ui.setMode('product');
      a.thermal.speed = 60;
      a.ui.runExp('load');
    }, 5000);
    await shot('22_exp_blocked', () => {
      const a = window.__FL_APP__;
      a.thermal.speed = 60;
      a.ui.runExp('block');
      a.ui.setMode('cycle');
    }, 7000);
    await shot('23_exp_poweroff', () => {
      const a = window.__FL_APP__;
      a.ui.runExp('unblock');
      a.ui.setMode('product');
      a.thermal.speed = 180;
      a.ui.runExp('poweroff');
    }, 8000);
    await shot('24_exp_defrost', () => {
      const a = window.__FL_APP__;
      a.ui.runExp('poweron');
      a.thermal.speed = 30;
      a.ui.setMode('open');
      a.ui.runExp('defrost');
    }, 6000);
  }

  // 数值健全性
  const health = await page.evaluate(() => {
    const S = window.__FL_APP__.thermal;
    const bad = [];
    ['fridgeTemp', 'freezerTemp', 'ambientTemp', 'compressorLoad', 'compressorPower',
      'coolingPower', 'heatRejection', 'condenserTemp', 'evapTemp', 'cop', 'energyKWh',
      'totalPower'].forEach((k) => {
        if (!isFinite(S[k])) bad.push(k + '=' + S[k]);
      });
    const cam = window.__FL_APP__.stage.camera;
    return {
      bad: bad,
      cam: [cam.position.x, cam.position.y, cam.position.z].map((v) => +v.toFixed(2)),
      state: {
        fridgeTemp: +S.fridgeTemp.toFixed(2), freezerTemp: +S.freezerTemp.toFixed(2),
        load: +S.compressorLoad.toFixed(3), power: +S.totalPower.toFixed(1),
        cop: +S.cop.toFixed(2), cond: +S.condenserTemp.toFixed(1),
        reject: +S.heatRejection.toFixed(1), kwh: +S.energyKWh.toFixed(3),
        simTime: Math.round(S.simTime),
      },
      fps: document.getElementById('fps').textContent,
    };
  });

  console.log('== health:', JSON.stringify(health, null, 1));
  if (health.bad.length) console.log('!! NaN/Infinity fields: ' + health.bad.join(', '));
  if (errors.length) {
    console.log('== console issues (' + errors.length + '):');
    errors.slice(0, 25).forEach((e) => console.log('   ' + e));
  } else {
    console.log('== console clean');
  }

  await browser.close();
  fs.writeFileSync(path.join(QA, 'report_' + VIEW + '.json'),
    JSON.stringify({ stats: { parts: stats.parts, meshes: stats.meshes, tris: stats.tris }, health, errors, view: VIEW }, null, 2));
})().catch((e) => { console.error('QA FAILED:', e); process.exit(1); });
