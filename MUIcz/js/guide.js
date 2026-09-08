/*
  MUI 学习手册交互脚本
  说明：本文件只负责页面数据渲染、搜索、复制代码和返回顶部，不修改 MUI 源码。
*/

// CSS 常用类名数据：按使用场景分类，方便查找。
var cssGroups = [
  {title:'页面与导航类', rows:[
    ['mui-content','页面主体内容容器，通常放在 header 和 tabbar 之间','几乎所有 MUI 页面都需要'],
    ['mui-bar','工具栏基础类','需要和 mui-bar-nav / mui-bar-tab 等组合'],
    ['mui-bar-nav','顶部导航栏','常与 header 标签组合'],
    ['mui-title','导航栏标题','放在 mui-bar-nav 内部'],
    ['mui-action-back','返回按钮行为类','配合 mui-icon-left-nav 常用'],
    ['mui-pull-left','元素左浮动','顶部返回按钮常用'],
    ['mui-pull-right','元素右浮动','右侧按钮、菜单入口常用'],
    ['mui-bar-tab','底部选项卡导航','常用于 App 首页底部导航'],
    ['mui-tab-item','底部 tab 的每一项','内部通常包含图标和文字'],
    ['mui-active','激活状态','用于 tab、按钮、列表等状态展示']
  ]},
  {title:'按钮类', rows:[
    ['mui-btn','按钮基础类','所有 MUI 按钮建议先加这个类'],
    ['mui-btn-primary','主要按钮，默认蓝色','用于提交、确认等重要操作'],
    ['mui-btn-success','成功按钮，绿色','用于成功、启用类操作'],
    ['mui-btn-warning','警告按钮，橙色','用于提醒用户谨慎操作'],
    ['mui-btn-danger / mui-btn-red','危险按钮，红色','用于删除、退出、清空等操作'],
    ['mui-btn-outlined','空心按钮','适合次要操作'],
    ['mui-btn-block','块级大按钮，占满整行','登录、注册、提交常用'],
    ['mui-btn-link','链接样式按钮','放在导航栏右侧常见']
  ]},
  {title:'列表与卡片类', rows:[
    ['mui-table-view','列表容器','ul 常用类名'],
    ['mui-table-view-cell','列表项','li 常用类名'],
    ['mui-navigate-right','右侧箭头','个人中心、设置页常用'],
    ['mui-media','媒体列表项','适合图文列表'],
    ['mui-media-object','媒体对象，如图片','和 mui-media-body 搭配'],
    ['mui-media-body','媒体内容区域','标题和描述文字容器'],
    ['mui-card','卡片容器','内容分组展示'],
    ['mui-card-header','卡片头部','标题、头像等'],
    ['mui-card-content','卡片内容','正文区域'],
    ['mui-card-footer','卡片底部','操作按钮区域']
  ]},
  {title:'表单类', rows:[
    ['mui-input-group','表单分组容器','包裹多个 input-row'],
    ['mui-input-row','一行表单项','通常包含 label 和 input'],
    ['mui-input-clear','输入框清除按钮','输入内容后显示清除图标'],
    ['mui-input-password','密码输入框','可显示隐藏密码'],
    ['mui-search','搜索框样式','与 input type=search 搭配'],
    ['mui-radio','单选框容器','常与 mui-left / mui-right 搭配'],
    ['mui-checkbox','复选框容器','常见于协议勾选'],
    ['mui-switch','开关组件','设置页常用'],
    ['mui-switch-handle','开关内部滑块','放在 mui-switch 内部'],
    ['mui-range','滑块范围选择','音量、亮度、价格区间等']
  ]},
  {title:'图标、徽章与辅助类', rows:[
    ['mui-icon','图标基础类','需配合具体图标类'],
    ['mui-icon-home','首页图标','底部导航常用'],
    ['mui-icon-contact','联系人 / 我的图标','个人中心常用'],
    ['mui-icon-search','搜索图标','搜索入口常用'],
    ['mui-icon-compose','编辑图标','发布、编辑常用'],
    ['mui-icon-trash','删除图标','删除操作常用'],
    ['mui-badge','徽章基础类','消息数量、状态标记'],
    ['mui-badge-primary','蓝色徽章','普通状态'],
    ['mui-badge-success','绿色徽章','成功状态'],
    ['mui-badge-danger','红色徽章','重要提醒']
  ]},
  {title:'复杂交互相关类', rows:[
    ['mui-slider','轮播图容器','首页 banner 常用'],
    ['mui-slider-group','轮播图分组','内部放多个 mui-slider-item'],
    ['mui-slider-item','轮播图每一页','每一张图或一块内容'],
    ['mui-indicator','轮播指示点','通常放在 mui-slider-indicator 中'],
    ['mui-scroll-wrapper','滚动区域外层','区域滚动、侧滑菜单常用'],
    ['mui-scroll','滚动内容层','放在 scroll-wrapper 内部'],
    ['mui-off-canvas-wrap','侧滑菜单外层','移动端抽屉菜单'],
    ['mui-off-canvas-left','左侧菜单','侧滑菜单内容'],
    ['mui-inner-wrap','主内容包裹层','侧滑布局中必用'],
    ['mui-slider-right','列表右滑操作区','滑动删除、置顶等操作']
  ]}
];


