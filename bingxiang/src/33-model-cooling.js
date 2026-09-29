/* =========================================================================
 * 33-model-cooling.js — 制冷系统
 *   D1 压缩机（含半剖内部机构：定子/转子/主轴/偏心曲柄/连杆/活塞/气缸）
 *   D2 丝管式冷凝器（蛇形铜管 + 密集竖向散热丝）
 *   D3 蒸发器（蛇形管 + 密集铝翅片 + 风机 + 除霜加热管 + 接水槽）
 *   D4 毛细管 / 过滤干燥器 / 吸排气管 / 机械舱风扇 / 排水
 *   同时构建贯穿全机的制冷剂回路曲线（供粒子沿真实管路运动）
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;
  const M = FL.MAT;
  const D = FL.DIM;
  const place = FL.place;
  const V = (x, y, z) => new T.Vector3(x, y, z);

  M.wireSteel = new T.MeshStandardMaterial({ color: 0x767c81, metalness: 0.85, roughness: 0.44, envMapIntensity: 1.0 });
  M.fanPlastic = new T.MeshStandardMaterial({ color: 0x3a4045, metalness: 0.05, roughness: 0.55, envMapIntensity: 0.8 });

  /* ---------------- 蛇形盘管路径生成器 ---------------- */
  function arcXY(A, B, n) {
    const C = A.clone().add(B).multiplyScalar(0.5);
    const rad = A.distanceTo(B) / 2;
    if (rad < 1e-6) return [];
    const a0 = Math.atan2(A.y - C.y, A.x - C.x);
    const a1 = Math.atan2(B.y - C.y, B.x - C.x);
    let d = a1 - a0;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const out = [];
    for (let k = 1; k < n; k++) {
      const a = a0 + (d * k) / n;
      out.push(V(C.x + Math.cos(a) * rad, C.y + Math.sin(a) * rad, A.z));
    }
    return out;
  }
  /** runs: [{p0, p1}] 直线段序列，段间用 XY 平面半圆连接 */
  function snake(runs, dense) {
    const pts = [];
    runs.forEach(function (r, i) {
      const n = dense || 3;
      for (let k = 0; k <= n; k++) pts.push(r.p0.clone().lerp(r.p1, k / n));
      if (i < runs.length - 1) {
        arcXY(r.p1, runs[i + 1].p0, 7).forEach(function (p) { pts.push(p); });
      }
    });
    return pts;
  }
  FL.snake = snake;

  /* =====================================================================
   * 主构建
   * ===================================================================*/
  FL.buildCooling = function (root) {
    const out = { compressor: null, condenser: null, evaporator: null, fans: [], loop: null };

    /* ==================================================================
     * D1  压缩机
     * ================================================================*/
    const CP = V(0.145, 0.095, -0.248); // 压缩机底座中心（世界坐标）
    const comp = new T.Group();
    comp.position.copy(CP);
    root.add(comp);

    // 剖面轮廓（半径, 高度）—— 圆顶壳体
    const prof = [
      [0.000, 0.000], [0.072, 0.000], [0.082, 0.010], [0.082, 0.148],
      [0.079, 0.166], [0.062, 0.184], [0.038, 0.197], [0.000, 0.203],
    ].map(function (p) { return new T.Vector2(p[0], p[1]); });

    const shellGroup = new T.Group();
    const shellGeo = new T.LatheGeometry(prof, 44);
    const shellMesh = new T.Mesh(shellGeo, M.compressorPaint);
    shellMesh.castShadow = true; shellMesh.receiveShadow = true;
    shellGroup.add(shellMesh);
    // 底座法兰 + 减振脚
    place(new T.CylinderGeometry(0.090, 0.090, 0.008, 32), M.castIron, [0, 0.004, 0], null, shellGroup);
    FL.registerPart('compressor', comp, {
      category: 'cooling', explode: new T.Vector3(0.06, -0.10, -0.34),
      meta: { name: '变频压缩机', english: 'INVERTER COMPRESSOR', category: 'cooling',
        intro: '全封闭往复式变频压缩机。电机定子驱动转子，偏心曲柄带动连杆，推动活塞在气缸内往复，把低压蒸气压缩为高温高压蒸气。转速随负荷连续调节，因此负荷变化是平滑的而非“启停式”。',
        facts: [['可见机构', '定子 · 转子 · 主轴 · 偏心曲柄 · 连杆 · 活塞 · 气缸'],
          ['输入 / 输出', '低压低温蒸气 → 高压高温蒸气'],
          ['观察方式', '半壳剖视 · 教学慢动作（不代表真实转速）'],
          ['功率范围', '约 25 – 100 W（教学参数）']] },
    });
    comp.add(shellGroup);
    out.compressor = { group: comp, shell: shellGroup };

    // 半剖外壳（特写模式显示）
    const halfGeo = new T.LatheGeometry(prof, 44, -Math.PI * 0.5, Math.PI);
    const halfMesh = new T.Mesh(halfGeo, M.compressorPaint);
    halfMesh.castShadow = true; halfMesh.receiveShadow = true;
    const halfGroup = new T.Group();
    halfGroup.add(halfMesh);
    halfGroup.visible = false;
    FL.registerPart('compShellHalf', halfGroup, {
      category: 'cooling', explode: new T.Vector3(0, 0, -0.14),
      meta: { name: '压缩机半剖外壳', english: 'COMPRESSOR CUTAWAY SHELL', category: 'cooling',
        intro: '为教学观察制作的半剖壳体，与完整外壳同尺寸，仅保留后半部分，以便在不破坏真实尺寸的前提下看到内部运动机构。',
        facts: [['作用', '教学剖视'], ['关系', '与完整外壳互斥显示'], ['厚度', '约 2.5 mm 钢板']] },
    });
    comp.add(halfGroup);

    /* ---- 内部机构 ---- */
    const mech = new T.Group();
    comp.add(mech);

    // 定子（叠片）—— 教学半剖：只保留 +Z 半圈，使转子与内部机构可见
    const stator = new T.Group();
    const halfRingShape = new T.Shape();
    halfRingShape.absarc(0, 0, 0.056, 0, Math.PI, false);
    halfRingShape.absarc(0, 0, 0.040, Math.PI, 0, true);
    const lamGeo = new T.ExtrudeGeometry(halfRingShape, { depth: 0.005, bevelEnabled: false, curveSegments: 16 });
    lamGeo.rotateX(Math.PI / 2);
    const lam = new T.InstancedMesh(lamGeo, M.castIron, 15);
    const tmpO = new T.Object3D();
    for (let i = 0; i < 15; i++) {
      tmpO.position.set(0, 0.044 + i * 0.0074, 0);
      tmpO.rotation.set(0, 0, 0);
      tmpO.updateMatrix();
      lam.setMatrixAt(i, tmpO.matrix);
    }
    lam.instanceMatrix.needsUpdate = true;
    stator.add(lam);
    // 定子绕组（铜色）—— 同样只保留 +Z 半圈
    const wind = new T.InstancedMesh(FL.roundedBoxGeo(0.012, 0.086, 0.016, 0.003, 1), M.motorCopper, 10);
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 9) * Math.PI;
      tmpO.position.set(Math.sin(a) * 0.050, 0.088, Math.cos(a) * 0.050);
      tmpO.rotation.set(0, -a, 0);
      tmpO.updateMatrix();
      wind.setMatrixAt(i, tmpO.matrix);
    }
    wind.instanceMatrix.needsUpdate = true;
    stator.add(wind);
    FL.registerPart('compStator', stator, {
      category: 'cooling', explode: new T.Vector3(0, 0, 0),
      meta: { name: '电机定子', english: 'STATOR', category: 'cooling',
        intro: '硅钢片叠压定子，槽内嵌铜绕组。变频器改变供电频率即可连续调节转速，实现制冷量的无级调节。',
        facts: [['结构', '硅钢叠片 + 铜绕组'], ['作用', '产生旋转磁场'], ['关联', '变频驱动 · 负荷平滑调节']] },
    });
    mech.add(stator);

    // 转子 + 主轴
    const rotor = new T.Group();
    const rotorMesh = new T.Mesh(new T.CylinderGeometry(0.037, 0.037, 0.082, 24), M.steel);
    rotorMesh.position.y = 0.088;
    rotor.add(rotorMesh);
    const shaft = new T.Mesh(new T.CylinderGeometry(0.009, 0.009, 0.170, 14), M.steel);
    shaft.position.y = 0.085;
    rotor.add(shaft);
    rotor.position.y = 0;
    FL.registerPart('compRotor', rotor, {
      category: 'cooling', explode: new T.Vector3(0, 0, 0),
      meta: { name: '转子与主轴', english: 'ROTOR & SHAFT', category: 'cooling',
        intro: '转子在旋转磁场中同步转动，通过主轴把扭矩传给上端的偏心曲柄。转子与定子的气隙极小，是压缩机能效的关键。',
        facts: [['结构', '转子铁芯 + 主轴'], ['作用', '输出扭矩'], ['观察方式', '特写模式缓慢旋转']] },
    });
    mech.add(rotor);

    // 偏心曲柄 + 连杆 + 活塞 + 气缸
    const crank = new T.Group();
    crank.position.set(0, 0.168, 0);
    const crankDisc = new T.Mesh(new T.CylinderGeometry(0.024, 0.024, 0.014, 22), M.steel);
    crank.add(crankDisc);
    const pin = new T.Mesh(new T.CylinderGeometry(0.007, 0.007, 0.020, 12), M.steel);
    pin.position.set(0.013, 0.008, 0);
    crank.add(pin);
    FL.registerPart('compCrank', crank, {
      category: 'cooling', explode: new T.Vector3(0, 0, 0),
      meta: { name: '偏心曲柄', english: 'ECCENTRIC CRANK', category: 'cooling',
        intro: '装在主轴上的偏心曲柄，把旋转运动转化为往复运动的输入；偏心距决定活塞行程。',
        facts: [['作用', '旋转 → 往复转换'], ['偏心距', '13 mm（视觉比例）']] },
    });
    mech.add(crank);

    const conrod = new T.Mesh(FL.roundedBoxGeo(1, 0.010, 0.008, 0.003, 2), M.steel);
    conrod.geometry.translate(0.5, 0, 0); // 以一端为原点
    FL.registerPart('compConrod', conrod, {
      category: 'cooling', explode: new T.Vector3(0, 0, 0),
      meta: { name: '连杆', english: 'CONNECTING ROD', category: 'cooling',
        intro: '连杆把曲柄的偏心旋转转成活塞的直线往复，两端分别为曲柄销孔与活塞销孔。',
        facts: [['作用', '运动形式转换'], ['两端', '曲柄销 · 活塞销']] },
    });
    mech.add(conrod);

    const piston = new T.Mesh(new T.CylinderGeometry(0.017, 0.017, 0.030, 20), M.steel);
    piston.rotation.z = Math.PI / 2;
    FL.registerPart('compPiston', piston, {
      category: 'cooling', explode: new T.Vector3(0, 0, 0),
      meta: { name: '活塞', english: 'PISTON', category: 'cooling',
        intro: '活塞在气缸内往复，改变气缸容积：容积增大时经吸气阀吸入低压蒸气，容积减小时压缩并顶开排气阀。',
        facts: [['行程', '约 26 mm（视觉比例）'], ['作用', '容积变化 → 压缩'], ['配气', '吸气阀 / 排气阀']] },
    });
    mech.add(piston);

    const cylBlock = new T.Group();
    // 气缸同样做教学半剖，便于观察活塞往复
    const bore = new T.Mesh(new T.CylinderGeometry(0.0205, 0.0205, 0.072, 22, 1, true, -Math.PI / 2, Math.PI), M.castIron);
    bore.rotation.z = Math.PI / 2;
    bore.position.set(0.058, 0.168, 0);
    cylBlock.add(bore);
    const head = FL.roundedBoxGeo(0.020, 0.052, 0.046, 0.005, 2);
    place(head, M.castIron, [0.094, 0.168, 0], null, cylBlock);
    place(new T.CylinderGeometry(0.006, 0.006, 0.030, 12), M.copper, [0.094, 0.196, -0.012], null, cylBlock);
    place(new T.CylinderGeometry(0.006, 0.006, 0.030, 12), M.copper, [0.094, 0.140, -0.012], null, cylBlock);
    FL.registerPart('compCylinder', cylBlock, {
      category: 'cooling', explode: new T.Vector3(0, 0, 0),
      meta: { name: '气缸与阀组', english: 'CYLINDER & VALVES', category: 'cooling',
        intro: '气缸是活塞的往复腔体，缸头集成吸气阀与排气阀。低压蒸气从吸气管进入缸体，压缩后经排气管送往冷凝器。',
        facts: [['作用', '压缩腔'], ['接口', '吸气管 / 排气管'], ['密封', '全封闭壳体焊接']] },
    });
    mech.add(cylBlock);

    // 减振脚 / 接线盒 / 吸排气口
    const feet = new T.Group();
    [[0.055, 0.055], [-0.055, 0.055], [0.055, -0.055], [-0.055, -0.055]].forEach(function (p) {
      place(new T.CylinderGeometry(0.012, 0.012, 0.014, 12), M.gasket, [p[0], -0.006, p[1]], null, feet);
    });
    place(FL.roundedBoxGeo(0.046, 0.036, 0.026, 0.005, 2), M.greyPlastic, [-0.070, 0.120, 0.030], null, feet);
    FL.registerPart('compFeet', feet, {
      category: 'cooling', explode: new T.Vector3(0, -0.06, 0),
      meta: { name: '减振脚与接线盒', english: 'FEET & TERMINAL BOX', category: 'cooling',
        intro: '橡胶减振脚把压缩机振动与箱体解耦，降低噪声；侧面接线盒为电机与保护器提供电气接口。',
        facts: [['减振', '4 点橡胶脚'], ['电气', '接线盒 + 过载保护器'], ['作用', '降噪 · 隔振']] },
    });
    comp.add(feet);

    out.compressor.stator = stator;
    out.compressor.rotor = rotor;
    out.compressor.crank = crank;
    out.compressor.conrod = conrod;
    out.compressor.piston = piston;

    /* ==================================================================
     * D2  丝管式冷凝器（后置）
     * ================================================================*/
    const CZ = -0.386;
    const condRuns = [];
    const NCOND = 10, yTop = 1.52, yStep = 0.12, xA = -0.37, xB = 0.37;
    for (let i = 0; i < NCOND; i++) {
      const y = yTop - i * yStep;
      const dir = i % 2 === 0;
      condRuns.push({ p0: V(dir ? xB : xA, y, CZ), p1: V(dir ? xA : xB, y, CZ) });
    }
    const condPts = snake(condRuns, 4);
    const condCurve = new T.CatmullRomCurve3(condPts, false, 'centripetal', 0.5);

    const condGroup = new T.Group();
    const condTube = new T.Mesh(new T.TubeGeometry(condCurve, 460, 0.0048, 8, false), M.copper);
    condTube.castShadow = true;
    condGroup.add(condTube);
    // 密集竖向散热丝
    const wireGeo = new T.CylinderGeometry(0.0016, 0.0016, yTop - 0.44 + 0.08, 5);
    const NW = 64;
    const wires = new T.InstancedMesh(wireGeo, M.wireSteel, NW);
    const o = new T.Object3D();
    for (let i = 0; i < NW; i++) {
      o.position.set(xA + 0.006 + (i / (NW - 1)) * (xB - xA - 0.012), (yTop + 0.44) / 2, CZ - 0.007);
      o.updateMatrix();
      wires.setMatrixAt(i, o.matrix);
    }
    wires.instanceMatrix.needsUpdate = true;
    wires.castShadow = true;
    condGroup.add(wires);
    // 支撑框
    [-0.385, 0.385].forEach(function (x) {
      place(new T.CylinderGeometry(0.007, 0.007, 1.20, 12), M.steel, [x, (yTop + 0.44) / 2, CZ], null, condGroup);
    });
    [0.48, 1.02, 1.50].forEach(function (y) {
      place(FL.roundedBoxGeo(0.90, 0.014, 0.026, 0.004, 2), M.steel, [0, y, CZ - 0.006], null, condGroup);
    });
    FL.registerPart('condenser', condGroup, {
      category: 'cooling', explode: new T.Vector3(0, 0, -0.44),
      meta: { name: '丝管式冷凝器', english: 'WIRE-TUBE CONDENSER', category: 'cooling',
        intro: '后置丝管式冷凝器：蛇形铜管负责输送高温高压制冷剂，密集竖向散热丝把管壁热量以自然对流方式交给环境空气。冷凝器是整个制冷循环中唯一向环境排热的部件。',
        facts: [['结构', '蛇形铜管 + 64 根竖向散热丝 + 支撑框'],
          ['输入 / 输出', '高温高压蒸气 → 高压液体'],
          ['散热方式', '自然对流（无风扇）'],
          ['教学要点', '散热受阻 → 冷凝温度上升 → COP 下降']] },
    });
    root.add(condGroup);
    out.condenser = { group: condGroup, curve: condCurve };

    /* ==================================================================
     * D3  蒸发器（冷冻室后部翅片盘管）
     * ================================================================*/
    const EX = (D.evapX0 + D.evapX1) / 2, EY = (D.evapY0 + D.evapY1) / 2;
    const EZ0 = -0.325, EZ1 = -0.175;
    const cols = [-0.09, -0.03, 0.03, 0.09].map(function (d) { return EX + d; });
    const rows = [-0.105, 0.105].map(function (d) { return EY + d; });
    const evapRuns = [];
    let k = 0;
    const seq = [
      [0, 1, 2, 3],
      [3, 2, 1, 0],
    ];
    seq.forEach(function (rowOrder, j) {
      rowOrder.forEach(function (ci) {
        const dir = k % 2 === 0;
        evapRuns.push({
          p0: V(cols[ci], rows[j], dir ? EZ0 : EZ1),
          p1: V(cols[ci], rows[j], dir ? EZ1 : EZ0),
        });
        k++;
      });
    });
    const evapPts = snake(evapRuns, 4);
    const evapCurve = new T.CatmullRomCurve3(evapPts, false, 'centripetal', 0.5);

    const evapGroup = new T.Group();
    const evapTube = new T.Mesh(new T.TubeGeometry(evapCurve, 420, 0.0042, 8, false), M.copper);
    evapTube.castShadow = true;
    evapGroup.add(evapTube);

    // 铝翅片（InstancedMesh，薄板沿 Z 堆叠）
    const NF = 62;
    const finGeo = new T.BoxGeometry(0.30, 0.375, 0.0007);
    const fins = new T.InstancedMesh(finGeo, M.aluminium, NF);
    for (let i = 0; i < NF; i++) {
      o.position.set(EX, EY, EZ0 + 0.012 + (i / (NF - 1)) * (EZ1 - EZ0 - 0.024));
      o.rotation.set(0, 0, 0);
      o.updateMatrix();
      fins.setMatrixAt(i, o.matrix);
    }
    fins.instanceMatrix.needsUpdate = true;
    fins.castShadow = true;
    fins.receiveShadow = true;
    evapGroup.add(fins);
    // 上下端板
    [EY - 0.192, EY + 0.192].forEach(function (y) {
      place(FL.roundedPanelGeo(0.31, EZ1 - EZ0 + 0.02, 0.006, 0.004, 2), M.aluminium, [EX, y, (EZ0 + EZ1) / 2], [-Math.PI / 2, 0, 0], evapGroup);
    });
    FL.registerPart('evaporator', evapGroup, {
      category: 'cooling', explode: new T.Vector3(-0.10, 0.05, 0.34),
      meta: { name: '翅片式蒸发器', english: 'FINNED EVAPORATOR', category: 'cooling',
        intro: '冷冻室后部的翅片盘管。节流后的低温低压制冷剂在管内蒸发吸热，62 片铝翅片把管壁的“冷”大面积传递给流经的空气，风机再把冷空气送入箱内。',
        facts: [['结构', '8 程蛇形铜管 + 62 片铝翅片'],
          ['输入 / 输出', '低温两相冷媒 → 低压过热蒸气'],
          ['换热方向', '箱内空气 → 制冷剂'],
          ['关键', '与冷凝器方向相反：这里吸热，那里放热']] },
    });
    root.add(evapGroup);
    out.evaporator = { group: evapGroup, curve: evapCurve, center: V(EX, EY, (EZ0 + EZ1) / 2) };

    /* ---- 蒸发器风机 ---- */
    function buildFan(cx, cy, cz, dia, facing, mat) {
      const g = new T.Group();
      g.position.set(cx, cy, cz);
      if (facing === -1) g.rotation.y = Math.PI;
      const hub = new T.Mesh(new T.CylinderGeometry(dia * 0.19, dia * 0.19, 0.024, 20), mat || M.fanPlastic);
      hub.rotation.x = Math.PI / 2;
      g.add(hub);
      const blades = new T.Group();
      const bn = 7;
      for (let i = 0; i < bn; i++) {
        const a = (i / bn) * Math.PI * 2;
        const b = new T.Mesh(FL.roundedBoxGeo(dia * 0.34, 0.0035, dia * 0.30, 0.002, 1), mat || M.fanPlastic);
        b.position.set(Math.cos(a) * dia * 0.30, Math.sin(a) * dia * 0.30, 0.006);
        b.rotation.z = a + 0.5;
        b.rotation.y = 0.42;
        blades.add(b);
      }
      g.add(blades);
      const ring = new T.Mesh(new T.TorusGeometry(dia * 0.5, 0.004, 8, 30), M.greyPlastic);
      g.add(ring);
      const motor = new T.Mesh(new T.CylinderGeometry(dia * 0.13, dia * 0.13, 0.030, 16), M.steel);
      motor.rotation.x = Math.PI / 2;
      motor.position.z = -0.028;
      g.add(motor);
      g.traverse(function (o2) { if (o2.isMesh) { o2.castShadow = true; } });
      return { group: g, blades: blades };
    }

    const evFan = buildFan(EX, EY - 0.06, EZ1 + 0.026, 0.125, 1, M.fanPlastic);
    FL.registerPart('evapFan', evFan.group, {
      category: 'cooling', explode: new T.Vector3(0, -0.06, 0.30),
      meta: { name: '蒸发器风机', english: 'EVAPORATOR FAN', category: 'cooling',
        intro: '离心/轴流风机把空气强制抽过蒸发器翅片，再把冷却后的空气送入风道。门体打开时风机会停机，避免把冷气直接吹到室内。',
        facts: [['作用', '强制对流换热'], ['控制', '门开关联动 · 可停机'], ['功率', '约 3 W'], ['观察方式', '运行时持续旋转']] },
    });
    root.add(evFan.group);
    out.fans.push({ name: 'evap', blades: evFan.blades, speed: 0, on: true });

    /* ---- 除霜加热管 ---- */
    const heatRuns = [];
    [EY - 0.155, EY - 0.135].forEach(function (y, i) {
      const dir = i % 2 === 0;
      heatRuns.push({ p0: V(dir ? cols[0] : cols[3], y, EZ0 + 0.02), p1: V(dir ? cols[3] : cols[0], y, EZ0 + 0.02) });
    });
    const heatCurve = new T.CatmullRomCurve3(snake(heatRuns, 3), false, 'centripetal', 0.5);
    const heater = new T.Mesh(new T.TubeGeometry(heatCurve, 120, 0.0055, 8, false), M.heater);
    const heaterGroup = new T.Group();
    heaterGroup.add(heater);
    FL.registerPart('defrostHeater', heaterGroup, {
      category: 'cooling', explode: new T.Vector3(0, -0.14, 0.22),
      meta: { name: '除霜加热管', english: 'DEFROST HEATER', category: 'cooling',
        intro: '蒸发器下方的电加热管。结霜会堵塞翅片间隙、显著降低换热能力，因此系统会周期性停机并加热化霜；化霜水沿接水槽与排水管流入压缩机上方的接水盘。',
        facts: [['功率', '约 180 W（教学参数）'], ['除霜方式', '停机 + 电加热'], ['排水路径', '接水槽 → 排水管 → 接水盘']] },
    });
    root.add(heaterGroup);
    out.heater = heaterGroup;

    /* ---- 接水槽 / 排水管 / 接水盘 ---- */
    const tray = new T.Group();
    place(FL.roundedBoxGeo(0.33, 0.008, EZ1 - EZ0 + 0.03, 0.003, 2), M.greyPlastic, [EX, EY - 0.196, (EZ0 + EZ1) / 2], null, tray);
    place(FL.roundedPanelGeo(0.33, 0.030, 0.006, 0.004, 2), M.greyPlastic, [EX, EY - 0.182, EZ1 + 0.014], null, tray);
    place(FL.roundedPanelGeo(0.33, 0.030, 0.006, 0.004, 2), M.greyPlastic, [EX, EY - 0.182, EZ0 - 0.014], null, tray);
    FL.registerPart('drainTray', tray, {
      category: 'cooling', explode: new T.Vector3(0, -0.20, 0.20),
      meta: { name: '接水槽', english: 'DRAIN TRAY', category: 'cooling',
        intro: '位于蒸发器下方的倾斜接水槽，收集化霜水并导入排水管；槽体带坡度保证水不会滞留结冰。',
        facts: [['作用', '收集化霜水'], ['坡度', '导向排水口'], ['材料', 'ABS / 镀锌板']] },
    });
    root.add(tray);

    const drainPts = [
      V(EX + 0.06, EY - 0.208, EZ0 + 0.02), V(EX + 0.02, EY - 0.24, -0.30),
      V(0.10, 0.40, -0.28), V(0.16, 0.345, -0.27), V(0.20, 0.315, -0.26),
    ];
    const drainCurve = new T.CatmullRomCurve3(drainPts, false, 'centripetal', 0.5);
    const drainGroup = new T.Group();
    drainGroup.add(new T.Mesh(new T.TubeGeometry(drainCurve, 60, 0.0055, 8, false), M.greyPlastic));
    FL.registerPart('drainTube', drainGroup, {
      category: 'cooling', explode: new T.Vector3(0, -0.12, 0.16),
      meta: { name: '除霜排水管', english: 'DRAIN TUBE', category: 'cooling',
        intro: '把接水槽里的化霜水引到压缩机上方的接水盘。排水管外壁贴着回气管，利用回气冷量抑制管口结霜堵塞。',
        facts: [['作用', '导流化霜水'], ['路线', '接水槽 → 机械舱接水盘'], ['防堵', '贴附回气管']] },
    });
    root.add(drainGroup);

    const pan = new T.Group();
    place(FL.roundedBoxGeo(0.30, 0.026, 0.185, 0.004, 2), M.greyPlastic, [0.145, 0.302, -0.250], null, pan);
    FL.registerPart('drainPan', pan, {
      category: 'cooling', explode: new T.Vector3(0.06, -0.06, -0.30),
      meta: { name: '接水盘', english: 'EVAPORATION PAN', category: 'cooling',
        intro: '置于压缩机上方，利用压缩机壳体余热把化霜水自然蒸发，因此整机无需外接排水——这是家用冰箱的经典设计。',
        facts: [['位置', '压缩机上方'], ['原理', '压缩机余热蒸发'], ['优点', '无需外接排水']] },
    });
    root.add(pan);

    /* ---- 机械舱轴流风扇 ---- */
    const mFan = buildFan(-0.28, 0.235, -0.335, 0.13, -1, M.fanPlastic);
    FL.registerPart('mechFan', mFan.group, {
      category: 'cooling', explode: new T.Vector3(-0.10, 0, -0.34),
      meta: { name: '机械舱轴流风扇', english: 'MACHINERY BAY FAN', category: 'cooling',
        intro: '机械舱辅助风扇，加速压缩机表面与冷凝器下端的热空气排出，避免机械舱积热导致冷凝温度升高。',
        facts: [['作用', '强化机械舱散热'], ['控制', '随压缩机同步启停'], ['功率', '约 2 W']] },
    });
    root.add(mFan.group);
    out.fans.push({ name: 'mech', blades: mFan.blades, speed: 0, on: true });

    /* ==================================================================
     * D4  过滤干燥器 / 毛细管 / 全机管路
     * ================================================================*/
    const drier = new T.Group();
    place(new T.CylinderGeometry(0.017, 0.017, 0.098, 20), M.copperDark, [0.315, 0.235, -0.272], null, drier);
    place(new T.CylinderGeometry(0.019, 0.019, 0.010, 20), M.copper, [0.315, 0.288, -0.272], null, drier);
    place(new T.CylinderGeometry(0.019, 0.019, 0.010, 20), M.copper, [0.315, 0.182, -0.272], null, drier);
    FL.registerPart('filterDrier', drier, {
      category: 'cooling', explode: new T.Vector3(0.16, -0.04, -0.20),
      meta: { name: '过滤干燥器', english: 'FILTER DRIER', category: 'cooling',
        intro: '内置分子筛与滤网，吸收系统内残余水分并拦截杂质。水分是制冷系统最大的敌人——它会生成冰堵和酸性物质。',
        facts: [['作用', '吸水 · 滤杂'], ['位置', '冷凝器出口与毛细管之间'], ['失效后果', '冰堵 · 压缩机损坏']] },
    });
    root.add(drier);

    /* ---- 制冷剂回路：完整路径 ---- */
    const P = []; // {p, tag}
    const push = (tag, arr) => arr.forEach(function (p) { P.push({ p: p, tag: tag }); });

    // ① 排气管：压缩机 → 冷凝器入口
    push('discharge', [
      V(0.145, 0.298, -0.290),
      V(0.235, 0.320, -0.310), V(0.330, 0.350, -0.335), V(0.408, 0.430, -0.365),
      V(0.418, 0.760, -0.378), V(0.412, 1.240, -0.380), V(0.398, 1.470, -0.384),
      V(0.370, 1.520, CZ),
    ]);
    // ② 冷凝器盘管
    push('condense', condPts);
    // ③ 液管：冷凝器出口 → 干燥器
    const condEnd = condPts[condPts.length - 1];
    push('liquid', [
      condEnd.clone(), V(0.400, 0.400, -0.360), V(0.360, 0.320, -0.310),
      V(0.330, 0.288, -0.282), V(0.315, 0.288, -0.272),
      V(0.315, 0.182, -0.272), V(0.300, 0.150, -0.268),
    ]);
    // ④ 毛细管：干燥器 → 蒸发器入口（细长螺旋）
    const capPts = [];
    capPts.push(V(0.300, 0.150, -0.268));
    capPts.push(V(0.250, 0.140, -0.250));
    capPts.push(V(0.180, 0.155, -0.235));
    // 螺旋段
    const coilC = V(0.075, 0.185, -0.235);
    for (let i = 0; i <= 30; i++) {
      const a = (i / 30) * Math.PI * 5.0;
      capPts.push(V(coilC.x + Math.cos(a) * 0.020, coilC.y + Math.sin(a) * 0.014, coilC.z + (i / 30) * 0.055 - 0.028));
    }
    capPts.push(V(-0.030, 0.245, -0.220));
    capPts.push(V(-0.075, 0.340, -0.205));
    capPts.push(V(-0.110, 0.470, -0.190));
    capPts.push(V(-0.135, 0.600, -0.180));
    capPts.push(V(-0.1565, 0.6685, EZ1 + 0.004));
    const capU0 = P.length;
    push('flash', capPts);
    const capU1 = P.length - 1;
    // ⑤ 蒸发器
    push('evaporate', evapPts);
    // ⑥ 回气管：蒸发器出口 → 压缩机吸气口
    const evapEnd = evapPts[evapPts.length - 1];
    push('suction', [
      evapEnd.clone(), V(-0.330, 0.420, -0.310), V(-0.290, 0.380, -0.250),
      V(-0.180, 0.300, -0.230), V(-0.050, 0.230, -0.226), V(0.030, 0.180, -0.226),
      V(0.070, 0.150, -0.226),
    ]);

    const loopPts = P.map(function (o) { return o.p; });
    const loopCurve = new T.CatmullRomCurve3(loopPts, false, 'centripetal', 0.5);

    // 弧长参数 → 段标签（用于粒子着色）
    const cum = [0];
    for (let i = 1; i < loopPts.length; i++) cum.push(cum[i - 1] + loopPts[i].distanceTo(loopPts[i - 1]));
    const totalLen = cum[cum.length - 1];
    const breaks = [];
    let lastTag = null;
    P.forEach(function (o, i) {
      if (o.tag !== lastTag) { breaks.push({ tag: o.tag, u: cum[i] / totalLen }); lastTag = o.tag; }
    });

    out.loop = {
      curve: loopCurve,
      breaks: breaks,
      length: totalLen,
      capU0: cum[capU0] / totalLen,
      capU1: cum[capU1] / totalLen,
    };

    // 可见管路：主管 + 极细毛细管
    const pipeGroup = new T.Group();
    function sub(u0, u1, n) {
      const ps = [];
      for (let i = 0; i <= n; i++) ps.push(loopCurve.getPointAt(u0 + (u1 - u0) * (i / n)));
      return new T.CatmullRomCurve3(ps, false, 'centripetal', 0.5);
    }
    const mainA = new T.Mesh(new T.TubeGeometry(sub(0, out.loop.capU0, 260), 300, 0.0048, 8, false), M.copper);
    mainA.castShadow = true;
    pipeGroup.add(mainA);
    const capMesh = new T.Mesh(new T.TubeGeometry(sub(out.loop.capU0, out.loop.capU1, 160), 200, 0.0013, 6, false), M.copperDark);
    pipeGroup.add(capMesh);
    const mainB = new T.Mesh(new T.TubeGeometry(sub(out.loop.capU1, 1, 200), 220, 0.0048, 8, false), M.copper);
    mainB.castShadow = true;
    pipeGroup.add(mainB);
    // 管路夹
    [[0.42, 0.62, -0.372], [0.418, 1.10, -0.376], [-0.30, 0.34, -0.256], [0.10, 0.30, -0.28]].forEach(function (p) {
      place(FL.roundedBoxGeo(0.020, 0.016, 0.024, 0.004, 1), M.greyPlastic, p, null, pipeGroup);
    });
    FL.registerPart('refrigerantPipe', pipeGroup, {
      category: 'cooling', explode: new T.Vector3(0, 0, -0.10),
      meta: { name: '制冷剂管路系统', english: 'REFRIGERANT PIPING', category: 'cooling',
        intro: '连接压缩机、冷凝器、毛细管与蒸发器的密闭铜管路，与箱内空气完全隔离——两者只在蒸发器与冷凝器的管壁处交换热量，绝不混合。',
        facts: [['组成', '排气管 · 液管 · 毛细管 · 回气管'],
          ['密封性', '全焊接密闭回路'], ['毛细管', '内径 0.6–0.8 mm，负责节流降压'],
          ['教学要点', '铜管中的彩色粒子 = 制冷剂；青色曲线 = 箱内空气']] },
    });
    root.add(pipeGroup);

    out.pipeGroup = pipeGroup;
    out.capillary = capMesh;
    return out;
  };
})(window.FL);
