# 南孚全球官网（nanfu.global）前端镜像 · 动效学习指南

> 这是对 [https://www.nanfu.global/](https://www.nanfu.global/) 前端的完整本地镜像，
> 用于**学习它的滚动逐帧动画 / 平滑滚动 / 进场动效**。所有 HTML、CSS、JS、图片、序列帧、视频、字体均已下载，本地可运行。
>
> 镜像仅供个人学习研究，版权归原网站所有，请勿用于商业用途。

---

## 一、怎么运行（重要：要用本地服务器，不能直接双击 HTML）

**最简单**：双击目录里的 **`启动本地站点.bat`**（已装 Python 即可，会自动打开浏览器）。

手动方式：在本目录下执行
```bash
python -m http.server 8000
```
然后浏览器访问：

| 页面 | 地址 |
|---|---|
| 首页（动效最集中） | http://localhost:8000/ |
| 电池产品列表 | http://localhost:8000/batteries |
| 碱性电池详情 | http://localhost:8000/batteries/nanfu-alkaline |
| 充电宝 | http://localhost:8000/power-bank |
| 关于我们 | http://localhost:8000/about |
| 联系我们 | http://localhost:8000/contact |
| **动效最小复现 Demo（强烈建议先看）** | http://localhost:8000/动效原理demo.html |

> 为什么必须用服务器？因为代码里资源用的是绝对路径 `/templates/...`，且序列帧、字体等需要通过 HTTP 加载。
> 直接双击 HTML 用 `file://` 打开会因路径协议问题加载失败。

---

## 二、目录结构

```
nanfu-global/
├── index.html                 首页（服务端渲染，动效全在这一页）
├── 启动本地站点.bat           一键启动
├── 动效原理demo.html          ★ 带中文注释的最小复现 Demo（重点看这个）
├── templates/assets/
│   ├── index.d9c9dbee1.js     ★ 主 JS（现代浏览器，type=module）—— 所有动效逻辑
│   ├── index.091b56b9.js       主 JS（老浏览器兼容版，nomodule），内容基本相同
│   ├── index.55.css            主样式（226KB，含所有动画 keyframes）
│   ├── respone.css             响应式补充
│   ├── iconfont.*.woff2/ttf    图标字体
│   └── home/
│       ├── bannerFm/           ★ 主视觉序列帧 120 张（PC，webp，1920×1000）
│       ├── bannerFm_app/       ★ 主视觉序列帧 120 张（手机，jpg，1080×1700）
│       ├── batteryFm/          ★ 电池旋转序列帧 150 张（webp）
│       ├── media.mp4 / webm    开场/循环背景视频
│       ├── loop.mp4 / in.mp4   循环背景视频
│       └── map/  bg.png ...    地图、背景等
├── upfiles/                   后台上传的产品图、媒体图（按月分目录）
├── batteries/ about/ power-bank/ contact/   各子页面（各自的 index.html）
└── _external/                 Google Fonts 等外部资源的本地副本
```

---

## 三、动效技术栈（先看这张图，再看代码）

| 技术 | 版本 | 作用 | 丝滑感/酷炫感的来源 |
|---|---|---|---|
| **Lenis** | 0.2.28 | 惯性平滑滚动 | ⭐ 滚轮松手后页面还会"漂"一段的高级感 |
| **GSAP** | 3.x | 动画时间轴引擎 | 把多个动画串起来、精确控制 |
| **ScrollTrigger** | GSAP 插件 | 滚动触发 / `scrub` 绑定 | ⭐ 滚动进度 ↔ 动画进度 1:1 映射 |
| **Canvas 序列帧** | 原生 | 逐帧播放预渲染动画 | ⭐ 主视觉/电池"像视频一样"随滚动播放 |
| **Swiper** | 打包版 | 轮播、横向滑动卡片 | 产品展示 |
| **jQuery** | 打包版 | DOM 操作、AJAX | 基础交互 |
| IntersectionObserver / ScrollTrigger.batch | 原生 | 元素进入视口时淡入上移 | 各区块进场动画 |

---

## 四、核心动效原理（配合 Demo 看）

### 1. 滚动驱动逐帧动画（全站最酷的地方）

这是 Apple 产品页同款手法。画面不是视频，而是**一串静态图**，用滚动位置决定显示第几帧。

**HTML 结构**（在 `index.html` 里搜 `bannerCv`）：
```html
<canvas class="bannerCv"
        data-apppath="/templates/assets/home/bannerFm_app/"
        data-path="/templates/assets/home/bannerFm/"
        data-count="120"></canvas>
```

**JS 里有一个帧播放器类**（`index.d9c9dbee1.js`，搜 `class wr`）：
- 构造时根据 `matchMedia('(orientation: portrait)')` 判断横竖屏，加载 PC 或手机帧；
- `Promise.all` 预加载全部 120 帧（`new Image()`）；
- `drawFitCoverImage()` 用 canvas 的 `drawImage()` 按 cover 方式绘制当前帧；
- 关键方法 **`upData(帧号)`**：外部把帧号传进来，就画对应那一帧。

**滚动如何变成帧号**（搜 `s.upData` / `scrollTrigger`）：
```js
let state = { value: 0 };
gsap.timeline({
  scrollTrigger: {
    trigger: banner,
    start: "-=" + 0 * vh,
    end:   "+=" + vh,        // 滚动一个屏幕高度
    scrub: 0.9,              // 跟随滚动，0.9 带轻微缓动手感
  },
  onUpdate() {
    s.upData(parseInt(state.value));   // 把 0~120 传给 canvas 重绘
  },
})
.fromTo(state, { value: 0 }, { value: 120, ease: "none" }); // 线性映射 0→120
```
- 滚到底 → 120 帧播完；往回滚 → 画面倒放。
- `ease: "none"` 很关键：帧号必须和滚动严格线性，否则画面忽快忽慢。

**电池旋转**（搜 `class Qr` / `A.upData`）同理，是 150 帧；它还在同一个 timeline 里
叠加了 canvas 容器的横向位移（`x` 从 `-0.5vw` 移动到目标位置），所以你会看到
"电池一边旋转、一边横向移动"的复合效果。

### 2. Lenis 惯性平滑滚动

搜 `new Cr({ duration: 1.3 })`（`Cr` 是压缩后的 Lenis 类名）和 `Fa.raf`：
```js
lenis = new Lenis({ duration: 1.3 });         // 惯性动画时长
const tick = (t) => { lenis.raf(t); requestAnimationFrame(tick); };
requestAnimationFrame(tick);                   // 每帧驱动 Lenis
```
标准的 Lenis + GSAP 桥接三件套（Demo 里就是这么写的）：
```js
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```
弹窗打开时 `lenis.stop()` 锁住滚动，关闭时 `lenis.start()` 恢复。

### 3. 区块进场动画（淡入 + 上移）

搜 `ScrollTrigger.batch` 或 `.alanFn`：元素进入视口时，用
`gsap.to(el, { opacity: 1, y: 0, duration: 1.5, ease: "power3.out" })` 播放，
并支持 `data-delay` 做错落延迟、`data-pic` 做图片动效。

### 4. 开场时序

首页加载后先播放一段开场视频（`.firstMedia`），视频结束 `fadeOut`；
约 1.7s 后导航/按钮出现，2s 后正式启动 Lenis 滚动和帧动画（搜 `setTimeout`、`i.start()`）。
所以代码里首页会先 `Fa.stop()` 锁住滚动，等开场播完再 `_a(Na, Fa)` 解锁。

---

## 五、怎么在压缩后的 JS 里找代码（实用索引）

主 JS 是压缩成一行的（900KB），用 VS Code 打开后按 `Ctrl+F` 搜这些关键词即可定位：

| 想看的东西 | 搜索关键词 |
|---|---|
| 主视觉帧播放器类 | `class wr` |
| 电池帧播放器类 | `class Qr` |
| 帧预加载 / 命名规则 | `padStart(5,"0")` |
| 主视觉滚动绑定 | `s.upData` |
| 电池滚动绑定 | `A.upData` |
| 平滑滚动初始化 | `new Cr({ duration: 1.3 })` |
| 滚动驱动循环 | `Fa.raf` |
| 区块进场动画 | `ScrollTrigger.batch`、`.alanFn` |
| 轮播初始化 | `new Swiper` / `slidesPerView` |
| 横竖屏切换 | `matchMedia("(orientation: portrait)")` |

> 建议：先用「动效原理demo.html」在**未压缩、有中文注释**的代码里理解原理，
> 再回到压缩 JS 对照真实实现，效率最高。

---

## 六、本地镜像相对原站的改动说明

1. **手机端序列帧格式**：原站代码里手机端写的是 `.webp`，但服务器上手机端实际文件是
   `.jpg`（原站此处本身就是坏的，手机上会断图）。我已把本地 JS 改为手机端自动加载 `.jpg`，
   并补齐了 120 张 jpg，本地手机视图也能正常播放。
2. **文件名 query 后缀**：原站资源带 `?v=19`、`?v=2` 做缓存版本号，本地服务器会自动忽略
   query，不影响使用。
3. **动态接口**：产品参数表通过 `/pajax.php`、`/powajax.php` 异步 POST 加载，
   本地没有后端，这一小块切换内容可能不显示（不影响动效）。
4. **统计脚本**：cnzz 统计代码本地会请求失败，属正常现象，可忽略。
5. **字体**：页面通过 Google Fonts 在线加载 Noto Sans SC（需联网；国内网络可能较慢，
   失败时回退系统黑体，不影响布局）。
6. **其他语言站**：`_external/` 下有 es/pt/tr/vn/ru 等语言站的首页 HTML 残留（抓取语言
   切换链接时顺带保存），没有对应资源，可忽略或删除。

---

## 七、推荐学习顺序

1. 先跑起来 `启动本地站点.bat`，打开首页滚动一遍，感受动效；
2. 打开 `动效原理demo.html`，一边滚一边看左上角"当前帧/滚动进度"变化，再读它的注释源码；
3. 回到 `index.d9c9dbee1.js` 按上面的索引表对照真实实现；
4. 想自己动手：把 Demo 里的 `FRAME_COUNT`、`scrub`、`duration`、`ease` 改一改，观察手感变化；
5. 进阶：给帧动画再叠加位移、透明度、3D 变换（参考电池段 `Qr` 的写法）。
