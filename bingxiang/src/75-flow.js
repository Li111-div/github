/* =========================================================================
 * 75-flow.js — 三套流场可视化
 *   ① 箱内空气循环（青色曲线 + 粒子）—— 与制冷剂完全隔离
 *   ② 密闭制冷剂回路（沿真实铜管的分段彩色粒子）
 *   ③ 冷凝器向环境排热（暖橙粒子 + 热流线 + 辉光）
 *
 * 粒子使用自定义 ShaderMaterial：逐粒子颜色 + 逐粒子透明度，
 * 采用普通混合（非叠加），因此在浅色影棚与深色影棚下都成立。
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;
  const M = FL.MAT;
  const V = (x, y, z) => new T.Vector3(x, y, z);

  /* 空气流线材质（可独立调节透明度） */
  FL.MAT.airLineClone = function () {
    return new T.MeshBasicMaterial({
      color: 0x2f9cb8, transparent: true, opacity: 0.34, depthWrite: false,
    });
  };

  function dotTexture() {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.30, 'rgba(255,255,255,0.78)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    return new T.CanvasTexture(c);
  }

  /** 逐粒子颜色 + 逐粒子 alpha 的点精灵材质 */
  function particleMaterial(sprite, worldSize, baseAlpha) {
    return new T.ShaderMaterial({
      uniforms: {
        uMap: { value: sprite },
        uSize: { value: worldSize },
        uAlpha: { value: baseAlpha },
      },
      vertexShader: [
        'attribute vec3 aColor;',
        'attribute float aAlpha;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        'uniform float uSize;',
        'void main() {',
        '  vColor = aColor;',
        '  vAlpha = aAlpha;',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = max(1.5, uSize * (260.0 / max(0.001, -mv.z)));',
        '  gl_Position = projectionMatrix * mv;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uMap;',
        'uniform float uAlpha;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        'void main() {',
        '  vec4 t = texture2D(uMap, gl_PointCoord);',
        '  float a = t.a * vAlpha * uAlpha;',
        '  if (a < 0.004) discard;',
        '  gl_FragColor = vec4(vColor, a);',
        '}',
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      depthTest: true,
    });
  }

  function makeCloud(n, sprite, worldSize, baseAlpha) {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aColor', new T.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aAlpha', new T.BufferAttribute(new Float32Array(n), 1));
    const mat = particleMaterial(sprite, worldSize, baseAlpha);
    const pts = new T.Points(geo, mat);
    pts.frustumCulled = false;
    return { geo: geo, mat: mat, points: pts, n: n };
  }

  /* 制冷剂分段颜色 */
  const REF_COLORS = {
    discharge: new T.Color(0xe8461c),   // 高温高压气体：橙红
    condense: new T.Color(0xe8a132),    // 冷凝液体：金黄铜黄
    liquid: new T.Color(0xd99a34),
    flash: new T.Color(0x1d8fc4),       // 节流后：青蓝
    evaporate: new T.Color(0x39b9c9),
    suction: new T.Color(0x1f9d78),     // 低压回气：青绿
  };

  FL.createFlow = function (scene, model, stage) {
    const F = {};
    const sprite = dotTexture();

    /* ==================================================================
     * ① 箱内空气循环
     * ================================================================*/
    const airCurves = [];
    function airLoop(side) {
      const s = side === 'left' ? -1 : 1;
      const cx = side === 'left' ? -0.231 : 0.231;
      const main = new T.CatmullRomCurve3([
        V(cx, 0.46, -0.115), V(cx, 1.00, -0.115), V(cx, 1.62, -0.112), V(cx, 1.79, -0.08),
        V(cx + 0.05 * s, 1.81, 0.02), V(cx + 0.07 * s, 1.76, 0.16), V(cx + 0.07 * s, 1.30, 0.222),
        V(cx + 0.07 * s, 0.80, 0.222), V(cx + 0.06 * s, 0.34, 0.215), V(cx, 0.22, 0.13),
        V(cx - 0.02 * s, 0.17, 0.02), V(cx, 0.20, -0.10), V(cx, 0.34, -0.115),
      ], true, 'centripetal', 0.5);
      airCurves.push({ curve: main, side: side, kind: 'main' });
      [0.90, 1.22, 1.54].forEach(function (y) {
        airCurves.push({
          curve: new T.CatmullRomCurve3([
            V(cx - 0.09 * s, y + 0.05, -0.10), V(cx - 0.02 * s, y + 0.03, 0.02),
            V(cx + 0.04 * s, y, 0.13), V(cx + 0.07 * s, y - 0.03, 0.215),
          ], false, 'centripetal', 0.5),
          side: side, kind: 'branch',
        });
      });
      [0.30, 0.62].forEach(function (y) {
        airCurves.push({
          curve: new T.CatmullRomCurve3([
            V(cx - 0.09 * s, y + 0.04, -0.10), V(cx - 0.01 * s, y, 0.04), V(cx + 0.06 * s, y - 0.03, 0.20),
          ], false, 'centripetal', 0.5),
          side: side, kind: 'branch',
        });
      });
    }
    airLoop('left'); airLoop('right');

    const airGroup = new T.Group();
    const airLineMats = [];
    airCurves.forEach(function (a) {
      const mat = M.airLineClone();
      mat.opacity = a.kind === 'main' ? 0.34 : 0.22;
      airLineMats.push(mat);
      const tube = new T.Mesh(
        new T.TubeGeometry(a.curve, 90, a.kind === 'main' ? 0.0030 : 0.0021, 5, a.curve.closed), mat);
      tube.renderOrder = 3;
      airGroup.add(tube);
    });
    scene.add(airGroup);

    const AIRN = 320;
    const airCloud = makeCloud(AIRN, sprite, 0.013, 0.42);
    airCloud.points.renderOrder = 4;
    scene.add(airCloud.points);
    const airState = [];
    for (let i = 0; i < AIRN; i++) {
      airState.push({ ci: i % airCurves.length, u: Math.random(), sp: 0.055 + Math.random() * 0.05 });
    }
    const airPos = airCloud.geo.attributes.position.array;
    const airCol = airCloud.geo.attributes.aColor.array;
    const airAlp = airCloud.geo.attributes.aAlpha.array;
    const _p = new T.Vector3();

    /* ==================================================================
     * ② 制冷剂粒子（沿真实管路）
     * ================================================================*/
    const loop = model.cooling.loop;
    const REFN = 300;
    const refCloud = makeCloud(REFN, sprite, 0.026, 1.0);
    refCloud.points.renderOrder = 5;
    scene.add(refCloud.points);
    const refState = [];
    for (let i = 0; i < REFN; i++) refState.push({ u: i / REFN, sp: 0.030 + Math.random() * 0.018 });
    const refPos = refCloud.geo.attributes.position.array;
    const refCol = refCloud.geo.attributes.aColor.array;
    const refAlp = refCloud.geo.attributes.aAlpha.array;

    loop.breakMap = {};
    loop.breaks.forEach(function (b, i) {
      const nxt = loop.breaks[i + 1];
      loop.breakMap[b.tag + '0'] = b.u;
      loop.breakMap[b.tag + '1'] = nxt ? nxt.u : 1;
    });

    function refColorAt(u, out) {
      let tag = loop.breaks[0].tag;
      for (let i = 0; i < loop.breaks.length; i++) { if (u >= loop.breaks[i].u - 1e-6) tag = loop.breaks[i].tag; }
      if (u >= loop.capU0 && u <= loop.capU1) tag = 'flash';
      out.copy(REF_COLORS[tag] || REF_COLORS.liquid);
      if (tag === 'condense') {
        const a = loop.breakMap.condense0, b = loop.breakMap.condense1;
        out.copy(REF_COLORS.discharge).lerp(REF_COLORS.liquid, FL.clamp((u - a) / Math.max(1e-6, b - a), 0, 1));
      } else if (tag === 'evaporate') {
        const a = loop.breakMap.evaporate0, b = loop.breakMap.evaporate1;
        out.copy(REF_COLORS.flash).lerp(REF_COLORS.suction, FL.clamp((u - a) / Math.max(1e-6, b - a), 0, 1));
      }
      return out;
    }

    /* 管路发光（Cycle 模式强调：普通混合的浅色外扩描边） */
    const glowMat = new T.MeshBasicMaterial({
      color: 0xf0a45e, transparent: true, opacity: 0, depthWrite: false, side: T.BackSide,
    });
    const glowMesh = new T.Mesh(model.cooling.pipeGroup.children[0].geometry, glowMat);
    glowMesh.scale.setScalar(2.1);
    glowMesh.renderOrder = 2;
    scene.add(glowMesh);

    /* ==================================================================
     * ③ 排热（冷凝器 → 环境）
     * ================================================================*/
    const HEATN = 240;
    const heatCloud = makeCloud(HEATN, sprite, 0.024, 0.55);
    heatCloud.points.renderOrder = 5;
    scene.add(heatCloud.points);
    const heatPos = heatCloud.geo.attributes.position.array;
    const heatCol = heatCloud.geo.attributes.aColor.array;
    const heatAlp = heatCloud.geo.attributes.aAlpha.array;
    const heatState = [];
    function spawnHeat(i) {
      heatState[i] = {
        x: -0.37 + Math.random() * 0.74,
        y: 0.44 + Math.random() * 1.08,
        z: -0.398 - Math.random() * 0.02,
        life: 0,
        maxLife: 2.4 + Math.random() * 2.6,
        vx: (Math.random() - 0.5) * 0.10,
        vy: 0.09 + Math.random() * 0.13,
        vz: -0.02 - Math.random() * 0.05,
      };
    }
    for (let i = 0; i < HEATN; i++) { spawnHeat(i); heatState[i].life = Math.random() * heatState[i].maxLife; }

    const heatLineGroup = new T.Group();
    const heatLineMat = new T.MeshBasicMaterial({
      color: 0xd8763a, transparent: true, opacity: 0, depthWrite: false,
    });
    for (let i = 0; i < 9; i++) {
      const x = -0.32 + (i / 8) * 0.64;
      const c = new T.CatmullRomCurve3([
        V(x, 0.46 + Math.random() * 0.34, -0.40),
        V(x + (Math.random() - 0.5) * 0.08, 0.86 + Math.random() * 0.26, -0.46),
        V(x + (Math.random() - 0.5) * 0.14, 1.24 + Math.random() * 0.22, -0.54),
        V(x + (Math.random() - 0.5) * 0.20, 1.60 + Math.random() * 0.20, -0.62),
      ], false, 'centripetal', 0.5);
      heatLineGroup.add(new T.Mesh(new T.TubeGeometry(c, 40, 0.0042, 5, false), heatLineMat));
    }
    scene.add(heatLineGroup);

    const glowPlane = new T.Mesh(
      new T.PlaneGeometry(0.96, 1.36),
      new T.MeshBasicMaterial({ color: 0xd8763a, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide })
    );
    glowPlane.position.set(0, 1.0, -0.428);
    scene.add(glowPlane);

    /* ==================================================================
     * 更新
     * ================================================================*/
    const _c = new T.Color();

    F.update = function (dt, S, kin, opts) {
      const running = S.powerOn && !S.defrost;
      const load = S.compressorLoad;
      const cycleMode = opts.cycleMode;

      /* ---- 空气 ---- */
      airGroup.visible = opts.showAir;
      airCloud.points.visible = opts.showAir;
      if (opts.showAir) {
        const airSpeedK = (running ? 1.0 : 0.06) * (0.55 + load * 0.9) * (cycleMode ? 0.45 : 1);
        const doorL = kin.doorState.left.angle > FL.deg(6);
        const doorR = kin.doorState.right.angle > FL.deg(6);
        const cool = FL.clamp(1 - FL.invLerp(-22, 6, S.evapTemp), 0.3, 1);
        for (let i = 0; i < AIRN; i++) {
          const st = airState[i];
          const a = airCurves[st.ci];
          const blocked = (a.side === 'left' && doorL) || (a.side === 'right' && doorR);
          st.u += st.sp * (blocked ? 0.10 : airSpeedK) * dt;
          if (!isFinite(st.u)) st.u = 0;
          st.u -= Math.floor(st.u);
          a.curve.getPointAt(st.u, _p);
          airPos[i * 3] = _p.x; airPos[i * 3 + 1] = _p.y; airPos[i * 3 + 2] = _p.z;
          _c.setRGB(0.30 * cool, 0.72, 0.88);
          airCol[i * 3] = _c.r; airCol[i * 3 + 1] = _c.g; airCol[i * 3 + 2] = _c.b;
          airAlp[i] = (a.kind === 'main' ? 1.0 : 0.7) * (blocked ? 0.35 : 1);
        }
        airCloud.geo.attributes.position.needsUpdate = true;
        airCloud.geo.attributes.aColor.needsUpdate = true;
        airCloud.geo.attributes.aAlpha.needsUpdate = true;
      }

      /* ---- 制冷剂 ---- */
      refCloud.points.visible = opts.showRefrigerant;
      if (opts.showRefrigerant) {
        const k = running ? (0.55 + load * 0.85) : 0.0;
        const boost = cycleMode ? 1.0 : 0.62;
        for (let i = 0; i < REFN; i++) {
          const st = refState[i];
          st.u += st.sp * k * dt * 0.75;
          if (!isFinite(st.u)) st.u = 0;
          st.u -= Math.floor(st.u);
          loop.curve.getPointAt(st.u, _p);
          refPos[i * 3] = _p.x; refPos[i * 3 + 1] = _p.y; refPos[i * 3 + 2] = _p.z;
          refColorAt(st.u, _c);
          refCol[i * 3] = _c.r; refCol[i * 3 + 1] = _c.g; refCol[i * 3 + 2] = _c.b;
          refAlp[i] = (k > 0.001 ? 1.0 : 0.22) * boost;
        }
        refCloud.geo.attributes.position.needsUpdate = true;
        refCloud.geo.attributes.aColor.needsUpdate = true;
        refCloud.geo.attributes.aAlpha.needsUpdate = true;
      }
      refCloud.mat.uniforms.uSize.value = cycleMode ? 0.026 : 0.017;
      glowMat.opacity = FL.damp(glowMat.opacity, cycleMode ? 0.14 : 0, 3, dt);

      /* ---- 排热 ---- */
      const heatK = FL.clamp(S.heatRejection / 160, 0, 1.6) * (running ? 1 : 0.12);
      heatCloud.points.visible = opts.showHeat;
      glowPlane.visible = opts.showHeat;
      heatLineGroup.visible = opts.showHeat;
      if (opts.showHeat) {
        const speed = 0.5 + heatK * 1.1;
        for (let i = 0; i < HEATN; i++) {
          const h = heatState[i];
          h.life += dt * speed;
          if (h.life > h.maxLife) { spawnHeat(i); h.life = 0; }
          const a = h.life / h.maxLife;
          heatPos[i * 3] = h.x + h.vx * h.life;
          heatPos[i * 3 + 1] = h.y + h.vy * h.life;
          heatPos[i * 3 + 2] = h.z + h.vz * h.life;
          _c.setRGB(0.92, 0.44, 0.16);
          heatCol[i * 3] = _c.r; heatCol[i * 3 + 1] = _c.g; heatCol[i * 3 + 2] = _c.b;
          heatAlp[i] = Math.sin(Math.PI * FL.clamp(a, 0, 1)) * heatK;
        }
        heatCloud.geo.attributes.position.needsUpdate = true;
        heatCloud.geo.attributes.aColor.needsUpdate = true;
        heatCloud.geo.attributes.aAlpha.needsUpdate = true;
        const condHot = FL.clamp(FL.invLerp(28, 66, S.condenserTemp), 0, 1);
        heatLineMat.opacity = FL.damp(heatLineMat.opacity, (0.06 + condHot * 0.26) * heatK, 3, dt);
        glowPlane.material.opacity = FL.damp(glowPlane.material.opacity, (0.02 + condHot * 0.09) * heatK, 3, dt);
      }
    };

    F.setMode = function (mode) { F.mode = mode; };
    F.airCurves = airCurves;
    F.loopCurve = loop.curve;
    F.airLineMats = airLineMats;

    return F;
  };
})(window.FL);
