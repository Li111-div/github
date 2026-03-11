# 途味 - 旅游美食综合网页项目

## 📁 项目说明

这是一个超大型的旅游美食综合网页项目，采用 HTML5 + CSS3 + JavaScript + jQuery 技术栈开发。

## 🎯 核心功能

### 美食板块（主题色：橙色 #FF7F24）
- **八大菜系展示**：川、粤、鲁、苏、浙、闽、湘、徽
- **地方特色小吃**：各地知名小吃推荐
- **购买美食**：在线选购各地美食
- **AI 生成教程**：接入 DeepSeek 大模型，自动生成美食制作教程

### 旅游板块（主题色：蓝色 #1E88E5）
- **国内/国外景点**：精选全球热门景点
- **瀑布流布局**：美观的景点展示
- **AI 路线规划**：智能生成旅行路线
- **收藏功能**：保存喜欢的景点

## 📂 目录结构

```
美食旅游网页/
├── index.html                 # 主页面
├── css/
│   ├── common.css            # 公共样式
│   ├── food.css              # 美食板块样式
│   └── travel.css            # 旅游板块样式
├── js/
│   ├── common.js             # 公共工具函数
│   ├── ai.js                 # AI 接口封装（途味助手）
│   ├── food.js               # 美食板块逻辑
│   └── travel.js             # 旅游板块逻辑
├── pages/
│   ├── food_detail.html      # 美食详情页
│   ├── cart.html             # 购物车页
│   ├── scenic_detail.html    # 景点详情页
│   └── favorites.html        # 收藏页
└── images/
    ├── food/                 # 美食图片（需自行添加）
    └── travel/               # 旅游图片（需自行添加）
```

## 🖼️ 图片资源说明

由于版权原因，项目不包含实际图片资源。所有图片引用了占位图服务（via.placeholder.com）。

### 建议添加的图片：

**美食图片 (images/food/)**:
- chuan.jpg - 川菜代表图
- yue.jpg - 粤菜代表图
- lu.jpg - 鲁菜代表图
- su.jpg - 苏菜代表图
- zhe.jpg - 浙菜代表图
- min.jpg - 闽菜代表图
- xiang.jpg - 湘菜代表图
- hui.jpg - 徽菜代表图
- guobaorou.jpg - 锅包肉
- mixian.jpg - 过桥米线
- zhajiangmian.jpg - 炸酱面
- roujiamo.jpg - 肉夹馍
- xiaolongbao.jpg - 小笼包
- dandanmian.jpg - 担担面
- shuizhuniurou.jpg - 水煮牛肉
- lachang.jpg - 腊肠
- jiuzhuandachang.jpg - 九转大肠
- songshuguiyu.jpg - 松鼠鳜鱼
- xihucuyu.jpg - 西湖醋鱼
- fotiaoqiang.jpg - 佛跳墙
- duojiaoyutou.jpg - 剁椒鱼头
- chouguiyu.jpg - 臭鳜鱼

**旅游图片 (images/travel/)**:
- gugong.jpg - 故宫
- waitan.jpg - 外滩
- bingmayong.jpg - 兵马俑
- jiuzhaigou.jpg - 九寨沟
- lijiang.jpg - 丽江古城
- guilin.jpg - 桂林山水
- budala.jpg - 布达拉宫
- xihu.jpg - 西湖
- fujisan.jpg - 富士山
- aifeier.jpg - 埃菲尔铁塔
- doushou.jpg - 罗马斗兽场
- daohuanggong.jpg - 泰国大皇宫
- Ziyou.jpg - 自由女神像
- gejuyuan.jpg - 悉尼歌剧院
- shengjiatang.jpg - 圣家堂
- maldives.jpg - 马尔代夫

## 🚀 使用方法

### 1. 直接运行
直接用浏览器打开 `index.html` 即可运行项目。

### 2. 使用本地服务器（推荐）
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080

# Node.js (需要先安装 http-server)
npx http-server -p 8080
```

然后访问 `http://localhost:8080`

## 🤖 AI 功能配置

### 当前状态：模拟模式
项目默认使用模拟数据，无需 API 密钥即可体验所有功能。

### 接入真实 DeepSeek API
如需使用真实的 AI 生成功能，请编辑 `js/ai.js` 文件：

```javascript
const AI_CONFIG = {
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: 'YOUR_DEEPSEEK_API_KEY',  // 替换为您的 API 密钥
  model: 'deepseek-chat',
  mockMode: false  // 改为 false 启用真实 API
};
```

获取 DeepSeek API 密钥：https://platform.deepseek.com/

## ✨ 功能特性

### 交互体验
- ✅ 丝滑过渡动画（0.3-0.5s）
- ✅ 选项卡切换动画
- ✅ 元素 hover 动画
- ✅ 页面加载动画
- ✅ 按钮点击反馈

### 响应式设计
- ✅ 移动端适配（320px-768px）
- ✅ 平板适配（768px-1199px）
- ✅ PC 端适配（1200px+）
- ✅ 移动端底部导航栏
- ✅ 汉堡包菜单

### AI 集成
- ✅ 途味助手 AI 生成美食教程
- ✅ 途味助手 AI 规划旅行路线
- ✅ 生成结果支持复制/导出
- ✅ 加载动画和错误处理

### 代码规范
- ✅ BEM命名法
- ✅ 详细中文注释
- ✅ W3C 标准
- ✅ 无控制台警告

## 🌐 浏览器兼容性

- Chrome 最新版 ✅
- Firefox 最新版 ✅
- Edge最新版 ✅
- Safari 最新版 ✅
- 微信浏览器 ✅

## 📱 响应式测试

### 移动端测试尺寸
- 320px（iPhone SE）
- 375px（iPhone 12 mini）
- 414px（iPhone 12 Pro Max）

### 平板测试尺寸
- 768px（iPad）
- 1024px（iPad Pro）

### PC 测试尺寸
- 1200px
- 1440px
- 1920px

## 🔧 开发技巧

### 修改主题色
- 美食主题色：编辑 `css/food.css` 中的 `--theme-primary`
- 旅游主题色：编辑 `css/travel.css` 中的 `--theme-primary`

### 添加新菜品
编辑 `js/food.js` 中的 `FOOD_DATA` 对象。

### 添加新景点
编辑 `js/travel.js` 中的 `TRAVEL_DATA` 对象。

### 自定义 AI 提示词
编辑 `js/ai.js` 中的 `_getDefaultSystemPrompt` 方法。

## 📝 注意事项

1. 首次加载可能需要几秒钟下载 jQuery CDN
2. 图片使用占位图服务，需要联网才能显示
3. AI 功能默认为模拟模式，生成结果为预设内容
4. 购物车数据保存在 localStorage，清除缓存会丢失

## 🎉 后续优化建议

1. 接入真实的 DeepSeek API
2. 添加用户登录注册功能
3. 实现真实的支付流程
4. 添加更多美食和景点数据
5. 实现社交分享功能
6. 添加用户评价系统
7. 实现搜索历史记录
8. 添加夜间模式

## 📄 许可证

© 2026 途味团队 - 仅供学习参考

---

**技术支持**: 如有问题，请检查浏览器控制台错误信息。
**更新日期**: 2026-03-11
