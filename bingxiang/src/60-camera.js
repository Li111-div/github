/* =========================================================================
 * 60-camera.js — 相机导演：六种模式的构图与特写重新取景
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;
  const V = (x, y, z) => new T.Vector3(x, y, z);

  FL.MODE_PRESETS = {
    product: { pos: V(1.80, 1.56, 3.58), tgt: V(-0.14, 0.94, 0.0), fov: 38 },
    open: { pos: V(1.42, 1.72, 3.30), tgt: V(-0.06, 0.99, 0.06), fov: 38 },
    explode: { pos: V(2.72, 2.00, 5.62), tgt: V(-0.05, 1.02, -0.05), fov: 38 },
    section: { pos: V(2.18, 1.72, 2.82), tgt: V(-0.10, 1.02, -0.05), fov: 38 },
    cycle: { pos: V(2.42, 1.88, -3.10), tgt: V(-0.05, 0.86, -0.14), fov: 38 },
  };

  /* 特写：保留集 / 隐藏集 / 观察方向 */
  const INSPECT = {
    compressor: {
      keep: ['compressor', 'compShellHalf', 'compStator', 'compRotor', 'compCrank', 'compConrod', 'compPiston',
        'compCylinder', 'compFeet', 'mechFan', 'pcb', 'bayDivider', 'mechFrame', 'tempSensors'],
      hide: ['mechCover', 'doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight', 'gasketLeft', 'gasketRight',
        'handleLeft', 'handleRight', 'displayPanel', 'shelfL1', 'shelfL2', 'shelfL3', 'shelfR1', 'shelfR2', 'shelfR3',
        'drawerL1', 'drawerL2', 'drawerR1', 'drawerR2', 'ductLeft', 'ductRight', 'returnGrille', 'evaporator', 'evapFan'],
      view: [0.72, 0.30, -1.0], fov: 34, half: true,
    },
    condenser: {
      keep: ['condenser', 'refrigerantPipe', 'shellRear', 'filterDrier'],
      hide: ['mechCover', 'doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight', 'gasketLeft', 'gasketRight',
        'handleLeft', 'handleRight', 'displayPanel', 'shelfL1', 'shelfL2', 'shelfL3', 'shelfR1', 'shelfR2', 'shelfR3',
        'drawerL1', 'drawerL2', 'drawerR1', 'drawerR2', 'ductLeft', 'ductRight', 'returnGrille'],
      view: [0.42, 0.22, -1.0], fov: 34,
    },
    evaporator: {
      keep: ['evaporator', 'evapFan', 'defrostHeater', 'drainTray', 'drainTube', 'refrigerantPipe', 'bayDivider'],
      hide: ['doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight', 'gasketLeft', 'gasketRight', 'handleLeft', 'handleRight',
        'displayPanel', 'shelfL1', 'shelfL2', 'shelfL3', 'shelfR1', 'shelfR2', 'shelfR3',
        'drawerL1', 'drawerL2', 'drawerR1', 'drawerR2', 'ductLeft', 'ductRight', 'returnGrille'],
      view: [-0.35, 0.40, 1.0], fov: 34,
    },
    evapFan: {
      keep: ['evapFan', 'evaporator', 'defrostHeater'],
      hide: ['doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight', 'gasketLeft', 'gasketRight', 'handleLeft', 'handleRight',
        'displayPanel', 'ductLeft', 'ductRight', 'returnGrille'],
      view: [-0.2, 0.3, 1.0], fov: 32,
    },
    filterDrier: {
      keep: ['filterDrier', 'refrigerantPipe', 'condenser', 'compressor', 'pcb', 'mechFrame'],
      hide: ['mechCover', 'doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight', 'gasketLeft', 'gasketRight',
        'handleLeft', 'handleRight', 'displayPanel', 'shelfL1', 'shelfL2', 'shelfL3', 'shelfR1', 'shelfR2', 'shelfR3',
        'drawerL1', 'drawerL2', 'drawerR1', 'drawerR2', 'ductLeft', 'ductRight', 'returnGrille'],
      view: [0.9, 0.30, -0.7], fov: 30,
    },
    pcb: {
      keep: ['pcb', 'wireHarness', 'tempSensors', 'mechFrame'],
      hide: ['mechCover', 'doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight', 'gasketLeft', 'gasketRight',
        'handleLeft', 'handleRight', 'displayPanel', 'shelfL1', 'shelfL2', 'shelfL3', 'shelfR1', 'shelfR2', 'shelfR3',
        'drawerL1', 'drawerL2', 'drawerR1', 'drawerR2', 'ductLeft', 'ductRight', 'returnGrille'],
      view: [1.0, 0.22, 0.5], fov: 30,
    },
    drainTray: {
      keep: ['drainTray', 'drainTube', 'drainPan', 'defrostHeater', 'evaporator'],
      hide: ['doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight', 'gasketLeft', 'gasketRight', 'handleLeft', 'handleRight',
        'displayPanel', 'ductLeft', 'ductRight', 'returnGrille'],
      view: [-0.15, 0.55, 1.0], fov: 34,
    },
    shelfL1: { keep: ['shelfL1', 'shelfL2', 'shelfL3', 'shelfSupports', 'linerLeft', 'lightLeft'], hide: ['doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight', 'ductLeft'], view: [0.5, 0.45, 1.0], fov: 34 },
    drawerL1: { keep: ['drawerL1', 'drawerL2', 'drawerRails', 'linerLeft'], hide: ['doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight', 'ductLeft'], view: [0.55, 0.5, 1.0], fov: 34 },
    doorLeft: { keep: ['doorLeft', 'doorBinLeft', 'gasketLeft', 'handleLeft', 'hingeLeftUpper', 'hingeLeftLower'], hide: [], view: [0.85, 0.30, 1.0], fov: 34 },
    doorRight: { keep: ['doorRight', 'doorBinRight', 'gasketRight', 'handleRight', 'displayPanel', 'hingeRightUpper', 'hingeRightLower'], hide: [], view: [-0.85, 0.30, 1.0], fov: 34 },
  };
  /* 食材零件：爆炸 / 回路模式隐藏，特写模式按目标决定 */
  const FOOD_IDS = ['foodFreshShelf', 'foodFrozenShelf', 'foodDrawerR1', 'foodDrawerR2',
    'foodDrawerL1', 'foodDrawerL2', 'foodDoorLeft', 'foodDoorRight'];
  FL.FOOD_IDS = FOOD_IDS;

  const DOOR_IDS = ['doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight',
    'gasketLeft', 'gasketRight', 'handleLeft', 'handleRight', 'displayPanel'];

  Object.keys(INSPECT).forEach(function (k) {
    INSPECT[k].hide = (INSPECT[k].hide || []).concat(FOOD_IDS);
  });

  INSPECT.foodFreshShelf = {
    keep: ['foodFreshShelf', 'foodDrawerR1', 'foodDrawerR2', 'linerRight',
      'shelfR1', 'shelfR2', 'shelfR3', 'shelfNotches', 'shelfSupports', 'lightRight', 'ductRight', 'drawerRails'],
    hide: DOOR_IDS.concat(['foodFrozenShelf', 'foodDrawerL1', 'foodDrawerL2', 'foodDoorLeft', 'foodDoorRight', 'mechCover']),
    view: [0.62, 0.30, 1.0], fov: 36,
  };
  INSPECT.foodFrozenShelf = {
    keep: ['foodFrozenShelf', 'foodDrawerL1', 'foodDrawerL2', 'linerLeft',
      'shelfL1', 'shelfL2', 'shelfL3', 'shelfNotches', 'shelfSupports', 'lightLeft', 'ductLeft', 'drawerRails'],
    hide: DOOR_IDS.concat(['foodFreshShelf', 'foodDrawerR1', 'foodDrawerR2', 'foodDoorLeft', 'foodDoorRight', 'mechCover']),
    view: [-0.62, 0.30, 1.0], fov: 36,
  };
  INSPECT.foodDoorRight = {
    keep: ['foodDoorRight', 'doorRight', 'doorBinRight', 'gasketRight', 'handleRight', 'displayPanel'],
    hide: ['doorLeft', 'doorBinLeft', 'gasketLeft', 'handleLeft', 'mechCover'],
    view: [-0.88, 0.26, 1.0], fov: 34,
  };

  FL.INSPECT_CFG = INSPECT;

  /* 组件 id → 特写配置别名 */
  const ALIAS = {
    compShellHalf: 'compressor', compStator: 'compressor', compRotor: 'compressor', compCrank: 'compressor',
    compConrod: 'compressor', compPiston: 'compressor', compCylinder: 'compressor', compFeet: 'compressor',
    shelfL2: 'shelfL1', shelfL3: 'shelfL1', shelfR1: 'shelfL1', shelfR2: 'shelfL1', shelfR3: 'shelfL1',
    drawerL2: 'drawerL1', drawerR1: 'drawerL1', drawerR2: 'drawerL1',
    drainTube: 'drainTray', drainPan: 'drainTray', defrostHeater: 'drainTray',
    wireHarness: 'pcb', tempSensors: 'pcb',
    capillary: 'filterDrier', refrigerantPipe: 'filterDrier',
    doorBinLeft: 'doorLeft', doorBinRight: 'doorRight',
  };

  FL.createDirector = function (stage, rig, model) {
    const ghostMat = new T.MeshBasicMaterial({
      color: 0x64787f, transparent: true, opacity: 0.026, depthWrite: false,
      side: T.DoubleSide, toneMapped: false,
    });

    // 按“最深层已注册祖先”归属，确保嵌套零件（压缩机内部机构）状态正确
    const meshOwner = [];
    FL.parts.forEach(function (rec) {
      rec.group.traverse(function (o) {
        if (o.isMesh || o.isInstancedMesh) meshOwner.push({ mesh: o, partId: rec.id, depth: 0 });
      });
    });
    meshOwner.forEach(function (e) {
      let p = e.mesh.parent, d = 0;
      while (p) { if (p.userData.partId) d++; p = p.parent; }
      e.depth = d;
      e.partId = e.mesh.userData.partId || e.partId;
    });
    meshOwner.sort(function (a, b) { return a.depth - b.depth; });
    meshOwner.forEach(function (e) {
      if (!e.mesh.userData._origMat) e.mesh.userData._origMat = e.mesh.material;
    });

    let ghostKeep = null, hideSet = null;

    function applyVisibility() {
      meshOwner.forEach(function (e) {
        const hidden = hideSet && hideSet[e.partId];
        const keep = !ghostKeep || ghostKeep[e.partId];
        if (hidden) { e.mesh.visible = false; return; }
        e.mesh.visible = true;
        e.mesh.material = keep ? e.mesh.userData._origMat : ghostMat;
      });
    }

    function resetVisibility() {
      ghostKeep = null; hideSet = null;
      meshOwner.forEach(function (e) {
        e.mesh.visible = true;
        e.mesh.material = e.mesh.userData._origMat;
      });
      // 恢复默认隐藏件
      const half = FL.parts.get('compShellHalf');
      if (half) half.group.visible = false;
      const mechCover = FL.parts.get('mechCover');
      if (mechCover) mechCover.group.visible = true;
    }

    const director = {
      mode: 'product',
      ghostMat: ghostMat,
      resetVisibility: resetVisibility,
      applyVisibility: applyVisibility,
    };

    function buildSets(ids) {
      const s = {};
      (ids || []).forEach(function (i) { s[i] = true; });
      return s;
    }

    /** 模式级半隐藏（Cycle 模式让箱体降权） */
    function modeGhost(mode) {
      if (mode === 'cycle') {
        ghostKeep = buildSets([
          'condenser', 'refrigerantPipe', 'filterDrier', 'compressor', 'compShellHalf', 'compStator', 'compRotor',
          'compCrank', 'compConrod', 'compPiston', 'compCylinder', 'compFeet', 'evaporator', 'evapFan', 'defrostHeater',
          'drainTray', 'drainTube', 'drainPan', 'mechFan', 'pcb', 'wireHarness', 'tempSensors', 'bayDivider', 'mechFrame',
          'ductLeft', 'ductRight', 'returnGrille', 'linerLeft', 'linerRight', 'shelfSupports', 'drawerRails',
        ]);
        hideSet = buildSets(['mechCover', 'doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight',
          'shelfL1', 'shelfL2', 'shelfL3', 'shelfR1', 'shelfR2', 'shelfR3',
          'drawerL1', 'drawerL2', 'drawerR1', 'drawerR2', 'displayPanel'].concat(FOOD_IDS));
      } else if (mode === 'explode') {
        ghostKeep = null;
        hideSet = buildSets(['mechCover'].concat(FOOD_IDS));
      } else if (mode === 'section') {
        /* 剖面：隐藏门体与门架，避免门板遮挡箱体三明治切面 */
        ghostKeep = null;
        hideSet = buildSets(['mechCover', 'doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight',
          'gasketLeft', 'gasketRight', 'handleLeft', 'handleRight', 'displayPanel']);
      } else {
        ghostKeep = null;
        hideSet = null;
      }
    }

    /** 进入模式（不含运动学复位，由 main 统一调度） */
    director.enterMode = function (mode, animate) {
      director.mode = mode;
      const p = FL.MODE_PRESETS[mode];
      if (mode === 'inspect') return;
      if (!p) return;
      modeGhost(mode);
      applyVisibility();
      const half = FL.parts.get('compShellHalf');
      if (half) half.group.visible = false;
      if (animate === false) rig.snapTo(p.pos, p.tgt, p.fov);
      else rig.flyTo(p.pos, p.tgt, { fov: p.fov, lambda: mode === 'product' ? 2.2 : 2.6 });
    };

    /** 进入部件特写：自动重新构图 */
    director.inspect = function (partId) {
      const cfgId = INSPECT[partId] ? partId : (ALIAS[partId] || null);
      const cfg = cfgId ? INSPECT[cfgId] : null;
      director.mode = 'inspect';
      director.inspectId = partId;

      const rec = FL.parts.get(partId);
      if (!rec) return;

      if (cfg) {
        ghostKeep = buildSets(cfg.keep);
        hideSet = buildSets(cfg.hide);
        director.inspectCooling = cfg.keep.indexOf('refrigerantPipe') >= 0 ||
          cfg.keep.indexOf('condenser') >= 0 || cfg.keep.indexOf('evaporator') >= 0 ||
          cfg.keep.indexOf('compressor') >= 0;
      } else {
        // 兜底：仅保留该部件及其同类
        ghostKeep = buildSets([partId]);
        hideSet = buildSets(['mechCover'].concat(
          FOOD_IDS.filter(function (f) { return f !== partId; })));
        director.inspectCooling = false;
      }
      applyVisibility();

      // 压缩机特写：显示半剖壳
      const half = FL.parts.get('compShellHalf');
      const shellRec = FL.parts.get('compressor');
      if (half && cfg && cfg.half) {
        half.group.visible = true;
        if (shellRec) shellRec.group.children.forEach(function (c) {
          if (c === half.group) return;
          if (c.isGroup && c.children.length && c.children[0].geometry &&
            c.children[0].geometry.type === 'LatheGeometry') c.visible = false;
        });
      } else if (half) {
        half.group.visible = false;
        if (shellRec) shellRec.group.children.forEach(function (c) {
          if (c !== half.group && c.isGroup) c.visible = true;
          if (c.isMesh) c.visible = true;
        });
      }

      // 自动取景
      const box = new T.Box3().setFromObject(rec.group);
      if (!isFinite(box.min.x)) return;
      const c = box.getCenter(new T.Vector3());
      const size = box.getSize(new T.Vector3());
      const dir = new T.Vector3().fromArray((cfg && cfg.view) || [0.65, 0.42, 1.0]).normalize();
      const fov = (cfg && cfg.fov) || 34;
      const r = Math.max(size.x, size.y, size.z) * 0.5;
      const dist = Math.max(0.42, (r / Math.tan((fov * Math.PI) / 360)) * 1.42);
      const pos = c.clone().addScaledVector(dir, dist);
      pos.y = Math.max(pos.y, 0.08);
      rig.flyTo(pos, c, { fov: fov, lambda: 2.3 });
    };

    return director;
  };
})(window.FL);
