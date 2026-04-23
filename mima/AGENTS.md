# 密码加密解密工具箱 - AGENTS

## 项目概览
- **项目类型**: 原生静态多页面 Web 应用
- **技术栈**: 原生 HTML/CSS/JavaScript + CDN 外部库
- **依赖**: Tailwind CSS, CryptoJS, Supabase JS SDK, Font Awesome
- **端口**: 5000

## 目录结构
```
/workspace/projects/
├── index.html          # 首页 - 功能导航
├── md5.html            # MD5 加密页面
├── sha1.html           # SHA1 加密页面
├── decrypt.html        # 解密查询页面
├── tools.html          # 离线工具页面
├── readme.html         # 使用说明页面
├── styles/
│   └── main.css        # 共享暗黑风格样式
└── .coze               # 项目配置
```

## 页面功能

### 1. index.html (首页)
- 功能导航卡片
- 数据库连接状态指示
- 重要提示说明

### 2. md5.html (MD5 加密)
- 输入明文生成 32 位 MD5 哈希
- 自动存储到 Supabase 数据库
- 复制结果功能
- Toast 提示反馈

### 3. sha1.html (SHA1 加密)
- 输入明文生成 40 位 SHA1 哈希
- 自动存储到 Supabase 数据库
- 复制结果功能

### 4. decrypt.html (解密查询)
- 选择算法类型 (MD5/SHA1)
- 输入密文查询数据库
- 显示查询结果和历史记录
- 格式验证 (MD5 32位, SHA1 40位)

### 5. tools.html (离线工具)
所有工具均为本地计算，不上传数据：
- Base64 编码/解码
- URL 编码/解码
- 进制转换 (BIN/OCT/DEC/HEX)
- Unicode 编码/解码
- HTML 实体编码/解码
- 大小写转换

### 6. readme.html (使用说明)
- 完整使用文档
- 技术原理说明
- 注意事项声明

## Supabase 配置
- **API URL**: https://vxebvrglknakopdbfyuf.supabase.co
- **发布密钥**: sb_publishable_63yeKCzGKJ4QHJl_hjLlQw_khNPspXp
- **数据表**: hash_dict
- **字段**: id, plain_text, hash_text, hash_type, created_at
- **RLS**: 仅允许 SELECT, INSERT

## CDN 资源
```
Tailwind CSS: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css
CryptoJS: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js
Supabase: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
Font Awesome: 已通过 CDN 引入
```

## 启动命令
```bash
# 开发环境
python -m http.server 5000 --bind 0.0.0.0

# 或使用 Coze CLI
coze dev
```

## 验证检查清单
- [x] 所有 6 个 HTML 页面 HTTP 200 响应
- [x] CSS 样式文件正常加载
- [x] CDN 资源可访问
- [x] Supabase SDK 正常初始化
- [x] 页面间导航正常