// HBuilder / HBuilderX 中常见的 MUI 快速输入提示词。
// 说明：以下按 DCloud MUI 官方“代码块”文档整理。写法中的“最小触发”表示输入这部分字符后通常即可在代码助手中选中；“完整触发”表示完整代码块名称。
var snippetGroups = [
  {title:'HTML 结构与页面布局代码块', rows:[
    ['mdoctype / 最小：mdo','HTML','生成 mui-dom 页面结构','官方代码块：mDoctype(mui-dom结构)'],
    ['mbody / 最小：mbo','HTML','生成主体内容结构','官方代码块：mBody(主体)'],
    ['mscroll / 最小：msc','HTML','生成区域滚动容器','官方代码块：mScroll(区域滚动容器)'],
    ['mrefresh / 最小：mre','HTML','生成刷新容器','官方代码块：mrefreshContainer(刷新容器)'],
    ['mheader / 最小：mhe','HTML','生成普通标题栏','官方代码块：mHeader(标题栏)'],
    ['mheaderwithBack / 最小：mhe','HTML','生成带返回箭头标题栏','官方代码块：mHeader(带返回箭头的标题栏)'],
    ['micon / 最小：mic','HTML','生成 MUI 图标','官方代码块：mIcon(图标)'],
    ['moffcanvasall / 最小：mof','HTML','侧滑导航：主界面和菜单同时移动','官方代码块：mOffcanvas(all)'],
    ['moffcanvasmain / 最小：mof','HTML','侧滑导航：主界面移动、菜单不动','官方代码块：mOffcanvas(main)'],
    ['moffcanvasmenu / 最小：mof','HTML','侧滑导航：主界面不动、菜单移动','官方代码块：mOffcanvas(menu)'],
    ['moffcanvasscalable / 最小：mof','HTML','侧滑导航：缩放式侧滑','官方代码块：mOffcanvas(scalable)']
  ]},
  {title:'HTML 表单、按钮与基础控件代码块', rows:[
    ['mcheckbox / 最小：mch','HTML','生成复选框','官方代码块：mCheckbox(复选框)'],
    ['mcheckbox_left / 最小：mch','HTML','生成居左复选框','官方代码块：mCheckbox(复选框居左)'],
    ['mcheckbox_disabled / 最小：mch','HTML','生成禁用复选框','官方代码块：mCheckbox(禁用选项)'],
    ['minputtext / 最小：min','HTML','生成文本框','官方代码块：mText(文本框)'],
    ['minputsearch / 最小：min','HTML','生成搜索框','官方代码块：mText_Search(搜索框)'],
    ['minputclear / 最小：min','HTML','生成带清除按钮文本框','官方代码块：mText_Clear'],
    ['minputspeech / 最小：min','HTML','生成语音输入文本框','官方代码块：mText_Speech'],
    ['mform / 最小：mfo','HTML','生成表单','官方代码块：mForm(表单)'],
    ['mradio / 最小：mra','HTML','生成单选框','官方代码块：mRadio(单选框)'],
    ['mradio_left / 最小：mra','HTML','生成居左单选框','官方代码块：mRadio(单选框居左)'],
    ['mradio_disable / 最小：mra','HTML','生成禁用单选框','官方代码块：mRadio(禁用单选框)'],
    ['mradio_selected / 最小：mra','HTML','生成默认选中单选框','官方代码块：mRadios(默认选中指定项)'],
    ['mbutton / 最小：mbu','HTML','生成按钮','官方代码块：mButton(按钮)'],
    ['mbutton_outline / 最小：mbu','HTML','生成无底色有边框按钮','官方代码块：mButton(按钮无底色、有边框)'],
    ['mbutton_block / 最小：mbu','HTML','生成块状按钮','官方代码块：mButton(块状按钮)'],
    ['mswitch / 最小：msw','HTML','生成开关','官方代码块：mSwitch(开关)'],
    ['mswitch_blue / 最小：msw','HTML','生成蓝色开关','官方代码块：mSwitch(开关 - 蓝色)'],
    ['mswitchmini / 最小：msw','HTML','生成迷你开关','官方代码块：mSwitch(开关Mini)'],
    ['mswitchmini_blue / 最小：msw','HTML','生成蓝色迷你开关','官方代码块：mSwitch(开关Mini - blue)'],
    ['mnumbox / 最小：mnu','HTML','生成数字输入框','官方代码块：mnumbox(数字输入框)'],
    ['mrangeLabel / 最小：mra','HTML','生成 Label + 滑块','官方代码块：mRange(Label+滑块)']
  ]},
  {title:'HTML 列表、选项卡、轮播与弹层代码块', rows:[
    ['mpopover / 最小：mpo','HTML','生成弹出菜单','官方代码块：mPopover(弹出菜单)'],
    ['mprogressbarinfinite / 最小：mpr','HTML','生成无限循环进度条','官方代码块：mprogressbar(进度条-无限循环)'],
    ['mprogressbar / 最小：mpr','HTML','生成有准确值进度条','官方代码块：mprogressbar(进度条-有准确值)'],
    ['mactionsheet / 最小：mac','HTML','生成 H5 模式弹出菜单','官方代码块：mActionsheet(H5模式弹出菜单)'],
    ['mbadge / 最小：mba','HTML','生成数字角标','官方代码块：mbadge(数字角标)'],
    ['mbadge_inverted / 最小：mba','HTML','生成无底色数字角标','官方代码块：mbadge(数字角标无底色)'],
    ['mtab / 最小：mta','HTML','生成底部选项卡','官方代码块：mTab(底部选项卡)'],
    ['mtabsegmented / 最小：mta','HTML','生成 div 选项卡','官方代码块：mTabSegmented(div选项卡)'],
    ['mtabviewpage / 最小：mta','HTML','生成可左右拖动选项卡','官方代码块：mTabSegmented(可左右拖动的选项卡)'],
    ['mpagination / 最小：mpa','HTML','生成分页','官方代码块：mPagination(分页)'],
    ['mlist / 最小：mli','HTML','生成列表','官方代码块：mList(列表)'],
    ['mlist_Media_left / 最小：mli','HTML','生成图片居左图文列表','官方代码块：mListMedia(图文列表图片居左)'],
    ['mlist_Media_right / 最小：mli','HTML','生成图片居右图文列表','官方代码块：mListMedia(图文列表图片居右)'],
    ['mgrid / 最小：mgr','HTML','生成九宫格','官方代码块：mGrid(九宫格)'],
    ['mslider_gallery_table / 最小：msl','HTML','生成图文表格','官方代码块：mGallery-Table(图文表格)'],
    ['mslider_gallery / 最小：msl','HTML','生成图片轮播','官方代码块：mGallery(图片轮播)'],
    ['mslider / 最小：msl','HTML','生成轮播组件','官方代码块：slide(轮播组件)'],
    ['actionsheet / 最小：act','HTML','生成操作表','官方代码块：mactionsheet(操作表)'],
    ['maccordion / 最小：mac','HTML','生成折叠面板','官方代码块：maccordion(折叠面板)'],
    ['mpullrefresh / 最小：mpu','HTML','生成刷新容器','官方代码块：mrefreshContainer(刷新容器)']
  ]},
  {title:'MUI init 初始化代码块', rows:[
    ['minit / 最小：min','JS','生成 mui.init()','MUI 初始化'],
    ['minsubpage / 最小：mins','JS','生成创建子页面配置','mui.init({ subpages:[...] })'],
    ['minpreload / 最小：minp','JS','生成预加载页面配置','preloadPages 配置'],
    ['minpullRefresh / 最小：minp','JS','生成刷新组件配置','pullRefresh 配置'],
    ['mingesture / 最小：ming','JS','生成手势事件配置','gestureConfig 配置'],
    ['minswipeback / 最小：mins','JS','生成侧滑返回配置','swipeBack 配置'],
    ['minkeyevent / 最小：mink','JS','生成按键绑定配置','keyEventBind 配置'],
    ['minbeforeback / 最小：minb','JS','生成重写返回逻辑配置','beforeback 配置'],
    ['minstatusbar / 最小：mins','JS','生成状态栏颜色配置','setStatusBarBackground'],
    ['minprelimit / 最小：minp','JS','生成预加载数量配置','preloadLimit 配置']
  ]},
  {title:'MUI JS 组件、事件、弹窗与工具代码块', rows:[
    ['mplusready / 最小：mpl','JS','生成 mui.plusReady()','推荐用于 HTML5+ API 就绪后执行'],
    ['mready / 最小：mre','JS','生成 mui.ready()','DOM 就绪后执行'],
    ['mmon','JS','生成 mui.on()','事件绑定 / 事件委托'],
    ['mmoff','JS','生成 mui.off()','取消事件绑定'],
    ['mtrigger','JS','生成 mui.trigger()','触发 DOM 事件'],
    ['mfire','JS','生成 mui.fire()','触发跨 Webview 自定义事件'],
    ['dg','JS','生成 document.getElementById()','原生选择器'],
    ['ds','JS','生成 document.querySelector()','原生选择器'],
    ['dsa','JS','生成 querySelector + addEventListener','选择元素并绑定事件'],
    ['dga','JS','生成 getElementById + addEventListener','选择 ID 并绑定事件'],
    ['wad','JS','生成 window.addEventListener()','监听 window 事件'],
    ['dad','JS','生成 document.addEventListener()','监听 document 事件'],
    ['mdalert / 最小：mda','JS','生成 mui.alert()','弹出提示框'],
    ['mdconfirm / 最小：mdc','JS','生成 mui.confirm()','确认弹出框'],
    ['mdprompt / 最小：mdp','JS','生成 mui.prompt()','输入弹出框'],
    ['mdtoast / 最小：mdt','JS','生成 mui.toast()','自动消失提示框'],
    ['mdclosePopup / 最小：mdc','JS','生成 mui.closePopup()','关闭最外层对话框'],
    ['mdclosePopups / 最小：mdc','JS','生成 mui.closePopups()','关闭全部对话框'],
    ['mmui / 最小：mmu','JS','生成 mui()','mui 对象选择器'],
    ['meach / 最小：mea','JS','生成 mui.each()','数组、对象遍历'],
    ['mmeach / 最小：mme','JS','生成 mui().each()','DOM 遍历'],
    ['mextend / 最小：mex','JS','生成 mui.extend()','对象合并'],
    ['mlater / 最小：mla','JS','生成 mui.later()','setTimeout 封装'],
    ['mscrollto / 最小：msc','JS','生成 mui.scrollTo()','滚动到指定位置'],
    ['mos','JS','生成 mui.os','判断当前运行环境']
  ]},
  {title:'MUI AJAX、Webview 与 plus 模块代码块', rows:[
    ['majax / 最小：maj','JS','生成 mui.ajax()','通用 Ajax 请求'],
    ['mpost / 最小：mpo','JS','生成 mui.post()','POST 请求'],
    ['mget / 最小：mge','JS','生成 mui.get()','GET 请求'],
    ['mjson / 最小：mjs','JS','生成 mui.getJSON()','请求 JSON 数据'],
    ['mopenwindow / 最小：mop','JS','生成打开新页面代码','mui.openWindow()'],
    ['mcurrent / 最小：mcu','JS','生成当前页面代码','mui.currentWebview'],
    ['mback / 最小：mba','JS','生成 mui.back()','关闭窗口 / 返回'],
    ['mbackfunction / 最小：mba','JS','生成重写返回逻辑','自定义返回处理'],
    ['mbackDouble / 最小：mba','JS','生成双击退出应用','常用于首页返回键'],
    ['mbacktast / 最小：mba','JS','生成双击进入后台','官方代码块写法保留'],
    ['mpreload / 最小：mpr','JS','生成 mui.preload()','预加载页面'],
    ['pready / 最小：pre','JS','生成 plusReady','plus 就绪相关代码块'],
    ['pacce','JS','生成 plus.accelerometer','加速度传感器模块'],
    ['paudio','JS','生成 plus.audio','音频模块'],
    ['pbarcode','JS','生成 plus.barcode','扫码模块'],
    ['pcamera','JS','生成 plus.camera','摄像头模块'],
    ['pcontacts','JS','生成 plus.contacts','通讯录模块'],
    ['pdevice','JS','生成 plus.device','设备信息模块'],
    ['pgallery','JS','生成 plus.gallery','系统相册模块'],
    ['pgeolocation','JS','生成 plus.geolocation','定位模块'],
    ['pio','JS','生成 plus.io','文件系统模块'],
    ['pkey','JS','生成 plus.key','按键模块'],
    ['pmaps','JS','生成 plus.maps','地图模块'],
    ['pmessaging','JS','生成 plus.messaging','短信/邮件等消息模块'],
    ['pnativeObj','JS','生成 plus.nativeObj','原生对象绘制模块'],
    ['pnativeUI','JS','生成 plus.nativeUI','原生 UI 模块'],
    ['pnavigator','JS','生成 plus.navigator','导航栏、状态栏等控制'],
    ['porientation','JS','生成 plus.orientation','方向传感器模块'],
    ['ppayment','JS','生成 plus.payment','支付模块'],
    ['pproximity','JS','生成 plus.proximity','距离传感器模块'],
    ['ppush','JS','生成 plus.push','消息推送模块'],
    ['pruntime','JS','生成 plus.runtime','运行环境模块']
  ]}
];
// HTML 组件示例数据：每个示例都带中文注释，方便复制学习。
var htmlComponents = [
  {tag:'页面骨架', title:'顶部栏 + 内容区', desc:'MUI 最常见的页面结构，适合普通单页。', code:'<!-- 顶部导航栏 -->\n<header class="mui-bar mui-bar-nav">\n  <a class="mui-action-back mui-icon mui-icon-left-nav mui-pull-left"></a>\n  <h1 class="mui-title">页面标题</h1>\n</header>\n\n<!-- 页面主体内容 -->\n<div class="mui-content">\n  <p>这里放页面内容</p>\n</div>'},
  {tag:'底部导航', title:'底部 TabBar', desc:'适合首页、消息、购物车、我的等主导航。', code:'<!-- 底部选项卡导航 -->\n<nav class="mui-bar mui-bar-tab">\n  <a class="mui-tab-item mui-active" href="#home">\n    <span class="mui-icon mui-icon-home"></span>\n    <span class="mui-tab-label">首页</span>\n  </a>\n  <a class="mui-tab-item" href="#mine">\n    <span class="mui-icon mui-icon-contact"></span>\n    <span class="mui-tab-label">我的</span>\n  </a>\n</nav>'},
  {tag:'按钮', title:'常用按钮', desc:'MUI 内置多种按钮颜色和大小。', code:'<!-- 不同状态按钮 -->\n<button class="mui-btn">默认按钮</button>\n<button class="mui-btn mui-btn-primary">主要按钮</button>\n<button class="mui-btn mui-btn-success">成功按钮</button>\n<button class="mui-btn mui-btn-warning">警告按钮</button>\n<button class="mui-btn mui-btn-danger">危险按钮</button>\n\n<!-- 占满整行的大按钮 -->\n<button class="mui-btn mui-btn-primary mui-btn-block">提交</button>'},
  {tag:'列表', title:'普通列表 / 带箭头列表', desc:'适合设置页、菜单页、新闻列表。', code:'<!-- 列表容器 -->\n<ul class="mui-table-view">\n  <li class="mui-table-view-cell">普通列表项</li>\n  <li class="mui-table-view-cell">\n    <a class="mui-navigate-right">带右箭头的列表项</a>\n  </li>\n</ul>'},
  {tag:'图文列表', title:'媒体列表', desc:'适合新闻、商品、消息、文章摘要。', code:'<ul class="mui-table-view">\n  <li class="mui-table-view-cell mui-media">\n    <a href="javascript:;">\n      <img class="mui-media-object mui-pull-left" src="images/demo.png">\n      <div class="mui-media-body">\n        标题文字\n        <p class="mui-ellipsis">这里是摘要内容，超出会省略</p>\n      </div>\n    </a>\n  </li>\n</ul>'},
  {tag:'卡片', title:'Card 卡片', desc:'用于信息分组、文章卡片、商品卡片。', code:'<div class="mui-card">\n  <div class="mui-card-header">卡片标题</div>\n  <div class="mui-card-content">\n    <div class="mui-card-content-inner">卡片正文内容</div>\n  </div>\n  <div class="mui-card-footer">卡片底部操作</div>\n</div>'},
  {tag:'表单', title:'输入框表单', desc:'登录、注册、资料编辑页面常用。', code:'<form class="mui-input-group">\n  <div class="mui-input-row">\n    <label>账号</label>\n    <input type="text" class="mui-input-clear" placeholder="请输入账号">\n  </div>\n  <div class="mui-input-row">\n    <label>密码</label>\n    <input type="password" class="mui-input-password" placeholder="请输入密码">\n  </div>\n</form>'},
  {tag:'开关', title:'Switch 开关', desc:'设置页启用/关闭某项功能常用。', code:'<!-- 开关组件 -->\n<div class="mui-switch" id="noticeSwitch">\n  <div class="mui-switch-handle"></div>\n</div>'},
  {tag:'轮播', title:'Slider 轮播图', desc:'首页 banner、引导页、广告图常用。', code:'<div class="mui-slider" id="bannerSlider">\n  <div class="mui-slider-group mui-slider-loop">\n    <!-- 循环轮播时，首尾需要复制节点 -->\n    <div class="mui-slider-item mui-slider-item-duplicate"><img src="images/3.jpg"></div>\n    <div class="mui-slider-item"><img src="images/1.jpg"></div>\n    <div class="mui-slider-item"><img src="images/2.jpg"></div>\n    <div class="mui-slider-item"><img src="images/3.jpg"></div>\n    <div class="mui-slider-item mui-slider-item-duplicate"><img src="images/1.jpg"></div>\n  </div>\n  <div class="mui-slider-indicator">\n    <div class="mui-indicator mui-active"></div>\n    <div class="mui-indicator"></div>\n    <div class="mui-indicator"></div>\n  </div>\n</div>'},
  {tag:'滑动操作', title:'列表滑动删除', desc:'消息列表、购物车、收藏列表常用。', code:'<ul class="mui-table-view">\n  <li class="mui-table-view-cell">\n    <div class="mui-slider-right mui-disabled">\n      <a class="mui-btn mui-btn-red">删除</a>\n    </div>\n    <div class="mui-slider-handle">向左滑动这一行</div>\n  </li>\n</ul>'},
  {tag:'侧滑菜单', title:'OffCanvas 侧滑菜单', desc:'适合分类菜单、个人中心抽屉导航。', code:'<div class="mui-off-canvas-wrap mui-draggable">\n  <!-- 左侧菜单 -->\n  <aside class="mui-off-canvas-left">\n    <div class="mui-scroll-wrapper">\n      <div class="mui-scroll">菜单内容</div>\n    </div>\n  </aside>\n  <!-- 主页面 -->\n  <div class="mui-inner-wrap">\n    <div class="mui-content mui-scroll-wrapper">\n      <div class="mui-scroll">主页面内容</div>\n    </div>\n  </div>\n</div>'}
];

