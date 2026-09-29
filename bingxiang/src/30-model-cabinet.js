/* =========================================================================
 * 30-model-cabinet.js — 箱体结构（外皮 / 保温层 / 内胆 / 中梁 / 底座 / 机械舱）
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;
  const M = FL.MAT;

  /* ---------------------- 全局尺寸（单位：米） ---------------------- */
  const D = (FL.DIM = {
    W: 0.94, H: 1.9, D: 0.72,
    // 外壳
    shellT: 0.012, foamT: 0.046, linerT: 0.006,
    outX: 0.47, outY0: 0.06, outY1: 1.9, outZ0: -0.36, outZ1: 0.302,
    // 内层边界
    inX: 0.412, inY0: 0.118, inY1: 1.842,
    // 腔体
    cavY0: 0.124, cavY1: 1.836, cavZ0: -0.144, cavZ1: 0.302, cavZBack: -0.15,
    freeX0: -0.406, freeX1: -0.056,
    fridX0: 0.056, fridX1: 0.406,
    mullX0: -0.056, mullX1: 0.056,
    // 门
    doorZ0: 0.302, doorZ1: 0.36, doorT: 0.058,
    doorY0: 0.072, doorY1: 1.888,
    doorGap: 0.024,
    // 机械舱 / 蒸发器舱
    mechY0: 0.118, mechY1: 0.36, mechZ0: -0.348, mechZ1: -0.15,
    bayDivY: 0.366,
    evapX0: -0.408, evapX1: -0.085, evapY0: 0.372, evapY1: 0.755, evapZ0: -0.344, evapZ1: -0.155,
    // 抽屉 / 搁板
    drawerTravel: 0.3,
    shelfZFront: 0.198, shelfZBack: -0.134,
    binZBack: 0.304, binZFront: 0.218,
    binY: [0.448, 0.898, 1.348],
    drawerY: [0.126, 0.452],
    trayInnerY: [0.137, 0.463],
    shelfY: [0.92, 1.24, 1.56],
  });

  function place(geo, mat, pos, rot, parent) {
    const m = new T.Mesh(geo, mat);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    m.castShadow = true;
    m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }
  FL.place = place;

  /** 带孔面板（内胆风道开口 / 后面板开口） */
  function panelWithHoleGeo(W, H, Tk, R, hole) {
    const shape = FL.roundedRectShape(W, H, R);
    const holePath = new T.Path();
    FL.roundedRectShape(hole.w, hole.h, hole.r || 0.012)
      .getPoints(48)
      .forEach(function (p, i) {
        const x = p.x + hole.x, y = p.y + hole.y;
        if (i === 0) holePath.moveTo(x, y);
        else holePath.lineTo(x, y);
      });
    shape.holes.push(holePath);
    const geo = new T.ExtrudeGeometry(shape, {
      depth: Tk, bevelEnabled: false, curveSegments: 10, steps: 1,
    });
    geo.translate(0, 0, -Tk / 2);
    geo.computeVertexNormals();
    return geo;
  }
  FL.panelWithHoleGeo = panelWithHoleGeo;

  /** 快速创建“面板”网格：默认正面朝向 +Z（宽 W × 高 H × 厚 Tk） */
  FL.panel = function (W, H, Tk, R, mat, bevelSeg) {
    return new T.Mesh(FL.roundedPanelGeo(W, H, Tk, R, bevelSeg), mat);
  };

  /* =====================================================================
   * 构建箱体
   * ===================================================================*/
  FL.buildCabinet = function (root) {
    const cab = new T.Group();
    cab.name = 'cabinet';
    root.add(cab);

    const oy0 = D.outY0, oy1 = D.outY1;
    const cy = (oy0 + oy1) / 2, ch = oy1 - oy0;
    const cz = (D.outZ0 + D.outZ1) / 2, cd = D.outZ1 - D.outZ0;

    /* ---------------- 1. 外壳钣金（5 面） ---------------- */
    // 左 / 右 外壳
    const shellL = new T.Group();
    place(FL.roundedPanelGeo(cd, ch, D.shellT, 0.008), M.ivoryShell, [-0.464, cy, cz], [0, Math.PI / 2, 0], shellL);
    FL.registerPart('shellLeft', shellL, {
      category: 'cabinet',
      explode: new T.Vector3(-0.34, 0, 0),
      meta: { name: '左侧钣金外壳', english: 'LEFT STEEL SHELL', category: 'cabinet',
        intro: '0.6 mm 冷轧钢板经预涂装成型，是整机的结构承力面与外观面，内侧贴合硬质聚氨酯发泡保温层。',
        facts: [['材料', '预涂装冷轧钢板'], ['厚度', '0.6 mm 视觉 12 mm'], ['作用', '结构承力 · 外观面 · 防潮'], ['相邻结构', '发泡保温层 / 内胆']] },
    });
    cab.add(shellL);

    const shellR = new T.Group();
    place(FL.roundedPanelGeo(cd, ch, D.shellT, 0.008), M.ivoryShell, [0.464, cy, cz], [0, Math.PI / 2, 0], shellR);
    FL.registerPart('shellRight', shellR, {
      category: 'cabinet', explode: new T.Vector3(0.34, 0, 0),
      meta: { name: '右侧钣金外壳', english: 'RIGHT STEEL SHELL', category: 'cabinet',
        intro: '与左侧对称的承力外壳，两侧共同保证箱体刚性与门体铰链的安装强度。',
        facts: [['材料', '预涂装冷轧钢板'], ['作用', '承力 · 铰链基座'], ['相邻结构', '发泡保温层 / 内胆']] },
    });
    cab.add(shellR);

    // 顶板
    const shellTop = new T.Group();
    place(FL.roundedPanelGeo(0.916, cd, D.shellT, 0.008), M.ivoryShell, [0, 1.894, cz], [-Math.PI / 2, 0, 0], shellTop);
    FL.registerPart('shellTop', shellTop, {
      category: 'cabinet', explode: new T.Vector3(0, 0.30, 0),
      meta: { name: '顶板', english: 'TOP PANEL', category: 'cabinet',
        intro: '顶部封闭钣金，与两侧外壳咬合形成箱体上盖，内侧同样填充发泡保温材料。',
        facts: [['位置', '箱体顶部'], ['相邻结构', '顶部保温层'], ['作用', '封闭 · 保温 · 承力']] },
    });
    cab.add(shellTop);

    // 底板
    const shellBot = new T.Group();
    place(FL.roundedPanelGeo(0.916, cd, D.shellT, 0.008), M.ivoryShell, [0, 0.066, cz], [-Math.PI / 2, 0, 0], shellBot);
    FL.registerPart('shellBottom', shellBot, {
      category: 'cabinet', explode: new T.Vector3(0, -0.22, 0),
      meta: { name: '底板', english: 'BOTTOM PANEL', category: 'cabinet',
        intro: '箱体底部承重钣金，向上支撑内胆与储物结构，向下连接可调底脚。',
        facts: [['位置', '箱体底部'], ['相邻结构', '底部保温层 · 底脚'], ['作用', '承重 · 封闭']] },
    });
    cab.add(shellBot);

    // 后面板（上半，冷凝器安装面）
    const shellRear = new T.Group();
    place(FL.roundedPanelGeo(0.916, 1.488, D.shellT, 0.008), M.ivoryShell, [0, 1.144, -0.354], [0, Math.PI, 0], shellRear);
    FL.registerPart('shellRear', shellRear, {
      category: 'cabinet', explode: new T.Vector3(0, 0, -0.40),
      meta: { name: '后面板', english: 'REAR PANEL', category: 'cabinet',
        intro: '箱体背面钣金，外侧安装丝管式冷凝器，内侧为发泡保温层，同时构成机械舱的上盖边界。',
        facts: [['位置', '箱体背面'], ['外挂', '丝管式冷凝器'], ['作用', '封闭 · 冷凝器基座 · 保温']] },
    });
    cab.add(shellRear);

    /* ---------------- 2. 发泡保温层 ---------------- */
    const mkFoam = (w, h, d, x, y, z, id, name, en, explode) => {
      const g = new T.Group();
      const m = place(FL.roundedBoxGeo(w, h, d, 0.004, 2), M.foam, [x, y, z], null, g);
      FL.registerPart(id, g, {
        category: 'cabinet', explode: explode,
        meta: { name: name, english: en, category: 'cabinet',
          intro: '硬质聚氨酯整体发泡层，闭孔率高，是箱体隔热的核心；与外壳、内胆共同构成三明治式箱壁。',
          facts: [['材料', '硬质聚氨酯泡沫'], ['导热系数', '≈ 0.022 W/(m·K)（教学参数）'], ['作用', '阻断漏热 · 提升能效'], ['观察方式', '剖面模式可见切层']] },
      });
      cab.add(g);
      return m;
    };
    mkFoam(D.foamT, ch, cd, -0.435, cy, cz, 'insulLeft', '左侧保温层', 'LEFT INSULATION', new T.Vector3(-0.20, 0, 0));
    mkFoam(D.foamT, ch, cd, 0.435, cy, cz, 'insulRight', '右侧保温层', 'RIGHT INSULATION', new T.Vector3(0.20, 0, 0));
    mkFoam(0.824, D.foamT, cd, 0, 1.865, cz, 'insulTop', '顶部保温层', 'TOP INSULATION', new T.Vector3(0, 0.20, 0));
    mkFoam(0.824, D.foamT, cd, 0, 0.095, cz, 'insulBottom', '底部保温层', 'BOTTOM INSULATION', new T.Vector3(0, -0.16, 0));
    // 后部保温（避开机械舱与蒸发器舱）
    mkFoam(0.824, 1.082, 0.198, 0, 1.301, -0.249, 'insulRear', '后部保温层', 'REAR INSULATION', new T.Vector3(0, 0, -0.28));
    mkFoam(0.492, 0.383, 0.198, 0.166, 0.5635, -0.249, 'insulRearLow', '后部保温层（下）', 'REAR INSULATION LOWER', new T.Vector3(0, 0, -0.24));

    /* ---------------- 3. 中央隔热梁 ---------------- */
    const mull = new T.Group();
    place(FL.roundedBoxGeo(0.100, 1.724, 0.446, 0.005, 2), M.foam, [0, 0.98, 0.076], null, mull);
    place(FL.roundedPanelGeo(0.446, 1.724, 0.006, 0.006), M.liner, [-0.053, 0.98, 0.076], [0, Math.PI / 2, 0], mull);
    place(FL.roundedPanelGeo(0.446, 1.724, 0.006, 0.006), M.liner, [0.053, 0.98, 0.076], [0, Math.PI / 2, 0], mull);
    place(FL.roundedPanelGeo(0.112, 1.724, 0.008, 0.006), M.liner, [0, 0.98, 0.298], null, mull);
    FL.registerPart('mullion', mull, {
      category: 'cabinet', explode: new T.Vector3(0, 0, 0.16),
      meta: { name: '中央隔热梁', english: 'CENTER MULLION', category: 'cabinet',
        intro: '分隔冷冻与冷藏两区的隔热梁，内部同样整体发泡，正面覆塑料盖板；同时是两扇门体的密封配合面。',
        facts: [['作用', '分区隔热 · 门体密封面'], ['内部', '聚氨酯发泡 + 内胆'], ['相邻结构', '左右内胆 · 门封条']] },
    });
    cab.add(mull);

    /* ---------------- 4. 内胆（左冷冻 / 右冷藏） ---------------- */
    function buildLiner(cavX0, cavX1, id, name, en, hole) {
      const g = new T.Group();
      const w = cavX1 - cavX0, cx = (cavX0 + cavX1) / 2;
      const h = D.cavY1 - D.cavY0, cyy = (D.cavY0 + D.cavY1) / 2;
      const dz = D.cavZ1 - D.cavZBack, dzz = (D.cavZ1 + D.cavZBack) / 2;
      // 左右侧壁
      place(FL.roundedPanelGeo(dz, h, D.linerT, 0.006), M.liner, [cavX0 + D.linerT / 2, cyy, dzz], [0, Math.PI / 2, 0], g);
      place(FL.roundedPanelGeo(dz, h, D.linerT, 0.006), M.liner, [cavX1 - D.linerT / 2, cyy, dzz], [0, Math.PI / 2, 0], g);
      // 顶 / 底
      place(FL.roundedPanelGeo(w, dz, D.linerT, 0.006), M.liner, [cx, D.cavY1 - D.linerT / 2, dzz], [-Math.PI / 2, 0, 0], g);
      place(FL.roundedPanelGeo(w, dz, D.linerT, 0.006), M.liner, [cx, D.cavY0 + D.linerT / 2, dzz], [-Math.PI / 2, 0, 0], g);
      // 背板（可带风道开口）
      const backGeo = hole
        ? panelWithHoleGeo(w, h, D.linerT, 0.006, hole)
        : FL.roundedPanelGeo(w, h, D.linerT, 0.006);
      place(backGeo, M.liner, [cx, cyy, D.cavZBack + D.linerT / 2], null, g);
      FL.registerPart(id, g, {
        category: 'cabinet', explode: new T.Vector3(0, 0, 0.22),
        meta: { name: name, english: en, category: 'cabinet',
          intro: 'ABS 真空成型内胆，围出储物腔体，背面与发泡层贴合；耐低温、易清洁，背部集成风道开口。',
          facts: [['材料', 'ABS 真空成型'], ['厚度', '约 0.6–1.0 mm'], ['功能', '储物腔 · 风道 · 回风'], ['开口', hole ? '背部送风道' : '顶部送风']] },
      });
      cab.add(g);
      return g;
    }
    buildLiner(D.freeX0, D.freeX1, 'linerLeft', '冷冻室内胆', 'FREEZER LINER', {
      w: 0.31, h: 0.36, r: 0.014, x: (D.evapX0 + D.evapX1) / 2 - (D.freeX0 + D.freeX1) / 2, y: (D.evapY0 + D.evapY1) / 2 - (D.cavY0 + D.cavY1) / 2,
    });
    buildLiner(D.fridX0, D.fridX1, 'linerRight', '冷藏室内胆', 'FRIDGE LINER', {
      w: 0.24, h: 0.28, r: 0.012, x: 0, y: 1.836 - 0.19 - (D.cavY0 + D.cavY1) / 2,
    });

    /* ---------------- 5. 机械舱框架 / 隔板 / 检修盖 ---------------- */
    const divider = new T.Group();
    place(FL.roundedPanelGeo(0.824, 0.198, 0.010, 0.006), M.steel, [0, D.bayDivY, -0.249], [-Math.PI / 2, 0, 0], divider);
    FL.registerPart('bayDivider', divider, {
      category: 'cabinet', explode: new T.Vector3(0, 0.22, -0.18),
      meta: { name: '机械舱隔板', english: 'MACHINERY BAY DIVIDER', category: 'cabinet',
        intro: '分隔机械舱与蒸发器舱的金属隔板，阻止压缩机热量窜入蒸发器舱，同时承载除霜排水管。',
        facts: [['作用', '热隔离 · 承载排水'], ['材质', '镀锌钢板'], ['相邻结构', '压缩机 / 蒸发器']] },
    });
    cab.add(divider);

    const mechFrame = new T.Group();
    [[-0.418, 0], [0.418, 0]].forEach(function (p) {
      place(FL.roundedPanelGeo(0.198, 0.30, 0.008, 0.004), M.greyPlastic, [p[0], 0.24, -0.249], [0, Math.PI / 2, 0], mechFrame);
    });
    place(FL.roundedPanelGeo(0.836, 0.016, 0.198, 0.004), M.greyPlastic, [0, 0.128, -0.249], [-Math.PI / 2, 0, 0], mechFrame);
    FL.registerPart('mechFrame', mechFrame, {
      category: 'cabinet', explode: new T.Vector3(0, -0.18, -0.22),
      meta: { name: '机械舱框架', english: 'MACHINERY BAY FRAME', category: 'cabinet',
        intro: '压缩机舱的承力框架，承载压缩机底板、冷凝风扇与电气盒，并提供散热气流的通道边界。',
        facts: [['作用', '承载 · 气流通道'], ['材质', '工程塑料 + 钢板'], ['散热方式', '自然对流 + 辅助风扇']] },
    });
    cab.add(mechFrame);

    // 机械舱检修盖（带散热格栅，Cycle / 特写模式自动让位）
    const mechCover = new T.Group();
    const covMat = new T.MeshStandardMaterial({
      color: 0xd8d5cc, metalness: 0.25, roughness: 0.5,
      alphaMap: FL.TX.ventAlpha, transparent: true, side: T.DoubleSide,
    });
    covMat.alphaMap.repeat.set(8, 3);
    place(FL.roundedPanelGeo(0.824, 0.286, 0.006, 0.006), covMat, [0, 0.245, -0.353], [0, Math.PI, 0], mechCover);
    FL.registerPart('mechCover', mechCover, {
      category: 'cabinet', explode: new T.Vector3(0, 0, -0.30),
      meta: { name: '机械舱检修盖', english: 'SERVICE COVER', category: 'cabinet',
        intro: '带散热格栅的检修盖板，保证压缩机舱进风；检修或教学观察时可整体移除以暴露压缩机。',
        facts: [['作用', '进风 · 检修'], ['开孔率', '约 55%'], ['观察方式', 'Cycle / 特写模式自动隐藏']] },
    });
    cab.add(mechCover);

    /* ---------------- 6. 底座 / 踢脚 ---------------- */
    const base = new T.Group();
    place(FL.roundedBoxGeo(0.88, 0.06, 0.63, 0.006, 2), M.darkTrim, [0, 0.03, -0.025], null, base);
    place(FL.roundedPanelGeo(0.86, 0.05, 0.008, 0.004), M.greyPlastic, [0, 0.03, 0.294], null, base);
    [[-0.34, -0.30], [0.34, -0.30], [-0.34, 0.20], [0.34, 0.20]].forEach(function (p) {
      place(new T.CylinderGeometry(0.016, 0.018, 0.02, 12), M.darkTrim, [p[0], 0.01, p[1]], null, base);
    });
    FL.registerPart('base', base, {
      category: 'cabinet', explode: new T.Vector3(0, -0.34, 0),
      meta: { name: '底座与踢脚', english: 'BASE & PLINTH', category: 'cabinet',
        intro: '深灰底座抬高箱体，避免底部直接受潮；前面踢脚板遮蔽底部结构，四角可调底脚用于找平。',
        facts: [['作用', '找平 · 防潮 · 遮蔽'], ['结构', '底座 + 踢脚板 + 可调底脚']] },
    });
    cab.add(base);

    return cab;
  };
})(window.FL);
