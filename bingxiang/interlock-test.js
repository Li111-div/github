/* 动作联锁功能验证：在真实浏览器中驱动运动学控制器，检查联锁顺序 */
const { chromium } = require('playwright-core');
const path = require('path');
const EXE = 'C:/Users/31009/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const URL = 'file:///' + path.join(__dirname, 'OPEN_ME.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 800, height: 500 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__FL_APP__);

  const r = await p.evaluate(() => {
    const a = window.__FL_APP__, K = a.kin;
    const out = {};
    const deg = (x) => +(x * 180 / Math.PI).toFixed(1);
    const tick = (n, dt) => { for (let i = 0; i < n; i++) K.update(dt || 0.05, a.thermal); };

    K.resetPose(); tick(400);
    out.initial = { doorL: deg(K.doorState.left.angle), drawerL0: +K.drawers.find(d=>d.id==='drawerL1').t.toFixed(3) };

    // ① 门关着直接点抽屉 → 必须先开门
    K.openDrawer('left', 0, true);
    tick(3);
    out.after3Ticks = { doorL: deg(K.doorState.left.angle), drawer: +K.drawers.find(d=>d.id==='drawerL1').t.toFixed(3) };
    tick(400);
    const d1 = K.drawers.find(d=>d.id==='drawerL1');
    out.drawerOpened = { doorL: deg(K.doorState.left.angle), drawer: +d1.t.toFixed(3),
      doorOpenEnough: K.doorState.left.angle >= K.SAFE_ANGLE - 0.02, drawerOut: d1.t > 0.9 };

    // ② 抽屉伸出时要求关门 → 必须先收抽屉
    K.openDoor('left', false);
    tick(3);
    out.closeRequestedEarly = { doorL: deg(K.doorState.left.angle), drawer: +d1.t.toFixed(3) };
    tick(400);
    out.afterClose = { doorL: deg(K.doorState.left.angle), drawer: +d1.t.toFixed(3),
      drawerRetracted: d1.t < 0.02, doorClosed: K.doorState.left.angle < 0.01 };

    // ③ 抽屉伸出 + 门开着时进入爆炸图 → 必须自动复位
    K.openDrawer('left', 0, true); K.openDrawer('right', 1, true); tick(400);
    out.beforeExplode = { drawerL: +K.drawers.find(d=>d.id==='drawerL1').t.toFixed(3),
      drawerR: +K.drawers.find(d=>d.id==='drawerR2').t.toFixed(3),
      doorL: deg(K.doorState.left.angle), doorR: deg(K.doorState.right.angle) };
    K.enterExplode(true);
    tick(5);
    out.explodeJustEntered = { explodeT: +K.explodeT.toFixed(3) };
    tick(700);
    out.explodeSettled = { explodeT: +K.explodeT.toFixed(3),
      drawerL: +K.drawers.find(d=>d.id==='drawerL1').t.toFixed(3),
      drawerR: +K.drawers.find(d=>d.id==='drawerR2').t.toFixed(3),
      doorL: deg(K.doorState.left.angle), doorR: deg(K.doorState.right.angle) };

    // ④ 爆炸过程中尝试操作抽屉 → 应被拒绝
    K.openDrawer('left', 0, true); tick(60);
    out.drawerBlockedInExplode = +K.drawers.find(d=>d.id==='drawerL1').t.toFixed(3);

    // ⑤ 爆炸 50% 时零件确实分离
    K.pendingExplode = false; K.explodeTarget = 0.5; tick(300);
    const shell = window.FL.parts.get('shellLeft');
    const door = window.FL.parts.get('doorLeft');
    out.explode50Offsets = {
      shellLeftX: +(shell.group.position.x - shell.base.x).toFixed(3),
      doorLeftZ: +(door.group.position.z - door.base.z).toFixed(3),
      explosionT: +K.explodeT.toFixed(3),
    };

    // ⑥ 抽屉行程
    K.explodeTarget = 0; K.explodeT = 0; tick(300);
    K.openDrawer('left', 0, true); tick(400);
    const dL1 = K.drawers.find(d=>d.id==='drawerL1');
    out.drawerTravel = +(dL1.group.position.z - dL1.base).toFixed(3);

    // ⑦ 数值健全性
    out.bad = ['fridgeTemp','freezerTemp','compressorLoad','compressorPower','coolingPower',
      'heatRejection','condenserTemp','evapTemp','cop','energyKWh'].filter(k => !isFinite(a.thermal[k]));
    return out;
  });

  console.log(JSON.stringify(r, null, 1));
  console.log(errs.length ? 'CONSOLE ERRORS: ' + errs.join(' | ') : 'console clean');
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
