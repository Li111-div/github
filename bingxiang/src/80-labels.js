/* =========================================================================
 * 80-labels.js — 3D 舞台标签（投影跟随 / 出屏隐藏 / 遮挡隐藏 / 重叠避让）
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;
  const V = (x, y, z) => new T.Vector3(x, y, z);

  const DEFS = [
    // product
    { text: '微珠光金属门板', sub: 'PEARL IVORY STEEL', pos: V(-0.36, 1.52, 0.36), modes: ['product'], dir: 'left' },
    { text: '双区数字温控', sub: 'DUAL-ZONE DISPLAY', pos: V(0.30, 1.74, 0.37), modes: ['product'], dir: 'right' },
    { text: '隐藏式门缝', sub: 'PRECISION GAP', pos: V(0.0, 0.55, 0.37), modes: ['product'], dir: 'right' },
    // open
    { text: '分层送风口', sub: 'LAYERED AIR OUTLET', pos: V(-0.231, 1.60, -0.09), modes: ['open'], dir: 'left' },
    { text: '钢化玻璃搁板', sub: 'TEMPERED GLASS SHELF', pos: V(-0.231, 1.24, 0.10), modes: ['open'], dir: 'left' },
    { text: '抽屉 · 先开门再抽拉', sub: 'DRAWER · INTERLOCK', pos: V(-0.231, 0.30, 0.08), modes: ['open'], dir: 'left' },
    { text: '门上置物架', sub: 'DOOR BIN', pos: V(0.30, 1.34, 0.10), modes: ['open'], dir: 'right' },
    { text: '回风格栅', sub: 'RETURN AIR', pos: V(-0.231, 0.16, -0.06), modes: ['open'], dir: 'left' },
    // explode
    { text: '门体总成', sub: 'DOOR ASSEMBLY', pos: V(-0.90, 1.20, 0.90), modes: ['explode'], dir: 'left' },
    { text: '箱体三明治结构', sub: 'SHELL · FOAM · LINER', pos: V(-0.62, 1.30, 0.0), modes: ['explode'], dir: 'left' },
    { text: '储物组件', sub: 'STORAGE', pos: V(0.55, 1.20, 0.60), modes: ['explode'], dir: 'right' },
    { text: '冷凝器', sub: 'CONDENSER', pos: V(0.0, 1.55, -0.80), modes: ['explode'], dir: 'right' },
    { text: '压缩机', sub: 'COMPRESSOR', pos: V(0.25, 0.10, -0.75), modes: ['explode'], dir: 'right' },
    // section
    { text: '实体保温切面', sub: 'SOLID INSULATION CUT', pos: V(-0.44, 1.40, 0.05), modes: ['section'], dir: 'left' },
    { text: '送风 / 回风', sub: 'SUPPLY / RETURN', pos: V(-0.30, 0.90, -0.10), modes: ['section'], dir: 'left' },
    { text: '压缩机机械舱', sub: 'MACHINERY BAY', pos: V(0.15, 0.26, -0.22), modes: ['section'], dir: 'right' },
    // cycle
    { text: '01 变频压缩机', sub: 'COMPRESSOR', pos: V(0.15, 0.34, -0.25), modes: ['cycle'], dir: 'right' },
    { text: '02 冷凝器', sub: 'CONDENSER', pos: V(0.38, 1.35, -0.40), modes: ['cycle'], dir: 'right' },
    { text: '03 毛细管 / 干燥器', sub: 'CAPILLARY · DRIER', pos: V(0.33, 0.20, -0.27), modes: ['cycle'], dir: 'right' },
    { text: '04 蒸发器', sub: 'EVAPORATOR', pos: V(-0.40, 0.72, -0.24), modes: ['cycle'], dir: 'left' },
    // inspect 补充
    { text: '半壳剖视 · 教学慢动作', sub: 'CUTAWAY · SLOW MOTION', pos: V(0.15, 0.34, -0.25), modes: ['inspect-compressor'], dir: 'right' },
  ];

  FL.createLabels = function (container, camera, model) {
    const layer = document.createElement('div');
    layer.className = 'label-layer';
    container.appendChild(layer);

    const items = DEFS.map(function (d) {
      const el = document.createElement('div');
      el.className = 'lbl lbl-' + (d.dir || 'right');
      el.innerHTML = '<span class="lbl-dot"></span><span class="lbl-tx"><b>' + d.text + '</b><i>' + (d.sub || '') + '</i></span>';
      el.style.opacity = '0';
      layer.appendChild(el);
      return { def: d, el: el, shown: false };
    });

    // 遮挡检测用对象集
    const occluders = [];
    ['shellLeft', 'shellRight', 'shellTop', 'shellBottom', 'shellRear', 'mullion', 'base',
      'doorLeft', 'doorRight', 'doorBinLeft', 'doorBinRight', 'mechCover', 'linerLeft', 'linerRight',
      'ductLeft', 'ductRight', 'condenser', 'evaporator'].forEach(function (id) {
      const rec = FL.parts.get(id);
      if (rec) rec.group.traverse(function (o) { if (o.isMesh && !o.isInstancedMesh) occluders.push(o); });
    });
    const ray = new T.Raycaster();
    const ndc = new T.Vector3();
    const camDir = new T.Vector3();
    const toP = new T.Vector3();
    let occTick = 0;
    const occCache = {};

    function visibleFor(mode, inspectId) {
      return function (d) {
        if (mode === 'inspect') {
          if (d.modes.indexOf('inspect-' + inspectId) >= 0) return true;
          return false;
        }
        return d.modes.indexOf(mode) >= 0;
      };
    }

    const placed = [];
    const _v = new T.Vector3();

    function update(mode, inspectId, w, h) {
      const test = visibleFor(mode, inspectId);
      placed.length = 0;
      /* 爆炸 / 回路模式下箱体已被分离或半隐藏，遮挡检测不再成立 */
      const skipOcc = (mode === 'cycle' || mode === 'explode');
      const doOcclusion = !skipOcc && (occTick++ % 5) === 0;
      camera.getWorldDirection(camDir);

      items.forEach(function (it) {
        if (!test(it.def)) {
          if (it.shown) { it.el.style.opacity = '0'; it.shown = false; }
          return;
        }
        _v.copy(it.def.pos);
        toP.copy(_v).sub(camera.position);
        if (toP.dot(camDir) <= 0.02) { it.el.style.opacity = '0'; it.shown = false; return; }

        ndc.copy(_v).project(camera);
        if (ndc.z > 1 || ndc.z < -1) { it.el.style.opacity = '0'; it.shown = false; return; }
        const sx = (ndc.x * 0.5 + 0.5) * w;
        const sy = (-ndc.y * 0.5 + 0.5) * h;
        if (sx < 40 || sx > w - 40 || sy < 20 || sy > h - 20) {
          it.el.style.opacity = '0'; it.shown = false; return;
        }

        // 遮挡检测（每 5 帧一次）
        if (doOcclusion) {
          ray.set(camera.position, toP.clone().normalize());
          ray.far = toP.length() - 0.03;
          const hits = ray.intersectObjects(occluders, false);
          let vis = true;
          for (let i = 0; i < hits.length; i++) {
            const o = hits[i].object;
            if (o.visible === false) continue;
            vis = false; break;
          }
          occCache[it.def.text] = vis;
        }
        if (!skipOcc && occCache[it.def.text] === false) { it.el.style.opacity = '0'; it.shown = false; return; }

        // 重叠避让
        const w0 = it.el.offsetWidth || 150, h0 = it.el.offsetHeight || 30;
        const rect = { x: sx, y: sy, w: w0, h: h0 };
        for (let i = 0; i < placed.length; i++) {
          const p = placed[i];
          if (Math.abs(p.x - rect.x) < (p.w + rect.w) * 0.5 + 6 &&
            Math.abs(p.y - rect.y) < (p.h + rect.h) * 0.5 + 6) {
            it.el.style.opacity = '0'; it.shown = false; return;
          }
        }
        placed.push(rect);

        it.el.style.transform = 'translate(' + Math.round(sx) + 'px,' + Math.round(sy) + 'px)';
        if (!it.shown) {
          it.el.style.opacity = '1';
          it.el.style.transition = 'opacity .28s ease';
          it.shown = true;
        }
      });
    }

    return { update: update, layer: layer };
  };
})(window.FL);
