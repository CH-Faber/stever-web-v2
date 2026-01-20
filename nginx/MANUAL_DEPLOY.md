# 手动部署指南（不使用脚本）

如果你不想运行 `deploy.sh` 脚本，可以按照以下步骤手动部署。

## 前提条件

- 已有普通用户（或者你就用 root，自己承担风险）
- 域名已解析到服务器 IP
- 已安装基础软件（Node.js, Nginx, PM2）

---

## 核心步骤（最简化版本）

# 安装基础软件

```bash
# 更新系统
sudo apt update

# 安装 Nginx
sudo apt install nginx -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Mindcraft 系统依赖 (用于 canvas)
sudo apt install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libxi-dev libxinerama-dev libxrandr-dev
```

# 克隆并构建项目

```bash
# 克隆项目
cd /var/www
git clone <your-repo-url> stever-web-v2
cd stever-web-v2

# 构建后端
cd server
npm install
npm run build

# 构建前端
cd ../client
npm install
npm run build

# 安装 Mindcraft 依赖
cd ../mindcraft
npm install
```

### 3. 配置环境变量

```bash
# 创建后端环境变量文件
cd /var/www/stever-web-v2/server
nano .env
```

输入以下内容：
```
PORT=3001
NODE_ENV=production
MINDCRAFT_PATH=/var/www/stever-web-v2/mindcraft
CLIENT_URL=https://mc.faberhu.top
```

保存并退出（Ctrl+X, Y, Enter）

### 4. 配置 Nginx

```bash
# 复制配置文件
sudo cp /var/www/stever-web-v2/nginx/mc.faberhu.top.conf /etc/nginx/sites-available/mc.faberhu.top

# 创建软链接
sudo ln -s /etc/nginx/sites-available/mc.faberhu.top /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 5. 启动后端服务

```bash
cd /var/www/stever-web-v2/server

# 用 PM2 启动
pm2 start dist/server/src/index.js --name stever-web-backend

# 查看状态
pm2 status
pm2 logs stever-web-backend
```

### 6. 配置 SSL（可选但推荐）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d mc.faberhu.top
```

---

## 就这么简单！

**最核心的就是：**
1. 安装 Node.js 和 Nginx
2. 构建前后端代码
3. 配置 Nginx 反向代理
4. 用 PM2 启动后端

---

## 如果你想更简单

### 方案 A: 只用 Node.js（不用 Nginx）

适合测试或内网使用：

```bash
# 1. 构建项目
cd /var/www/stever-web-v2
cd server && npm install && npm run build
cd ../client && npm install && npm run build

# 2. 配置环境变量
cd ../server
echo "PORT=3001" > .env
echo "NODE_ENV=production" >> .env

# 3. 启动后端
pm2 start dist/server/src/index.js --name backend

# 4. 前端用 serve 或其他静态服务器
npm install -g serve
cd ../client
pm2 start "serve -s dist -p 80" --name frontend
```

访问：`http://your_ip:80`

### 方案 B: 用 Docker（最简单）

如果你熟悉 Docker：

```bash
# 创建 Dockerfile（前端）
cat > /var/www/stever-web-v2/client/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-p", "80"]
EOF

# 创建 Dockerfile（后端）
cat > /var/www/stever-web-v2/server/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "dist/server/src/index.js"]
EOF

# 构建并运行
cd /var/www/stever-web-v2
docker build -t stever-client ./client
docker build -t stever-server ./server
docker run -d -p 80:80 stever-client
docker run -d -p 3001:3001 stever-server
```

### 方案 C: 开发模式（最快，仅测试用）

```bash
cd /var/www/stever-web-v2

# 启动后端（开发模式）
cd server
npm install
pm2 start "npm run dev" --name backend-dev

# 启动前端（开发模式）
cd ../client
npm install
pm2 start "npm run dev" --name frontend-dev
```

访问：`http://your_ip:5173`

---

## 更新代码

手动更新也很简单：

```bash
cd /var/www/stever-web-v2

# 拉取代码
git pull

# 重新构建
cd server && npm install && npm run build
cd ../client && npm install && npm run build

# 重启服务
pm2 restart stever-web-backend

# 如果修改了 Nginx 配置
sudo systemctl reload nginx
```

---

## 常见问题

### Q: 我不想用 PM2，可以直接运行吗？

可以，但不推荐（进程会在 SSH 断开后停止）：

```bash
cd /var/www/stever-web-v2/server
node dist/server/src/index.js
```

或者用 `nohup`：
```bash
nohup node dist/server/src/index.js > app.log 2>&1 &
```

### Q: 我不想用 Nginx，可以吗？

可以，但需要修改后端代码来服务静态文件：

```javascript
// server/src/index.ts 添加
import path from 'path';

// 在路由之后添加
app.use(express.static(path.join(__dirname, '../../../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
});
```

然后直接访问 `http://your_ip:3001`

### Q: 我只想在本地测试，不需要域名和 SSL

```bash
# 1. 构建项目
cd /var/www/stever-web-v2
cd server && npm install && npm run build
cd ../client && npm install && npm run build

# 2. 启动后端
cd ../server
pm2 start dist/server/src/index.js --name backend

# 3. 用 serve 启动前端
cd ../client
npx serve -s dist -p 80
```

访问：`http://localhost` 或 `http://your_ip`

### Q: 端口被占用怎么办？

```bash
# 查看占用端口的进程
sudo netstat -tlnp | grep 3001

# 杀死进程
sudo kill -9 <PID>

# 或者修改端口
# 编辑 server/.env，改成其他端口如 3002
```

---

## 最最最简化版本（5 步搞定）

如果你只是想快速看到效果：

```bash
# 1. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. 克隆项目
git clone <your-repo-url> ~/stever-web-v2
cd ~/stever-web-v2

# 3. 安装依赖
cd server && npm install && cd ../client && npm install && cd ..

# 4. 启动后端（开发模式）
cd server && npm run dev &

# 5. 启动前端（开发模式）
cd ../client && npm run dev
```

访问：`http://your_ip:5173`

---

## 总结

**deploy.sh 脚本做的事情：**
- 自动执行上面的所有步骤
- 检查错误
- 提供友好的输出

**你手动做的好处：**
- 更清楚每一步在做什么
- 可以根据需要调整
- 出错时更容易排查

**建议：**
- 第一次部署：手动执行，了解流程
- 后续更新：用脚本，省时间

选择权在你！
