# Git SSH 配置指南

如果你遇到 `Permission denied (publickey)` 错误，说明服务器无法通过 SSH 访问 GitHub。

## 🚀 快速解决方案

### 方案 1: 改用 HTTPS（最简单）

```bash
cd /var/www/stever-web-v2

# 查看当前远程地址
git remote -v

# 如果显示 git@github.com:... 改成 HTTPS
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 测试
git pull
```

**优点：** 简单，不需要配置 SSH 密钥  
**缺点：** 每次 pull/push 可能需要输入密码（可以配置 credential helper）

### 方案 2: 配置 SSH 密钥

```bash
# 1. 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"
# 按回车使用默认路径
# 按回车设置空密码（或输入密码）

# 2. 查看公钥
cat ~/.ssh/id_ed25519.pub

# 3. 复制输出内容

# 4. 添加到 GitHub
# 访问：https://github.com/settings/keys
# 点击 "New SSH key"
# 标题：Server - mc.faberhu.top
# 粘贴公钥内容
# 点击 "Add SSH key"

# 5. 测试连接
ssh -T git@github.com
# 应该显示：Hi username! You've successfully authenticated...

# 6. 现在可以 git pull 了
cd /var/www/stever-web-v2
git pull
```

**优点：** 更安全，不需要输入密码  
**缺点：** 需要配置 SSH 密钥

### 方案 3: 不使用 git pull（如果代码已经是最新的）

如果你的代码已经是最新的，可以跳过 git pull：

```bash
# 直接构建和部署，不拉取代码
cd /var/www/stever-web-v2

# 构建后端
cd server && npm install && npm run build

# 构建前端
cd ../client && npm install && npm run build

# 启动服务
cd ../server
pm2 start dist/server/src/index.js --name stever-web-backend
pm2 save
```

## 📝 详细步骤

### 使用 HTTPS 的完整配置

```bash
cd /var/www/stever-web-v2

# 改用 HTTPS
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 配置 Git 缓存密码（可选，避免每次输入）
git config --global credential.helper store

# 第一次 pull 会要求输入用户名和密码
git pull
# Username: your_github_username
# Password: your_github_token (不是密码！)

# 之后就不需要再输入了
```

**注意：** GitHub 已经不支持密码登录，需要使用 Personal Access Token：
1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 生成并复制 token
5. 在 git pull 时，用 token 作为密码

### 使用 SSH 的完整配置

```bash
# 1. 检查是否已有 SSH 密钥
ls -la ~/.ssh/
# 如果看到 id_rsa.pub 或 id_ed25519.pub，说明已有密钥

# 2. 如果没有，生成新密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 3. 启动 ssh-agent
eval "$(ssh-agent -s)"

# 4. 添加密钥到 ssh-agent
ssh-add ~/.ssh/id_ed25519

# 5. 查看公钥
cat ~/.ssh/id_ed25519.pub

# 6. 复制公钥内容，添加到 GitHub
# https://github.com/settings/keys

# 7. 测试连接
ssh -T git@github.com

# 8. 确保仓库使用 SSH URL
cd /var/www/stever-web-v2
git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO.git

# 9. 测试 pull
git pull
```

## 🔍 故障排查

### 问题 1: ssh-keygen: command not found

```bash
# 安装 openssh-client
sudo apt update
sudo apt install openssh-client -y
```

### 问题 2: 仍然提示 Permission denied

```bash
# 检查 SSH 配置
ssh -vT git@github.com

# 检查密钥权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# 确保 ssh-agent 运行
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### 问题 3: HTTPS 每次都要输入密码

```bash
# 配置 credential helper
git config --global credential.helper store

# 或者使用 cache（密码缓存 15 分钟）
git config --global credential.helper cache

# 或者设置缓存时间（1 小时）
git config --global credential.helper 'cache --timeout=3600'
```

### 问题 4: 不知道仓库地址

```bash
# 查看当前远程地址
cd /var/www/stever-web-v2
git remote -v

# 如果显示：
# origin  git@github.com:username/repo.git (fetch)
# 改成 HTTPS：
# git remote set-url origin https://github.com/username/repo.git

# 如果显示：
# origin  https://github.com/username/repo.git (fetch)
# 改成 SSH：
# git remote set-url origin git@github.com:username/repo.git
```

## 💡 推荐方案

**对于服务器部署，推荐使用 SSH 密钥：**
1. 更安全
2. 不需要输入密码
3. 可以限制密钥权限（只读或读写）

**快速设置：**
```bash
# 一键配置 SSH（复制粘贴执行）
ssh-keygen -t ed25519 -C "server@mc.faberhu.top" -f ~/.ssh/id_ed25519 -N ""
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
echo "复制下面的公钥，添加到 GitHub："
cat ~/.ssh/id_ed25519.pub
```

然后访问 https://github.com/settings/keys 添加公钥。

## 🎯 总结

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| HTTPS | 简单快速 | 需要 token | ⭐⭐⭐ |
| SSH | 安全方便 | 需要配置 | ⭐⭐⭐⭐⭐ |
| 不用 git pull | 最简单 | 无法自动更新 | ⭐⭐ |

**建议：** 花 2 分钟配置 SSH 密钥，一劳永逸！