// JS 常用语句数据：把常见 API 和使用场景对应起来。
var jsItems = [
  {tag:'初始化', title:'mui.init()', desc:'页面初始化入口，很多配置如手势、下拉刷新、子页面等都写在这里。', code:'// 初始化 MUI\nmui.init();'},
  {tag:'就绪', title:'mui.ready()', desc:'DOM 准备完成后执行，类似 DOMContentLoaded。', code:'// 页面 DOM 加载完成后执行\nmui.ready(function(){\n  console.log("页面已准备好");\n});'},
  {tag:'5+App', title:'mui.plusReady()', desc:'HTML5+ 原生能力准备完成后执行，MUI 推荐用 mui.plusReady() 封装。', code:'// 只有在 5+App 环境中 plus API 才可用\nmui.plusReady(function(){\n  plus.nativeUI.toast("5+App 已准备好");\n});'},
  {tag:'提示', title:'mui.toast()', desc:'轻量提示信息，不打断用户操作。', code:'// 显示一个短提示\nmui.toast("保存成功");'},
  {tag:'弹窗', title:'mui.alert()', desc:'普通提示弹窗。', code:'// 弹出提示框\nmui.alert("操作完成", "提示", "知道了", function(){\n  console.log("用户关闭了提示框");\n});'},
  {tag:'确认', title:'mui.confirm()', desc:'需要用户确认或取消时使用。', code:'// 确认框\nmui.confirm("确定删除这条记录吗？", "提示", ["取消", "确定"], function(e){\n  if(e.index === 1){\n    mui.toast("已删除");\n  }\n});'},
  {tag:'输入', title:'mui.prompt()', desc:'需要用户输入内容时使用。', code:'// 输入框弹窗\nmui.prompt("请输入昵称", "例如：小明", "修改昵称", ["取消", "确定"], function(e){\n  if(e.index === 1){\n    mui.toast("昵称：" + e.value);\n  }\n});'},
  {tag:'事件', title:'mui(selector).on()', desc:'推荐用于列表等动态元素的事件委托。', code:'// 给列表项绑定点击事件\nmui(".mui-table-view").on("tap", ".mui-table-view-cell", function(){\n  mui.toast("点击了：" + this.innerText);\n});'},
  {tag:'选择器', title:'mui(selector)', desc:'MUI 的选择器写法，可获取元素集合并调用 MUI 方法。', code:'// 获取所有按钮并遍历\nmui(".mui-btn").each(function(index, item){\n  console.log(index, item.innerText);\n});'},
  {tag:'轮播', title:'slider()', desc:'初始化轮播图并设置自动播放间隔。', code:'// 自动轮播，单位毫秒\nmui("#bannerSlider").slider({\n  interval: 3000\n});'},
  {tag:'滚动', title:'mui.scroll()', desc:'初始化区域滚动，常用于侧滑菜单、局部滚动页面。', code:'// 初始化滚动区域\nmui(".mui-scroll-wrapper").scroll({\n  indicators: true,  // 是否显示滚动条\n  deceleration: 0.0006\n});'},
  {tag:'返回', title:'mui.back()', desc:'执行返回操作，5+App 中常用于返回上一页或关闭当前 Webview。', code:'// 返回上一页\nmui.back();'},
  {tag:'打开页面', title:'mui.openWindow()', desc:'5+App 中打开新页面或新 Webview。', code:'// 打开新页面\nmui.openWindow({\n  url: "detail.html",\n  id: "detail",\n  extras: { id: 1001 }\n});'},
  {tag:'预加载', title:'mui.preload()', desc:'提前加载页面，提高后续打开速度。', code:'// 预加载详情页\nvar detailPage = mui.preload({\n  url: "detail.html",\n  id: "detail"\n});'},
  {tag:'触发事件', title:'mui.fire()', desc:'跨 Webview 通知另一页面执行某个事件。', code:'// 向详情页发送自定义事件\nmui.fire(detailPage, "refreshDetail", {\n  id: 1001\n});'},
  {tag:'下拉刷新', title:'pullRefresh()', desc:'结束下拉刷新或上拉加载时常用。', code:'// 结束下拉刷新\nmui("#refreshContainer").pullRefresh().endPulldownToRefresh();\n\n// 结束上拉加载，true 表示没有更多数据\nmui("#refreshContainer").pullRefresh().endPullupToRefresh(false);'},
  {tag:'Ajax', title:'mui.ajax()', desc:'请求接口数据，写法类似 jQuery ajax。', code:'// 请求列表数据\nmui.ajax("https://example.com/api/list", {\n  dataType: "json",\n  type: "get",\n  timeout: 10000,\n  success: function(res){\n    console.log(res);\n  },\n  error: function(){\n    mui.toast("网络异常");\n  }\n});'}
];

