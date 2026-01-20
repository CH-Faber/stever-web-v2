# 快速部署指南

## ⚠️ 重要提示

1. **不要使用 root 用户登录服务器！** 使用普通用户，需要权限时用 `sudo`
2. **确保域名已解析** - mc.faberhu.top 必须指向你的服务器 IP
3. **按顺序执行** - 不要跳过步骤

## 🔐 如果你只有 root 用户

**如果你当前只能用 root 登录，先创建一个普通用户：**

```bash
# 以 root 身份登录服务器
ssh root@your_server_ip

# 下载并运行用户创建脚本
wget https://raw.githubusercontent.com/your-repo/stever-web-v2/main/nginx/create-deploy-user.sh
# 或者如果项目已经在服务器上：
# bash /path/to/stever-web-v2/nginx/create-deploy-user.sh

# 运行脚本
bash create-deploy-user.sh

# 按提示输入用户名和密码
# 脚本会自动配置 sudo 权限和 SSH 访问

# 在新终端测试登录（不要关闭当前 root 会话！）
ssh deploy@your_server_ip
```

**详细的用户设置指南请查看：`USER_SETUP.md`**

## 一键安装脚本

```bash
# 1. 以普通用户登录服务器（不是 root！）
ssh your_user@your_server

# 2. 克隆项目
cd /var/www
sudo mkdir -p /var/www/stever-web-v2
sudo chown -R $USER:$USER /var/www/stever-web-v2
git clone <your-repo-url> stever-web-v2
cd stever-web-v2

# 3. 给脚本添加执行权限
chmod +x nginx/*.sh

# 4. 安装 certbot（如果还没安装）
bash nginx/install-certbot.sh

# 5. 执行完整部署
./nginx/deploy.sh full
```

## 分步执行（如果一键脚本失败）

# 安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Nginx
sudo apt install nginx -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version

# 安装 PM2
sudo npm install -g pm2

# 安装 Mindcraft 所需的系统依赖 (用于 canvas 编译)
sudo apt install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libxi-dev libxinerama-dev libxrandr-dev

# 安装 certbot
sudo apt install certbot python3-certbot-nginx -y
```

# 构建项目

```bash
cd /var/www/stever-web-v2

# 构建服务端
cd server
npm install
npm run build

# 构建客户端
cd ../client
npm install
npm run build

# 安装 Mindcraft 依赖
cd ../mindcraft
npm install

# 验证构建结果
ls -la ../client/dist/
```

### 步骤 3: 配置环境变量

```bash
cd /var/www/stever-web-v2/server

# 创建 .env 文件
cat > .env << EOF
PORT=3001
NODE_ENV=production
MINDCRAFT_PATH=/var/www/stever-web-v2/mindcraft
CLIENT_URL=https://mc.faberhu.top
EOF

# 查看配置
cat .env
```

### 步骤 4: 配置 Nginx

```bash
# 复制配置文件
sudo cp /var/www/stever-web-v2/nginx/mc.faberhu.top.conf /etc/nginx/sites-available/mc.faberhu.top

# 创建软链接
sudo ln -s /etc/nginx/sites-available/mc.faberhu.top /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

### 步骤 5: 配置防火墙

```bash
# 允许 HTTP 和 HTTPS
sudo ufw allow 'Nginx Full'

# 允许 SSH（重要！否则可能断开连接）
sudo ufw allow OpenSSH

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

### 步骤 6: 获取 SSL 证书

**在执行此步骤前，确保：**
- 域名 mc.faberhu.top 已解析到服务器 IP
- Nginx 正在运行
- 防火墙已开放 80 和 443 端口

```bash
# 检查域名解析
nslookup mc.faberhu.top

# 获取证书
sudo certbot --nginx -d mc.faberhu.top

# 按照提示操作：
# 1. 输入邮箱地址
# 2. 同意服务条款 (Y)
# 3. 选择是否重定向 HTTP 到 HTTPS (推荐选 2)

