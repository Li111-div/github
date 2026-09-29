/* =========================================================================
 * 90-main.js — 应用装配与主循环
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;

  function boot() {
    const stageEl = document.getElementById('stage');
    const t0 = performance.now();

    /* ---------------- 舞台 / 模型 ---------------- */
    const stage = FL.createStage(stageEl);
    const model = FL.buildModel(stage.scene);

    /* ---------------- 相机 ---------------- */
    const rig = FL.createRig(stage.camera, stage.renderer.domElement);
    const director = FL.createDirector(stage, rig, model);

    /* ---------------- 系统 ---------------- */
    const kin = FL.createKinematics(model, null);
    const thermal = FL.createThermal();
    const flow = FL.createFlow(stage.scene, model, stage);
    const labels = FL.createLabels(stageEl, stage.camera, model);

    const app = {
      stage: stage, model: model, rig: rig, director: director,
      kin: kin, thermal: thermal, flow: flow, labels: labels,
      toast: toast,
    };
    window.__FL_APP__ = app;

    const ui = FL.createUI(app);
    app.ui = ui;

    /* ---------------- 初始机位 ---------------- */
    const P0 = FL.MODE_PRESETS.product;
    rig.snapTo(P0.pos, P0.tgt, P0.fov);
    director.enterMode('product', false);
    stage.setSection(false);
    kin.resetPose();

    /* ---------------- 交互拾取 ---------------- */
    let downX = 0, downY = 0, downT = 0;
    const cvs = stage.renderer.domElement;
    cvs.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      downX = e.clientX; downY = e.clientY; downT = performance.now();
    });
    cvs.addEventListener('pointerup', function (e) {
      if (e.button !== 0) return;
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved > 5 || performance.now() - downT > 380) return;
      const id = app.pick(e);
      if (id) {
        const rec = FL.parts.get(id);
        if (rec && rec.meta) ui.inspect(id);
      } else if (ui.mode === 'inspect') {
        ui.setMode('product');
        document.querySelectorAll('.comp').forEach((c) => c.classList.remove('on'));
      }
    });

    /* ---------------- 尺寸 ---------------- */
    function onResize() { stage.resize(); }
    window.addEventListener('resize', onResize);
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(stageEl);
    onResize();

    /* ---------------- 门体显示屏 ---------------- */
    let dispT = 0;
    function updateDisplay(dt) {
      dispT += dt;
      if (dispT < 1.6) return;
      dispT = 0;
      if (!FL.displayMat) return;
      const tex = FL.TX.display(thermal.fridgeTemp, thermal.freezerTemp, thermal.powerOn);
      tex.anisotropy = 8;
      FL.displayMat.map = tex;
      FL.displayMat.emissiveMap = tex;
      FL.displayMat.needsUpdate = true;
    }

    /* ---------------- 主循环 ---------------- */
    let last = performance.now();
    let fps = 60, firstFrame = true;
    const flowOpts = { showAir: true, showRefrigerant: true, showHeat: true, cycleMode: false };

    function frame(now) {
      /* RAF 时间戳可能早于调度时刻的 performance.now()，必须夹紧为非负 */
      const dt = FL.clamp((now - last) / 1000, 0, 0.05);
      last = now;
      fps = fps * 0.92 + (1 / Math.max(dt, 1e-4)) * 0.08;

      rig.keyboard(dt);
      kin.update(dt, thermal);

      /* 爆炸过程中暂停热工仿真时钟，避免教学数据乱跳 */
      const paused = kin.explodeT > 0.02;
      if (!paused) thermal.update(dt, kin);
      thermal.tickExperiment(dt, kin);
      updateDisplay(dt);

      /* 特写模式：隐藏与目标无关的流场可视化，避免干扰构图 */
      const inspecting = (ui.mode === 'inspect');
      flowOpts.showAir = ui.opts.showAir && !inspecting;
      flowOpts.showHeat = ui.opts.showHeat && !inspecting;
      flowOpts.showRefrigerant = ui.opts.showRefrigerant && (!inspecting || director.inspectCooling === true);
      flowOpts.cycleMode = (ui.mode === 'cycle');
      flow.update(dt, thermal, kin, flowOpts);

      /* 箱内照明点光源随门体开关 */
      const openK = FL.clamp(
        Math.max(kin.doorState.left.angle, kin.doorState.right.angle) / FL.deg(70), 0, 1);
      const lit = thermal.powerOn ? openK : 0;
      stage.lights.innerL.intensity = FL.damp(stage.lights.innerL.intensity, lit * 0.46, 5, dt);
      stage.lights.innerR.intensity = FL.damp(stage.lights.innerR.intensity, lit * 0.26, 5, dt);
      stage.lights.bayL.intensity = FL.damp(stage.lights.bayL.intensity,
        (ui.mode === 'cycle' || (inspecting && director.inspectCooling)) ? 0.34 : 0, 3, dt);

      rig.update(dt);

      const w = stageEl.clientWidth, h = stageEl.clientHeight;
      labels.update(ui.mode, director.inspectId, w, h);

      stage.renderer.render(stage.scene, stage.camera);
      ui.tick(dt, fps);

      if (firstFrame) {
        firstFrame = false;
        const boot = document.getElementById('boot');
        setTimeout(function () { boot.classList.add('gone'); }, 120);
        FL.log('first frame in ' + Math.round(performance.now() - t0) + 'ms');
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /* ---------------- Toast ---------------- */
    let toastEl = null, toastTimer = null;
    function toast(msg) {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.style.cssText =
          'position:fixed;left:50%;top:84px;transform:translateX(-50%) translateY(-10px);z-index:120;' +
          'padding:9px 18px;border-radius:11px;background:rgba(22,56,70,.92);color:#fff;font-size:12px;' +
          'letter-spacing:.4px;box-shadow:0 12px 30px -10px rgba(16,40,50,.55);opacity:0;transition:.28s;' +
          'pointer-events:none;backdrop-filter:blur(8px)';
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = msg;
      requestAnimationFrame(function () {
        toastEl.style.opacity = '1';
        toastEl.style.transform = 'translateX(-50%) translateY(0)';
      });
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateX(-50%) translateY(-10px)';
      }, 2400);
    }

    /* ---------------- 尺寸变化时的标签刷新 ---------------- */
    window.addEventListener('resize', function () {
      labels.update(ui.mode, director.inspectId, stageEl.clientWidth, stageEl.clientHeight);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.FL);
