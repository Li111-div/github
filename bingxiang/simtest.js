const { chromium } = require('playwright-core');
const path = require('path');
const EXE = 'C:/Users/31009/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const URL = 'file:///' + path.join(__dirname, 'OPEN_ME.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 640, height: 400 } });
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__FL_APP__);
  const out = await p.evaluate(() => {
    const a = window.__FL_APP__, S = a.thermal, K = a.kin;
    const R = {};
    const step = (sec) => { const n = Math.round(sec / 0.5); for (let i = 0; i < n; i++) S.update(0.5 / S.speed, K); };
    S.speed = 60;
    const snap = () => ({ f: +S.fridgeTemp.toFixed(2), z: +S.freezerTemp.toFixed(2),
      load: +S.compressorLoad.toFixed(3), pw: +S.totalPower.toFixed(1), cop: +S.cop.toFixed(2),
      cond: +S.condenserTemp.toFixed(1), evap: +S.evapTemp.toFixed(1), rej: +S.heatRejection.toFixed(1) });

    R.start = snap();
    step(1800); R.pullDown30min = snap();

    // A 开门 1 分钟
    K.openDoor('left', true); K.openDoor('right', true);
    for (let i = 0; i < 60; i++) { K.doorState.left.angle = K.doorState.right.angle = 2.0; S.update(1 / S.speed, K); }
    R.doorOpen1min = snap();
    K.openDoor('left', false); K.openDoor('right', false);
    K.doorState.left.angle = K.doorState.right.angle = 0;
    step(900); R.afterDoorRecover = snap();

    // B 常温负载
    S.loadPulse = 155; step(120); R.load2min = snap(); step(1500); R.loadRecover = snap();

    // C 散热受阻
    S.blocked = true; step(900); R.blocked15min = snap();
    S.blocked = false; step(900); R.unblocked = snap();

    // D 断电
    const t0 = S.freezerTemp; S.powerOn = false; step(3600); R.powerOff1h = snap();
    R.powerOffDelta = +(S.freezerTemp - t0).toFixed(2);
    S.powerOn = true; step(1800); R.powerOnRecover = snap();

    // E 除霜
    S.defrost = true; S.defrostTimer = S.P.DEFROST_SECONDS;
    step(360); R.defrost6min = snap();
    S.defrost = false; step(1200); R.afterDefrost = snap();

    // F 食材热惯性：装载量 → 有效热容 → 同样开门 1 分钟后的温升差异
    const doorTest = function (foodLoad) {
      S.exp.reset(); S.foodLoad = foodLoad; S.foodOn = true; S.speed = 60;
      step(2400);
      const z0 = S.freezerTemp, f0 = S.fridgeTemp;
      for (let i = 0; i < 60; i++) { K.doorState.left.angle = K.doorState.right.angle = 2.0; S.update(1 / S.speed, K); }
      const dz = S.freezerTemp - z0, df = S.fridgeTemp - f0;
      K.doorState.left.angle = K.doorState.right.angle = 0;
      return { C_F: Math.round(S.C_F), C_Z: Math.round(S.C_Z), mass: +(S.foodMassF + S.foodMassZ).toFixed(1),
        dFridge: +df.toFixed(3), dFreezer: +dz.toFixed(3) };
    };
    R.foodEmpty = doorTest(0);
    R.foodNormal = doorTest(0.65);
    R.foodFull = doorTest(1);
    S.exp.reset(); S.foodOn = true; S.foodLoad = 0.65;

    R.energyKWh = +S.energyKWh.toFixed(3);
    R.bad = ['fridgeTemp','freezerTemp','compressorLoad','compressorPower','coolingPower','heatRejection','condenserTemp','evapTemp','cop','energyKWh','totalPower']
      .filter(k => !isFinite(S[k]));
    return R;
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
