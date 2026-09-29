/* =========================================================================
 * 65-kinematics.js — 统一运动学控制器 + 动作联锁
 *   · 门体绕真实铰链旋转（最大 138°）
 *   · 抽屉沿导轨抽拉（300 mm），拉出前必须先开门
 *   · 关门前必须先收回抽屉；进入爆炸图前全部复位
 *   · 风机旋转、压缩机内部曲柄连杆活塞慢动作
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;

  const EXPLODE_GAIN = 2.5;
  const SAFE_ANGLE = FL.deg(76);   // 抽屉安全开启角
  const MAX_OPEN = FL.deg(138);
  const DOOR_OPEN = FL.deg(116);

  FL.createKinematics = function (model, thermal) {
    const doors = model.doors;
    const drawers = model.interior.drawers;
    const cooling = model.cooling;

    const K = {
      SAFE_ANGLE: SAFE_ANGLE,
      MAX_OPEN: MAX_OPEN,
      explodeT: 0,
      explodeTarget: 0,
      pendingExplode: false,
      mechTheta: 0,
      mechSpeed: 0,
      drawers: drawers,
    };

    /* ------------------------- 门 ------------------------- */
    const doorState = {
      left: { angle: 0, target: 0, rec: doors.left, pendingClose: false },
      right: { angle: 0, target: 0, rec: doors.right, pendingClose: false },
    };
    K.doorState = doorState;

    K.openDoor = function (side, open) {
      const st = doorState[side];
      if (!st) return;
      if (open === undefined) open = st.target < DOOR_OPEN * 0.5;
      if (open) {
        st.pendingClose = false;
        st.target = DOOR_OPEN;
      } else {
        st.pendingClose = true;   // 等抽屉收回后真正关门
      }
    };
    K.toggleDoor = function (side) { K.openDoor(side, doorState[side].target < DOOR_OPEN * 0.5); };
    K.doorAngle = function (side) { return doorState[side].angle; };

    /* ------------------------- 抽屉 ------------------------- */
    drawers.forEach(function (d) { d.t = 0; d.target = 0; d.pending = false; });

    K.openDrawer = function (side, index, open) {
      const d = drawers.find(function (x) { return x.side === side && x.index === index; });
      if (!d) return;
      if (K.explodeT > 0.02) return;                       // 爆炸过程中禁止操作
      if (open === undefined) open = d.target < 0.5;
      if (open) {
        if (doorState[side].angle < SAFE_ANGLE - 0.02) {
          doorState[side].pendingClose = false;
          doorState[side].target = DOOR_OPEN;               // 先开门
          d.pending = true;                                 // 等门到安全角再抽拉
        } else {
          d.target = 1;
        }
      } else {
        d.target = 0;
        d.pending = false;
      }
    };
    K.toggleDrawer = function (side, index) {
      const d = drawers.find(function (x) { return x.side === side && x.index === index; });
      if (d) K.openDrawer(side, index, d.target < 0.5);
    };
    K.retractDrawers = function (side) {
      drawers.forEach(function (d) {
        if (!side || d.side === side) { d.target = 0; d.pending = false; }
      });
    };
    K.drawerOpenAmount = function (side, index) {
      const d = drawers.find(function (x) { return x.side === side && x.index === index; });
      return d ? d.t : 0;
    };

    /* ------------------------- 爆炸 ------------------------- */
    K.setExplode = function (v) {
      K.explodeTarget = FL.clamp(v, 0, 1);
      if (K.explodeTarget > 0.02) K.pendingExplode = false;
    };
    K.enterExplode = function (on) {
      if (on) {
        K.pendingExplode = true;
        K.retractDrawers(null);
        doorState.left.pendingClose = true;
        doorState.right.pendingClose = true;
      } else {
        K.pendingExplode = false;
        K.explodeTarget = 0;
      }
    };
    K.resetPose = function () {
      K.pendingExplode = false;
      K.explodeTarget = 0;
      K.retractDrawers(null);
      doorState.left.pendingClose = true;
      doorState.right.pendingClose = true;
    };
    K.isSettled = function () {
      return K.explodeT < 0.005 && drawers.every(function (d) { return d.t < 0.005; }) &&
        doorState.left.angle < 0.005 && doorState.right.angle < 0.005;
    };

    /* ------------------------- 每帧更新 ------------------------- */
    const _v = new T.Vector3();
    K.update = function (dt, state) {
      /* 抽屉 */
      drawers.forEach(function (d) {
        if (K.explodeT > 0.02) { d.target = 0; d.pending = false; }
        if (d.pending && doorState[d.side].angle >= SAFE_ANGLE - 0.02) {
          d.target = 1; d.pending = false;
        }
        d.t = FL.damp(d.t, d.target, 4.2, dt);
        if (d.t < 0.001) d.t = 0;
      });
      /* 门 */
      ['left', 'right'].forEach(function (side) {
        const st = doorState[side];
        const sideDrawers = drawers.filter(function (d) { return d.side === side; });
        const allIn = sideDrawers.every(function (d) { return d.t < 0.012; });
        if (st.pendingClose) {
          sideDrawers.forEach(function (d) { d.target = 0; d.pending = false; });
          if (allIn) { st.target = 0; st.pendingClose = false; }
        }
        st.angle = FL.damp(st.angle, st.target, 3.0, dt);
        if (st.angle < 0.0008) st.angle = 0;
        st.rec.group.rotation.y = st.rec.isLeft ? -st.angle : st.angle;
      });
      /* 爆炸 */
      if (K.pendingExplode) {
        const allIn = drawers.every(function (d) { return d.t < 0.012; });
        const doorsClosed = doorState.left.angle < 0.012 && doorState.right.angle < 0.012;
        if (allIn && doorsClosed) { K.explodeTarget = 1; K.pendingExplode = false; }
      }
      K.explodeT = FL.damp(K.explodeT, K.explodeTarget, 2.6, dt);
      if (K.explodeT < 0.001) K.explodeT = 0;
      if (K.explodeT > 0.999) K.explodeT = 1;

      const et = K.explodeT;
      FL.parts.forEach(function (rec) {
        rec.group.position.copy(rec.base).addScaledVector(rec.explode, et * EXPLODE_GAIN);
      });
      /* 抽屉滑出量叠加在爆炸位移之上 */
      drawers.forEach(function (d) {
        d.group.position.z += d.t * d.travel;
      });

      /* 风机 */
      const running = state && state.powerOn && !state.defrost;
      const load = state ? state.compressorLoad : 0;
      cooling.fans.forEach(function (f) {
        let target = 0;
        if (running) {
          if (f.name === 'evap') {
            const sideOpen = doorState.left.angle > FL.deg(12);
            target = sideOpen ? 0 : 5.5 + load * 12.0;   // 门开 → 停机
          } else {
            target = 6.0 + load * 10.0;
          }
        }
        f.speed = FL.damp(f.speed, target, 1.6, dt);
        f.blades.rotation.z += f.speed * dt;
      });

      /* 压缩机内部教学慢动作 */
      const targetSpeed = running ? 1.0 + load * 3.2 : 0;
      K.mechSpeed = FL.damp(K.mechSpeed, targetSpeed, 1.2, dt);
      K.mechTheta += K.mechSpeed * dt;
      K.applyMechanism();

      /* 内部照明 / 除霜加热 */
      const openAny = doorState.left.angle > FL.deg(6) || doorState.right.angle > FL.deg(6);
      FL.MAT.interiorLight.emissiveIntensity = FL.damp(
        FL.MAT.interiorLight.emissiveIntensity, openAny && state && state.powerOn ? 0.85 : 0.0, 5, dt);
      const heaterOn = state && state.defrost ? 1 : 0;
      FL.MAT.heater.emissiveIntensity = FL.damp(FL.MAT.heater.emissiveIntensity, heaterOn * 2.4, 3, dt);
    };

    /* 曲柄滑块机构解析解 */
    const R = 0.013, L = 0.030, PISTON_OFF = 0.016;
    K.applyMechanism = function () {
      const th = K.mechTheta;
      const c = cooling.compressor;
      c.rotor.rotation.y = th;
      c.crank.rotation.y = th;
      const ax = R * Math.cos(th), az = -R * Math.sin(th);
      const xPin = R * Math.cos(th) + Math.sqrt(Math.max(1e-8, L * L - Math.pow(R * Math.sin(th), 2)));
      c.piston.position.set(xPin + PISTON_OFF, 0.168, 0);
      const dx = xPin - ax, dz = 0 - az;
      const dist = Math.hypot(dx, dz);
      c.conrod.position.set(ax, 0.168, az);
      c.conrod.scale.set(dist, 1, 1);
      c.conrod.rotation.set(0, Math.atan2(-dz, dx), 0);
    };

    return K;
  };
})(window.FL);