// 联动示例：把 HTML、CSS、JS 常一起使用的场景放在一起。
var combineItems = [
  {tag:'初始化组合', title:'MUI 页面初始化 + 5+App 原生能力', desc:'标准 5+App 写法：先 mui.init，再等待 plusready 调用原生能力。', code:'<!-- HTML 引入顺序：先 CSS，再页面结构，最后 JS -->\n<link rel="stylesheet" href="css/mui.min.css">\n<script src="js/mui.min.js"></script>\n\n<script>\n  // 1. 初始化 MUI\n  mui.init();\n\n  // 2. 等待 5+App 原生能力准备好\n  mui.plusReady(function(){\n    plus.nativeUI.toast("当前 App 已进入可调用原生能力状态");\n  });\n</script>'},
  {tag:'列表组合', title:'列表渲染 + 事件委托 + Toast', desc:'列表数据可能是动态生成的，建议用 mui().on() 进行事件委托。', code:'<ul class="mui-table-view" id="newsList">\n  <li class="mui-table-view-cell" data-id="1">新闻标题 1</li>\n  <li class="mui-table-view-cell" data-id="2">新闻标题 2</li>\n</ul>\n\n<script>\n  mui("#newsList").on("tap", ".mui-table-view-cell", function(){\n    var id = this.getAttribute("data-id");\n    mui.toast("打开新闻 ID：" + id);\n  });\n</script>'},
  {tag:'确认组合', title:'删除按钮 + 确认框 + 删除节点', desc:'滑动删除或普通删除按钮都可以套用这个逻辑。', code:'<button class="mui-btn mui-btn-danger" id="deleteBtn">删除</button>\n\n<script>\n  document.getElementById("deleteBtn").addEventListener("tap", function(){\n    mui.confirm("确定删除吗？", "提示", ["取消", "确定"], function(e){\n      if(e.index === 1){\n        mui.toast("删除成功");\n      }\n    });\n  });\n</script>'},
  {tag:'轮播组合', title:'轮播 HTML + JS 初始化', desc:'轮播图需要 HTML 结构和 slider 初始化配合。', code:'<div class="mui-slider" id="bannerSlider">\n  <div class="mui-slider-group">\n    <div class="mui-slider-item"><img src="images/banner1.jpg"></div>\n    <div class="mui-slider-item"><img src="images/banner2.jpg"></div>\n  </div>\n</div>\n\n<script>\n  mui("#bannerSlider").slider({\n    interval: 3000\n  });\n</script>'},
  {tag:'刷新组合', title:'下拉刷新 + 上拉加载', desc:'列表页非常常见，注意回调结束时必须调用结束方法，否则加载动画会一直显示。', code:'<div id="refreshContainer" class="mui-content mui-scroll-wrapper">\n  <div class="mui-scroll">\n    <ul class="mui-table-view" id="list"></ul>\n  </div>\n</div>\n\n<script>\n  mui.init({\n    pullRefresh: {\n      container: "#refreshContainer",\n      down: {\n        callback: function(){\n          // TODO: 重新请求第一页数据\n          mui.toast("刷新成功");\n          mui("#refreshContainer").pullRefresh().endPulldownToRefresh();\n        }\n      },\n      up: {\n        callback: function(){\n          // TODO: 请求下一页数据\n          mui.toast("加载更多");\n          mui("#refreshContainer").pullRefresh().endPullupToRefresh(false);\n        }\n      }\n    }\n  });\n</script>'},
  {tag:'选择器组合', title:'PopPicker 选择器基本流程', desc:'需要额外引入 picker / poppicker 的 CSS 和 JS 文件。', code:'<!-- 需要额外引入：mui.picker.css、mui.poppicker.css、mui.picker.js、mui.poppicker.js -->\n<button class="mui-btn mui-btn-primary" id="typeBtn">选择分类</button>\n\n<script>\n  var picker = new mui.PopPicker();\n  picker.setData([\n    { value: "food", text: "美食" },\n    { value: "travel", text: "旅游" }\n  ]);\n\n  document.getElementById("typeBtn").addEventListener("tap", function(){\n    picker.show(function(items){\n      mui.toast("选择了：" + items[0].text);\n    });\n  });\n</script>'},
  {tag:'页面跳转组合', title:'打开详情页 + 传递参数', desc:'在 5+App 中常用 mui.openWindow 打开新 Webview。', code:'<ul class="mui-table-view" id="goodsList">\n  <li class="mui-table-view-cell" data-id="1001">商品 A</li>\n</ul>\n\n<script>\n  mui("#goodsList").on("tap", ".mui-table-view-cell", function(){\n    mui.openWindow({\n      url: "detail.html",\n      id: "detail",\n      extras: {\n        goodsId: this.getAttribute("data-id")\n      }\n    });\n  });\n</script>'}
];

