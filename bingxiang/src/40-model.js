/* =========================================================================
 * 40-model.js — 整机装配
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;

  FL.buildModel = function (scene) {
    const root = new T.Group();
    root.name = 'Refrigerator';
    scene.add(root);

    const cabinet = FL.buildCabinet(root);
    const doors = FL.buildDoors(root);
    const interior = FL.buildInterior(root);
    const cooling = FL.buildCooling(root);
    const electronics = FL.buildElectronics(root);
    const food = FL.buildFood(root, { doors: doors, interior: interior });

    // 统计
    let meshes = 0, tris = 0;
    root.traverse(function (o) {
      if (o.isMesh || o.isInstancedMesh) {
        meshes++;
        const g = o.geometry;
        if (g && g.index) tris += (g.index.count / 3) * (o.isInstancedMesh ? o.count : 1);
        else if (g && g.attributes.position) tris += (g.attributes.position.count / 3) * (o.isInstancedMesh ? o.count : 1);
      }
    });

    const box = new T.Box3().setFromObject(root);
    FL.log('model built: parts=' + FL.parts.size + ' meshes=' + meshes + ' tris≈' + Math.round(tris));

    return {
      root: root,
      cabinet: cabinet,
      doors: doors,
      interior: interior,
      food: food,
      cooling: cooling,
      electronics: electronics,
      stats: { parts: FL.parts.size, meshes: meshes, tris: Math.round(tris) },
      bounds: box,
    };
  };

  /** 供右侧“结构”面板使用：按分类整理可特写部件 */
  FL.componentCatalog = function () {
    const groups = {
      cooling: { label: '制冷系统', items: [] },
      cabinet: { label: '箱体结构', items: [] },
      door: { label: '门体系统', items: [] },
      interior: { label: '内部储物', items: [] },
      electronics: { label: '电气控制', items: [] },
      food: { label: '食材（参与热惯性）', items: [] },
    };
    FL.parts.forEach(function (rec) {
      if (!rec.meta || !rec.meta.name) return;
      const cat = rec.meta.category || 'other';
      if (!groups[cat]) groups[cat] = { label: '其他', items: [] };
      groups[cat].items.push({ id: rec.id, meta: rec.meta });
    });
    return groups;
  };
})(window.FL);
