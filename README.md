# EquinoxX.github.io

EquinoxX 的个人主页（PhantomBlog）· 托管于 GitHub Pages · 自定义域名 `equinoxx.tech`

无框架、无外部依赖，国内可直接访问。

## 目录结构

```
├── index.html              # 主页（结构 + 文案）
├── assets/
│   ├── css/style.css       # 样式（深/浅双主题）
│   ├── js/main.js          # 交互与数据渲染
│   └── favicon.svg         # 站点图标
├── data/
│   ├── posts.json          # 文章数据（可编辑）
│   └── comments.json       # 留言数据（可编辑）
├── images/avatar.jpg       # 头像
└── CNAME                   # 自定义域名配置
```

## 如何更新内容

- **发文章**：编辑 `data/posts.json`，按现有格式追加一条即可，页面会自动按日期倒序展示。
- **加留言**：编辑 `data/comments.json`，追加 `{ "username": "名字", "content": "内容", "date": "2026-09-06 10:00" }`。
- **换头像**：直接覆盖 `images/avatar.jpg`（正方形图片效果最佳）。

改完后提交推送 `main` 分支，GitHub Pages 会自动重新部署，约 1 分钟内生效。

## 自定义域名

仓库根目录的 `CNAME` 指向 `equinoxx.tech`。如更换域名，请同步修改 `CNAME` 与 DNS 记录。