// 生成 CSS 表格。
function renderCssTables(){
  var container = document.getElementById('cssTableList');
  container.innerHTML = cssGroups.map(function(group){
    var rows = group.rows.map(function(row){
      return '<tr><td>'+row[0]+'</td><td>'+row[1]+'</td><td>'+row[2]+'</td></tr>';
    }).join('');
    return '<article class="table-card searchable"><h3>'+group.title+'</h3><div class="responsive-table"><table><thead><tr><th>类名</th><th>功能说明</th><th>常见场景</th></tr></thead><tbody>'+rows+'</tbody></table></div></article>';
  }).join('');
}


// 生成 HBuilder 快速输入表格。
function renderSnippetTables(){
  var container = document.getElementById('snippetTableList');
  container.innerHTML = snippetGroups.map(function(group){
    var rows = group.rows.map(function(row){
      return '<tr><td>'+row[0]+'</td><td>'+row[1]+'</td><td>'+row[2]+'</td><td>'+row[3]+'</td></tr>';
    }).join('');
    return '<article class="table-card searchable"><h3>'+group.title+'</h3><div class="responsive-table"><table><thead><tr><th>快捷输入</th><th>位置</th><th>生成内容</th><th>说明</th></tr></thead><tbody>'+rows+'</tbody></table></div></article>';
  }).join('');
}
// 生成组件卡片或 JS 卡片。
function renderCards(containerId, data){
  var container = document.getElementById(containerId);
  container.innerHTML = data.map(function(item, index){
    return '<article class="component-card searchable">'
      + '<div class="component-head"><div><h3>'+item.title+'</h3><p>'+item.desc+'</p></div><span class="tag">'+item.tag+'</span></div>'
      + '<div class="component-body"><div class="code-wrap"><div class="code-title"><span>示例代码</span><button class="copy-btn" data-copy="code-'+containerId+'-'+index+'">复制</button></div><pre><code id="code-'+containerId+'-'+index+'"></code></pre></div></div>'
      + '</article>';
  }).join('');

  // 使用 textContent 填充代码，避免 HTML 示例被浏览器当作真实标签执行。
  data.forEach(function(item, index){
    document.getElementById('code-'+containerId+'-'+index).textContent = item.code;
  });
}

