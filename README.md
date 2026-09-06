# EquinoxX · PhantomBlog

EquinoxX 的个人主页（PhantomBlog）。

- **主站（自托管）**：`http://103.236.97.213:38090` —— 匿名问答、访客计数等动态功能
  - 域名 `equinoxx.tech` 原指向本站；因服务器为境内 NAT 且未做 ICP 备案，域名走 HTTP 会被备案系统拦截，备案完成后再启用
- **GitHub Pages 备份（只读）**：https://EquinoxXawa.github.io

纯 HTML / CSS / JS，无框架。动态功能由服务器上的零依赖 Node API 提供；GitHub Pages 上自动降级为只读展示。

## 目录结构

```
├── index.html              # 主页
├── assets/
│   ├── css/style.css       # 样式（深/浅双主题、响应式）
│   ├── js/main.js          # 页面逻辑：问答/计数 API、主题、导航
│   ├── js/fx.js            # 特效：粒子背景、打字机、彩带雨
│   └── favicon.svg
├── data/
│   ├── posts.json          # 文章数据（当前为空）
│   └── comments.json       # 老留言数据（服务器首启时自动迁移为问答种子）
├── images/avatar.jpg
└── deploy/                 # 服务器部署件（不入站运行）
    ├── server.js           # Node API：匿名问答 + 访客计数
    ├── equinoxx.tech.conf  # Nginx 站点配置（参考）
    └── phantomblog-qa.service  # systemd 服务
```

## 功能

- 深/浅双主题（记忆偏好、跟随系统）
- 粒子漂浮背景 + 点击彩花（随主题变色、鼠标排斥）
- Hero 打字机循环文案、彩带雨
- 小玩具坞（右下角）：手速测试、今日运势、一言、彩带
- 匿名问答：可匿名提交、服务端持久化（限速 3 条/分钟/IP）
- **站长管理**：问答区「管理」按钮输入口令解锁后，可对每条问答「回复 / 删除回复 / 删除」（口令见服务器 systemd 单元 `PB_ADMIN`）
- 访客计数：今日 + 累计（每次会话计 1）

## 更新内容

- **发文章**：编辑 `data/posts.json`。
- **问答数据**：主站存在服务器 `/var/www/phantomblog/runtime/qa.json`（部署目录见 `deploy/`）。
- **换头像**：覆盖 `images/avatar.jpg`。
