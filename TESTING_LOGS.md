# 测试日志持久化功能

## 问题修复

已修复以下问题：
1. ✅ 日志路径从 `server/logs/` 改为项目根目录 `logs/`
2. ✅ 前端页面刷新后自动加载活跃会话的历史日志
3. ✅ 添加 `setBotLogs` 方法到 store

## 测试步骤

### 1. 重启服务器

```bash
# 停止当前服务器（如果正在运行）
# 然后启动新的服务器
cd server
npm start
```

### 2. 测试 API（可选）

在项目根目录运行：
```bash
node test-logs-api.js
```

应该看到类似输出：
```
测试日志 API...

1. 获取所有日志会话...
   找到 1 个会话
   最新会话: Stever01 (bot_xxx_2026-01-15T18-09-12-535Z)

2. 获取会话日志...
   找到 25 条日志
   第一条: Starting bot...
   最后一条: Generated response: hello world...

3. 获取机器人的所有会话...
   机器人 Stever01 有 1 个会话

4. 检查活跃会话...
   活跃状态: 否

✅ 所有测试通过！
```

### 3. 测试前端功能

#### 测试 A: 查看历史日志
1. 打开浏览器访问 http://localhost:5173
2. 进入任意机器人详情页
3. 点击"历史日志"按钮
4. 应该能看到之前的日志会话列表
5. 点击"查看日志"查看完整日志

#### 测试 B: 刷新页面保持日志
1. 启动一个机器人
2. 等待一些日志出现
3. **刷新页面**（F5）
4. 日志应该仍然显示（从持久化存储加载）

#### 测试 C: 新会话创建
1. 停止机器人
2. 再次启动机器人
3. 点击"历史日志"
4. 应该看到两个会话（旧的和新的）

#### 测试 D: 下载日志
1. 进入历史日志页面
2. 选择一个会话
3. 点击"下载日志"按钮
4. 应该下载一个 .log 文件

## 预期行为

### 启动机器人时
- ✅ 创建新的日志会话
- ✅ 会话 ID 格式: `bot_{botId}_{timestamp}`
- ✅ 日志文件保存在 `logs/` 目录
- ✅ 实时日志显示在监控面板

### 刷新页面时
- ✅ 如果机器人正在运行，自动加载活跃会话的日志
- ✅ 日志不会消失
- ✅ 继续接收新的实时日志

### 停止机器人时
- ✅ 会话标记为结束
- ✅ 日志文件保留
- ✅ 可以在历史记录中查看

### 查看历史日志时
- ✅ 显示所有历史会话
- ✅ 显示会话时间和持续时间
- ✅ 可以过滤日志级别
- ✅ 可以下载日志文件

## 故障排查

### 问题：刷新后日志消失

**检查：**
1. 打开浏览器开发者工具（F12）
2. 查看 Console 是否有错误
3. 查看 Network 标签，检查 API 请求是否成功

**可能原因：**
- 服务器未重启（需要重新编译和启动）
- API 请求失败（检查服务器日志）
- 没有活跃会话（机器人未运行）

### 问题：历史日志页面为空

**检查：**
1. 确认 `logs/` 目录存在
2. 确认 `logs/sessions.json` 文件存在
3. 检查文件权限

**解决：**
```bash
# 检查日志目录
ls -la logs/

# 查看 sessions.json
cat logs/sessions.json
```

### 问题：API 返回 404

**检查：**
1. 确认服务器已重新编译：`cd server && npm run build`
2. 确认服务器已重启
3. 检查路由是否正确注册

**验证：**
```bash
curl http://localhost:3001/api/logs/sessions
```

## 调试技巧

### 查看服务器日志
服务器启动时应该看到：
```
[LogStorage] Created logs directory: /path/to/logs
[LogStorage] Loaded X session(s) from metadata
Server running on http://localhost:3001
```

### 查看浏览器控制台
页面加载时应该看到：
```
No active session logs to load
```
或
```
Loaded X logs from active session
```

### 手动测试 API
```bash
# 获取所有会话
curl http://localhost:3001/api/logs/sessions

# 获取特定会话的日志
curl http://localhost:3001/api/logs/sessions/bot_xxx_2026-01-15T18-09-12-535Z

# 获取机器人的会话
curl http://localhost:3001/api/logs/sessions/bot/bot_1768106403862_k0khacg

# 检查活跃会话
curl http://localhost:3001/api/logs/active/bot_1768106403862_k0khacg
```

## 成功标志

如果一切正常，你应该能够：
- ✅ 刷新页面后日志仍然显示
- ✅ 查看历史日志会话列表
- ✅ 查看任何会话的完整日志
- ✅ 下载日志文件
- ✅ 每次启动创建新的独立会话

## 需要帮助？

如果遇到问题：
1. 检查服务器控制台输出
2. 检查浏览器开发者工具
3. 运行 `node test-logs-api.js` 测试 API
4. 查看 `logs/` 目录内容
