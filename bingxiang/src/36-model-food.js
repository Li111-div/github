/* =========================================================================
 * 36-model-food.js — 食材系统
 *   · 全程序化建模的冷藏 / 冷冻 / 门架食材（60+ 件）
 *   · 开关控制显示，并同步参与热工模型（食材热惯性 + 显热负荷）
 *   · 食材挂在真实承托物上：搁板食材挂 root，抽屉食材挂抽屉组，门架食材挂门组
 *     → 抽拉抽屉 / 开门时食材跟随运动，不穿模
 *   · 摆放由 row() 自动居中排布，尺寸受 LIM 约束（见 food-bounds-test.js 校验）
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;
  const D = FL.DIM;
  const place = FL.place;

  /* ------------------------- 食材材质 ------------------------- */
  const F = (FL.FOODMAT = {});
  const std = (o) => new T.MeshStandardMaterial(o);
  const phys = (o) => new T.MeshPhysicalMaterial(o);

  F.cartonWhite = std({ color: 0xf2f0ea, metalness: 0.0, roughness: 0.62, envMapIntensity: 0.32 });
  F.cartonBlue = std({ color: 0x2b6ea8, metalness: 0.0, roughness: 0.55, envMapIntensity: 0.34 });
  F.cartonRed = std({ color: 0xb03a2e, metalness: 0.0, roughness: 0.55, envMapIntensity: 0.7 });
  F.cartonGreen = std({ color: 0x3f7d4e, metalness: 0.0, roughness: 0.55, envMapIntensity: 0.7 });
  F.cartonCream = std({ color: 0xe8d9b0, metalness: 0.0, roughness: 0.6, envMapIntensity: 0.7 });
  F.cardboard = std({ color: 0xc9a878, metalness: 0.0, roughness: 0.78, envMapIntensity: 0.6 });

  F.canAlu = std({ color: 0xc6cacd, metalness: 0.85, roughness: 0.28, envMapIntensity: 1.0 });
  F.canLabel = std({ color: 0x1f5fa8, metalness: 0.05, roughness: 0.5, envMapIntensity: 0.7 });

  F.petGlass = phys({
    color: 0xd7e6ea, metalness: 0.0, roughness: 0.09, transparent: true, opacity: 0.42,
    clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 1.3, depthWrite: false,
  });
  F.petAmber = phys({
    color: 0xd9a24e, metalness: 0.0, roughness: 0.10, transparent: true, opacity: 0.55,
    clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 1.3, depthWrite: false,
  });
  F.cap = std({ color: 0x2a2e33, metalness: 0.25, roughness: 0.45 });

  F.eggShell = std({ color: 0xeadfc9, metalness: 0.0, roughness: 0.55, envMapIntensity: 0.7 });

  F.apple = std({ color: 0xb8282a, metalness: 0.0, roughness: 0.34, envMapIntensity: 0.38 });
  F.appleGreen = std({ color: 0x7fae3c, metalness: 0.0, roughness: 0.36, envMapIntensity: 0.75 });
  F.orange = std({ color: 0xe07a1c, metalness: 0.0, roughness: 0.62, envMapIntensity: 0.34 });
  F.lemon = std({ color: 0xe8c832, metalness: 0.0, roughness: 0.58, envMapIntensity: 0.65 });
  F.stem = std({ color: 0x5a4a2c, metalness: 0.0, roughness: 0.8 });

  F.broccoli = std({ color: 0x3f7a3a, metalness: 0.0, roughness: 0.72, envMapIntensity: 0.6 });
  F.carrot = std({ color: 0xdb7a22, metalness: 0.0, roughness: 0.6, envMapIntensity: 0.65 });
  F.leaf = std({ color: 0x5f9c47, metalness: 0.0, roughness: 0.68, envMapIntensity: 0.6 });
  F.tomato = std({ color: 0xc2352c, metalness: 0.0, roughness: 0.36, envMapIntensity: 0.75 });

  F.tubWhite = std({ color: 0xeeece6, metalness: 0.0, roughness: 0.5, envMapIntensity: 0.7 });
  F.tubPink = std({ color: 0xd98aa0, metalness: 0.0, roughness: 0.5, envMapIntensity: 0.7 });
  F.tubChoc = std({ color: 0x5c3a26, metalness: 0.0, roughness: 0.5, envMapIntensity: 0.7 });
  F.iceLid = std({ color: 0xd8e4ea, metalness: 0.0, roughness: 0.35, envMapIntensity: 0.8 });

  F.meat = std({ color: 0xc06a72, metalness: 0.0, roughness: 0.42, envMapIntensity: 0.7 });
  F.frozenPouch = phys({
    color: 0xdfe9ee, metalness: 0.0, roughness: 0.30, transparent: true, opacity: 0.72,
    clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.0,
  });
  F.frozenInside = std({ color: 0x9fb8c6, metalness: 0.0, roughness: 0.55 });

  /* ------------------------- 复用的基础几何 ------------------------- */
  const G = {
    sphere: new T.SphereGeometry(1, 16, 12),
    cyl: new T.CylinderGeometry(1, 1, 1, 16),
  };
  function mesh(geo, mat, pos, rot, scl, parent) {
    const m = new T.Mesh(geo, mat);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (scl) m.scale.set(scl[0], scl[1], scl[2]);
    m.castShadow = true;
    if (parent) parent.add(m);
    return m;
  }

  /* ============================ 食材构建器 ============================ */
  /* 约定：返回的 Group 底面位于 y = 0，水平中心位于 (0, 0) */

  /** 1L 屋顶型牛奶盒 */
  function milkCarton(mat, h) {
    const g = new T.Group();
    const w = 0.070, d = 0.070;
    const bodyH = (h || 0.196) - 0.042;
    place(FL.roundedBoxGeo(w, bodyH, d, 0.006, 2), mat, [0, bodyH / 2, 0], null, g);
    // 四棱锥台屋顶：用 thetaStart 让四个面正对轴向，避免旋转造成包围盒膨胀
    const roof = new T.Mesh(new T.CylinderGeometry(0.0001, 0.0495, 0.042, 4, 1, false, Math.PI / 4), mat);
    roof.position.y = bodyH + 0.021;
    roof.castShadow = true;
    g.add(roof);
    place(new T.CylinderGeometry(0.011, 0.011, 0.013, 12), F.cap, [0.016, bodyH + 0.030, 0], null, g);
    place(FL.roundedBoxGeo(w + 0.001, bodyH * 0.46, d + 0.001, 0.004, 1), F.cartonBlue, [0, bodyH * 0.62, 0], null, g);
    return g;
  }

  /** 易拉罐 */
  function can(mat) {
    const g = new T.Group();
    const r = 0.0328, h = 0.122;
    mesh(G.cyl, F.canAlu, [0, h / 2, 0], null, [r, h, r], g);
    place(new T.CylinderGeometry(r * 1.02, r * 0.90, 0.012, 16), F.canAlu, [0, h - 0.006, 0], null, g);
    place(new T.CylinderGeometry(r * 0.90, r * 1.02, 0.012, 16), F.canAlu, [0, 0.006, 0], null, g);
    place(new T.CylinderGeometry(r + 0.0006, r + 0.0006, h * 0.62, 16, 1, true), mat || F.canLabel, [0, h / 2, 0], null, g);
    return g;
  }

  /** 塑料饮料瓶 */
  function bottle(mat, h, r) {
    const g = new T.Group();
    r = r || 0.031;
    h = h || 0.198;
    place(new T.CylinderGeometry(r, r * 0.96, h * 0.70, 16), mat || F.petGlass, [0, h * 0.35, 0], null, g);
    place(new T.CylinderGeometry(r * 0.55, r, h * 0.14, 16), mat || F.petGlass, [0, h * 0.77, 0], null, g);
    place(new T.CylinderGeometry(r * 0.46, r * 0.46, h * 0.10, 14), mat || F.petGlass, [0, h * 0.89, 0], null, g);
    place(new T.CylinderGeometry(r * 0.50, r * 0.50, 0.016, 14), F.cap, [0, h * 0.955, 0], null, g);
    place(new T.CylinderGeometry(r + 0.0005, r + 0.0005, h * 0.30, 16, 1, true), F.cartonRed, [0, h * 0.30, 0], null, g);
    return g;
  }

  /** 鸡蛋 */
  function egg(scl) {
    const g = new T.Group();
    scl = scl || 1;
    mesh(G.sphere, F.eggShell, [0, 0.031 * scl, 0], null, [0.0205 * scl, 0.031 * scl, 0.0205 * scl], g);
    return g;
  }

  /** 苹果 / 橙子 / 柠檬 */
  function fruit(mat, r, squash) {
    const g = new T.Group();
    mesh(G.sphere, mat, [0, r * (squash || 0.94), 0], null, [r, r * (squash || 0.94), r], g);
    if (!squash) place(new T.CylinderGeometry(0.0022, 0.0022, 0.020, 6), F.stem, [0, r * 1.86, 0], null, g);
    return g;
  }

  /** 西兰花 */
  function broccoli() {
    const g = new T.Group();
    place(new T.CylinderGeometry(0.017, 0.021, 0.048, 10), F.leaf, [0, 0.024, 0], null, g);
    const rnd = FL.rng(7);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.2832;
      const rr = i === 0 ? 0 : 0.019 + rnd() * 0.007;
      mesh(G.sphere, F.broccoli, [Math.cos(a) * rr, 0.056 + (i ? rnd() * 0.010 : 0.012), Math.sin(a) * rr],
        null, [0.023, 0.020, 0.023], g);
    }
    return g;
  }

  /** 胡萝卜（沿 X 轴摆放） */
  function carrot(len) {
    const g = new T.Group();
    len = len || 0.115;
    const m = place(new T.CylinderGeometry(0.009, 0.021, len, 12), F.carrot, [0, 0.021, 0], [0, 0, Math.PI / 2], g);
    m.position.set(0, 0.021, 0);
    for (let i = 0; i < 4; i++) {
      place(new T.CylinderGeometry(0.002, 0.003, 0.026, 6), F.leaf,
        [len / 2 + 0.012, 0.021 + (i - 1.5) * 0.005, (i % 2 ? 0.004 : -0.004)],
        [0, 0, (i - 1.5) * 0.22], g);
    }
    return g;
  }

  /** 生菜 */
  function lettuce() {
    const g = new T.Group();
    const rnd = FL.rng(13);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.2832;
      mesh(G.sphere, F.leaf, [Math.cos(a) * 0.028, 0.034 + rnd() * 0.012, Math.sin(a) * 0.028],
        null, [0.044, 0.038, 0.044], g);
    }
    mesh(G.sphere, F.leaf, [0, 0.050, 0], null, [0.042, 0.034, 0.042], g);
    return g;
  }

  /** 番茄 */
  function tomato() {
    const g = new T.Group();
    mesh(G.sphere, F.tomato, [0, 0.026, 0], null, [0.028, 0.025, 0.028], g);
    place(new T.CylinderGeometry(0.003, 0.003, 0.010, 6), F.leaf, [0, 0.052, 0], null, g);
    return g;
  }

  /** 保鲜盒（半透明盖） */
  function foodBox(w, h, d, mat) {
    const g = new T.Group();
    w = w || 0.15; h = h || 0.066; d = d || 0.108;
    place(FL.roundedBoxGeo(w, h, d, 0.008, 2), mat || F.tubWhite, [0, h / 2, 0], null, g);
    place(FL.roundedBoxGeo(w + 0.004, 0.010, d + 0.004, 0.004, 2), F.iceLid, [0, h + 0.004, 0], null, g);
    return g;
  }

  /** 酸奶杯 */
  function yogurt(mat) {
    const g = new T.Group();
    place(new T.CylinderGeometry(0.036, 0.028, 0.070, 16), mat || F.tubWhite, [0, 0.035, 0], null, g);
    place(new T.CylinderGeometry(0.038, 0.038, 0.008, 16), F.iceLid, [0, 0.074, 0], null, g);
    return g;
  }

  /** 冰淇淋桶 */
  function iceCreamTub(mat) {
    const g = new T.Group();
    place(new T.CylinderGeometry(0.052, 0.046, 0.098, 18), mat || F.tubChoc, [0, 0.049, 0], null, g);
    place(new T.CylinderGeometry(0.055, 0.055, 0.012, 18), F.iceLid, [0, 0.104, 0], null, g);
    return g;
  }

  /** 冷冻食品袋（软包装） */
  function frozenPouch(w, h, d, mat) {
    const g = new T.Group();
    w = w || 0.13; h = h || 0.052; d = d || 0.10;
    place(FL.roundedBoxGeo(w, h, d, 0.012, 3), mat || F.frozenPouch, [0, h / 2, 0], null, g);
    place(FL.roundedBoxGeo(w * 0.72, h * 0.52, d * 0.80, 0.012, 2), F.frozenInside, [0, h * 0.52, 0], null, g);
    return g;
  }

  /** 披萨盒 */
  function pizzaBox() {
    const g = new T.Group();
    place(FL.roundedBoxGeo(0.212, 0.030, 0.206, 0.006, 2), F.cardboard, [0, 0.015, 0], null, g);
    place(FL.roundedBoxGeo(0.196, 0.006, 0.190, 0.004, 2), F.cartonRed, [0, 0.032, 0], null, g);
    return g;
  }

  /** 肉类托盘 */
  function meatTray() {
    const g = new T.Group();
    place(FL.roundedBoxGeo(0.142, 0.030, 0.098, 0.008, 2), F.meat, [0, 0.015, 0], null, g);
    place(FL.roundedBoxGeo(0.150, 0.008, 0.106, 0.004, 2), F.frozenPouch, [0, 0.033, 0], null, g);
    return g;
  }

  /** 蛋架（6 枚装） */
  function eggTray() {
    const g = new T.Group();
    place(FL.roundedBoxGeo(0.150, 0.014, 0.064, 0.006, 2), F.cartonCream, [0, 0.007, 0], null, g);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const e = egg(0.86);
        e.position.set(-0.038 + i * 0.038, 0.012, -0.016 + j * 0.032);
        g.add(e);
      }
    }
    place(FL.roundedBoxGeo(0.150, 0.056, 0.004, 0.002, 1), F.cartonCream, [0, 0.028, -0.033], null, g);
    return g;
  }

  /** 调味瓶 */
  function condiment(mat) {
    const g = new T.Group();
    place(new T.CylinderGeometry(0.019, 0.021, 0.086, 14), mat || F.cartonGreen, [0, 0.043, 0], null, g);
    place(new T.CylinderGeometry(0.011, 0.014, 0.018, 12), F.cap, [0, 0.095, 0], null, g);
    return g;
  }

  /* ============================ 摆放 ============================ */
  /* 容器尺寸约束（由 DIM 推导，保证食材永远不越出容器）
   *   搁板  半宽 0.159   z ∈ [-0.128, 0.192]
   *   抽屉  半宽 0.148   z ∈ [-0.108, 0.186]
   *   门架  半宽 0.190   z 中心 -0.0655（可用深度 70 mm）
   * 所有排布由 row() 自动居中并计算总宽；越界由 food-bounds-test.js 报出。 */
  const LIM = {
    shelfHalf: 0.159, shelfZ0: -0.128, shelfZ1: 0.192,
    drawerHalf: 0.148, drawerZ0: -0.108, drawerZ1: 0.186,
    binHalf: 0.190, binZ: -0.0655,
  };
  let LVC = 0;
  const lv = () => +((LVC++ * 0.137) % 1).toFixed(3);

  FL.buildFood = function (root, model) {
    const out = { parts: [], items: [], meshCount: 0, limit: LIM };
    const ids = (FL.FOOD_IDS_ALL = []);
    const SHELF = D.shelfY;
    const FRESH = (D.fridX0 + D.fridX1) / 2;
    const FROZ = (D.freeX0 + D.freeX1) / 2;
    const DY = D.trayInnerY;
    const FS = SHELF.map((y) => y + 0.004);

    function put(parent, builder, x, y, z, ry, level) {
      const g = builder();
      g.position.set(x, y, z);
      if (ry) g.rotation.y = ry;
      g.userData.foodLevel = level === undefined ? lv() : level;
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; out.meshCount++; } });
      parent.add(g);
      out.items.push(g);
      return g;
    }

    /** 沿 x 自动排布一行并居中；返回总宽 */
    function row(parent, cx, y, z, gap, list) {
      const total = list.reduce(function (s, it) { return s + it.w; }, 0) + gap * (list.length - 1);
      let x = cx - total / 2;
      list.forEach(function (it) {
        put(parent, it.b, x + it.w / 2, y, z, it.ry || 0, it.level);
        x += it.w + gap;
      });
      return total;
    }

    const W = {
      milk: 0.072, can: 0.068, bottle: 0.064, yogurt: 0.078,
      box: (w) => w + 0.004, fruit: (r) => 2 * r + 0.002, meat: 0.152,
      tomato: 0.058, pouch: (w) => w + 0.004, ice: 0.112, pizza: 0.216,
      eggTray: 0.158, cond: 0.044, lettuce: 0.116, broccoli: 0.102, carrot: (l) => l,
    };

    /* ---------------- 冷藏室：搁板 ---------------- */
    const freshShelf = new T.Group();
    root.add(freshShelf);

    row(freshShelf, FRESH, FS[2], -0.058, 0.012, [
      { b: () => milkCarton(F.cartonBlue), w: W.milk },
      { b: () => milkCarton(F.cartonRed), w: W.milk },
    ]);
    row(freshShelf, FRESH, FS[2], 0.118, 0.010, [
      { b: () => foodBox(0.132, 0.062, 0.100, F.tubWhite), w: W.box(0.132) },
      { b: () => yogurt(F.tubPink), w: W.yogurt },
      { b: () => yogurt(F.tubWhite), w: W.yogurt },
    ]);

    row(freshShelf, FRESH, FS[1], -0.058, 0.010, [
      { b: () => can(F.canLabel), w: W.can },
      { b: () => can(F.cartonRed), w: W.can },
      { b: () => can(F.cartonGreen), w: W.can },
      { b: () => bottle(F.petGlass, 0.196, 0.030), w: W.bottle },
    ]);
    row(freshShelf, FRESH, FS[1], 0.122, 0.010, [
      { b: () => fruit(F.apple, 0.041), w: W.fruit(0.041), ry: 0.10 },
      { b: () => fruit(F.apple, 0.041), w: W.fruit(0.041), ry: -0.12 },
      { b: () => fruit(F.orange, 0.039), w: W.fruit(0.039), ry: 0.08 },
    ]);

    row(freshShelf, FRESH, FS[0], -0.052, 0.012, [
      { b: () => foodBox(0.156, 0.070, 0.106, F.tubWhite), w: W.box(0.156) },
      { b: () => foodBox(0.120, 0.056, 0.100, F.tubPink), w: W.box(0.120) },
    ]);
    row(freshShelf, FRESH, FS[0], 0.120, 0.010, [
      { b: () => meatTray(), w: W.meat },
      { b: () => tomato(), w: W.tomato },
      { b: () => fruit(F.lemon, 0.031), w: W.fruit(0.031) },
    ]);

    ids.push('foodFreshShelf');
    FL.registerPart('foodFreshShelf', freshShelf, {
      category: 'food', explode: new T.Vector3(0, 0, 0.55),
      meta: { name: '冷藏室食材（搁板）', english: 'FRESH FOOD · SHELF', category: 'food',
        intro: '搁板上的冷藏食材：乳制品、饮料、酸奶、水果与保鲜盒。食材不只是装饰——它们具有真实热容，会显著提高冷藏室的热惯性，让箱温在开门或断电时变化得更慢。',
        facts: [['示意食材', '牛奶 · 饮料 · 酸奶 · 保鲜盒 · 苹果 / 橙子 / 柠檬 · 番茄 · 肉类'],
          ['热物性', '比热约 3000 J/(kg·K)（含水食材 + 包装折算）'],
          ['教学要点', '食材越多 → 有效热容越大 → 温度越稳，但降温也更慢']] },
    });

    /* ---------------- 冷藏室：抽屉 ---------------- */
    const dR1 = FL.parts.get('drawerR1').group;
    const dR2 = FL.parts.get('drawerR2').group;
    const freshDrawerA = new T.Group();
    dR1.add(freshDrawerA);
    row(freshDrawerA, FRESH, DY[0], -0.040, 0.012, [
      { b: () => lettuce(), w: W.lettuce },
      { b: () => broccoli(), w: W.broccoli },
    ]);
    row(freshDrawerA, FRESH, DY[0], 0.115, 0.026, [
      { b: () => carrot(0.115), w: W.carrot(0.115), ry: 0.10 },
      { b: () => carrot(0.105), w: W.carrot(0.105), ry: -0.10 },
    ]);
    FL.registerPart('foodDrawerR1', freshDrawerA, {
      category: 'food',
      meta: { name: '冷藏室保鲜抽屉食材', english: 'CRISPER DRAWER · VEG', category: 'food',
        intro: '保鲜抽屉里的蔬菜。抽屉独立密封、湿度较高，能减缓叶菜失水；抽拉时食材随抽屉一起沿导轨滑出。',
        facts: [['示意食材', '生菜 · 西兰花 · 胡萝卜'], ['湿度', '高湿保鲜区'],
          ['关联运动', '食材挂在抽屉组上，随抽屉抽拉 300 mm']] },
    });

    const freshDrawerB = new T.Group();
    dR2.add(freshDrawerB);
    row(freshDrawerB, FRESH, DY[1], -0.040, 0.010, [
      { b: () => fruit(F.apple, 0.042), w: W.fruit(0.042), ry: 0.12 },
      { b: () => fruit(F.apple, 0.042), w: W.fruit(0.042), ry: -0.10 },
      { b: () => fruit(F.orange, 0.040), w: W.fruit(0.040), ry: 0.06 },
    ]);
    row(freshDrawerB, FRESH, DY[1], 0.112, 0.010, [
      { b: () => fruit(F.appleGreen, 0.040), w: W.fruit(0.040), ry: -0.08 },
      { b: () => fruit(F.lemon, 0.032), w: W.fruit(0.032) },
      { b: () => fruit(F.orange, 0.040), w: W.fruit(0.040), ry: 0.10 },
    ]);
    FL.registerPart('foodDrawerR2', freshDrawerB, {
      category: 'food',
      meta: { name: '冷藏室果蔬抽屉食材', english: 'CRISPER DRAWER · FRUIT', category: 'food',
        intro: '果蔬抽屉里的水果。水果在成熟过程中会释放乙烯并产生呼吸热，是冷藏室内部热负荷的一部分。',
        facts: [['示意食材', '苹果 · 橙子 · 柠檬'], ['生理特性', '呼吸热 + 乙烯释放'],
          ['关联运动', '随抽屉抽拉']] },
    });

    /* ---------------- 冷冻室：搁板 ---------------- */
    const frozenShelf = new T.Group();
    root.add(frozenShelf);

    row(frozenShelf, FROZ, FS[2], -0.052, 0.010, [
      { b: () => iceCreamTub(F.tubChoc), w: W.ice },
      { b: () => iceCreamTub(F.tubPink), w: W.ice },
    ]);
    row(frozenShelf, FROZ, FS[2], 0.118, 0.010, [
      { b: () => frozenPouch(0.132, 0.050, 0.100, F.frozenPouch), w: W.pouch(0.132) },
      { b: () => frozenPouch(0.120, 0.046, 0.094, F.frozenPouch), w: W.pouch(0.120) },
    ]);

    row(frozenShelf, FROZ, FS[1], -0.056, 0.012, [
      { b: () => foodBox(0.146, 0.062, 0.104, F.tubWhite), w: W.box(0.146) },
      { b: () => foodBox(0.122, 0.056, 0.098, F.tubWhite), w: W.box(0.122) },
    ]);
    row(frozenShelf, FROZ, FS[1], 0.118, 0.010, [
      { b: () => meatTray(), w: W.meat },
      { b: () => frozenPouch(0.122, 0.048, 0.096), w: W.pouch(0.122) },
    ]);

    row(frozenShelf, FROZ, FS[0], -0.010, 0, [{ b: () => pizzaBox(), w: W.pizza }]);
    row(frozenShelf, FROZ, FS[0], 0.152, 0.010, [
      { b: () => frozenPouch(0.130, 0.048, 0.096), w: W.pouch(0.130) },
      { b: () => frozenPouch(0.118, 0.046, 0.092), w: W.pouch(0.118) },
    ]);

    ids.push('foodFrozenShelf');
    FL.registerPart('foodFrozenShelf', frozenShelf, {
      category: 'food', explode: new T.Vector3(0, 0, 0.55),
      meta: { name: '冷冻室食材（搁板）', english: 'FROZEN FOOD · SHELF', category: 'food',
        intro: '冷冻室搁板上的速冻食品、冰淇淋与肉类。冷冻食材的比热与相变潜热共同构成巨大的“冷量蓄水池”，这也是断电后冷冻室能长时间维持低温的原因。',
        facts: [['示意食材', '冰淇淋 · 冷冻袋装 · 披萨 · 肉类托盘 · 冷冻盒'],
          ['热物性', '含相变潜热，等效热容远高于冷藏食材'],
          ['教学要点', '断电后冷冻室升温最慢，正是靠这部分蓄冷']] },
    });

    /* ---------------- 冷冻室：抽屉 ---------------- */
    const dL1 = FL.parts.get('drawerL1').group;
    const dL2 = FL.parts.get('drawerL2').group;
    const frozenDrawerA = new T.Group();
    dL1.add(frozenDrawerA);
    row(frozenDrawerA, FROZ, DY[0], -0.040, 0.012, [
      { b: () => frozenPouch(0.140, 0.056, 0.104), w: W.pouch(0.140) },
      { b: () => frozenPouch(0.128, 0.052, 0.098), w: W.pouch(0.128) },
    ]);
    row(frozenDrawerA, FROZ, DY[0], 0.115, 0.012, [
      { b: () => frozenPouch(0.120, 0.048, 0.094), w: W.pouch(0.120) },
      { b: () => meatTray(), w: W.meat },
    ]);
    FL.registerPart('foodDrawerL1', frozenDrawerA, {
      category: 'food',
      meta: { name: '冷冻抽屉食材', english: 'FREEZER DRAWER', category: 'food',
        intro: '冷冻室下层抽屉里的速冻食品与肉类。取出时抽屉沿导轨抽出，食材随抽屉一同移动，不穿模。',
        facts: [['示意食材', '速冻袋装 · 肉类托盘'], ['关联运动', '随抽屉抽拉 300 mm']] },
    });

    const frozenDrawerB = new T.Group();
    dL2.add(frozenDrawerB);
    row(frozenDrawerB, FROZ, DY[1], -0.040, 0.012, [
      { b: () => iceCreamTub(F.tubPink), w: W.ice },
      { b: () => iceCreamTub(F.tubChoc), w: W.ice },
    ]);
    row(frozenDrawerB, FROZ, DY[1], 0.112, 0.012, [
      { b: () => frozenPouch(0.128, 0.050, 0.098), w: W.pouch(0.128) },
      { b: () => frozenPouch(0.118, 0.046, 0.092), w: W.pouch(0.118) },
    ]);
    FL.registerPart('foodDrawerL2', frozenDrawerB, {
      category: 'food',
      meta: { name: '冰淇淋抽屉食材', english: 'ICE CREAM DRAWER', category: 'food',
        intro: '冷冻室上层抽屉里的冰淇淋与速冻小包装。抽屉上方通常还配一层可拆隔板，避免大件食材被压。',
        facts: [['示意食材', '冰淇淋桶 ×2 · 速冻袋装 ×2'], ['温度', '约 −18 °C']] },
    });

    /* ---------------- 门架食材 ---------------- */
    const BIN_Y = D.binY;
    const doorFoods = [
      { side: 'right', id: 'foodDoorRight', name: '冷藏门架食材', en: 'FRIDGE DOOR BIN FOOD',
        intro: '冷藏门架上的常取食材：牛奶、饮料、蛋架与调味瓶。门架是箱内温度最高的位置（开关门时受环境影响最大），适合放耐温的调味品与饮料。',
        rows: [
          [BIN_Y[0], [{ b: () => milkCarton(F.cartonGreen, 0.190), w: W.milk },
            { b: () => milkCarton(F.cartonBlue, 0.190), w: W.milk },
            { b: () => bottle(F.petAmber, 0.184, 0.030), w: W.bottle }]],
          [BIN_Y[1], [{ b: () => can(F.canLabel), w: W.can },
            { b: () => can(F.cartonRed), w: W.can },
            { b: () => eggTray(), w: W.eggTray }]],
          [BIN_Y[2], [{ b: () => condiment(F.cartonGreen), w: W.cond },
            { b: () => condiment(F.cartonRed), w: W.cond },
            { b: () => foodBox(0.122, 0.058, 0.062, F.tubWhite), w: W.box(0.122) }]],
        ] },
      { side: 'left', id: 'foodDoorLeft', name: '冷冻门架食材', en: 'FREEZER DOOR BIN FOOD',
        intro: '冷冻门架上的速冻小包装。冷冻门架温度波动最大，一般只放耐冻、周转快的食材。',
        rows: [
          [BIN_Y[0], [{ b: () => frozenPouch(0.112, 0.046, 0.058), w: W.pouch(0.112) },
            { b: () => frozenPouch(0.104, 0.044, 0.056), w: W.pouch(0.104) }]],
          [BIN_Y[1], [{ b: () => frozenPouch(0.108, 0.046, 0.058), w: W.pouch(0.108) },
            { b: () => frozenPouch(0.100, 0.042, 0.054), w: W.pouch(0.100) }]],
          [BIN_Y[2], [{ b: () => foodBox(0.118, 0.052, 0.058, F.tubWhite), w: W.box(0.118) },
            { b: () => frozenPouch(0.096, 0.040, 0.052), w: W.pouch(0.096) }]],
        ] },
    ];

    doorFoods.forEach(function (cfg) {
      const rec = FL.parts.get(cfg.side === 'right' ? 'doorRight' : 'doorLeft');
      const g = new T.Group();
      rec.group.add(g);
      const cx = cfg.side === 'right' ? -0.235 : 0.235;
      cfg.rows.forEach(function (r) {
        row(g, cx, r[0] + 0.008, LIM.binZ, 0.010, r[1]);
      });
      ids.push(cfg.id);
      FL.registerPart(cfg.id, g, {
        category: 'food',
        meta: { name: cfg.name, english: cfg.en, category: 'food', intro: cfg.intro,
          facts: [['位置', cfg.side === 'right' ? '冷藏室门内衬' : '冷冻室门内衬'],
            ['关联运动', '食材挂在门组上，开门时随门体绕铰链旋转'],
            ['温度特征', '门架是箱内温度最高、波动最大的区域']] },
      });
    });

    /* ---------------- 统计与开关 ---------------- */
    out.total = out.items.length;
    out.setVisible = function (on) {
      ids.forEach(function (id) {
        const r = FL.parts.get(id);
        if (r) r.group.visible = !!on;
      });
    };
    out.setLoad = function (k) {
      k = FL.clamp(k, 0, 1);
      out.load = k;
      let n = 0;
      out.items.forEach(function (g) {
        const vis = k >= g.userData.foodLevel - 1e-6;
        g.visible = vis;
        if (vis) n++;
      });
      out.visibleCount = n;
    };
    out.load = 1;
    out.setLoad(0.65);
    out.setVisible(true);
    FL.log('food items: ' + out.total + ' (' + out.meshCount + ' meshes)');
    return out;
  };
})(window.FL);
