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
├── hash.html           # 哈希加密页面 (MD5/SHA1 标签页合并)
├── decrypt.html        # 解密查询页面
├── encrypt.html        # 可逆加密页面 (12种算法)
├── tools.html          # 离线工具页面
├── readme.html         # 使用说明页面
├── styles/
│   └── main.css        # 共享暗黑风格样式（含响应式）
└── .coze               # 项目配置
```

## 页面功能

### 1. index.html (首页)
- 功能导航卡片
- 数据库连接状态指示
- 重要提示说明

### 2. hash.html (哈希加密 - MD5/SHA1合并)
- 标签页切换 MD5 / SHA1
- 输入明文生成哈希值
- 自动存储到 Supabase 数据库
- 复制结果功能
- Toast 提示反馈
- MD5: 32位十六进制
- SHA1: 40位十六进制

### 3. decrypt.html (解密查询)
- 选择算法类型 (MD5/SHA1)
- 输入密文查询数据库
- 显示查询结果和历史记录
- 格式验证 (MD5 32位, SHA1 40位)
- 密文自动转小写兼容

### 5. encrypt.html (可逆加密)
支持12种对称加密算法，均支持加密/解密双向操作，分为4个分组：

**推荐算法**：
- **AES-256 (CBC模式)**: 高级加密标准，最安全的对称加密算法
- **AES-ECB**: 电子密码本模式，简单快速
- **AES-CTR**: 计数器模式，可并行加密

**经典算法**：
- **DES**: 数据加密标准（密钥8位）
- **DES-ECB**: DES电子密码本模式
- **TripleDES**: 三重DES（密钥24位）
- **TripleDES-ECB**: TripleDES电子密码本模式

**流加密算法**：
- **RC4**: 序列密码，广泛应用于SSL/TLS
- **RC4Drop**: RC4改进版，丢弃初始密钥流
- **Rabbit**: 高性能流加密算法
- **Rabbit Legacy**: Rabbit原始版本

**其他算法**：
- **Blowfish**: 河豚算法，密钥长度可变(32-448位)

所有操作本地完成，使用CryptoJS实现

### 6. tools.html (离线工具)
所有工具均为本地计算，不上传数据：
- Base64 编码/解码
- URL 编码/解码
- 进制转换 (BIN/OCT/DEC/HEX)
- Unicode 编码/解码
- HTML 实体编码/解码
- 大小写转换

### 7. readme.html (使用说明)
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
