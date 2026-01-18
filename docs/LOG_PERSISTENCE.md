# 日志持久化系统

## 概述

日志持久化系统为每个机器人的每次运行创建独立的日志存档，支持历史日志查看、搜索和管理。

## 功能特性

### 1. 自动日志存档
- **独立会话**: 每次机器人启动都会创建一个新的日志会话
- **会话ID格式**: `{botId}_{timestamp}` (例如: `bot_123_2026-01-16T10-30-00-000Z`)
- **存储格式**: JSON Lines (.jsonl) - 每行一个JSON对象，便于流式读取和追加

### 2. 日志文件结构
```
logs/
├── sessions.json                          # 会话元数据索引
├── bot_123_2026-01-16T10-30-00-000Z.jsonl # 日志文件
└── bot_456_2026-01-16T11-00-00-000Z.jsonl
```

### 3. 日志会话生命周期
1. **启动时**: 调用 `startLogSession(botId, botName)` 创建新会话
2. **运行中**: 每条日志通过 `writeLogEntry(botId, log)` 写入文件
3. **停止时**: 调用 `endLogSession(botId)` 标记会话结束

### 4. API 端点

#### 获取所有日志会话
```
GET /api/logs/sessions
```

#### 获取指定机器人的日志会话
```
GET /api/logs/sessions/bot/:botId
```

#### 获取会话日志
```
GET /api/logs/sessions/:sessionId?level=info&limit=100&offset=0
```
参数:
- `level`: 过滤日志级别 (info/warn/error)
- `limit`: 返回条数限制
- `offset`: 分页偏移量

#### 删除日志会话
```
DELETE /api/logs/sessions/:sessionId
```

#### 获取活跃会话
```
GET /api/logs/active/:botId
```

### 5. 前端页面

#### 历史日志列表 (`/logs` 或 `/logs/bot/:botId`)
- 显示所有或指定机器人的日志会话
- 显示会话开始时间、持续时间、状态
- 支持删除会话
- 点击查看详细日志

#### 日志会话查看器 (`/logs/session/:sessionId`)
- 查看指定会话的完整日志
- 支持日志级别过滤
- 支持下载日志文件
- 自动滚动到底部

#### 实时监控面板
- 新增"历史日志"按钮，快速跳转到该机器人的历史日志

## 技术实现

### 后端服务

#### LogStorageService
```typescript
// 初始化日志存储
await initializeLogStorage();

// 开始新会话
const sessionId = await startLogSession(botId, botName);

// 写入日志
await writeLogEntry(botId, log);

// 结束会话
await endLogSession(botId);

// 读取会话日志
const { logs, total } = await readSessionLogs(sessionId, options);

// 获取机器人的所有会话
const sessions = await getBotSessions(botId);

// 删除会话
await deleteSession(sessionId);
```

#### ProcessManagerService 集成
- 在 `startBot()` 时自动调用 `startLogSession()`
- 在 `addLogEntry()` 时自动调用 `writeLogEntry()`
- 在 `stopBot()` 时自动调用 `endLogSession()`

### 前端组件

#### LogHistory
- 显示日志会话列表
- 支持按机器人过滤
- 显示会话状态和时长

#### LogSessionViewer
- 复用现有的 `LogViewer` 组件
- 添加下载功能
- 显示会话元信息

#### MonitorPanel
- 添加"历史日志"按钮
- 链接到该机器人的历史日志页面

## 数据格式

### 会话元数据 (sessions.json)
```json
[
  {
    "sessionId": "bot_123_2026-01-16T10-30-00-000Z",
    "botId": "bot_123",
    "botName": "我的机器人",
    "startTime": "2026-01-16T10:30:00.000Z",
    "endTime": "2026-01-16T11:00:00.000Z",
    "logFile": "logs/bot_123_2026-01-16T10-30-00-000Z.jsonl"
  }
]
```

### 日志文件 (.jsonl)
```jsonl
{"type":"session_start","sessionId":"bot_123_2026-01-16T10-30-00-000Z","botId":"bot_123","botName":"我的机器人","startTime":"2026-01-16T10:30:00.000Z"}
{"type":"log","timestamp":"2026-01-16T10:30:01.000Z","level":"info","message":"Bot started","source":"system"}
{"type":"log","timestamp":"2026-01-16T10:30:05.000Z","level":"info","message":"Connected to server","source":"bot"}
{"type":"session_end","sessionId":"bot_123_2026-01-16T10-30-00-000Z","endTime":"2026-01-16T11:00:00.000Z"}
```

## 性能优化

1. **流式写入**: 使用 `fs.appendFile()` 追加日志，避免读取整个文件
2. **内存缓存**: 保留最近1000条日志在内存中用于实时显示
3. **元数据索引**: 使用 `sessions.json` 快速查询会话列表
4. **分页支持**: API支持分页，避免一次加载大量日志

## 存储管理

### 自动清理（未来功能）
- 可配置日志保留天数
- 自动删除过期日志
- 压缩旧日志文件

### 手动管理
- 通过UI删除单个会话
- 直接删除 `logs/` 目录下的文件

## 使用示例

### 查看机器人历史日志
1. 进入机器人详情页
2. 点击"历史日志"按钮
3. 选择要查看的会话
4. 查看完整日志或下载

### 删除旧日志
1. 进入历史日志页面
2. 找到要删除的会话
3. 点击删除按钮
4. 确认删除

## 故障排查

### 日志文件未创建
- 检查 `logs/` 目录权限
- 查看服务器控制台错误信息
- 确认 `initializeLogStorage()` 已调用

### 日志丢失
- 检查 `sessions.json` 是否存在
- 验证日志文件是否完整
- 查看服务器日志中的错误

### 性能问题
- 检查日志文件大小
- 考虑增加分页限制
- 定期清理旧日志

## 未来改进

1. **日志搜索**: 全文搜索日志内容
2. **日志分析**: 统计错误率、警告数量等
3. **日志导出**: 支持多种格式导出（CSV、JSON等）
4. **日志压缩**: 自动压缩旧日志节省空间
5. **日志聚合**: 多个机器人日志的聚合视图
