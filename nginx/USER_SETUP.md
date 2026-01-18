# Ubuntu 服务器用户设置指南

## 当前情况检查

首先，检查你当前是什么用户：

```bash
# 查看当前用户
whoami

# 如果显示 "root"，说明你正在使用 root 用户
```

## 方案选择

### 方案 1: 创建新用户（推荐，如果只有 root）

如果你的服务器只有 root 用户，需要创建一个新的普通用户。

### 方案 2: 使用已有用户

如果服务器已经有其他用户（比如 ubuntu、admin 等），直接使用即可。

---

## 方案 1: 创建新用户

### 步骤 1: 以 root 身份创建新用户

```bash
# 当前以 root 登录服务器

# 创建新用户（替换 yourname 为你想要的用户名）
adduser yourname

# 按提示输入：
# - 密码（输入两次）
# - 全名（可以直接回车跳过）
# - 其他信息（可以直接回车跳过）
# - 确认信息（输入 Y）
```

### 步骤 2: 给新用户 sudo 权限

```bash
# 将用户添加到 sudo 组
usermod -aG sudo yourname

# 验证用户已添加到 sudo 组
groups yourname
# 应该显示: yourname : yourname sudo
```

### 步骤 3: 设置 SSH 密钥（可选但推荐）

**如果你使用密码登录：**
```bash
# 允许密码登录（确保 SSH 配置正确）
nano /etc/ssh/sshd_config

# 确保以下配置：
# PasswordAuthentication yes
# PubkeyAuthentication yes

# 重启 SSH 服务
systemctl restart sshd
```

**如果你使用 SSH 密钥登录（更安全）：**
```bash
# 为新用户创建 .ssh 目录
mkdir -p /home/yourname/.ssh
chmod 700 /home/yourname/.ssh

# 复制 root 的 SSH 密钥到新用户（如果 root 有的话）
cp /root/.ssh/authorized_keys /home/yourname/.ssh/authorized_keys

# 或者手动添加你的公钥
nano /home/yourname/.ssh/authorized_keys
# 粘贴你的公钥（从本地电脑的 ~/.ssh/id_rsa.pub 复制）

# 设置正确的权限
chmod 600 /home/yourname/.ssh/authorized_keys
chown -R yourname:yourname /home/yourname/.ssh

# 验证配置
ls -la /home/yourname/.ssh/
```

### 步骤 4: 测试新用户登录

**不要关闭当前的 root SSH 会话！** 打开一个新的终端窗口测试：

```bash
# 在你的本地电脑上，打开新终端
ssh yourname@your_server_ip

# 输入密码（或使用 SSH 密钥）

# 登录成功后，测试 sudo 权限
sudo whoami
# 应该显示: root

# 如果成功，说明配置正确！
```

### 步骤 5: 切换到新用户进行部署

```bash
# 现在以新用户身份登录
ssh yourname@your_server_ip

# 克隆项目
cd /var/www
sudo mkdir -p /var/www/stever-web-v2
sudo chown -R $USER:$USER /var/www/stever-web-v2
git clone <your-repo-url> stever-web-v2
cd stever-web-v2

# 执行部署
chmod +x nginx/deploy.sh
./nginx/deploy.sh full
```

---

## 方案 2: 使用已有用户

### 步骤 1: 查看系统中的用户

```bash
# 以 root 身份查看所有用户
cat /etc/passwd | grep -E '/home|/root'

# 常见的用户名：
# - ubuntu (Ubuntu 系统默认)
# - admin
# - debian (Debian 系统默认)
# - centos (CentOS 系统默认)
```

### 步骤 2: 确认用户有 sudo 权限

```bash
# 检查用户是否在 sudo 组
groups ubuntu  # 替换 ubuntu 为实际用户名

# 如果没有 sudo 权限，添加：
usermod -aG sudo ubuntu
```

### 步骤 3: 设置密码（如果需要）

```bash
# 为用户设置或重置密码
passwd ubuntu  # 替换 ubuntu 为实际用户名
```

### 步骤 4: 使用该用户登录

```bash
# 在本地电脑上
ssh ubuntu@your_server_ip
```

---

## 方案 3: 从 root 临时切换用户

如果你已经以 root 登录，可以临时切换到其他用户：

```bash
# 当前是 root 用户

# 切换到其他用户
su - yourname

# 现在你是 yourname 用户了
whoami  # 显示: yourname

# 执行部署
cd /var/www/stever-web-v2
./nginx/deploy.sh full

# 退出回到 root
exit
```

