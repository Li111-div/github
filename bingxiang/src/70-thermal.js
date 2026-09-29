/* =========================================================================
 * 70-thermal.js — 双温区集总参数热工仿真（教学模型，非实测数据）
 *   dT/dt = (Q_env + Q_door + Q_load − Q_cooling) / C
 *   Q_reject ≈ Q_absorb + P_compressor
 * =======================================================================*/
(function (FL) {
  'use strict';

  FL.createThermal = function () {
    const S = {
      /* 状态量 */
      fridgeTemp: 4.6,
      freezerTemp: -17.4,
      ambientTemp: 25,
      fridgeSetpoint: 4,
      freezerSetpoint: -18,
      compressorLoad: 0.42,
      compressorPower: 0,
      fanPower: 0,
      lightPower: 0,
      heaterPower: 0,
      totalPower: 0,
      coolingPower: 0,
      heatRejection: 0,
      condenserTemp: 34,
      evapTemp: -15,
      cop: 2.35,
      energyKWh: 0,
      simTime: 0,
      /* 控制 */
      powerOn: true,
      blocked: false,
      defrost: false,
      defrostTimer: 0,
      loadPulse: 0,
      /* 食材（显示开关 + 装载量 0~1，同时决定热惯性） */
      foodOn: true,
      foodLoad: 0.65,
      foodMassF: 0, foodMassZ: 0,
      C_F: 9000, C_Z: 7000,
      /* 时间 */
      speed: 30,
      speedOverride: 0,
      history: [],
      _histT: 0,
      /* 门（由运动学写入） */
      doorL: false, doorR: false,
    };

    /* 热工参数（教学标定，非厂家实测） */
    const P = {
      UA_F: 1.05, UA_Z: 0.95, UA_DOOR: 8.6,
      C_F0: 9000, C_Z0: 7000,          // 空箱：箱体结构 + 空气 + 搁板
      FOOD_CP: 3000,                    // 食材等效比热 J/(kg·K)（含水食材 + 包装折算）
      FOOD_FULL_F: 5.0,                 // 冷藏满仓食材质量 kg
      FOOD_FULL_Z: 3.5,                 // 冷冻满仓食材质量 kg
      P_MAX: 96, P_MIN: 3,
      COP_DERATE: 0.46,
      UA_COND_OK: 11.5, UA_COND_BLOCKED: 3.35,
      FAN_EVAP: 3.2, FAN_MECH: 2.0, LIGHT: 4.0, HEATER: 180,
      DEFROST_SECONDS: 720,
      SHARE_Z: 0.66, SHARE_F: 0.34,
    };
    S.P = P;

    const running = () => S.powerOn && !S.defrost;

    S.update = function (dtReal, kin) {
      const speed = S.speedOverride > 0 ? S.speedOverride : S.speed;
      const dt = FL.clamp(dtReal, 0, 0.06) * speed;
      S.simTime += dt;

      /* 门状态 */
      S.doorL = kin.doorState.left.angle > FL.deg(6);
      S.doorR = kin.doorState.right.angle > FL.deg(6);

      /* 除霜计时 */
      if (S.defrost) {
        S.defrostTimer -= dt;
        if (S.defrostTimer <= 0) { S.defrost = false; S.defrostTimer = 0; }
      }

      /* 目标负荷：按温差比例 + 平滑响应，禁止瞬间跳变 */
      const errF = S.fridgeTemp - S.fridgeSetpoint;
      const errZ = S.freezerTemp - S.freezerSetpoint;
      let target = FL.clamp((errF / 3.2) * 0.55 + (errZ / 4.2) * 0.75, 0, 1);
      if (target < 0.06) target = 0;               // 停机区（自然温度波动）
      if (!running()) target = 0;
      S.compressorLoad += (target - S.compressorLoad) * (1 - Math.exp(-dt / 46));
      S.compressorLoad = FL.clamp(S.compressorLoad, 0, 1);

      /* 冷凝温度（一阶，散热受阻时 UA 大幅下降） */
      const UAcond = S.blocked ? P.UA_COND_BLOCKED : P.UA_COND_OK;
      const condTarget = S.ambientTemp + S.heatRejection / UAcond;
      S.condenserTemp += (condTarget - S.condenserTemp) * (1 - Math.exp(-dt / 140));

      /* 蒸发温度 */
      const evapTarget = S.defrost ? 8.5 : (S.freezerTemp - 7.0);
      S.evapTemp += (evapTarget - S.evapTemp) * (1 - Math.exp(-dt / (S.defrost ? 150 : 70)));

      /* COP（逆卡诺 × 降额系数） */
      const Tk = S.evapTemp + 273.15;
      const Tc = Math.max(S.condenserTemp + 273.15, Tk + 6);
      S.cop = FL.clamp(P.COP_DERATE * (Tk / (Tc - Tk)), 0.75, 3.8);

      /* 功率与热量 */
      const on = running();
      S.compressorPower = on ? P.P_MIN + S.compressorLoad * (P.P_MAX - P.P_MIN) : 0;
      S.fanPower = on ? P.FAN_EVAP + P.FAN_MECH : 0;
      S.lightPower = (S.doorL || S.doorR) && S.powerOn ? P.LIGHT : 0;
      S.heaterPower = S.defrost ? P.HEATER : 0;
      S.totalPower = S.compressorPower + S.fanPower + S.lightPower + S.heaterPower;

      S.coolingPower = on ? S.compressorPower * S.cop : 0;
      S.heatRejection = S.coolingPower + S.compressorPower + S.heaterPower * 0.15;
      S.absorbedPower = Math.max(0, S.heatRejection - S.compressorPower);

      /* 漏热与附加负荷 */
      let Qf = P.UA_F * (S.ambientTemp - S.fridgeTemp);
      let Qz = P.UA_Z * (S.ambientTemp - S.freezerTemp);
      if (S.doorR) Qf += P.UA_DOOR * (S.ambientTemp - S.fridgeTemp);
      if (S.doorL) Qz += P.UA_DOOR * (S.ambientTemp - S.freezerTemp);
      if (S.defrost) { Qf += 22; Qz += 16; }
      Qf += S.loadPulse * 0.7;
      Qz += S.loadPulse * 0.3;

      /* 制冷量分配（单蒸发器 + 风门） */
      const coolZ = on ? S.coolingPower * P.SHARE_Z : 0;
      const coolF = on ? S.coolingPower * P.SHARE_F : 0;

      /* 食材热惯性：食材越多 → 有效热容越大 → 箱温越稳、降温也越慢 */
      S.foodMassF = S.foodOn ? S.foodLoad * P.FOOD_FULL_F : 0;
      S.foodMassZ = S.foodOn ? S.foodLoad * P.FOOD_FULL_Z : 0;
      S.C_F = P.C_F0 + S.foodMassF * P.FOOD_CP;
      S.C_Z = P.C_Z0 + S.foodMassZ * P.FOOD_CP;

      S.fridgeTemp += ((Qf - coolF) / S.C_F) * dt;
      S.freezerTemp += ((Qz - coolZ) / S.C_Z) * dt;

      /* 负载脉冲衰减 */
      if (S.loadPulse > 0.01) S.loadPulse *= Math.exp(-dt / 210); else S.loadPulse = 0;

      /* 累计能耗 */
      S.energyKWh += (S.totalPower * dt) / 3600000;

      /* 保护 */
      if (!isFinite(S.fridgeTemp)) S.fridgeTemp = S.ambientTemp;
      if (!isFinite(S.freezerTemp)) S.freezerTemp = S.ambientTemp;
      S.fridgeTemp = FL.clamp(S.fridgeTemp, -10, 60);
      S.freezerTemp = FL.clamp(S.freezerTemp, -45, 60);
      if (!isFinite(S.energyKWh)) S.energyKWh = 0;

      /* 趋势采样 */
      S._histT += dtReal;
      if (S._histT > 0.35) {
        S._histT = 0;
        S.history.push({ f: S.fridgeTemp, z: S.freezerTemp, p: S.totalPower, c: S.condenserTemp, t: S.simTime });
        if (S.history.length > 150) S.history.shift();
      }
    };

    /* ---------------------- 实验 ---------------------- */
    S.exp = {};
    S.exp.doorOpen = function (minutes) {
      const dur = (minutes || 1) * 60;
      S.speedOverride = 6;
      S._doorExpT = dur;
      return dur;
    };
    /** 放入一批常温食材：装载量上升 + 注入显热负荷 */
    S.exp.addLoad = function (deltaLoad) {
      const d = deltaLoad === undefined ? 0.18 : deltaLoad;
      const before = S.foodOn ? S.foodLoad : 0;
      S.foodOn = true;
      S.foodLoad = FL.clamp(S.foodLoad + d, 0, 1);
      const dm = (S.foodLoad - before) * (P.FOOD_FULL_F + P.FOOD_FULL_Z);
      const E = dm * P.FOOD_CP * Math.max(2, S.ambientTemp - 2);   // 需要被带走的显热 J
      S.loadPulse += FL.clamp(E / 210, 0, 430);                    // 指数衰减脉冲峰值 W
      return { load: +S.foodLoad.toFixed(2), mass: +dm.toFixed(2), energy: Math.round(E / 1000) };
    };
    S.exp.clearFood = function () { S.foodLoad = 0; S.loadPulse = 0; };
    S.exp.toggleBlocked = function (on) { S.blocked = on === undefined ? !S.blocked : on; return S.blocked; };
    S.exp.togglePower = function (on) { S.powerOn = on === undefined ? !S.powerOn : on; if (!S.powerOn) { S.defrost = false; } return S.powerOn; };
    S.exp.startDefrost = function () {
      if (!S.powerOn) return false;
      S.defrost = true;
      S.defrostTimer = P.DEFROST_SECONDS;
      S.speedOverride = Math.max(S.speedOverride, 10);
      return true;
    };
    S.exp.reset = function () {
      S.fridgeTemp = 4.6; S.freezerTemp = -17.4; S.energyKWh = 0; S.simTime = 0;
      S.compressorLoad = 0.42; S.condenserTemp = 34; S.evapTemp = -15;
      S.loadPulse = 0; S.blocked = false; S.defrost = false; S.powerOn = true;
      S.foodOn = true; S.foodLoad = 0.65;
      S.history.length = 0;
    };

    /* 实验计时（开门实验自动结束） */
    S.tickExperiment = function (dtReal, kin) {
      if (S._doorExpT > 0) {
        S._doorExpT -= dtReal * (S.speedOverride || S.speed);
        if (S._doorExpT <= 0) {
          S._doorExpT = 0;
          S.speedOverride = 0;
          kin.openDoor('left', false);
          kin.openDoor('right', false);
          return 'doorDone';
        }
      }
      if (S.defrost && S.defrostTimer <= 0) { S.speedOverride = 0; }
      return null;
    };

    return S;
  };
})(window.FL);
