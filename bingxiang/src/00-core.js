/* =========================================================================
 * 00-core.js — 命名空间 / 数学 / 几何工具
 * =======================================================================*/
window.FL = window.FL || {};
(function (FL) {
  'use strict';
  const T = THREE;

  /* ------------------------------ 数学 ------------------------------ */
  FL.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  FL.lerp = (a, b, t) => a + (b - a) * t;
  FL.invLerp = (a, b, v) => (b - a === 0 ? 0 : (v - a) / (b - a));
  FL.smoothstep = (t) => t * t * (3 - 2 * t);
  FL.smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  FL.easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  FL.easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  /** 帧率无关指数缓动 —— 全项目统一使用 */
  FL.damp = (cur, tgt, lambda, dt) => cur + (tgt - cur) * (1 - Math.exp(-lambda * dt));
  FL.dampVec3 = function (cur, tgt, lambda, dt) {
    const k = 1 - Math.exp(-lambda * dt);
    cur.x += (tgt.x - cur.x) * k;
    cur.y += (tgt.y - cur.y) * k;
    cur.z += (tgt.z - cur.z) * k;
    return cur;
  };
  FL.mapRange = (v, a, b, c, d) => c + ((FL.clamp(v, a, b) - a) / (b - a)) * (d - c);
  FL.deg = (d) => (d * Math.PI) / 180;
  FL.frac = (x) => x - Math.floor(x);
  /** 确定性随机，保证每次打开画面一致 */
  FL.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  FL.rand = FL.rng(20260929);

  /* --------------------------- 二维圆角矩形 --------------------------- */
  FL.roundedRectShape = function (w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    const x = -w / 2,
      y = -h / 2;
    const s = new T.Shape();
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x + w, y + h - r);
    s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    s.lineTo(x + r, y + h);
    s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(x, y + r);
    s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  };

  /* --------------------------- 几何：圆角板 ---------------------------
   * 用 ExtrudeGeometry + 倒角实现真实圆角与厚度（面板类零件首选）。
   * 返回几何最终外尺寸严格等于 W × H × D，沿 +Z 挤出，几何中心在原点。
   * ------------------------------------------------------------------ */
  FL.roundedPanelGeo = function (W, H, D, R, bevelSeg) {
    bevelSeg = bevelSeg || 3;
    const b = Math.min(R * 0.62, D * 0.32, 0.0035);
    const sw = Math.max(0.002, W - 2 * b);
    const sh = Math.max(0.002, H - 2 * b);
    const sr = Math.max(0.0008, R - b);
    const depth = Math.max(0.001, D - 2 * b);
    const geo = new T.ExtrudeGeometry(FL.roundedRectShape(sw, sh, sr), {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: b,
      bevelSize: b,
      bevelOffset: 0,
      bevelSegments: bevelSeg,
      curveSegments: 10,
      steps: 1,
    });
    geo.translate(0, 0, -depth / 2);
    geo.computeVertexNormals();
    return geo;
  };

  /* --------------------------- 几何：圆角盒 ---------------------------
   * 适用于块状零件的均匀圆角（分段盒 + 顶点投影到圆角立方体）。
   * ------------------------------------------------------------------ */
  FL.roundedBoxGeo = function (w, h, d, r, seg) {
    seg = seg || 3;
    r = Math.max(0, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
    const g = new T.BoxGeometry(w, h, d, seg, seg, seg);
    const pos = g.attributes.position;
    const nor = g.attributes.normal;
    const hx = w / 2 - r,
      hy = h / 2 - r,
      hz = d / 2 - r;
    const v = new T.Vector3(),
      p = new T.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      p.set(FL.clamp(v.x, -hx, hx), FL.clamp(v.y, -hy, hy), FL.clamp(v.z, -hz, hz));
      const dx = v.x - p.x,
        dy = v.y - p.y,
        dz = v.z - p.z;
      const len = Math.hypot(dx, dy, dz);
      if (len > 1e-9) {
        const s = r / len;
        pos.setXYZ(i, p.x + dx * s, p.y + dy * s, p.z + dz * s);
        nor.setXYZ(i, dx / len, dy / len, dz / len);
      }
    }
    pos.needsUpdate = true;
    nor.needsUpdate = true;
    g.computeBoundingSphere();
    return g;
  };

  /** 圆角矩形环（门封条 / 边框 / 卡槽） */
  FL.roundedRingGeo = function (W, H, T2, r, R) {
    const outer = FL.roundedRectShape(W, H, R);
    const hole = FL.roundedRectShape(W - 2 * r, H - 2 * r, Math.max(0.0008, R - r));
    outer.holes.push(hole);
    const geo = new T.ExtrudeGeometry(outer, {
      depth: T2,
      bevelEnabled: false,
      curveSegments: 8,
      steps: 1,
    });
    geo.translate(0, 0, -T2 / 2);
    geo.computeVertexNormals();
    return geo;
  };

  /** 薄壁开口盒（抽屉体 / 内胆 / 接水槽） */
  FL.trayGeo = function (w, h, d, t, r) {
    t = t || 0.004;
    const g = new T.Group();
    const mk = (gw, gh, gd, x, y, z) => {
      const m = new T.Mesh(FL.roundedBoxGeo(gw, gh, gd, Math.min(r || 0.002, gh / 2 - 1e-4, gw / 2 - 1e-4), 2));
      m.position.set(x, y, z);
      return m;
    };
    g.add(mk(w, t, d, 0, -h / 2 + t / 2, 0)); // 底
    g.add(mk(t, h, d, -w / 2 + t / 2, 0, 0)); // 左
    g.add(mk(t, h, d, w / 2 - t / 2, 0, 0)); // 右
    g.add(mk(w - 2 * t, h, t, 0, 0, -d / 2 + t / 2)); // 后
    return g;
  };

  /** 沿点集生成平滑曲线（CatmullRom，端点不外扩） */
  FL.curveFrom = function (pts, tension) {
    const c = new T.CatmullRomCurve3(pts, false, 'catmullrom', tension === undefined ? 0.4 : tension);
    return c;
  };

  /* --------------------------- 零件注册表 --------------------------- */
  /** 全项目统一的装配节点注册表：id -> {group, meta, explode, inspect} */
  FL.parts = new Map();
  FL.registerPart = function (id, group, opt) {
    opt = opt || {};
    group.name = id;
    group.userData.partId = id;
    group.traverse((o) => {
      o.userData.partId = id;
    });
    const rec = {
      id: id,
      group: group,
      base: group.position.clone(),
      baseQuat: group.quaternion.clone(),
      explode: opt.explode ? new T.Vector3().copy(opt.explode) : new T.Vector3(),
      meta: opt.meta || null,
      alwaysVisible: opt.alwaysVisible !== false,
      category: opt.category || 'other',
    };
    FL.parts.set(id, rec);
    return rec;
  };

  FL.log = function () {
    if (FL.DEBUG) console.log.apply(console, ['[FL]'].concat([].slice.call(arguments)));
  };
})(window.FL);
