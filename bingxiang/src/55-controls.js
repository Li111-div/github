/* =========================================================================
 * 55-controls.js — 统一相机操作（自研 Orbit / Pan / Zoom / WASD / QE）
 * 全模式操作完全一致，不切换“自由探索模式”。
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;

  FL.createRig = function (camera, dom) {
    const rig = {
      target: new T.Vector3(-0.15, 0.96, 0),
      targetGoal: new T.Vector3(-0.15, 0.96, 0),
      theta: 0.6, phi: 1.15, radius: 4.4,
      thetaGoal: 0.6, phiGoal: 1.15, radiusGoal: 4.4,
      fov: 38, fovGoal: 38,
      lambda: 16,
      flyTimer: 0,
      userActive: false,
      enabled: true,
      minPhi: 0.10, maxPhi: 1.53,
      minR: 0.45, maxR: 9.0,
    };

    const sph = new T.Spherical();
    const off = new T.Vector3();
    const right = new T.Vector3();
    const up = new T.Vector3();
    const fwd = new T.Vector3();

    function fromCartesian(pos, tgt) {
      off.copy(pos).sub(tgt);
      sph.setFromVector3(off);
      rig.radiusGoal = FL.clamp(sph.radius, rig.minR, rig.maxR);
      rig.thetaGoal = sph.theta;
      rig.phiGoal = FL.clamp(sph.phi, rig.minPhi, rig.maxPhi);
      rig.targetGoal.copy(tgt);
    }
    rig.fromCartesian = fromCartesian;

    /** 电影感飞行（缓入缓出） */
    rig.flyTo = function (pos, tgt, opts) {
      opts = opts || {};
      fromCartesian(pos, tgt);
      rig.lambda = opts.lambda || 2.5;
      rig.fovGoal = opts.fov || 38;
      rig.flyTimer = 1.6;
    };
    /** 立即定位（无动画） */
    rig.snapTo = function (pos, tgt, fov) {
      fromCartesian(pos, tgt);
      rig.theta = rig.thetaGoal; rig.phi = rig.phiGoal; rig.radius = rig.radiusGoal;
      rig.target.copy(rig.targetGoal);
      rig.fov = rig.fovGoal = fov || 38;
      rig.apply();
    };
    rig.setTarget = function (tgt) { rig.targetGoal.copy(tgt); };
    /** 立即完成过渡（供自动化 QA / 截图使用） */
    rig.settle = function () {
      rig.theta = rig.thetaGoal; rig.phi = rig.phiGoal; rig.radius = rig.radiusGoal;
      rig.target.copy(rig.targetGoal); rig.fov = rig.fovGoal;
      rig.lambda = 16; rig.flyTimer = 0;
      rig.apply();
    };

    rig.apply = function () {
      off.setFromSphericalCoords(rig.radius, rig.phi, rig.theta);
      camera.position.copy(rig.target).add(off);
      camera.lookAt(rig.target);
      if (Math.abs(camera.fov - rig.fov) > 0.01) {
        camera.fov = rig.fov;
        camera.updateProjectionMatrix();
      }
    };

    rig.update = function (dt) {
      if (rig.flyTimer > 0) {
        rig.flyTimer -= dt;
        if (rig.flyTimer <= 0) rig.lambda = 16;
      }
      const k = rig.lambda;
      rig.theta = FL.damp(rig.theta, rig.thetaGoal, k, dt);
      rig.phi = FL.damp(rig.phi, rig.phiGoal, k, dt);
      rig.radius = FL.damp(rig.radius, rig.radiusGoal, k, dt);
      rig.fov = FL.damp(rig.fov, rig.fovGoal, k, dt);
      FL.dampVec3(rig.target, rig.targetGoal, k, dt);
      rig.apply();
    };

    /* ------------------------- 交互 ------------------------- */
    let dragging = 0, px = 0, py = 0;
    const keys = {};

    function down(e) {
      if (!rig.enabled) return;
      dragging = e.button === 2 || e.shiftKey ? 2 : 1;
      px = e.clientX; py = e.clientY;
      rig.lambda = 18;
      dom.setPointerCapture && dom.setPointerCapture(e.pointerId);
      dom.style.cursor = 'grabbing';
    }
    function move(e) {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      px = e.clientX; py = e.clientY;
      if (dragging === 1) {
        rig.thetaGoal -= dx * 0.0055;
        rig.phiGoal = FL.clamp(rig.phiGoal - dy * 0.0048, rig.minPhi, rig.maxPhi);
      } else {
        const sc = rig.radius * 0.0018;
        camera.getWorldDirection(fwd);
        right.setFromMatrixColumn(camera.matrix, 0);
        up.setFromMatrixColumn(camera.matrix, 1);
        rig.targetGoal.addScaledVector(right, -dx * sc);
        rig.targetGoal.addScaledVector(up, dy * sc);
      }
      rig.lambda = 18;
      rig.flyTimer = 0;
    }
    function upFn(e) {
      dragging = 0;
      dom.style.cursor = 'grab';
      dom.releasePointerCapture && dom.releasePointerCapture(e.pointerId);
    }
    function wheel(e) {
      if (!rig.enabled) return;
      e.preventDefault();
      rig.radiusGoal = FL.clamp(rig.radiusGoal * (1 + Math.sign(e.deltaY) * 0.10), rig.minR, rig.maxR);
      rig.lambda = 18;
      rig.flyTimer = 0;
    }

    dom.addEventListener('pointerdown', down);
    dom.addEventListener('pointermove', move);
    dom.addEventListener('pointerup', upFn);
    dom.addEventListener('pointercancel', upFn);
    dom.addEventListener('wheel', wheel, { passive: false });
    dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    dom.style.cursor = 'grab';

    window.addEventListener('keydown', function (e) {
      keys[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE'].indexOf(e.code) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.code] = false; });
    window.addEventListener('blur', function () { for (const k in keys) keys[k] = false; });

    rig.keyboard = function (dt) {
      let f = 0, s = 0, v = 0;
      if (keys['KeyW']) f += 1;
      if (keys['KeyS']) f -= 1;
      if (keys['KeyD']) s += 1;
      if (keys['KeyA']) s -= 1;
      if (keys['KeyE']) v += 1;
      if (keys['KeyQ']) v -= 1;
      if (!f && !s && !v) return;
      const sp = rig.radius * 0.85 * dt;
      camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
      right.setFromMatrixColumn(camera.matrix, 0); right.y = 0; right.normalize();
      rig.targetGoal.addScaledVector(fwd, f * sp).addScaledVector(right, s * sp);
      rig.targetGoal.y += v * sp;
      rig.lambda = 18;
      rig.flyTimer = 0;
    };

    return rig;
  };
})(window.FL);
