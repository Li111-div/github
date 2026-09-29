/* =========================================================================
 * 20-materials.js — PBR 材质库
 * 视觉核心：象牙白 ≠ 纯白；每种材料必须有独立的 roughness / metalness /
 * clearcoat / 反射特征，避免“全场景同一材质”的玩具感。
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;
  const M = (FL.MAT = {});

  function std(o) {
    const m = new T.MeshStandardMaterial(o);
    return m;
  }
  function phys(o) {
    const m = new T.MeshPhysicalMaterial(o);
    return m;
  }

  /* ------------------------- 钣金 / 面板 ------------------------- */
  // 象牙白珠光门板：暖白 + 极轻金属细闪 + 清漆层
  M.ivoryDoor = phys({
    color: 0xe9e0d0,
    metalness: 0.20,
    roughness: 0.30,
    clearcoat: 0.16,
    clearcoatRoughness: 0.26,
    envMapIntensity: 1.05,
    roughnessMap: FL.TX.ivoryRough,
  });

  // 箱体侧板 / 顶板：比门板更哑光、更冷一点的灰白
  M.ivoryShell = phys({
    color: 0xd9d6cd,
    metalness: 0.16,
    roughness: 0.40,
    clearcoat: 0.08,
    clearcoatRoughness: 0.34,
    envMapIntensity: 0.9,
    roughnessMap: FL.TX.ivoryRough,
  });

  // 门缝阴影 / 深灰装饰
  M.darkTrim = std({ color: 0x1d2124, metalness: 0.55, roughness: 0.42, envMapIntensity: 1.0 });

  // 高级金属把手：拉丝不锈钢
  M.brushedSteel = std({
    color: 0xb9bdc0,
    metalness: 0.94,
    roughness: 0.24,
    normalMap: FL.TX.brushNormal,
    normalScale: new T.Vector2(0.35, 0.35),
    envMapIntensity: 1.25,
  });

  // 铝（蒸发器翅片 / 内衬包边）
  M.aluminium = std({
    color: 0xb4bcc0,
    metalness: 0.86,
    roughness: 0.36,
    roughnessMap: FL.TX.finRough,
    envMapIntensity: 0.75,
  });

  // 铜管：暖铜色，明显区别于铝
  M.copper = std({ color: 0xb06a3c, metalness: 0.92, roughness: 0.31, envMapIntensity: 1.15 });
  M.copperDark = std({ color: 0x8c5230, metalness: 0.9, roughness: 0.4, envMapIntensity: 1.0 });

  /* ------------------------- 塑料 / 内胆 ------------------------- */
  // 内胆：高漫反射、微暖灰、无金属感
  M.liner = std({
    color: 0xc6c0b1,
    metalness: 0.02,
    roughness: 0.70,
    roughnessMap: FL.TX.foamRough,
    envMapIntensity: 0.22,
  });

  // 内胆深色背板（风道面板）
  M.linerDark = std({ color: 0x9c9a8f, metalness: 0.03, roughness: 0.74, envMapIntensity: 0.20 });

  // 发泡保温层
  M.foam = std({
    color: 0xdccea6,
    metalness: 0.0,
    roughness: 0.95,
    roughnessMap: FL.TX.foamRough,
    envMapIntensity: 0.35,
  });

  // 抽屉 / 门架：半透明烟灰塑料
  M.smokePlastic = phys({
    color: 0x93a3aa,
    metalness: 0.0,
    roughness: 0.30,
    transmission: 0.0,
    transparent: true,
    opacity: 0.42,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.45,
    depthWrite: false,
  });

  // 白色工程塑料（导轨 / 卡槽 / 风机护圈）
  M.whitePlastic = std({ color: 0xd3cfc5, metalness: 0.02, roughness: 0.52, envMapIntensity: 0.26 });
  M.greyPlastic = std({ color: 0x767c81, metalness: 0.05, roughness: 0.58, envMapIntensity: 0.28 });

  // 门封条：哑光黑橡胶
  M.gasket = std({
    color: 0x1a1c1e,
    metalness: 0.0,
    roughness: 0.92,
    roughnessMap: FL.TX.rubberRough,
    envMapIntensity: 0.35,
  });

  /* ------------------------- 玻璃 ------------------------- */
  // 钢化玻璃搁板：有厚度、边缘青灰、主体透明但可见
  M.glass = phys({
    color: 0xa9d4dd,
    metalness: 0.0,
    roughness: 0.045,
    transparent: true,
    opacity: 0.34,
    transmission: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    ior: 1.52,
    reflectivity: 0.7,
    side: T.DoubleSide,
    envMapIntensity: 1.5,
    depthWrite: false,
  });

  // 显示屏黑玻璃
  M.displayGlass = phys({
    color: 0x0a0e12,
    metalness: 0.15,
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.2,
  });

  /* ------------------------- 机械 / 电气 ------------------------- */
  // 压缩机黑色烤漆（不能纯黑吸光）
  M.compressorPaint = std({
    color: 0x1f2225,
    metalness: 0.30,
    roughness: 0.42,
    normalMap: FL.TX.paintNormal,
    normalScale: new T.Vector2(0.22, 0.22),
    envMapIntensity: 0.80,
  });

  // 剖切后的金属铸件内部
  M.castIron = std({ color: 0x4e5458, metalness: 0.7, roughness: 0.55, envMapIntensity: 0.9 });
  M.motorCopper = std({ color: 0xa9612f, metalness: 0.85, roughness: 0.42, envMapIntensity: 1.0 });
  M.steel = std({ color: 0x7d8288, metalness: 0.86, roughness: 0.43, envMapIntensity: 0.68 });

  // PCB
  M.pcb = std({ color: 0x1d5a44, map: FL.TX.pcb, metalness: 0.25, roughness: 0.55, envMapIntensity: 0.8 });
  M.chip = std({ color: 0x14181c, metalness: 0.25, roughness: 0.42, envMapIntensity: 0.9 });
  M.cap = std({ color: 0x2f3b52, metalness: 0.35, roughness: 0.45, envMapIntensity: 0.9 });
  M.wireRed = std({ color: 0x8f2c25, metalness: 0.05, roughness: 0.6 });
  M.wireBlack = std({ color: 0x1c1f22, metalness: 0.05, roughness: 0.6 });
  M.wireBlue = std({ color: 0x2b4a7a, metalness: 0.05, roughness: 0.6 });

  /* ------------------------- 功能材质 ------------------------- */
  // 内部照明
  M.interiorLight = std({
    color: 0xfff6e4,
    emissive: 0xfff1d8,
    emissiveIntensity: 0,
    metalness: 0.0,
    roughness: 0.5,
  });

  // 除霜加热管
  M.heater = std({
    color: 0x6a6259,
    emissive: 0xff5a1e,
    emissiveIntensity: 0,
    metalness: 0.6,
    roughness: 0.4,
  });

  // 运行指示灯
  M.led = std({ color: 0x0a2a2e, emissive: 0x4fe3ff, emissiveIntensity: 1.2, roughness: 0.3 });

  // 热流辉光（排热）
  M.heatGlow = new T.MeshBasicMaterial({
    color: 0xff9a52,
    transparent: true,
    opacity: 0.0,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide,
  });

  // 空气流线
  M.airLine = new T.MeshBasicMaterial({
    color: 0x7fd6e8,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    blending: T.AdditiveBlending,
  });

  // 制冷剂管路发光（Cycle 模式高亮）
  M.refLineGlow = new T.MeshBasicMaterial({
    color: 0xffb066,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: T.AdditiveBlending,
  });

  /* 统一替换环境贴图强度（供舞台切换明暗时使用） */
  M.setEnvIntensity = function (k) {
    Object.keys(M).forEach(function (key) {
      const m = M[key];
      if (m && m.isMeshStandardMaterial && m.envMapIntensity !== undefined) {
        if (m.userData._baseEnv === undefined) m.userData._baseEnv = m.envMapIntensity;
        m.envMapIntensity = m.userData._baseEnv * k;
      }
    });
  };
})(window.FL);
