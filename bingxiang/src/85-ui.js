/* =========================================================================
 * 85-ui.js — 右侧数字面板 / Hero 文案 / 教学模式 / 控件
 * =======================================================================*/
(function (FL) {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const HERO = {
    product: ['THE SCIENCE OF COOLING', '看见冷的每一处细节。'],
    open: ['ANATOMY OF EVERYDAY COOLING', '打开门。<br>看见完整结构。'],
    explode: ['BUILT FROM THE INSIDE OUT', '从整机到每一个部件。'],
    section: ['A LOOK BENEATH THE SURFACE', '切开外壳。<br>保留运行原理。'],
    cycle: ['ONE LOOP. CONTINUOUS COOLING.', '沿着回路，<br>追踪热的去向。'],
  };

  const STEPS = [
    { no: '01', cn: '压缩做功', en: 'COMPRESSION', id: 'compressor',
      from: '低压低温蒸气', to: '高温高压蒸气',
      body: '压缩机吸入蒸发器出来的低压蒸气，用活塞把它压缩。压力升高后，制冷剂的饱和温度随之升高到高于环境温度——这是它能够“把热交给房间空气”的前提。此步需要输入机械功。' },
    { no: '02', cn: '冷凝放热', en: 'CONDENSATION', id: 'condenser',
      from: '高温高压蒸气', to: '高压液体',
      body: '高温高压蒸气进入后置冷凝器，通过铜管壁与散热丝把热量交给环境空气，自身冷凝成液体。这里是整个系统唯一向房间排热的部位——热量 = 箱内吸热 + 压缩机做功。' },
    { no: '03', cn: '毛细管节流', en: 'EXPANSION', id: 'filterDrier',
      from: '高压液体', to: '低温两相混合物',
      body: '高压液体经过内径仅 0.6–0.8 mm 的毛细管，因节流效应压力骤降，一部分液体闪发成蒸气并吸收自身热量，温度随之降到远低于箱内温度。干燥器负责在此前吸走残余水分、拦截杂质。' },
    { no: '04', cn: '蒸发吸热', en: 'EVAPORATION', id: 'evaporator',
      from: '低温两相混合物', to: '低压过热蒸气',
      body: '低温制冷剂进入蒸发器，吸收流经翅片的箱内空气热量并完全汽化，箱内空气因此被冷却。吸热后的制冷剂变成低压过热蒸气，沿回气管返回压缩机，循环闭合。' },
  ];

  FL.createUI = function (app) {
    const { thermal: S, kin: K, director: D, rig, flow, model, labels } = app;

    const ui = { tab: 'live', mode: 'product', opts: { showAir: true, showRef: true, showHeat: true } };

    /* ---------------------------- Tabs ---------------------------- */
    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        ui.tab = b.dataset.tab;
        document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
        document.querySelectorAll('.pane').forEach(function (p) {
          p.classList.toggle('on', p.dataset.pane === ui.tab);
        });
        if (ui.tab === 'live') requestAnimationFrame(drawTrend);
      });
    });

    /* ---------------------------- 模式 ---------------------------- */
    function setMode(mode, animate) {
      if (mode === ui.mode && mode !== 'product') { /* 允许重复点击 */ }
      ui.mode = mode;
      document.querySelectorAll('#modenav button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
      document.querySelectorAll('#modebar button[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
      $('ctxExplode').classList.toggle('on', mode === 'explode');
      $('ctxSection').classList.toggle('on', mode === 'section');
      $('inspectbar').classList.remove('on');

      if (mode === 'open') { K.openDoor('left', true); K.openDoor('right', true); }
      else if (mode === 'explode') { K.enterExplode(true); }
      else if (mode === 'cycle') { K.resetPose(); app.flow.setMode('cycle'); }
      else if (mode === 'section') {
        /* 剖面：门体与门架暂时隐藏，使箱体三明治切面不被门板遮挡 */
        K.retractDrawers(null);
        K.openDoor('left', false); K.openDoor('right', false);
      }
      else if (mode === 'product') { K.resetPose(); }

      if (mode !== 'open') {
        if (mode === 'product' || mode === 'section' || mode === 'cycle') { K.retractDrawers(null); }
      }
      if (mode === 'section') app.stage.setSection(true, parseFloat($('sectionRange').value) / 100);
      else app.stage.setSection(false);

      D.enterMode(mode, animate);
      updateHero(mode, null);

      if (mode === 'explode') {
        const v = parseFloat($('explodeRange').value) / 100;
        K.explodeTarget = v;
      }
    }
    ui.setMode = setMode;

    document.querySelectorAll('#modenav button, #modebar button[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.dataset.mode); });
    });

    /* ---------------------------- Hero ---------------------------- */
    function updateHero(mode, meta) {
      const h = $('hero');
      if (mode === 'inspect' && meta) {
        h.querySelector('.hero-en').textContent = meta.english || 'COMPONENT';
        h.querySelector('.hero-cn').innerHTML = meta.name;
      } else {
        const d = HERO[mode] || HERO.product;
        h.querySelector('.hero-en').textContent = d[0];
        h.querySelector('.hero-cn').innerHTML = d[1];
      }
    }
    ui.updateHero = updateHero;

    /* ---------------------------- 特写 ---------------------------- */
    function inspect(id) {
      const rec = FL.parts.get(id);
      if (!rec || !rec.meta) return;
      D.inspect(id);
      updateHero('inspect', rec.meta);
      $('ibEn').textContent = rec.meta.english || '';
      $('ibCn').textContent = rec.meta.name || '';
      $('inspectbar').classList.add('on');
      ui.mode = 'inspect';
      document.querySelectorAll('#modenav button, #modebar button[data-mode]').forEach((b) => b.classList.remove('on'));
      $('ctxExplode').classList.remove('on');
      $('ctxSection').classList.remove('on');
      app.stage.setSection(false);
      K.resetPose();
      document.querySelectorAll('.comp').forEach((c) => c.classList.toggle('on', c.dataset.id === id));
      renderMeta(rec.meta);
    }
    ui.inspect = inspect;

    $('ibExit').addEventListener('click', function () {
      setMode('product');
      document.querySelectorAll('.comp').forEach((c) => c.classList.remove('on'));
    });

    /* 3D 拾取 */
    app.pick = function (ev) {
      const rect = app.stage.renderer.domElement.getBoundingClientRect();
      const m = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
      );
      const rc = new THREE.Raycaster();
      rc.setFromCamera(m, app.stage.camera);
      const hits = rc.intersectObject(model.root, true);
      for (let i = 0; i < hits.length; i++) {
        const o = hits[i].object;
        if (o.visible === false) continue;
        let p = o;
        while (p && !p.userData.partId) p = p.parent;
        if (p && p.userData.partId) {
          const rec = FL.parts.get(p.userData.partId);
          if (rec && rec.meta) return p.userData.partId;
        }
      }
      return null;
    };

    /* ---------------------------- 结构目录 ---------------------------- */
    (function buildCatalog() {
      const groups = FL.componentCatalog();
      const host = $('catalog');
      const order = ['cooling', 'cabinet', 'door', 'interior', 'electronics', 'food'];
      const html = [];
      order.forEach(function (k) {
        const g = groups[k];
        if (!g || !g.items.length) return;
        html.push('<div class="catgroup"><h5>' + g.label + '</h5>');
        g.items.forEach(function (it) {
          html.push('<div class="comp" data-id="' + it.id + '"><span class="dot"></span>' +
            '<span class="nm">' + it.meta.name + '</span><span class="en">' + (it.meta.english || '') + '</span></div>');
        });
        html.push('</div>');
      });
      host.innerHTML = html.join('');
      host.querySelectorAll('.comp').forEach(function (c) {
        c.addEventListener('click', function () { inspect(c.dataset.id); });
      });
    })();

    function renderMeta(meta) {
      let host = $('metaBox');
      if (!host) {
        host = document.createElement('div');
        host.id = 'metaBox';
        host.className = 'card';
        $('catalog').insertBefore(host, $('catalog').firstChild);
      }
      let h = '<div class="card-t">' + meta.name + '<span class="tag">' + (meta.english || '') + '</span></div>';
      h += '<p style="margin:0 0 4px;font-size:11.4px;color:var(--ink-2);line-height:1.72">' + (meta.intro || '') + '</p>';
      if (meta.facts && meta.facts.length) {
        h += '<div class="meta-facts">';
        meta.facts.forEach(function (f) {
          h += '<div class="fr"><b>' + f[0] + '</b><span>' + f[1] + '</span></div>';
        });
        h += '</div>';
      }
      host.innerHTML = h;
    }

    /* ---------------------------- 原理步骤 ---------------------------- */
    (function buildSteps() {
      const host = $('steps');
      host.innerHTML = STEPS.map(function (s) {
        return '<div class="step" data-id="' + s.id + '" data-no="' + s.no + '">' +
          '<div class="hd"><span class="no">' + s.no + '</span><b>' + s.cn + '</b><span class="en">' + s.en + '</span></div>' +
          '<div class="bd"><div class="flow"><em>' + s.from + '</em><s>→</s><em>' + s.to + '</em></div>' + s.body + '</div></div>';
      }).join('');
      host.querySelectorAll('.step').forEach(function (el) {
        el.addEventListener('click', function () {
          const on = el.classList.contains('on');
          host.querySelectorAll('.step').forEach((x) => x.classList.remove('on'));
          if (!on) { el.classList.add('on'); inspect(el.dataset.id); }
        });
      });
    })();

    /* ---------------------------- 实时数值 ---------------------------- */
    let lastUI = 0;
    function fmt(v, d) { return (v >= 0 ? '' : '') + v.toFixed(d === undefined ? 1 : d); }

    function renderLive() {
      const f = S.fridgeTemp, z = S.freezerTemp;
      $('tFridge').innerHTML = fmt(f, 1) + '<span>°C</span>';
      $('tFreezer').innerHTML = fmt(z, 1) + '<span>°C</span>';
      $('tFridgeSet').textContent = '设定 ' + S.fridgeSetpoint + ' °C';
      $('tFreezerSet').textContent = '设定 ' + S.freezerSetpoint + ' °C';
      $('mPower').innerHTML = S.totalPower.toFixed(0) + '<u>W</u>';
      $('mLoad').innerHTML = (S.compressorLoad * 100).toFixed(0) + '<u>%</u>';
      $('mLoadBar').style.width = (S.compressorLoad * 100).toFixed(1) + '%';
      $('mCond').innerHTML = S.condenserTemp.toFixed(1) + '<u>°C</u>';
      $('mEvap').innerHTML = S.evapTemp.toFixed(1) + '<u>°C</u>';
      $('mCop').textContent = S.cop.toFixed(2);
      $('mAmb').innerHTML = S.ambientTemp.toFixed(0) + '<u>°C</u>';
      $('mKwh').innerHTML = S.energyKWh.toFixed(3) + '<u>kWh</u>';
      $('mHeatCap').innerHTML = ((S.C_F + S.C_Z) / 1000).toFixed(1) + '<u>kJ/K</u>';
      $('mFoodMass').innerHTML = (S.foodMassF + S.foodMassZ).toFixed(1) + '<u>kg</u>';

      const abs = S.absorbedPower || 0, comp = S.compressorPower || 0, rej = S.heatRejection || 0;
      $('hAbsorb').innerHTML = abs.toFixed(0) + '<small>W</small>';
      $('hComp').innerHTML = comp.toFixed(0) + '<small>W</small>';
      $('hReject').innerHTML = rej.toFixed(0) + '<small>W</small>';
      const tot = Math.max(1, abs + comp);
      $('hBarA').style.width = ((abs / tot) * 100).toFixed(1) + '%';
      $('hBarB').style.width = ((comp / tot) * 100).toFixed(1) + '%';

      let rs = '运行中';
      if (!S.powerOn) rs = '已断电';
      else if (S.defrost) rs = '除霜中';
      else if (S.blocked) rs = '散热受阻';
      else if (S.compressorLoad < 0.05) rs = '已达标 · 待机';
      $('runState').textContent = rs;

      const mm = Math.floor(S.simTime / 60), hh = Math.floor(mm / 60);
      $('simClock').textContent = '模拟 ' + (hh > 0 ? hh + 'h ' : '') + (mm % 60) + 'm';
    }
    ui.renderLive = renderLive;

    /* ---------------------------- 趋势图 ---------------------------- */
    const cvs = $('trend');
    const ctx = cvs.getContext('2d');
    function drawTrend() {
      const w = cvs.clientWidth, h = cvs.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cvs.width !== w * dpr || cvs.height !== h * dpr) {
        cvs.width = w * dpr; cvs.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(213,224,223,.55)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 3; i++) {
        const y = (i / 3) * (h - 4) + 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const hist = S.history;
      if (hist.length < 2) return;
      const n = hist.length;
      const px = (i) => (i / (n - 1)) * w;

      function line(get, lo, hi, color, width) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width || 1.6;
        ctx.lineJoin = 'round';
        for (let i = 0; i < n; i++) {
          const v = FL.clamp((get(hist[i]) - lo) / (hi - lo), 0, 1);
          const y = (1 - v) * (h - 8) + 4;
          if (i === 0) ctx.moveTo(px(i), y); else ctx.lineTo(px(i), y);
        }
        ctx.stroke();
      }
      line((d) => d.p, 0, 170, 'rgba(216,132,86,.85)', 1.3);
      line((d) => d.f, -2, 12, '#4eabc2', 1.8);
      line((d) => d.z, -26, -6, '#2f6f8f', 1.8);
    }
    ui.drawTrend = drawTrend;

    /* ---------------------------- 控件 ---------------------------- */
    function bindSwitch(id, onChange) {
      const el = $(id);
      el.addEventListener('click', function () {
        el.classList.toggle('on');
        onChange(el.classList.contains('on'));
      });
      return el;
    }
    function setSwitch(id, on) { $(id).classList.toggle('on', !!on); }

    $('rAmb').addEventListener('input', function () {
      S.ambientTemp = parseFloat(this.value);
      $('vAmb').textContent = S.ambientTemp.toFixed(0) + ' °C';
    });
    $('rSetF').addEventListener('input', function () {
      S.fridgeSetpoint = parseFloat(this.value);
      $('vSetF').textContent = S.fridgeSetpoint + ' °C';
    });
    $('rSetZ').addEventListener('input', function () {
      S.freezerSetpoint = parseFloat(this.value);
      $('vSetZ').textContent = S.freezerSetpoint + ' °C';
    });
    const SPEEDS = [1, 10, 30, 60, 180];
    $('rSpeed').addEventListener('input', function () {
      S.speed = SPEEDS[parseInt(this.value, 10)];
      S.speedOverride = 0;
      $('vSpeed').textContent = S.speed + ' ×';
    });

    $('rFoodLoad').addEventListener('input', function () {
      S.foodLoad = parseFloat(this.value) / 100;
      $('vFoodLoad').textContent = Math.round(S.foodLoad * 100) + ' %';
      syncFood();
    });
    bindSwitch('swFood', function (on) { S.foodOn = on; syncFood(); });

    function syncFood() {
      const fd = app.model.food;
      if (!fd) return;
      fd.setLoad(S.foodOn ? S.foodLoad : 0);
      fd.setVisible(S.foodOn);
    }
    ui.syncFood = syncFood;

    bindSwitch('swPower', function (on) {
      S.powerOn = on;
      if (!on) { S.defrost = false; setSwitch('swDefrost', false); }
    });
    bindSwitch('swBlocked', function (on) { S.blocked = on; });
    bindSwitch('swDefrost', function (on) {
      if (on) { if (!S.powerOn) { setSwitch('swDefrost', false); return; } S.defrost = true; S.defrostTimer = S.P.DEFROST_SECONDS; S.speedOverride = Math.max(S.speedOverride, 10); }
      else { S.defrost = false; S.defrostTimer = 0; S.speedOverride = 0; }
    });
    bindSwitch('swRef', function (on) { ui.opts.showRefrigerant = on; });
    bindSwitch('swAir', function (on) { ui.opts.showAir = on; });
    bindSwitch('swHeat', function (on) { ui.opts.showHeat = on; });

    /* ---------------------------- 实验 ---------------------------- */
    document.querySelectorAll('[data-exp]').forEach(function (b) {
      b.addEventListener('click', function () { runExp(b.dataset.exp, b); });
    });

    function markExp(id, on) {
      ['expA', 'expB', 'expC', 'expD', 'expE'].forEach(function (k) { $(k).classList.toggle('active', k === id && on); });
    }

    function runExp(kind, btn) {
      switch (kind) {
        case 'door':
          S.exp.doorOpen(1);
          K.openDoor('left', true); K.openDoor('right', true);
          setMode('open');
          markExp('expA', true);
          app.toast && app.toast('实验 A · 开门 1 分钟（模拟）');
          break;
        case 'doorStop':
          S._doorExpT = 0; S.speedOverride = 0;
          K.openDoor('left', false); K.openDoor('right', false);
          markExp('expA', false);
          break;
        case 'load': {
          const r = S.exp.addLoad(0.18);
          syncFood();
          markExp('expB', true);
          app.toast && app.toast('放入常温食材 ' + r.mass.toFixed(1) + ' kg · 显热约 ' + r.energy + ' kJ');
          setTimeout(function () { markExp('expB', false); }, 4000);
          break;
        }
        case 'fill': {
          const r = S.exp.addLoad(1);
          syncFood();
          app.toast && app.toast('已装满食材 · 共 ' + (S.foodMassF + S.foodMassZ).toFixed(1) + ' kg');
          break;
        }
        case 'clear':
          S.exp.clearFood();
          syncFood();
          markExp('expB', false);
          app.toast && app.toast('已清空食材');
          break;
        case 'block':
          S.blocked = true; setSwitch('swBlocked', true); markExp('expC', true);
          break;
        case 'unblock':
          S.blocked = false; setSwitch('swBlocked', false); markExp('expC', false);
          break;
        case 'poweroff':
          S.powerOn = false; setSwitch('swPower', false);
          S.defrost = false; setSwitch('swDefrost', false);
          markExp('expD', true);
          break;
        case 'poweron':
          S.powerOn = true; setSwitch('swPower', true); markExp('expD', false);
          break;
        case 'defrost':
          if (!S.powerOn) { app.toast && app.toast('请先恢复供电'); return; }
          S.defrost = true; S.defrostTimer = S.P.DEFROST_SECONDS; S.speedOverride = Math.max(S.speedOverride, 10);
          setSwitch('swDefrost', true); markExp('expE', true);
          break;
        case 'defrostStop':
          S.defrost = false; S.defrostTimer = 0; S.speedOverride = 0;
          setSwitch('swDefrost', false); markExp('expE', false);
          break;
      }
    }
    ui.runExp = runExp;

    /* ---------------------------- 舞台控件 ---------------------------- */
    $('explodeRange').addEventListener('input', function () {
      const v = parseFloat(this.value) / 100;
      $('explodeVal').textContent = Math.round(v * 100) + ' %';
      if (ui.mode !== 'explode') setMode('explode');
      K.pendingExplode = false;
      K.explodeTarget = v;
      K.retractDrawers(null);
      K.doorState.left.pendingClose = true; K.doorState.right.pendingClose = true;
    });
    $('sectionRange').addEventListener('input', function () {
      const v = parseFloat(this.value) / 100;
      $('sectionVal').textContent = Math.round(v * 100) + ' %';
      if (ui.mode !== 'section') setMode('section');
      app.stage.setSection(true, v);
    });

    $('btnDoorL').addEventListener('click', function () { K.toggleDoor('left'); });
    $('btnDoorR').addEventListener('click', function () { K.toggleDoor('right'); });
    $('btnReset').addEventListener('click', function () {
      K.resetPose();
      setMode('product');
      document.querySelectorAll('.comp').forEach((c) => c.classList.remove('on'));
    });

    $('btnStage').addEventListener('click', function () {
      const dark = !app.stage.dark;
      app.stage.setBackground(dark);
      this.textContent = '棚拍：' + (dark ? '深色' : '浅色');
      FL.MAT.airLine && 0;
    });

    $('btnHelp').addEventListener('click', function () { $('modal').classList.add('on'); });
    $('btnCloseModal').addEventListener('click', function () { $('modal').classList.remove('on'); });
    $('modal').addEventListener('click', function (e) { if (e.target === $('modal')) $('modal').classList.remove('on'); });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { $('modal').classList.remove('on'); if (ui.mode === 'inspect') setMode('product'); }
      if (e.key === '1') setMode('product');
      if (e.key === '2') setMode('open');
      if (e.key === '3') setMode('explode');
      if (e.key === '4') setMode('section');
      if (e.key === '5') setMode('cycle');
    });

    /* ---------------------------- 统计 ---------------------------- */
    $('sParts').textContent = model.stats.parts;
    $('sMeshes').textContent = model.stats.meshes;
    $('sTris').textContent = model.stats.tris.toLocaleString('en-US');

    /* ---------------------------- 帧循环钩子 ---------------------------- */
    ui.tick = function (dt, fps) {
      lastUI += dt;
      if (lastUI > 0.1) {
        lastUI = 0;
        renderLive();
        if (ui.tab === 'live') drawTrend();
        $('fps').textContent = fps.toFixed(0) + ' FPS';
      }
      /* 实验进度条 */
      if (S._doorExpT > 0) {
        const p = 1 - S._doorExpT / 60;
        $('expAProg').style.width = FL.clamp(p, 0, 1) * 100 + '%';
      } else $('expAProg').style.width = '0%';
      if (S.defrost) $('expEProg').style.width = (1 - S.defrostTimer / S.P.DEFROST_SECONDS) * 100 + '%';
      else $('expEProg').style.width = '0%';
      if (!S.powerOn && !$('expD').classList.contains('active')) markExp('expD', true);
      if (S.powerOn && $('expD').classList.contains('active')) markExp('expD', false);
      if (S.blocked !== $('swBlocked').classList.contains('on')) setSwitch('swBlocked', S.blocked);
      if (S.defrost !== $('swDefrost').classList.contains('on')) setSwitch('swDefrost', S.defrost);
      if (S.powerOn !== $('swPower').classList.contains('on')) setSwitch('swPower', S.powerOn);
      if (S.foodOn !== $('swFood').classList.contains('on')) setSwitch('swFood', S.foodOn);
      const fl = Math.round(S.foodLoad * 100);
      if (parseFloat($('rFoodLoad').value) !== fl) {
        $('rFoodLoad').value = fl; $('vFoodLoad').textContent = fl + ' %';
      }
    };

    return ui;
  };
})(window.FL);
