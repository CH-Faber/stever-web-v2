# Nginx 配置文件说明

这个目录包含了在 Ubuntu 服务器上部署 stever-web-v2 项目所需的 Nginx 配置文件和部署脚本。

## 📁 文件说明

- `mc.faberhu.top.conf` - Nginx 配置文件
- `QUICK_START.md` - **⭐ 快速开始指南（推荐从这里开始）**
- `USER_SETUP.md` - **👤 用户设置指南（如果只有 root 用户，先看这个）**
- `DEPLOYMENT.md` - 详细的部署指南
- `deploy.sh` - 自动化部署脚本
- `create-deploy-user.sh` - 创建部署用户的脚本
- `install-certbot.sh` - Certbot 安装脚本
- `README.md` - 本文件

## 🚀 快速开始

**如果你只有 root 用户，先查看 `USER_SETUP.md` 创建普通用户！**

### 方法 1: 一键部署（推荐）

```bash
# 1. 克隆项目到服务器
cd /var/www
git clone <your-repo-url> stever-web-v2
cd stever-web-v2

# 2. 给脚本添加执行权限
chmod +x nginx/*.sh

# 3. 安装 certbot（如果需要）
bash nginx/install-certbot.sh

# 4. 执行完整部署
./nginx/deploy.sh full
```

### 方法 2: 分步部署

参考 `QUICK_START.md` 或 `DEPLOYMENT.md` 文件中的详细步骤。

### 更新代码

```bash
# 使用部署脚本更新
./nginx/deploy.sh update
```

## ⚠️ 常见问题

### certbot: command not found

```bash
bash nginx/install-certbot.sh
```

### [ERROR] Please do not run this script as root

不要使用 `sudo` 运行部署脚本：
```bash
./nginx/deploy.sh full  # ✅ 正确
sudo ./nginx/deploy.sh full  # ❌ 错误
```

更多问题解决方案请查看 `QUICK_START.md`。

## 配置说明

### Nginx 配置特点

1. **HTTP 到 HTTPS 重定向** - 所有 HTTP 请求自动重定向到 HTTPS
2. **反向代理** - 将 `/api` 请求代理到后端服务 (端口 3001)
3. **WebSocket 支持** - 为 Socket.IO 配置了 WebSocket 代理
4. **静态文件服务** - 直接服务前端构建的静态文件
5. **SPA 路由支持** - 所有路由回退到 index.html
6. **Gzip 压缩** - 启用了文件压缩以提高传输效率
7. **缓存策略** - 静态资源设置了长期缓存
8. **安全头** - 添加了常见的安全响应头

### 目录结构

```
/var/www/stever-web-v2/
├── client/
│   ├── dist/              # 前端构建输出 (Nginx 服务的根目录)
│   └── ...
├── server/
│   ├── dist/              # 后端构建输出
│   └── .env               # 环境变量配置
├── nginx/
│   └── mc.faberhu.top.conf
└── ...
```

### 端口配置

- **前端**: 由 Nginx 直接服务静态文件 (443/80)
- **后端**: Node.js 服务运行在 3001 端口 (内部)
- **WebSocket**: 通过 Nginx 代理到后端的 Socket.IO

## 注意事项

1. **SSL 证书**: 首次部署后需要运行 `sudo certbot --nginx -d mc.faberhu.top` 获取 SSL 证书
2. **环境变量**: 确保 `server/.env` 文件配置正确
3. **文件权限**: 确保 Nginx 用户 (www-data) 有权限读取静态文件
4. **防火墙**: 确保开放了 80 和 443 端口
5. **域名解析**: 确保 mc.faberhu.top 已正确解析到服务器 IP

## 故障排查

如果遇到问题，请查看：

1. Nginx 错误日志: `/var/log/nginx/mc.faberhu.top.error.log`
2. Nginx 访问日志: `/var/log/nginx/mc.faberhu.top.access.log`
3. 后端日志: `pm2 logs stever-web-backend`
4. Nginx 配置测试: `sudo nginx -t`

更多详细信息请参考 `DEPLOYMENT.md`。
