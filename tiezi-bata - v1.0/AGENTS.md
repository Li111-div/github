# 校园树洞 - 匿名论坛 v2.0

## 项目概览
校园匿名论坛系统，支持表白墙功能。采用单页应用架构，所有功能通过 JavaScript 动态渲染，无需页面跳转。

## 技术栈
- **前端框架**: 原生 JavaScript (ES6+)
- **CSS框架**: Tailwind CSS (CDN)
- **数据库**: Supabase (PostgreSQL) + 本地存储后备
- **字体**: Google Fonts - Noto Sans SC
- **图标**: Remix Icon

## 文件结构
```
/workspace/projects/
├── index.html    # 主页面（单页应用容器）
├── style.css     # 自定义样式（主题系统、动画）
└── main.js       # 所有业务逻辑（LocalDB 本地存储管理）
```

## 核心功能

### 1. 用户系统
- 用户注册（自动生成匿名名称）
- 用户登录（会话持久化 via localStorage）
- 匿名用户名自动生成（形容词+名词+随机数）
- 退出登录
- 头像选择系统

### 2. 板块系统
- 校园闲聊 (chat)
- 学习求助 (study)
- 表白墙 (love) - 强制匿名、专属配色
- 失物招领 (lost)
- 交友脱单 (friend)

### 3. 主题系统
- 浅色模式 / 深色模式
- 跟随系统设置
- 手动切换
- 板块专属配色（表白墙粉色渐变）

### 4. 帖子功能
- 发布帖子（标题+内容+板块选择）
- 每日发帖限制（5条）
- 帖子列表（板块筛选、最新/最热排序）
- 踩帖自动隐藏（踩数>=10）
- 帖子收藏

### 5. 评论功能
- 一级评论
- 每日评论限制（10条）
- 评论删除

### 6. 个人中心
- 我的发布
- 我的评论
- 我的收藏
- 通知中心

### 7. 安全机制
- 关键词屏蔽（政治、色情、暴力等）
- 注册24小时后才能发言
- XSS 防护
- 网络异常自动提示

## Supabase 配置

### 连接信息
- **Project URL**: `https://pwncycfjhrnxlrowinbp.supabase.co`
- **匿名密钥**: `sb_publishable_ANYxis0bJjlRCsmWLFr15w_v902PU4U`

### 数据存储策略
- **云端优先**: 尝试使用 Supabase 存储数据
- **本地后备**: 云端不可用时自动切换到 localStorage
- 确保应用在各种网络环境下都能正常工作

### 数据库表结构

#### user_profiles 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| username | varchar | 用户名 |
| password | varchar | 密码 |
| anonymous_name | varchar | 匿名显示名 |
| avatar | varchar | 头像标识 |
| created_at | timestamp | 注册时间 |
| is_active | boolean | 账户状态 |
| today_post_count | int | 今日发帖数 |
| today_comment_count | int | 今日评论数 |
| last_post_date | date | 最后发帖日期 |
| last_comment_date | date | 最后评论日期 |

#### posts 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 发帖用户ID |
| username | varchar | 用户名 |
| anonymous_name | varchar | 匿名显示名 |
| title | varchar | 标题 |
| content | text | 内容 |
| category | varchar | 板块 |
| upvotes | int | 点赞数 |
| downvotes | int | 踩数 |
| created_at | timestamp | 发布时间 |

#### comments 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| post_id | uuid | 所属帖子 |
| user_id | uuid | 评论用户ID |
| username | varchar | 用户名 |
| anonymous_name | varchar | 匿名显示名 |
| content | text | 评论内容 |
| created_at | timestamp | 评论时间 |

#### categories 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| name | varchar | 板块名称 |
| icon | varchar | 图标标识 |
| description | varchar | 板块描述 |

## 启动方式

### 开发环境
```bash
# 直接打开 index.html 或启动静态服务器
python3 -m http.server 5000
# 或
npx serve -l 5000
```

### 访问地址
- 本地: `http://localhost:5000`
- 生产环境: `https://abc123.dev.coze.site` (根据实际域名)

## 页面说明

| 页面 | ID | 说明 |
|------|-----|------|
| 登录/注册 | authPage | 合并的认证界面 |
| 首页 | homePage | 帖子信息流 |
| 发帖页 | createPostPage | 发布新帖子 |
| 帖子详情 | postDetailPage | 查看帖子和评论 |
| 个人中心 | profilePage | 我的帖子和统计 |
| 规则声明 | rulesPage | 社区规则和免责声明 |

## 代码规范

### 全局函数（可直接调用）
- `App.init()` - 初始化应用
- `App.goHome()` - 返回首页
- `App.showPage(page)` - 显示指定页面
- `App.login()` - 执行登录
- `App.register()` - 执行注册
- `App.logout()` - 退出登录
- `showToast(message, type)` - 显示提示

### 页面方法
- `App.switchAuthTab(tab)` - 切换登录/注册选项卡
- `App.filterByCategory(cat)` - 按板块筛选
- `App.selectCategory(cat)` - 选择发帖板块
- `App.viewPostDetail(id)` - 查看帖子详情
- `App.likePost(id)` - 点赞帖子
- `App.dislikePost(id)` - 踩帖子
- `App.deletePost(id)` - 删除帖子
- `App.confirmDeletePost(id)` - 确认删除

### 状态管理
```javascript
currentUser        // 当前登录用户
currentCategory    // 当前筛选板块
currentPage        // 当前页面
currentPostId      // 当前查看的帖子ID
selectedPostCategory // 发帖时选择的板块
```

## 注意事项

1. 所有用户输入都会经过关键词过滤
2. 新用户注册后需等待24小时才能发言
3. 每日发帖限制5条，评论限制10条
4. 帖子踩数达到10条会自动隐藏内容
5. 外键关系需在数据库中正确配置才能使用关联查询

## 常见问题

### Q: 为什么帖子列表加载不出来？
A: 检查 Supabase 连接配置是否正确，确认 RLS 策略是否允许公开读取。

### Q: 为什么无法发帖？
A: 可能是未登录、24小时限制未过、或已达每日上限。

### Q: 如何添加新的板块？
A: 在 categories 表中插入新记录，并同步更新 main.js 中的 CATEGORIES 配置。