// 搜索知识卡片。
function bindSearch(){
  var input = document.getElementById('keywordInput');
  var hint = document.getElementById('searchHint');
  input.addEventListener('input', function(){
    var keyword = input.value.trim().toLowerCase();
    var cards = document.querySelectorAll('.searchable');
    var count = 0;
    cards.forEach(function(card){
      var matched = !keyword || card.innerText.toLowerCase().indexOf(keyword) !== -1;
      card.classList.toggle('hidden-by-search', !matched);
      card.classList.toggle('highlight-card', matched && !!keyword);
      if(matched){ count++; }
    });
    hint.textContent = keyword ? '已找到 ' + count + ' 个相关区域。' : '输入关键词后，会高亮匹配的知识卡片。';
  });
}

// 复制代码按钮。
function bindCopyButtons(){
  document.body.addEventListener('click', function(e){
    var btn = e.target.closest('.copy-btn');
    if(!btn){ return; }
    var code = document.getElementById(btn.getAttribute('data-copy')).textContent;
    // 优先使用浏览器剪贴板能力；如果当前环境不支持，则给出友好提示。
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(code).then(function(){
        mui.toast('代码已复制');
      }).catch(function(){
        mui.toast('当前浏览器不支持自动复制');
      });
    }else{
      mui.toast('当前浏览器不支持自动复制');
    }
  });
}

// 平滑跳转目录。
function bindSmoothLinks(){
  document.querySelectorAll('.smooth-link').forEach(function(link){
    link.addEventListener('click', function(e){
      var target = document.querySelector(link.getAttribute('href'));
      if(!target){ return; }
      e.preventDefault();
      target.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });
}

// 返回顶部按钮。
function bindBackTop(){
  var button = document.getElementById('backTop');
  window.addEventListener('scroll', function(){
    button.classList.toggle('show', window.scrollY > 500);
  });
  button.addEventListener('click', function(){
    window.scrollTo({ top:0, behavior:'smooth' });
  });
}

// 页面入口：DOM 加载完成后执行。
mui.ready(function(){
  renderCssTables();
  renderCards('htmlComponentList', htmlComponents);
  renderSnippetTables();
  renderCards('jsList', jsItems);
  renderCards('combineList', combineItems);
  bindSearch();
  bindCopyButtons();
  bindSmoothLinks();
  bindBackTop();
});


