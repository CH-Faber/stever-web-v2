# Nginx 部署指南

## 前置要求

1. Ubuntu 服务器
2. 已安装 Nginx
3. 已安装 Node.js (建议 v18 或更高版本)
4. 已安装 PM2 (用于管理 Node.js 进程)
5. 域名 mc.faberhu.top 已解析到服务器 IP

## 部署步骤

### 1. 安装必要软件

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Nginx
sudo apt install nginx -y

# 安装 Node.js (使用 NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Certbot (用于 SSL 证书)
sudo apt install certbot python3-certbot-nginx -y
```

### 2. 克隆项目到服务器

```bash
# 创建项目目录
sudo mkdir -p /var/www/stever-web-v2
sudo chown -R $USER:$USER /var/www/stever-web-v2

# 克隆项目
cd /var/www
git clone <your-repo-url> stever-web-v2
cd stever-web-v2
```

### 3. 安装依赖并构建

```bash
# 安装服务端依赖
cd /var/www/stever-web-v2/server
npm install
npm run build

# 安装客户端依赖并构建
cd /var/www/stever-web-v2/client
npm install
npm run build
```

### 4. 配置环境变量

```bash
# 编辑服务端环境变量
cd /var/www/stever-web-v2/server
nano .env
```

添加以下内容：
```
PORT=3001
NODE_ENV=production
MINDCRAFT_PATH=/var/www/stever-web-v2/mindcraft
CLIENT_URL=https://mc.faberhu.top
```

### 5. 配置 Nginx

```bash
# 复制 Nginx 配置文件
sudo cp /var/www/stever-web-v2/nginx/mc.faberhu.top.conf /etc/nginx/sites-available/mc.faberhu.top

# 创建软链接启用站点
sudo ln -s /etc/nginx/sites-available/mc.faberhu.top /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 如果测试通过，重启 Nginx
sudo systemctl restart nginx
```

### 6. 获取 SSL 证书

```bash
# 使用 Certbot 自动获取并配置 SSL 证书
sudo certbot --nginx -d mc.faberhu.top

# Certbot 会自动修改 Nginx 配置并重启服务
```

### 7. 使用 PM2 启动后端服务

```bash
cd /var/www/stever-web-v2/server

# 启动服务
pm2 start dist/server/src/index.js --name stever-web-backend

# 设置开机自启
pm2 startup
pm2 save

# 查看服务状态
pm2 status
pm2 logs stever-web-backend
```

### 8. 配置防火墙

```bash
# 允许 HTTP 和 HTTPS 流量
sudo ufw allow 'Nginx Full'

# 如果需要 SSH 访问
sudo ufw allow OpenSSH

# 启用防火墙
sudo ufw enable
```

## 更新部署

当你需要更新代码时：

```bash
cd /var/www/stever-web-v2

# 拉取最新代码
git pull

# 重新构建前端
cd client
npm install
npm run build

# 重新构建后端
cd ../server
npm install
npm run build

# 重启后端服务
pm2 restart stever-web-backend

# 重启 Nginx (如果需要)
sudo systemctl restart nginx
```

## 常用命令

```bash
# 查看 Nginx 状态
sudo systemctl status nginx

# 重启 Nginx
sudo systemctl restart nginx

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/mc.faberhu.top.error.log

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/mc.faberhu.top.access.log

# 查看 PM2 进程
pm2 list

# 查看后端日志
pm2 logs stever-web-backend

# 重启后端
pm2 restart stever-web-backend

# 停止后端
pm2 stop stever-web-backend
```

## 故障排查

### 1. 502 Bad Gateway

- 检查后端服务是否运行：`pm2 status`
- 检查端口 3001 是否被占用：`sudo netstat -tlnp | grep 3001`
- 查看后端日志：`pm2 logs stever-web-backend`

### 2. WebSocket 连接失败

- 确保 Nginx 配置中 `/socket.io` 路径正确配置了 WebSocket 代理
- 检查防火墙是否阻止了连接
- 查看浏览器控制台错误信息

### 3. SSL 证书问题

- 确保域名已正确解析到服务器 IP
- 重新运行 Certbot：`sudo certbot --nginx -d mc.faberhu.top`
- 检查证书是否过期：`sudo certbot certificates`

### 4. 静态文件 404

- 确保前端已正确构建：`ls -la /var/www/stever-web-v2/client/dist`
- 检查 Nginx 配置中的 root 路径是否正确
- 检查文件权限：`sudo chown -R www-data:www-data /var/www/stever-web-v2/client/dist`

## 自动续期 SSL 证书

Certbot 会自动设置定时任务续期证书，你可以测试续期：

```bash
sudo certbot renew --dry-run
```

## 监控和日志

建议设置日志轮转以避免日志文件过大：

```bash
# Nginx 日志轮转已由系统自动配置
# PM2 日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```
