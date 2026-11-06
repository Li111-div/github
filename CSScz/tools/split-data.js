/**
 * 将 data/properties.json 拆分为网页加载的 6 个数据分片，并生成 data/meta.js
 * 用法：node tools/split-data.js
 * 依赖：仅 Node.js 内置模块，无需安装 npm 包
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const source = path.join(DATA_DIR, 'properties.json');

if (!fs.existsSync(source)) {
  console.error('未找到 data/properties.json');
  process.exit(1);
}

const properties = JSON.parse(fs.readFileSync(source, 'utf8'));
if (!Array.isArray(properties) || !properties.length) {
  console.error('data/properties.json 必须是非空数组');
  process.exit(1);
}

const CATEGORIES = [
  { id: 'layout', name: '布局与定位', icon: 'layout', desc: 'display、position、浮动、包含块与容器查询' },
  { id: 'flexgrid', name: '弹性与网格', icon: 'grid', desc: 'Flexbox、Grid 与对齐分布' },
  { id: 'box', name: '盒模型与尺寸', icon: 'box', desc: '尺寸、内外边距、宽高比与对象适配' },
  { id: 'typography', name: '字体与排版', icon: 'type', desc: '字体、文本、书写模式与装饰' },
  { id: 'color', name: '颜色与背景', icon: 'palette', desc: '颜色、背景、渐变与色彩方案' },
  { id: 'border', name: '边框与轮廓', icon: 'square', desc: '边框、圆角、轮廓与阴影' },
  { id: 'effect', name: '滤镜与效果', icon: 'sparkles', desc: '滤镜、混合模式、不透明度与图像渲染' },
  { id: 'animation', name: '动画与过渡', icon: 'play', desc: '关键帧动画、过渡与滚动驱动动画' },
  { id: 'transform', name: '变换与运动', icon: 'move', desc: '2D/3D 变换、透视与运动路径' },
  { id: 'list', name: '列表与表格', icon: 'list', desc: '列表标记、计数器与表格布局' },
  { id: 'scroll', name: '滚动与溢出', icon: 'scroll', desc: '溢出裁剪、滚动捕捉与滚动条' },
  { id: 'fragmentation', name: '多列与分页', icon: 'columns', desc: '多列布局、分片与打印分页' },
  { id: 'mask', name: '遮罩与裁剪', icon: 'mask', desc: 'mask、clip-path 与形状' },
  { id: 'content', name: '内容与交互', icon: 'cursor', desc: '生成内容、光标、选择与交互行为' },
  { id: 'svg', name: 'SVG 与 MathML', icon: 'svg', desc: 'SVG 填充描边与 MathML 排版' },
  { id: 'ext', name: '扩展与非标准', icon: 'extension', desc: '浏览器私有前缀、历史属性与已废弃属性' },
  { id: 'other', name: '其他与通用', icon: 'more', desc: '自定义属性、继承控制与杂项' },
];

const STATUS_LABEL = { standard: '标准', experimental: '实验性', nonstandard: '非标准', obsolete: '已废弃' };

const byCategory = {};
const byStatus = {};
for (const p of properties) {
  byCategory[p.category] = (byCategory[p.category] || 0) + 1;
  byStatus[p.status] = (byStatus[p.status] || 0) + 1;
}

const meta = {
  title: 'CSS 属性图谱',
  subtitle: 'CSS Property Finder',
  total: properties.length,
  generatedAt: new Date().toISOString().slice(0, 10),
  categories: CATEGORIES.map((c) => ({ ...c, count: byCategory[c.id] || 0 })),
  statuses: ['standard', 'experimental', 'nonstandard', 'obsolete']
    .filter((id) => byStatus[id])
    .map((id) => ({ id, label: STATUS_LABEL[id] || id, count: byStatus[id] })),
  stats: {
    inherited: properties.filter((p) => p.inherited === '是').length,
    animatable: properties.filter((p) => p.animation && !/不可动画/.test(p.animation)).length,
    core: properties.filter((p) => p.tier === 'core').length,
    extra: properties.filter((p) => p.tier === 'extra').length,
    standard: properties.filter((p) => p.status === 'standard').length,
    experimental: properties.filter((p) => p.status === 'experimental').length,
    nonstandard: properties.filter((p) => p.status === 'nonstandard').length,
    obsolete: properties.filter((p) => p.status === 'obsolete').length,
  },
  sources: [
    { name: 'MDN CSS Reference', url: 'https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference' },
    { name: 'mdn-data', url: 'https://github.com/mdn/data' },
    { name: 'MDN Browser Compat Data', url: 'https://github.com/mdn/browser-compat-data' },
    { name: 'W3C CSS 规范', url: 'https://www.w3.org/Style/CSS/' },
  ],
};

fs.writeFileSync(path.join(DATA_DIR, 'meta.js'), `/* 自动生成：CSS 属性图谱元数据 */\nwindow.CSS_META = ${JSON.stringify(meta, null, 2)};\n`, 'utf8');

const CHUNKS = 6;
const per = Math.ceil(properties.length / CHUNKS);
for (let i = 0; i < CHUNKS; i++) {
  const slice = properties.slice(i * per, (i + 1) * per);
  const body = `/* 自动生成：CSS 属性数据 第 ${i + 1}/${CHUNKS} 部分（共 ${slice.length} 条） */\nwindow.CSS_DATA = (window.CSS_DATA || []).concat(${JSON.stringify(slice)});\n`;
  fs.writeFileSync(path.join(DATA_DIR, `properties-${String(i + 1).padStart(2, '0')}.js`), body, 'utf8');
}

console.log(`已生成 ${properties.length} 条属性数据：`);
console.log(`- data/meta.js（${meta.categories.length} 个分类，${meta.statuses.length} 种状态）`);
console.log(`- data/properties-01.js ~ properties-06.js（共 ${CHUNKS} 个分片）`);
