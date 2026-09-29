/* =========================================================================
 * 32-model-interior.js — 内部储物结构
 *   搁板（钢化玻璃 + 前后包边 + 防溢挡边 + 前沿集成 LED + 侧端盖）
 *   抽屉（透明前板 + 一体拉手 + 内部分隔 + 三节导轨滑块）
 *   内胆竖向调节槽（搁板可换位）
 *   风道盖板 / 分层送风口 / 回风格栅 / 顶部与搁板照明
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;
  const M = FL.MAT;
  const D = FL.DIM;
  const place = FL.place;

  const SHELF_Y = D.shelfY;
  const DRAWER_Y = D.drawerY;

  FL.buildInterior = function (root) {
    const out = { shelves: [], drawers: [], lights: [], ductCovers: [], ledMats: [] };

    const comps = [
      { side: 'left', x0: D.freeX0, x1: D.freeX1, name: '冷冻室' },
      { side: 'right', x0: D.fridX0, x1: D.fridX1, name: '冷藏室' },
    ];

    const supportGeo = FL.roundedBoxGeo(0.022, 0.010, 0.030, 0.003, 2);
    const notchGeo = FL.roundedBoxGeo(0.010, 0.008, 0.026, 0.002, 1);
    const supportInstances = [];
    const notchInstances = [];
    const railGeo = FL.roundedBoxGeo(0.010, 0.026, 0.290, 0.003, 2);
    const railInstances = [];
    const blockGeo = FL.roundedBoxGeo(0.010, 0.012, 0.026, 0.003, 1);
    const tmp = new T.Object3D();

    comps.forEach(function (c) {
      const w = c.x1 - c.x0;
      const cx = (c.x0 + c.x1) / 2;
      // 内胆内表面（留 2 mm 容差）
      const innerL = c.x0 + 0.006 + 0.002;
      const innerR = c.x1 - 0.006 - 0.002;
      const shelfW = w - 0.032;          // 让开两侧竖向调节槽
      const shelfD = D.shelfZFront - D.shelfZBack;
      const shelfZ = (D.shelfZFront + D.shelfZBack) / 2;

      /* ============ 内胆竖向调节槽（搁板可换位） ============ */
      [-1, 1].forEach(function (s) {
        const wallX = s < 0 ? innerL : innerR;
        const railX = wallX + s * 0.0025;
        [0.052, -0.062].forEach(function (rz) {
          const rail = new T.Mesh(FL.roundedBoxGeo(0.005, 1.60, 0.016, 0.002, 2), M.whitePlastic);
          rail.position.set(railX, 0.99, shelfZ + rz);
          rail.castShadow = true;
          root.add(rail);
          for (let y = 0.22; y <= 1.76; y += 0.06) {
            notchInstances.push({ x: railX + s * 0.0035, y: y, z: shelfZ + rz });
          }
        });
      });

      /* ============ 玻璃搁板 ============ */
      SHELF_Y.forEach(function (y, i) {
        const id = 'shelf' + (c.side === 'left' ? 'L' : 'R') + (i + 1);
        const g = new T.Group();

        // 钢化玻璃本体
        place(FL.roundedPanelGeo(shelfW, shelfD, 0.007, 0.004, 2), M.glass, [cx, y, shelfZ], [-Math.PI / 2, 0, 0], g);
        // 前沿金属包边（U 型）
        place(FL.roundedPanelGeo(shelfW, 0.016, 0.015, 0.003, 2), M.aluminium, [cx, y - 0.004, D.shelfZFront - 0.005], null, g);
        // 前沿防溢挡边（微上翘）
        place(FL.roundedPanelGeo(shelfW, 0.011, 0.006, 0.002, 2), M.aluminium, [cx, y + 0.010, D.shelfZFront - 0.010], null, g);
        // 后沿包边
        place(FL.roundedPanelGeo(shelfW, 0.012, 0.009, 0.002, 2), M.aluminium, [cx, y + 0.002, D.shelfZBack + 0.004], null, g);
        // 左右端盖
        [-1, 1].forEach(function (s) {
          place(FL.roundedBoxGeo(0.009, 0.016, shelfD - 0.004, 0.003, 2), M.whitePlastic,
            [cx + s * (shelfW / 2 + 0.004), y, shelfZ], null, g);
        });
        // 前沿集成 LED 灯带
        const ledMat = new T.MeshStandardMaterial({
          color: 0xe8e4d8, emissive: 0xfff2da, emissiveIntensity: 0, roughness: 0.5, metalness: 0.0,
        });
        out.ledMats.push(ledMat);
        const led = new T.Mesh(FL.roundedBoxGeo(shelfW - 0.030, 0.0045, 0.0055, 0.0015, 1), ledMat);
        led.position.set(cx, y - 0.011, D.shelfZFront - 0.009);
        g.add(led);

        FL.registerPart(id, g, {
          category: 'interior', explode: new T.Vector3(0, 0, 0.30),
          meta: { name: c.name + '钢化玻璃搁板', english: 'TEMPERED GLASS SHELF', category: 'interior',
            intro: '钢化玻璃搁板：四周磨边 + 前后金属包边，前沿带微上翘防溢挡边防止液体流下；前沿下缘集成 LED 灯带，为下层食材提供照明。两侧端盖插入内胆竖向调节槽，可分层换位。',
            facts: [['材料', '钢化玻璃 + 铝合金包边'],
              ['厚度', '约 4–6 mm（视觉 7 mm）'],
              ['细节', '前沿防溢挡边 · 前沿 LED · 左右端盖'],
              ['承载', '可分层换位（内胆竖向调节槽）']] },
        });
        root.add(g);
        out.shelves.push(g);

        // 承托卡槽（每层 4 个）
        const sy = y - 0.012;
        [[-1, 0.13], [-1, -0.09], [1, 0.13], [1, -0.09]].forEach(function (p) {
          supportInstances.push({ x: cx + p[0] * (shelfW / 2 + 0.007), y: sy, z: shelfZ + p[1] });
        });
      });

      /* ============ 抽屉 ×2 ============ */
      const dw = w - 0.036;
      DRAWER_Y.forEach(function (y, i) {
        const id = 'drawer' + (c.side === 'left' ? 'L' : 'R') + (i + 1);
        const g = new T.Group();
        const dh = 0.278;
        const frontZ = 0.190;

        // 半透明前板
        place(FL.roundedPanelGeo(dw, dh, 0.012, 0.010, 3), M.smokePlastic, [cx, y + dh / 2, frontZ], null, g);
        // 前板顶部一体式拉手（横杆 + 立柱）
        place(FL.roundedBoxGeo(dw - 0.046, 0.011, 0.011, 0.004, 2), M.aluminium, [cx, y + dh - 0.020, frontZ + 0.013], null, g);
        [cx - dw / 2 + 0.040, cx + dw / 2 - 0.040].forEach(function (px) {
          place(new T.CylinderGeometry(0.006, 0.006, 0.022, 10), M.aluminium, [px, y + dh - 0.032, frontZ + 0.010], null, g);
        });
        // 前板金属装饰条
        place(FL.roundedBoxGeo(dw - 0.020, 0.007, 0.013, 0.002, 2), M.aluminium, [cx, y + 0.014, frontZ + 0.006], null, g);

        // 盒体
        const body = FL.trayGeo(dw - 0.014, dh - 0.024, 0.300, 0.005, 0.004);
        body.position.set(cx, y + (dh - 0.024) / 2 + 0.006, 0.040);
        g.add(body);
        // 抽屉侧滑轨 + 可见滑块
        [-1, 1].forEach(function (s) {
          place(FL.roundedBoxGeo(0.008, 0.030, 0.290, 0.002, 2), M.whitePlastic,
            [cx + s * (dw / 2 - 0.002), y + 0.062, 0.040], null, g);
          for (let k = 0; k < 3; k++) {
            place(blockGeo, M.greyPlastic, [cx + s * (dw / 2 + 0.003), y + 0.062, 0.140 - k * 0.100], null, g);
          }
        });

        FL.registerPart(id, g, {
          category: 'interior', explode: new T.Vector3(0, 0, 0.36),
          meta: { name: c.name + '抽屉', english: 'CRISPER DRAWER', category: 'interior',
            intro: '透明前板抽屉，沿两侧三节滚珠导轨水平抽出 300 mm。前板上沿一体式铝合金拉手、盒内可拆分隔板、两侧可见滑块；拉出前必须先开启对应门体，否则会与门架干涉。',
            facts: [['行程', '300 mm'], ['导轨', '两侧三节滚珠导轨 + 可见滑块'],
              ['细节', '一体拉手 · 内部分隔板 · 前板装饰条'], ['联锁', '先开门 → 后抽拉']] },
        });
        root.add(g);
        out.drawers.push({ id: id, group: g, side: c.side, index: i, base: g.position.z, travel: D.drawerTravel });

        // 柜侧导轨（固定）
        [-1, 1].forEach(function (s) {
          railInstances.push({ x: cx + s * (dw / 2 + 0.004), y: y + 0.062, z: 0.040 });
        });
      });

      /* ============ 顶部照明 ============ */
      const lg = new T.Group();
      place(FL.roundedBoxGeo(w - 0.06, 0.012, 0.030, 0.004, 2), M.interiorLight, [cx, D.cavY1 - 0.020, 0.02], null, lg);
      place(FL.roundedBoxGeo(w - 0.10, 0.006, 0.026, 0.002, 2), M.whitePlastic, [cx, D.cavY1 - 0.028, 0.02], null, lg);
      FL.registerPart(c.side === 'left' ? 'lightLeft' : 'lightRight', lg, {
        category: 'interior', explode: new T.Vector3(0, 0.16, 0.06),
        meta: { name: '顶部 LED 照明', english: 'TOP LED LIGHT', category: 'interior',
          intro: '顶部 LED 灯带，开门时自动点亮；照明功率计入整机输入功率，长时间开门会额外增加箱内热负荷。与搁板前沿灯带共同构成箱内无影照明。',
          facts: [['功率', '约 2 × 2 W'], ['控制', '门开关联动'],
            ['组合', '顶部灯带 + 搁板前沿灯带'], ['影响', '照明热负荷计入热平衡']] },
      });
      root.add(lg);
      out.lights.push(lg);
    });

    /* ---------------- 通用 InstancedMesh 零件 ---------------- */
    function buildInstanced(geo, mat, list, id, name, en, intro, facts, explode) {
      const mesh = new T.InstancedMesh(geo, mat, list.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      list.forEach(function (p, i) {
        tmp.position.set(p.x, p.y, p.z);
        tmp.rotation.set(0, p.ry || 0, 0);
        tmp.updateMatrix();
        mesh.setMatrixAt(i, tmp.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      const grp = new T.Group();
      grp.add(mesh);
      FL.registerPart(id, grp, {
        category: 'interior', explode: explode,
        meta: { name: name, english: en, category: 'interior', intro: intro, facts: facts },
      });
      root.add(grp);
      return grp;
    }

    buildInstanced(supportGeo, M.whitePlastic, supportInstances, 'shelfSupports',
      '搁板承托卡槽', 'SHELF SUPPORTS',
      '内胆两侧的搁板承托卡槽，与竖向调节槽配合，搁板可分层换位以适配不同储物高度。',
      [['数量', supportInstances.length + ' 个'], ['材料', 'ABS 一体成型'], ['作用', '承托 · 分层调节']],
      new T.Vector3(0, 0, 0.18));

    buildInstanced(notchGeo, M.linerDark, notchInstances, 'shelfNotches',
      '搁板高度调节槽', 'SHELF ADJUST RAILS',
      '内胆两侧的竖向调节槽，每 60 mm 一个卡位，共 26 档；搁板端盖卡入槽内即可换位，不需要任何工具。',
      [['档距', '60 mm'], ['档数', '每侧 26 档'], ['作用', '搁板高度分档调节']],
      new T.Vector3(0, 0, 0.12));

    buildInstanced(railGeo, M.whitePlastic, railInstances, 'drawerRails',
      '抽屉固定导轨', 'DRAWER RAILS',
      '固定在内胆侧壁的三节滚珠导轨，为抽屉提供低阻力直线运动副，并限制最大行程与防脱出。',
      [['数量', railInstances.length + ' 条'], ['类型', '三节滚珠导轨'], ['作用', '直线运动副 · 限位']],
      new T.Vector3(0, 0, 0.20));

    /* ---------------- 风道盖板 ---------------- */
    const grilleMat = new T.MeshStandardMaterial({
      color: 0xd0cdc4, metalness: 0.05, roughness: 0.62,
      alphaMap: FL.TX.grilleAlpha, transparent: true, side: T.DoubleSide,
    });
    grilleMat.alphaMap.repeat.set(1, 2);

    // 冷冻室：蒸发器舱出风口 + 竖向风道 + 分层送风口
    const dl = new T.Group();
    const ex = (D.evapX0 + D.evapX1) / 2, ey = (D.evapY0 + D.evapY1) / 2;
    place(FL.roundedPanelGeo(0.31, 0.36, 0.008, 0.012, 2), grilleMat, [ex, ey, D.cavZBack + 0.006], null, dl);
    for (let k = 0; k < 7; k++) {
      place(FL.roundedBoxGeo(0.29, 0.006, 0.016, 0.002, 1), M.greyPlastic,
        [ex, ey - 0.140 + k * 0.047, D.cavZBack + 0.014], [0.42, 0, 0], dl);
    }
    const dlm = new T.MeshStandardMaterial({ color: 0xc6c3ba, metalness: 0.05, roughness: 0.6, alphaMap: FL.TX.grilleAlpha.clone(), transparent: true, side: T.DoubleSide });
    dlm.alphaMap.needsUpdate = true;
    dlm.alphaMap.repeat.set(1, 3);
    place(FL.roundedPanelGeo(0.30, 1.06, 0.030, 0.010, 2), dlm, [-0.252, 1.29, D.cavZBack + 0.017], null, dl);
    SHELF_Y.forEach(function (y) {
      place(FL.roundedBoxGeo(0.022, 0.100, 0.034, 0.006, 2), M.whitePlastic, [-0.395, y + 0.03, D.cavZBack + 0.020], null, dl);
      for (let k = 0; k < 5; k++) {
        place(FL.roundedBoxGeo(0.020, 0.005, 0.028, 0.001, 1), M.greyPlastic,
          [-0.393, y + 0.006 + k * 0.017, D.cavZBack + 0.020], null, dl);
      }
    });
    FL.registerPart('ductLeft', dl, {
      category: 'interior', explode: new T.Vector3(0, 0, 0.24),
      meta: { name: '冷冻室送风道盖板', english: 'AIR DUCT COVER (FREEZER)', category: 'interior',
        intro: '覆盖背部风道的格栅盖板。冷风由蒸发器舱经风道向上输送，再通过对应每层搁板的分层送风口沿搁板横向送出，形成「下回风、上送风」的循环。',
        facts: [['功能', '送风道 · 分层出风'], ['结构', '竖向风道 + 层叠导流叶片 + 分层送风口'],
          ['观察方式', 'Cycle 模式自动半透明']] },
    });
    root.add(dl);
    out.ductCovers.push(dl);

    // 冷藏室：顶部风道出口
    const dr = new T.Group();
    place(FL.roundedPanelGeo(0.28, 0.34, 0.008, 0.012, 2), grilleMat, [0.231, D.cavY1 - 0.024, 0.03], [-Math.PI / 2, 0, 0], dr);
    for (let k = 0; k < 6; k++) {
      place(FL.roundedBoxGeo(0.26, 0.006, 0.014, 0.002, 1), M.greyPlastic,
        [0.231, D.cavY1 - 0.036, -0.120 + k * 0.048], [-Math.PI / 2, 0, 0], dr);
    }
    FL.registerPart('ductRight', dr, {
      category: 'interior', explode: new T.Vector3(0, 0.20, 0.10),
      meta: { name: '冷藏室顶部风道出口', english: 'AIR OUTLET (FRIDGE)', category: 'interior',
        intro: '冷藏室的顶部送风口。单蒸发器系统通过风门把部分冷量从冷冻室引到冷藏室顶部，冷空气下沉形成自然对流 + 强制送风。',
        facts: [['位置', '冷藏室顶部'], ['冷源', '冷冻室蒸发器经风门分配'],
          ['气流', '顶部送风 · 底部回风'], ['细节', '层叠导流叶片']] },
    });
    root.add(dr);
    out.ductCovers.push(dr);

    // 冷冻室底部回风格栅
    const rr = new T.Group();
    place(FL.roundedPanelGeo(0.30, 0.072, 0.008, 0.010, 2), grilleMat, [-0.231, D.cavY0 + 0.046, D.cavZBack + 0.006], null, rr);
    for (let k = 0; k < 4; k++) {
      place(FL.roundedBoxGeo(0.29, 0.005, 0.014, 0.002, 1), M.greyPlastic,
        [-0.231, D.cavY0 + 0.026 + k * 0.016, D.cavZBack + 0.012], [0.35, 0, 0], rr);
    }
    FL.registerPart('returnGrille', rr, {
      category: 'interior', explode: new T.Vector3(0, 0, 0.18),
      meta: { name: '回风格栅', english: 'RETURN AIR GRILLE', category: 'interior',
        intro: '箱内空气的返回口。换热后的空气由底部格栅回到蒸发器舱重新被冷却，完成一次箱内循环；格栅带防护叶片，避免食材碎屑直接进入风道。',
        facts: [['功能', '回风入口'], ['位置', '冷冻室底部'],
          ['细节', '防护叶片'], ['配合', '与送风道构成完整回路']] },
    });
    root.add(rr);
    out.ductCovers.push(rr);

    return out;
  };
})(window.FL);