---

## 完整示例：从零开始

假设你现在只有 root 用户，下面是完整的操作流程：

```bash
# ========== 在服务器上（root 用户）==========

# 1. 创建新用户
adduser deploy
# 输入密码和信息

# 2. 添加 sudo 权限
usermod -aG sudo deploy

# 3. 设置 SSH 密钥
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# 4. 创建项目目录并设置权限
mkdir -p /var/www/stever-web-v2
chown -R deploy:deploy /var/www/stever-web-v2

# ========== 在本地电脑上 ==========

# 5. 使用新用户登录（新开一个终端窗口）
ssh deploy@your_server_ip

# 6. 验证登录成功
whoami  # 应该显示: deploy
sudo whoami  # 应该显示: root

# 7. 克隆项目
cd /var/www/stever-web-v2
git clone <your-repo-url> .

# 8. 执行部署
chmod +x nginx/deploy.sh
./nginx/deploy.sh full
```

---

## 常见问题

### Q1: 忘记了新用户的密码

```bash
# 以 root 身份重置密码
passwd yourname
```

### Q2: SSH 密钥登录失败

```bash
# 检查权限
ls -la /home/yourname/.ssh/

# 应该是：
# drwx------ (700) .ssh/
# -rw------- (600) authorized_keys

# 修复权限
chmod 700 /home/yourname/.ssh
chmod 600 /home/yourname/.ssh/authorized_keys
chown -R yourname:yourname /home/yourname/.ssh
```

### Q3: sudo 需要密码很烦

```bash
# 可以配置免密码 sudo（不太安全，不推荐）
sudo visudo

# 添加这一行（替换 yourname）
yourname ALL=(ALL) NOPASSWD:ALL
```

### Q4: 如何禁用 root SSH 登录（提高安全性）

**警告：确保新用户可以正常登录后再执行！**

```bash
# 编辑 SSH 配置
sudo nano /etc/ssh/sshd_config

# 修改或添加：
PermitRootLogin no

# 重启 SSH 服务
sudo systemctl restart sshd
```

### Q5: 我的云服务商（阿里云/腾讯云等）的情况

大多数云服务商在创建服务器时会：
- 自动创建一个默认用户（如 ubuntu、admin）
- 或者只提供 root 用户

**阿里云 ECS：**
- 通常有 root 用户
- 建议创建新用户

**腾讯云 CVM：**
- Ubuntu 系统通常有 ubuntu 用户
- CentOS 系统通常只有 root

**AWS EC2：**
- Ubuntu 系统默认用户是 ubuntu
- Amazon Linux 默认用户是 ec2-user

---

## 推荐配置

创建一个专门用于部署的用户：

```bash
# 用户名建议
deploy      # 简单明了
webapp      # 表示 web 应用
yourname    # 你的名字
```

```bash
# 完整配置脚本（以 root 运行）
#!/bin/bash

USERNAME="deploy"

# 创建用户
adduser $USERNAME

# 添加 sudo 权限
usermod -aG sudo $USERNAME

# 设置 SSH
mkdir -p /home/$USERNAME/.ssh
cp /root/.ssh/authorized_keys /home/$USERNAME/.ssh/authorized_keys 2>/dev/null || true
chown -R $USERNAME:$USERNAME /home/$USERNAME/.ssh
chmod 700 /home/$USERNAME/.ssh
chmod 600 /home/$USERNAME/.ssh/authorized_keys 2>/dev/null || true

# 创建项目目录
mkdir -p /var/www
chown -R $USERNAME:$USERNAME /var/www

echo "用户 $USERNAME 创建完成！"
echo "现在可以使用以下命令登录："
echo "ssh $USERNAME@your_server_ip"
```

保存为 `create-user.sh`，然后运行：
```bash
chmod +x create-user.sh
./create-user.sh
```

---

## 总结

1. **最简单的方法**：创建一个新用户 `deploy`，给它 sudo 权限
2. **测试很重要**：创建用户后，先在新终端测试登录，确认成功后再关闭 root 会话
3. **SSH 密钥更安全**：比密码登录更安全，推荐使用
4. **不要急着禁用 root**：等一切正常运行后再考虑禁用 root SSH 登录

需要帮助的话，告诉我你的具体情况（云服务商、系统版本等），我可以给出更具体的建议！
