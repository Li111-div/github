/* =========================================================================
 * 50-stage.js — 渲染器 / 影棚环境 / 灯光 / 地面
 * 目标：高端家电广告棚拍质感，而非 Three.js 教程。
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;

  /* 径向 alpha（无限地面淡出） */
  function radialAlpha() {
    const s = 512;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.42, '#e8e8e8');
    g.addColorStop(0.72, '#4a4a4a');
    g.addColorStop(1, '#000000');
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    const t = new T.CanvasTexture(c);
    return t;
  }

  FL.createStage = function (container) {
    /* ---------------------- 渲染器 ---------------------- */
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    renderer.physicallyCorrectLights = false;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.05, 120);

    /* ---------------------- 影棚环境贴图（PMREM） ---------------------- */
    function buildEnvMap() {
      const es = new T.Scene();
      es.background = new T.Color(0.05, 0.055, 0.06);
      const box = (pos, size, color, intensity) => {
        const m = new T.Mesh(
          new T.BoxGeometry(size[0], size[1], size[2]),
          new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(intensity) })
        );
        m.position.set(pos[0], pos[1], pos[2]);
        es.add(m);
        return m;
      };
      // 大面积顶部软光箱（主光）
      box([0, 7.2, 0], [22, 0.2, 22], 0xffffff, 2.7);
      // 左侧主轮廓光（暖）
      box([-8.5, 3.4, 2.4], [0.2, 13, 15], 0xfff2e0, 2.5);
      // 右后侧 rim light（冷）
      box([9.5, 3.8, -3.2], [0.2, 11, 13], 0xe6f0ff, 2.05);
      // 前方柔和补光
      box([0, 2.6, 9.5], [18, 11, 0.2], 0xffffff, 0.88);
      // 地面反弹（暖灰）
      box([0, -1.4, 0], [24, 0.2, 24], 0xd9d2c4, 0.82);
      // 背部暗区，制造主体轮廓对比
      box([0, 2.6, -9.5], [20, 12, 0.2], 0x2b2e31, 0.55);
      box([-9.5, 3, 0], [0.2, 12, 16], 0x3a3d40, 0.40);
      const pmrem = new T.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const rt = pmrem.fromScene(es, 0.035);
      pmrem.dispose();
      es.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
      return rt.texture;
    }
    scene.environment = buildEnvMap();

    /* ---------------------- 背景 ---------------------- */
    let bgTexLight = FL.TX.stageBg(false);
    let bgTexDark = FL.TX.stageBg(true);
    let bgMesh = new T.Mesh(
      new T.SphereGeometry(40, 32, 24),
      new T.MeshBasicMaterial({ map: bgTexLight, side: T.BackSide, toneMapped: false, depthWrite: false })
    );
    bgMesh.name = 'backdrop';
    scene.add(bgMesh);

    /* ---------------------- 地面 ---------------------- */
    const groundMat = new T.MeshStandardMaterial({
      color: 0xd6d8d0,
      roughness: 0.93,
      metalness: 0.0,
      transparent: true,
      alphaMap: radialAlpha(),
      envMapIntensity: 0.55,
      depthWrite: true,
    });
    const ground = new T.Mesh(new T.CircleGeometry(9, 72), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);

    // 接触阴影加强（柔和落地感）
    const contact = new T.Mesh(
      new T.PlaneGeometry(1.75, 1.35),
      new T.MeshBasicMaterial({
        map: FL.TX.groundGrad, transparent: true, depthWrite: false,
        opacity: 0.85, toneMapped: false,
      })
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(0.0, 0.0016, 0.02);
    contact.name = 'contactShadow';
    scene.add(contact);

    /* ---------------------- 灯光层级 ---------------------- */
    // ① 基础环境（仅做补底，避免纯黑）
    const hemi = new T.HemisphereLight(0xffffff, 0xbfc3c0, 0.24);
    scene.add(hemi);

    // ② 左前主光（大面积柔光，唯一投影光源）
    const key = new T.DirectionalLight(0xfff6ec, 1.72);
    key.position.set(2.9, 4.6, 3.6);
    key.target.position.set(-0.05, 0.92, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera;
    sc.left = -1.85; sc.right = 1.85; sc.top = 2.55; sc.bottom = -0.55; sc.near = 0.4; sc.far = 14;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.022;
    key.shadow.radius = 3;
    scene.add(key);
    scene.add(key.target);

    // ③ 左侧轮廓光
    const rimL = new T.DirectionalLight(0xdfeaf2, 0.50);
    rimL.position.set(-4.2, 2.6, 1.4);
    rimL.target.position.set(0, 1.0, 0);
    scene.add(rimL);
    scene.add(rimL.target);

    // ④ 右后侧 rim light（勾边）
    const rimR = new T.DirectionalLight(0xeaf2ff, 1.42);
    rimR.position.set(-2.2, 3.2, -4.4);
    rimR.target.position.set(0, 1.0, 0);
    scene.add(rimR);
    scene.add(rimR.target);

    // ⑤ 正面极柔补光（消除死黑，但不过曝）
    const fill = new T.DirectionalLight(0xffffff, 0.24);
    fill.position.set(0.6, 1.8, 5.0);
    fill.target.position.set(0, 1.0, 0);
    scene.add(fill);
    scene.add(fill.target);

    // ⑥ 箱内照明（开门时点亮）
    const innerL = new T.PointLight(0xfff0d6, 0.0, 2.6, 1);
    innerL.position.set(-0.23, 1.62, 0.06);
    scene.add(innerL);
    const innerR = new T.PointLight(0xfff0d6, 0.0, 2.6, 1);
    innerR.position.set(0.23, 1.62, 0.06);
    scene.add(innerR);

    // ⑦ 机械舱局部补光（Cycle / 特写时启用）
    const bayL = new T.PointLight(0xffe6cc, 0.0, 2.0, 1);
    bayL.position.set(0.05, 0.34, -0.05);
    scene.add(bayL);

    /* ---------------------- 背景切换 ---------------------- */
    const stage = {
      renderer: renderer,
      scene: scene,
      camera: camera,
      ground: ground,
      contact: contact,
      key: key,
      lights: { hemi: hemi, key: key, rimL: rimL, rimR: rimR, fill: fill, innerL: innerL, innerR: innerR, bayL: bayL },
      dark: false,
    };

    stage.setBackground = function (dark) {
      stage.dark = dark;
      bgMesh.material.map = dark ? bgTexDark : bgTexLight;
      bgMesh.material.needsUpdate = true;
      groundMat.color.set(dark ? 0x2f3336 : 0xd6d8d0);
      groundMat.envMapIntensity = dark ? 0.35 : 0.55;
      contact.material.opacity = dark ? 0.55 : 0.85;
      hemi.intensity = dark ? 0.13 : 0.24;
      rimR.intensity = dark ? 1.70 : 1.42;
      rimL.intensity = dark ? 0.36 : 0.50;
      fill.intensity = dark ? 0.12 : 0.24;
      key.intensity = dark ? 1.55 : 1.72;
      renderer.toneMappingExposure = dark ? 1.06 : 0.94;
      FL.MAT.setEnvIntensity(dark ? 0.85 : 1.0);
    };

    stage.resize = function () {
      const w = container.clientWidth, h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    /* ---------------------- 剖切面 ---------------------- */
    const clipPlane = new T.Plane(new T.Vector3(-1, 0, 0), 0.47);
    const SECTION_MATS = [
      'ivoryDoor', 'ivoryShell', 'darkTrim', 'brushedSteel', 'aluminium', 'copper', 'copperDark',
      'liner', 'linerDark', 'foam', 'whitePlastic', 'greyPlastic', 'gasket', 'glass', 'displayGlass',
      'compressorPaint', 'castIron', 'motorCopper', 'steel', 'wireSteel', 'fanPlastic', 'pcb', 'chip', 'cap',
      'wireRed', 'wireBlack', 'wireBlue', 'heater', 'interiorLight', 'smokePlastic',
    ];
    stage.clipPlane = clipPlane;
    stage.setSection = function (on, t) {
      const d = FL.lerp(-0.50, 0.50, t === undefined ? 0.5 : t);
      clipPlane.constant = d;
      SECTION_MATS.forEach(function (k) {
        const m = FL.MAT[k];
        if (!m) return;
        m.clippingPlanes = on ? [clipPlane] : null;
        if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
          if (m.userData._baseSide === undefined) m.userData._baseSide = m.side;
          if (m.userData._baseColor === undefined) m.userData._baseColor = m.color.clone();
          if (on) {
            if (m.userData._secEnv === undefined) m.userData._secEnv = m.envMapIntensity;
            m.side = T.DoubleSide;
            // 剖面下压低整体亮度，让 外皮 / 保温 / 内胆 三层灰度差真正读得出来
            m.color.copy(m.userData._baseColor).multiplyScalar(0.80);
            m.envMapIntensity = m.userData._secEnv * 0.5;
          } else {
            m.side = m.userData._baseSide === undefined ? m.side : m.userData._baseSide;
            m.color.copy(m.userData._baseColor);
            if (m.userData._secEnv !== undefined) {
              m.envMapIntensity = m.userData._secEnv;
              m.userData._secEnv = undefined;
            }
          }
        }
        m.needsUpdate = true;
      });
    };

    return stage;
  };
})(window.FL);
