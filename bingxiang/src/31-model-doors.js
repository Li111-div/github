/* =========================================================================
 * 31-model-doors.js — 门体（外板 / 保温 / 内衬 / 封条 / 铰链 / 把手 / 门架 / 屏）
 * 铰链 Pivot 位于真实门轴，绕 Y 轴旋转，最大 138°。
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;
  const M = FL.MAT;
  const D = FL.DIM;
  const place = FL.place;

  const MAX_OPEN = (138 * Math.PI) / 180;

  FL.buildDoors = function (root) {
    const doors = { left: null, right: null, hinges: [], gaskets: [] };

    function buildDoor(side) {
      const isLeft = side === 'left';
      const sgn = isLeft ? 1 : -1;          // 门体由铰链向外延伸方向
      const pivotX = isLeft ? -0.470 : 0.470;
      const W = 0.458, H = D.doorY1 - D.doorY0, cy = (D.doorY0 + D.doorY1) / 2;

      const g = new T.Group();
      g.position.set(pivotX, 0, 0.331);
      root.add(g);

      const cx = sgn * (W / 2 + 0.006);     // 门体中心（局部）

      /* ---- 外门板：象牙白珠光钣金 ---- */
      place(FL.roundedPanelGeo(W, H, 0.016, 0.014, 4), M.ivoryDoor, [cx, cy, 0.021], null, g);
      /* ---- 保温层 ---- */
      place(FL.roundedBoxGeo(W - 0.006, H - 0.006, 0.034, 0.006, 2), M.foam, [cx, cy, -0.004], null, g);
      /* ---- 内衬 ---- */
      place(FL.roundedPanelGeo(W - 0.008, H - 0.008, 0.008, 0.012, 3), M.liner, [cx, cy, -0.025], null, g);
      /* ---- 门封条 ---- */
      const gk = new T.Group();
      place(FL.roundedRingGeo(W - 0.010, H - 0.012, 0.016, 0.014, 0.016), M.gasket, [cx, cy, -0.033], null, gk);
      FL.registerPart(isLeft ? 'gasketLeft' : 'gasketRight', gk, {
        category: 'door', explode: new T.Vector3(0, 0, 0.10),
        meta: { name: '门封条', english: 'DOOR GASKET', category: 'door',
          intro: '磁吸式软质门封，靠磁条吸附在箱体前面板上形成气密；密封不良会显著提高漏热与能耗。',
          facts: [['材料', 'PVC 软质 + 磁条'], ['作用', '气密 · 隔热 · 防凝露'], ['教学要点', '门封老化 → 漏热增加 → 负荷上升']] },
      });
      g.add(gk);
      doors.gaskets.push(gk);

      /* ---- 把手（内缘竖向金属拉手） ---- */
      const hd = new T.Group();
      const hx = sgn * (W - 0.058);
      place(FL.roundedBoxGeo(0.026, 0.62, 0.026, 0.010, 3), M.brushedSteel, [hx, 1.20, 0.046], null, hd);
      [0.94, 1.46].forEach(function (yy) {
        place(new T.CylinderGeometry(0.011, 0.011, 0.036, 16), M.brushedSteel, [hx, yy, 0.030], [Math.PI / 2, 0, 0], hd);
      });
      FL.registerPart(isLeft ? 'handleLeft' : 'handleRight', hd, {
        category: 'door', explode: new T.Vector3(0, 0, 0.16),
        meta: { name: '竖向金属把手', english: 'BAR HANDLE', category: 'door',
          intro: '拉丝不锈钢竖向拉手，位于门体非铰链侧，提供开门的力臂；表面拉丝纹理与门板珠光漆面形成材质对比。',
          facts: [['材料', '拉丝不锈钢'], ['位置', '非铰链侧（内缘）'], ['作用', '开门力臂 · 视觉锚点']] },
      });
      g.add(hd);

      /* ---- 门上置物架 ×3（加深至 86 mm，可容纳真实食材） ---- */
      const bins = new T.Group();
      const bw = W - 0.062, bh = 0.112, bd = 0.086;
      const BZ = -0.070;                       // 门架中心（门体局部 z）
      const BIN_Y = [0.44, 0.89, 1.34];
      BIN_Y.forEach(function (by) {
        const b = new T.Group();
        const fz = BZ - bd / 2 + 0.0045;       // 前挡板所在 z
        // 底板
        place(FL.roundedBoxGeo(bw, 0.009, bd, 0.003, 2), M.smokePlastic, [cx, by + 0.0045, BZ], null, b);
        // 前挡板
        place(FL.roundedPanelGeo(bw, bh, 0.009, 0.006, 2), M.smokePlastic, [cx, by + bh / 2, fz], null, b);
        // 左右侧板
        place(FL.roundedPanelGeo(bd, bh, 0.008, 0.005, 2), M.smokePlastic, [cx - bw / 2, by + bh / 2, BZ], [0, Math.PI / 2, 0], b);
        place(FL.roundedPanelGeo(bd, bh, 0.008, 0.005, 2), M.smokePlastic, [cx + bw / 2, by + bh / 2, BZ], [0, Math.PI / 2, 0], b);
        // 前挡板顶部瓶挡横杆（位于食材之前，不干涉）
        place(FL.roundedBoxGeo(bw - 0.014, 0.009, 0.009, 0.004, 2), M.brushedSteel,
          [cx, by + bh + 0.010, fz - 0.006], null, b);
        [cx - bw / 2 + 0.024, cx + bw / 2 - 0.024].forEach(function (px) {
          place(new T.CylinderGeometry(0.005, 0.005, 0.024, 10), M.brushedSteel,
            [px, by + bh + 0.002, fz - 0.006], null, b);
        });
        // 底部加强筋
        for (let k = 0; k < 3; k++) {
          place(FL.roundedBoxGeo(bw - 0.020, 0.007, 0.009, 0.002, 1), M.whitePlastic,
            [cx, by - 0.0035, BZ - bd / 2 + 0.020 + k * 0.028], null, b);
        }
        // 前挡板顶部装饰条
        place(FL.roundedBoxGeo(bw, 0.004, 0.010, 0.0015, 1), M.aluminium, [cx, by + bh + 0.001, fz], null, b);
        bins.add(b);
      });
      FL.registerPart(isLeft ? 'doorBinLeft' : 'doorBinRight', bins, {
        category: 'door', explode: new T.Vector3(0, 0, 0.12),
        meta: { name: '门上置物架', english: 'DOOR BIN', category: 'door',
          intro: '门体内衬上的三层置物架，利用门体厚度空间扩充储物；与内腔搁板保持几何净空，开门时随门体一同旋出。',
          facts: [['数量', '每扇门 3 层'], ['材料', '半透明工程塑料'], ['净空', '与搁板前沿保留 20 mm'], ['关联', '门体旋转运动学']] },
      });
      g.add(bins);

      /* ---- 门体数字温控显示（冷藏门） ---- */
      if (!isLeft) {
        const dp = new T.Group();
        const mat = new T.MeshPhysicalMaterial({
          color: 0x0b1014, metalness: 0.2, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05,
          emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0.9,
          map: null, envMapIntensity: 1.1,
        });
        mat.map = FL.TX.display(4, -18, true);
        mat.emissiveMap = mat.map;
        FL.displayMat = mat;
        place(FL.roundedPanelGeo(0.224, 0.112, 0.008, 0.010, 3), mat, [cx, 1.735, 0.030], null, dp);
        FL.registerPart('displayPanel', dp, {
          category: 'door', explode: new T.Vector3(0, 0.10, 0.14),
          meta: { name: '双区数字温控屏', english: 'DUAL-ZONE DISPLAY', category: 'door',
            intro: '冷藏门上的触控显示区，实时显示冷冻室与冷藏室温度，并指示变频压缩机与多路送风状态。',
            facts: [['显示', '冷冻 / 冷藏双区温度'], ['指示', 'INVERTER · MULTI AIR'], ['数据来源', '教学仿真模型']] },
        });
        g.add(dp);
      }

      /* ---- 门体整体 ---- */
      const rec = FL.registerPart(isLeft ? 'doorLeft' : 'doorRight', g, {
        category: 'door', explode: new T.Vector3(isLeft ? -0.06 : 0.06, 0, 0.62),
        meta: {
          name: isLeft ? '冷冻室门体' : '冷藏室门体',
          english: isLeft ? 'FREEZER DOOR' : 'FRIDGE DOOR',
          category: 'door',
          intro: '门体为“外门板 + 发泡保温层 + 内衬”三明治结构，铰链轴位于门体外缘，最大开启角 138°，开启时随门旋转的内衬与门架不得与箱内结构干涉。',
          facts: [
            ['结构', '珠光钣金 + 聚氨酯发泡 + ABS 内衬'],
            ['铰链', '上下双铰链 · 外缘轴心'],
            ['最大开启', '138°'],
            ['厚度', '58 mm'],
          ],
        },
      });
      rec.pivot = new T.Vector3(pivotX, 0, 0.331);
      rec.isLeft = isLeft;
      rec.sgn = sgn;
      rec.angle = 0;
      rec.target = 0;
      return rec;
    }

    doors.left = buildDoor('left');
    doors.right = buildDoor('right');

    /* ---- 铰链（固定在箱体上，不随门旋转） ---- */
    function hinge(side, y, id, name, ex) {
      const isLeft = side === 'left';
      const hx = isLeft ? -0.470 : 0.470;
      const sgn = isLeft ? 1 : -1;
      const g = new T.Group();
      place(FL.roundedBoxGeo(0.052, 0.062, 0.030, 0.006, 2), M.steel, [hx - sgn * 0.012, y, 0.348], null, g);
      place(new T.CylinderGeometry(0.0085, 0.0085, 0.070, 14), M.steel, [hx - sgn * 0.014, y, 0.331], [0, 0, 0], g);
      place(new T.CylinderGeometry(0.014, 0.014, 0.008, 16), M.brushedSteel, [hx - sgn * 0.014, y + 0.030, 0.331], null, g);
      FL.registerPart(id, g, {
        category: 'door', explode: ex,
        meta: { name: name, english: 'HINGE', category: 'door',
          intro: '承重铰链，销轴即门体旋转轴。上下双铰链共同承担门体重量，并保证门体在 138° 范围内平稳旋转。',
          facts: [['作用', '门体旋转轴 · 承重'], ['数量', '上下各 1'], ['旋转轴', '门体外缘竖轴']] },
      });
      root.add(g);
      doors.hinges.push(g);
      return g;
    }
    hinge('left', 1.795, 'hingeLeftUpper', '冷冻门·上铰链', new T.Vector3(-0.06, 0.16, 0));
    hinge('left', 0.165, 'hingeLeftLower', '冷冻门·下铰链', new T.Vector3(-0.06, -0.14, 0));
    hinge('right', 1.795, 'hingeRightUpper', '冷藏门·上铰链', new T.Vector3(0.06, 0.16, 0));
    hinge('right', 0.165, 'hingeRightLower', '冷藏门·下铰链', new T.Vector3(0.06, -0.14, 0));

    doors.MAX_OPEN = MAX_OPEN;
    return doors;
  };
})(window.FL);
