/* =========================================================================
 * 34-model-electronics.js — 电气与传感
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;
  const M = FL.MAT;
  const place = FL.place;
  const V = (x, y, z) => new T.Vector3(x, y, z);

  FL.buildElectronics = function (root) {
    /* ---------------- 主控 PCB ---------------- */
    const pcb = new T.Group();
    const BX = -0.336, BY = 0.238, BZ = -0.245;
    // 基板（沿 X 法向的竖板）
    place(FL.roundedPanelGeo(0.210, 0.168, 0.011, 0.008, 2), M.pcb, [BX, BY, BZ], [0, Math.PI / 2, 0], pcb);
    // 主控芯片
    place(FL.roundedBoxGeo(0.010, 0.034, 0.034, 0.002, 1), M.chip, [BX + 0.010, BY + 0.020, BZ + 0.020], null, pcb);
    place(FL.roundedBoxGeo(0.008, 0.022, 0.030, 0.002, 1), M.chip, [BX + 0.010, BY - 0.040, BZ - 0.030], null, pcb);
    // 电解电容
    [[-0.045, 0.052], [-0.045, 0.020], [0.030, -0.048]].forEach(function (p) {
      place(new T.CylinderGeometry(0.012, 0.012, 0.026, 14), M.cap, [BX + 0.018, BY + p[0], BZ + p[1]], [0, 0, Math.PI / 2], pcb);
    });
    // 电感
    place(new T.TorusGeometry(0.014, 0.006, 8, 18), M.motorCopper, [BX + 0.016, BY + 0.055, BZ - 0.048], [0, Math.PI / 2, 0], pcb);
    // 继电器 / 功率模块
    place(FL.roundedBoxGeo(0.024, 0.030, 0.042, 0.003, 1), M.chip, [BX + 0.020, BY - 0.045, BZ + 0.038], null, pcb);
    // 接线端子排
    const term = new T.Group();
    for (let i = 0; i < 6; i++) {
      place(FL.roundedBoxGeo(0.014, 0.018, 0.014, 0.002, 1), i % 2 ? M.cap : M.greyPlastic,
        [BX + 0.014, BY - 0.062 + i * 0.024, BZ - 0.058], null, term);
    }
    pcb.add(term);
    // 散热片
    const sink = new T.InstancedMesh(new T.BoxGeometry(0.004, 0.048, 0.0035), M.aluminium, 12);
    const o = new T.Object3D();
    for (let i = 0; i < 12; i++) {
      o.position.set(BX + 0.026, BY + 0.070, BZ + 0.055 - i * 0.006);
      o.updateMatrix();
      sink.setMatrixAt(i, o.matrix);
    }
    sink.instanceMatrix.needsUpdate = true;
    pcb.add(sink);
    // 运行指示灯
    place(new T.CylinderGeometry(0.004, 0.004, 0.004, 10), M.led, [BX + 0.012, BY + 0.078, BZ - 0.060], [0, 0, Math.PI / 2], pcb);

    FL.registerPart('pcb', pcb, {
      category: 'electronics', explode: new T.Vector3(-0.26, 0, -0.16),
      meta: { name: '主控 PCB', english: 'MAIN CONTROL PCB', category: 'electronics',
        intro: '整机的控制核心：采集各温度传感器信号，按双温区设定值计算目标转速，输出变频驱动信号给压缩机，并控制风机、风门、除霜加热与照明。',
        facts: [['主要器件', '主控 MCU · 变频功率模块 · 电解电容 · 电感 · 继电器 · 端子排'],
          ['输入', '箱温 / 环温 / 蒸发器温度 / 门开关'],
          ['输出', '压缩机频率 · 风机 · 风门 · 除霜加热'],
          ['逻辑', 'PI 调节 + 平滑限速（防止负荷突变）']] },
    });
    root.add(pcb);

    /* ---------------- 线束 ---------------- */
    const harn = new T.Group();
    function wire(pts, mat, r) {
      const c = new T.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
      const m = new T.Mesh(new T.TubeGeometry(c, 40, r || 0.0035, 6, false), mat);
      harn.add(m);
      return m;
    }
    wire([V(-0.336, 0.170, -0.245), V(-0.230, 0.140, -0.250), V(-0.070, 0.130, -0.240), V(0.100, 0.150, -0.230), V(0.140, 0.165, -0.225)], M.wireRed);
    wire([V(-0.336, 0.155, -0.260), V(-0.240, 0.125, -0.268), V(-0.100, 0.115, -0.262), V(0.080, 0.128, -0.248), V(0.135, 0.140, -0.240)], M.wireBlack);
    wire([V(-0.336, 0.300, -0.235), V(-0.300, 0.340, -0.220), V(-0.286, 0.260, -0.300), V(-0.282, 0.240, -0.330)], M.wireBlack, 0.003);
    wire([V(-0.336, 0.312, -0.250), V(-0.320, 0.360, -0.235), V(-0.250, 0.330, -0.170), V(-0.200, 0.300, -0.180), V(-0.180, 0.240, -0.200), V(-0.160, 0.150, -0.210)], M.wireBlue, 0.003);
    wire([V(-0.336, 0.150, -0.230), V(-0.360, 0.100, -0.230), V(-0.360, 0.150, -0.180), V(-0.300, 0.400, -0.175), V(-0.250, 0.700, -0.170), V(-0.240, 1.200, -0.168), V(-0.235, 1.700, -0.166)], M.wireBlack, 0.0026);
    FL.registerPart('wireHarness', harn, {
      category: 'electronics', explode: new T.Vector3(-0.16, 0, -0.10),
      meta: { name: '线束', english: 'WIRING HARNESS', category: 'electronics',
        intro: '连接控制器与压缩机、风机、除霜加热管、门开关及各处温度传感器的电气线束，沿线束固定点走线，避免与运动部件干涉。',
        facts: [['组成', '电源线 · 信号线 · 传感器线'], ['固定', '线束夹 + 扎带'], ['注意', '与运动件保持净空']] },
    });
    root.add(harn);

    /* ---------------- 温度传感器 ---------------- */
    const sensors = new T.Group();
    function sensor(p, id, name) {
      const g = new T.Group();
      place(new T.CylinderGeometry(0.0055, 0.0055, 0.026, 10), M.whitePlastic, p, null, g);
      place(new T.CylinderGeometry(0.003, 0.003, 0.016, 8), M.wireBlack, [p[0], p[1] - 0.020, p[2]], null, g);
      sensors.add(g);
      return g;
    }
    sensor(V(-0.230, 1.760, -0.130), 's1', '冷藏室温感');
    sensor(V(-0.230, 0.180, -0.130), 's2', '冷冻室温感');
    sensor(V(-0.2465, 0.660, -0.168), 's3', '蒸发器温感');
    sensor(V(0.300, 1.400, -0.392), 's4', '冷凝器温感');
    FL.registerPart('tempSensors', sensors, {
      category: 'electronics', explode: new T.Vector3(0, 0, 0.10),
      meta: { name: '温度传感器组', english: 'TEMPERATURE SENSORS', category: 'electronics',
        intro: '负温度系数（NTC）热敏电阻：冷藏室与冷冻室各一只负责控温，蒸发器温感用于判断除霜终点，冷凝器温感用于评估散热状态。',
        facts: [['数量', '4 只（冷藏 / 冷冻 / 蒸发器 / 冷凝器）'],
          ['类型', 'NTC 热敏电阻'], ['作用', '控温 · 除霜判断 · 散热评估'],
          ['仿真取值', '由教学模型实时给出']] },
    });
    root.add(sensors);

    return { pcb: pcb, harness: harn, sensors: sensors };
  };
})(window.FL);
