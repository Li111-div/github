/* 食材摆放校验：包围盒是否越出容器、是否互相穿模 */
const { chromium } = require('playwright-core');
const path = require('path');
const EXE = 'C:/Users/31009/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const URL = 'file:///' + path.join(__dirname, 'OPEN_ME.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 800, height: 500 } });
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__FL_APP__);
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const a = window.__FL_APP__;
    const D = window.FL.DIM;
    const box = new THREE.Box3(), v = new THREE.Vector3();
    a.model.root.updateMatrixWorld(true);
    // 紧致包围盒：逐顶点变换，避免旋转导致 AABB 膨胀
    function tightBox(obj) {
      box.makeEmpty();
      obj.traverse(function (o) {
        if (!o.isMesh || o.isInstancedMesh) return;
        const pos = o.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
          box.expandByPoint(v);
        }
      });
      return box;
    }

    // 容器定义
    const CAV = {
      left:  { x0: D.freeX0 + 0.008, x1: D.freeX1 - 0.008, y0: D.cavY0, y1: D.cavY1, z0: D.cavZBack, z1: D.cavZFront },
      right: { x0: D.fridX0 + 0.008, x1: D.fridX1 - 0.008, y0: D.cavY0, y1: D.cavY1, z0: D.cavZBack, z1: D.cavZFront },
    };
    const FRESH_CX = (D.fridX0 + D.fridX1) / 2, FROZ_CX = (D.freeX0 + D.freeX1) / 2;

    const parts = ['foodFreshShelf','foodFrozenShelf','foodDrawerR1','foodDrawerR2','foodDrawerL1','foodDrawerL2','foodDoorLeft','foodDoorRight'];
    const groups = {};
    const issues = [];

    parts.forEach(id => {
      const rec = window.FL.parts.get(id);
      if (!rec) { issues.push('missing part: ' + id); return; }
      const items = rec.group.children.filter(c => c.userData.foodLevel !== undefined);
      groups[id] = items.map((g, i) => {
        tightBox(g);
        const isDrawer = id.indexOf('Drawer') >= 0;
        const isDoor = id.indexOf('Door') >= 0;
        const side = (id.indexOf('Frozen') >= 0 || id.indexOf('L1') >= 0 || id.indexOf('L2') >= 0 || id.indexOf('Left') >= 0) ? 'left' : 'right';
        const cav = CAV[side];
        const o = {
          i: i, id: id,
          min: [+box.min.x.toFixed(3), +box.min.y.toFixed(3), +box.min.z.toFixed(3)],
          max: [+box.max.x.toFixed(3), +box.max.y.toFixed(3), +box.max.z.toFixed(3)],
        };
        const ex = [];
        if (!isDoor) {
          if (box.min.x < cav.x0 - 1e-4) ex.push('x- ' + (cav.x0 - box.min.x).toFixed(3));
          if (box.max.x > cav.x1 + 1e-4) ex.push('x+ ' + (box.max.x - cav.x1).toFixed(3));
          if (box.min.y < cav.y0 - 1e-4) ex.push('y- ' + (cav.y0 - box.min.y).toFixed(3));
          if (box.max.y > cav.y1 + 1e-4) ex.push('y+ ' + (box.max.y - cav.y1).toFixed(3));
          if (box.min.z < cav.z0 - 1e-4) ex.push('z- ' + (cav.z0 - box.min.z).toFixed(3));
          if (box.max.z > cav.z1 + 1e-4) ex.push('z+ ' + (box.max.z - cav.z1).toFixed(3));
          if (isDrawer) {
            const dcx = side === 'left' ? FROZ_CX : FRESH_CX;
            if (box.max.z > 0.196) ex.push('穿抽屉前板 ' + (box.max.z - 0.196).toFixed(3));
            if (Math.abs(box.min.x - dcx) > 0.150 || Math.abs(box.max.x - dcx) > 0.150) ex.push('越抽屉侧壁');
          }
        } else {
          // 门架：世界 z ∈ [0.214, 0.306]
          if (box.max.z > 0.306) ex.push('穿门内衬 ' + (box.max.z - 0.306).toFixed(3));
          if (box.min.z < 0.214) ex.push('穿门前挡板 ' + (0.214 - box.min.z).toFixed(3));
          if (box.min.y < D.doorY0) ex.push('y-');
          if (box.max.y > D.doorY1) ex.push('y+');
        }
        o.ex = ex;
        if (ex.length) issues.push(id + '#' + i + ' → ' + ex.join(', '));
        return o;
      });
    });

    // 同容器内食材互相穿模（允许 5 mm 以内的轻接触）
    const overlaps = [];
    Object.keys(groups).forEach(k => {
      const g = groups[k];
      for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
        const A = g[i], B = g[j];
        const ox = Math.min(A.max[0], B.max[0]) - Math.max(A.min[0], B.min[0]);
        const oy = Math.min(A.max[1], B.max[1]) - Math.max(A.min[1], B.min[1]);
        const oz = Math.min(A.max[2], B.max[2]) - Math.max(A.min[2], B.min[2]);
        if (ox > 0.006 && oy > 0.006 && oz > 0.006) {
          overlaps.push(k + ' #' + i + '×#' + j + ' 重叠 ' + [ox, oy, oz].map(x => x.toFixed(3)).join('/'));
        }
      }
    });

    return {
      counts: Object.keys(groups).reduce((m, k) => (m[k] = groups[k].length, m), {}),
      total: a.model.food.total,
      meshes: a.model.food.meshCount,
      outOfBounds: issues,
      overlaps: overlaps,
      load65Visible: a.model.food.visibleCount,
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
