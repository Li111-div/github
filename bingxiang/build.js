/* =========================================================================
 * build.js — 把 shell.html + vendor/three.min.js + src/*.js 打包为
 *            自包含、可离线双击打开的 OPEN_ME.html
 * =======================================================================*/
const fs = require('fs');
const path = require('path');

const root = __dirname;
const srcDir = path.join(root, 'src');

const ORDER = [
  '00-core.js',
  '10-textures.js',
  '20-materials.js',
  '30-model-cabinet.js',
  '31-model-doors.js',
  '32-model-interior.js',
  '33-model-cooling.js',
  '34-model-electronics.js',
  '36-model-food.js',
  '40-model.js',
  '50-stage.js',
  '55-controls.js',
  '60-camera.js',
  '65-kinematics.js',
  '70-thermal.js',
  '75-flow.js',
  '80-labels.js',
  '85-ui.js',
  '90-main.js',
];

function esc(s) {
  return s.replace(/<\/script/gi, '<\\/script');
}

const shell = fs.readFileSync(path.join(root, 'shell.html'), 'utf8');
const three = fs.readFileSync(path.join(root, 'vendor', 'three.min.js'), 'utf8');

let app = '';
ORDER.forEach(function (f) {
  const p = path.join(srcDir, f);
  if (!fs.existsSync(p)) throw new Error('missing source: ' + f);
  app += '\n/* ===== ' + f + ' ===== */\n' + fs.readFileSync(p, 'utf8') + '\n';
});

const block =
  '<script>/* three.js r147 (MIT) — 本地内联，保证离线可用 */\n' + esc(three) + '\n</script>\n' +
  '<script>/* Refrigerator Digital Lab — application bundle */\n' + esc(app) + '\n</script>';

const out = shell.replace('<!-- __APP_SCRIPTS__ -->', block);
fs.writeFileSync(path.join(root, 'OPEN_ME.html'), out, 'utf8');

/* 同时产出一个多文件版入口，便于二次开发 */
const devShell = shell.replace(
  '<!-- __APP_SCRIPTS__ -->',
  '<script src="vendor/three.min.js"></script>\n' +
    ORDER.map((f) => '<script src="src/' + f + '"></script>').join('\n')
);
fs.writeFileSync(path.join(root, 'index.html'), devShell, 'utf8');

const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(0);
console.log('✓ OPEN_ME.html  ' + kb + ' KB  (' + ORDER.length + ' modules + three.js inlined)');
console.log('✓ index.html    多文件开发入口');
