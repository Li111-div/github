/* =========================================================================
 * 10-textures.js — 全程序化纹理（不依赖任何外部图片资源）
 * =======================================================================*/
(function (FL) {
  'use strict';
  const T = THREE;
  const TX = (FL.TX = {});

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function tex(c, repeat, srgb) {
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    if (repeat) t.repeat.set(repeat, repeat);
    t.anisotropy = 8;
    if (srgb) t.encoding = T.sRGBEncoding;
    t.needsUpdate = true;
    return t;
  }

  /* ---------------- 象牙白门板：极轻微微颗粒粗糙度 ---------------- */
  TX.ivoryRough = (function () {
    const s = 512,
      c = canvas(s, s),
      x = c.getContext('2d');
    x.fillStyle = '#9a9a9a';
    x.fillRect(0, 0, s, s);
    const img = x.getImageData(0, 0, s, s),
      d = img.data;
    const rnd = FL.rng(11);
    for (let i = 0; i < d.length; i += 4) {
      const n = (rnd() - 0.5) * 16;
      d[i] = d[i + 1] = d[i + 2] = FL.clamp(154 + n, 0, 255);
    }
    x.putImageData(img, 0, 0);
    // 极细的喷涂条纹，模拟家电钣金漆面
    x.globalAlpha = 0.05;
    for (let i = 0; i < 900; i++) {
      x.strokeStyle = rnd() > 0.5 ? '#ffffff' : '#5f5f5f';
      x.lineWidth = 0.6 + rnd() * 1.1;
      const y = rnd() * s;
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(s, y + (rnd() - 0.5) * 6);
      x.stroke();
    }
    return tex(c, 3);
  })();

  /* ---------------- 拉丝金属法线（把手 / 装饰条） ---------------- */
  TX.brushNormal = (function () {
    const s = 512,
      c = canvas(s, s),
      x = c.getContext('2d');
    x.fillStyle = '#8080ff';
    x.fillRect(0, 0, s, s);
    const rnd = FL.rng(23);
    for (let i = 0; i < 2600; i++) {
      const y = rnd() * s,
        a = rnd() * 0.5 - 0.25;
      x.strokeStyle = `rgba(${Math.round(128 + a * 90)},${Math.round(128 + a * 90)},255,0.5)`;
      x.lineWidth = 0.5 + rnd() * 0.9;
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(s, y + (rnd() - 0.5) * 3);
      x.stroke();
    }
    return tex(c, 2);
  })();

  /* ---------------- 门封条橡胶细纹 ---------------- */
  TX.rubberRough = (function () {
    const s = 256,
      c = canvas(s, s),
      x = c.getContext('2d');
    x.fillStyle = '#b0b0b0';
    x.fillRect(0, 0, s, s);
    const rnd = FL.rng(31);
    for (let i = 0; i < s; i += 4) {
      x.fillStyle = `rgba(0,0,0,${0.10 + rnd() * 0.16})`;
      x.fillRect(0, i, s, 1.6);
    }
    return tex(c, 1);
  })();

  /* ---------------- 发泡保温层：细密闭孔泡沫 ---------------- */
  TX.foamRough = (function () {
    const s = 256,
      c = canvas(s, s),
      x = c.getContext('2d');
    x.fillStyle = '#e8e8e8';
    x.fillRect(0, 0, s, s);
    const rnd = FL.rng(47);
    for (let i = 0; i < 5200; i++) {
      const r = 0.6 + rnd() * 2.1;
      x.beginPath();
      x.arc(rnd() * s, rnd() * s, r, 0, 6.2832);
      x.fillStyle = rnd() > 0.5 ? 'rgba(120,120,120,0.55)' : 'rgba(255,255,255,0.6)';
      x.fill();
    }
    return tex(c, 4);
  })();

  /* ---------------- 风道格栅（alpha） ---------------- */
  TX.grilleAlpha = (function () {
    const w = 256,
      h = 256,
      c = canvas(w, h),
      x = c.getContext('2d');
    x.clearRect(0, 0, w, h);
    const rows = 14;
    for (let i = 0; i < rows; i++) {
      const y = (i + 0.5) * (h / rows);
      const g = x.createLinearGradient(0, y - h / rows / 2.6, 0, y + h / rows / 2.6);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.fillRect(0, y - h / rows / 2.6, w, h / rows / 1.3);
    }
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  })();

  /* ---------------- 冷凝器背板散热格栅（深色细条） ---------------- */
  TX.ventAlpha = (function () {
    const w = 128,
      h = 128,
      c = canvas(w, h),
      x = c.getContext('2d');
    x.clearRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      x.fillStyle = 'rgba(255,255,255,1)';
      x.fillRect(0, i * (h / 6) + 4, w, h / 6 - 8);
    }
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  })();

  /* ---------------- 门体数字温控显示屏（自发光贴图） ---------------- */
  TX.display = function (fridgeT, freezerT, on) {
    const w = 512,
      h = 256,
      c = canvas(w, h),
      x = c.getContext('2d');
    x.fillStyle = '#06090c';
    x.fillRect(0, 0, w, h);
    if (!on) {
      x.fillStyle = 'rgba(120,140,150,0.35)';
      x.font = '600 34px system-ui,sans-serif';
      x.textAlign = 'center';
      x.fillText('— —', w / 2, h / 2 + 12);
      return new T.CanvasTexture(c);
    }
    x.strokeStyle = 'rgba(120,220,235,0.35)';
    x.lineWidth = 3;
    x.strokeRect(10, 10, w - 20, h - 20);
    x.fillStyle = '#cfeef5';
    x.font = '600 26px system-ui,sans-serif';
    x.textAlign = 'center';
    x.fillText('FREEZER', w * 0.26, 60);
    x.fillText('FRIDGE', w * 0.74, 60);
    x.fillStyle = '#ffffff';
    x.font = '300 76px system-ui,sans-serif';
    x.fillText(freezerT.toFixed(0) + '°', w * 0.26, 150);
    x.fillText(fridgeT.toFixed(0) + '°', w * 0.74, 150);
    x.fillStyle = '#7fd8e8';
    x.font = '400 22px system-ui,sans-serif';
    x.fillText('INVERTER', w * 0.26, 200);
    x.fillText('MULTI AIR', w * 0.74, 200);
    x.fillStyle = '#e0a86a';
    x.font = '400 18px system-ui,sans-serif';
    x.fillText('DIGITAL LAB · SIMULATED', w / 2, 232);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  };

  /* ---------------- 地面接触阴影渐变 ---------------- */
  TX.groundGrad = (function () {
    const s = 1024,
      c = canvas(s, s),
      x = c.getContext('2d');
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.30)');
    g.addColorStop(0.35, 'rgba(0,0,0,0.12)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    const t = new T.CanvasTexture(c);
    return t;
  })();

  /* ---------------- 舞台背景渐变 ---------------- */
  TX.stageBg = function (dark) {
    const w = 1024,
      h = 1024,
      c = canvas(w, h),
      x = c.getContext('2d');
    const g = x.createRadialGradient(w * 0.42, h * 0.34, 0, w * 0.5, h * 0.5, h * 0.95);
    if (dark) {
      g.addColorStop(0, '#2b3034');
      g.addColorStop(0.45, '#1d2225');
      g.addColorStop(1, '#0e1113');
    } else {
      g.addColorStop(0, '#f4f5ef');
      g.addColorStop(0.42, '#e4e6de');
      g.addColorStop(1, '#c6ccc4');
    }
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  };

  /* ---------------- PCB 板面（细密走线与焊盘） ---------------- */
  TX.pcb = (function () {
    const s = 512,
      c = canvas(s, s),
      x = c.getContext('2d');
    x.fillStyle = '#0d3a2c';
    x.fillRect(0, 0, s, s);
    const rnd = FL.rng(97);
    x.strokeStyle = 'rgba(190,225,205,0.30)';
    for (let i = 0; i < 190; i++) {
      x.lineWidth = 1 + rnd() * 1.6;
      x.beginPath();
      let px = rnd() * s,
        py = rnd() * s;
      x.moveTo(px, py);
      for (let k = 0; k < 3; k++) {
        if (rnd() > 0.5) px += (rnd() - 0.5) * 150;
        else py += (rnd() - 0.5) * 150;
        x.lineTo(px, py);
      }
      x.stroke();
    }
    x.fillStyle = 'rgba(230,200,120,0.75)';
    for (let i = 0; i < 260; i++) {
      x.beginPath();
      x.arc(rnd() * s, rnd() * s, 1.4 + rnd() * 2.4, 0, 6.2832);
      x.fill();
    }
    return tex(c, 1, true);
  })();

  /* ---------------- 压缩机外壳拉丝黑烤漆法线 ---------------- */
  TX.paintNormal = (function () {
    const s = 256,
      c = canvas(s, s),
      x = c.getContext('2d');
    x.fillStyle = '#8080ff';
    x.fillRect(0, 0, s, s);
    const rnd = FL.rng(131);
    for (let i = 0; i < 1400; i++) {
      const y = rnd() * s,
        a = rnd() * 0.22 - 0.11;
      x.strokeStyle = `rgba(${Math.round(128 + a * 255)},${Math.round(128 + a * 255)},255,0.5)`;
      x.lineWidth = 0.5 + rnd();
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(s, y + (rnd() - 0.5) * 2);
      x.stroke();
    }
    return tex(c, 3);
  })();

  /* ---------------- 铝翅片微纹理 ---------------- */
  TX.finRough = (function () {
    const s = 256,
      c = canvas(s, s),
      x = c.getContext('2d');
    x.fillStyle = '#7d7d7d';
    x.fillRect(0, 0, s, s);
    const rnd = FL.rng(151);
    for (let i = 0; i < 4200; i++) {
      x.fillStyle = `rgba(${rnd() > 0.5 ? 255 : 40},${rnd() > 0.5 ? 255 : 40},${rnd() > 0.5 ? 255 : 40},0.06)`;
      x.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 3, 1 + rnd() * 3);
    }
    return tex(c, 2);
  })();
})(window.FL);