# 测试自动续期
sudo certbot renew --dry-run
```

### 步骤 7: 启动后端服务

```bash
cd /var/www/stever-web-v2/server

# 启动服务（以普通用户身份，不是 root！）
pm2 start dist/server/src/index.js --name stever-web-backend

# 设置开机自启
pm2 startup
# 复制输出的命令并执行

# 保存进程列表
pm2 save

# 查看状态
pm2 status
pm2 logs stever-web-backend --lines 50
```

### 步骤 8: 验证部署

```bash
# 检查后端是否运行
curl http://localhost:3001/api/health

# 检查 Nginx 是否正常
curl -I https://mc.faberhu.top

# 查看日志
sudo tail -f /var/log/nginx/mc.faberhu.top.access.log
pm2 logs stever-web-backend
```

## 常见问题解决

### 问题 1: certbot: command not found

**解决方案：**
```bash
# 运行安装脚本
bash nginx/install-certbot.sh

# 或手动安装
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 问题 2: [ERROR] Please do not run this script as root

**原因：** 你使用了 root 用户或 `sudo` 运行部署脚本

**解决方案：**
```bash
# 不要这样做：
sudo ./nginx/deploy.sh full  # ❌ 错误

# 应该这样做：
./nginx/deploy.sh full       # ✅ 正确
```

### 问题 3: 502 Bad Gateway

**可能原因：**
1. 后端服务未启动
2. 端口 3001 被占用
3. 防火墙阻止了连接

**解决方案：**
```bash
# 检查后端服务
pm2 status
pm2 logs stever-web-backend

# 检查端口
sudo netstat -tlnp | grep 3001

# 重启服务
pm2 restart stever-web-backend

# 检查 Nginx 配置
sudo nginx -t
sudo systemctl restart nginx
```

### 问题 4: Permission denied

**解决方案：**
```bash
# 确保项目目录权限正确
sudo chown -R $USER:$USER /var/www/stever-web-v2

# 确保 Nginx 可以读取静态文件
sudo chown -R www-data:www-data /var/www/stever-web-v2/client/dist
```

### 问题 5: 域名无法访问

**检查清单：**
```bash
# 1. 检查域名解析
nslookup mc.faberhu.top

# 2. 检查 Nginx 是否运行
sudo systemctl status nginx

# 3. 检查防火墙
sudo ufw status

# 4. 检查 Nginx 配置
sudo nginx -t

# 5. 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 问题 6: WebSocket 连接失败

**解决方案：**
```bash
# 检查后端日志
pm2 logs stever-web-backend

# 确保 Nginx 配置了 WebSocket 代理
sudo grep -A 10 "location /socket.io" /etc/nginx/sites-available/mc.faberhu.top

# 重启服务
pm2 restart stever-web-backend
sudo systemctl restart nginx
```

## 更新代码

```bash
cd /var/www/stever-web-v2

# 拉取最新代码
git pull

# 使用部署脚本更新
./nginx/deploy.sh update

# 或手动更新
cd server && npm install && npm run build
cd ../client && npm install && npm run build
pm2 restart stever-web-backend
```

## 有用的命令

```bash
# 查看所有服务状态
sudo systemctl status nginx
pm2 status

# 查看日志
sudo tail -f /var/log/nginx/mc.faberhu.top.error.log
pm2 logs stever-web-backend --lines 100

# 重启服务
sudo systemctl restart nginx
pm2 restart stever-web-backend

# 停止服务
pm2 stop stever-web-backend
sudo systemctl stop nginx

# 查看 SSL 证书信息
sudo certbot certificates

# 手动续期 SSL 证书
sudo certbot renew
```

## 需要帮助？

如果遇到问题：
1. 查看日志文件
2. 检查服务状态
3. 确认防火墙和域名配置
4. 参考 DEPLOYMENT.md 获取更详细的信息
