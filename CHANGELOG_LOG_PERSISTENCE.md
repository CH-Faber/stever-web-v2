# 日志持久化功能更新日志

## 版本 2.0.0 - 2026-01-16

### 🎉 新增功能

#### 日志持久化系统
- **独立会话存档**: 每次机器人启动都会创建独立的日志会话，不再丢失历史记录
- **永久存储**: 日志保存在文件系统中，可以随时查看历史记录
- **会话管理**: 支持查看、搜索、删除历史日志会话
- **日志下载**: 可以将日志导出为文本文件

#### 新增页面
- **历史日志列表** (`/logs`, `/logs/bot/:botId`)
  - 显示所有或指定机器人的日志会话
  - 显示会话时间、持续时间、状态
  - 支持删除会话
  
- **日志会话查看器** (`/logs/session/:sessionId`)
  - 查看完整的历史日志
  - 支持按级别过滤（info/warn/error）
  - 支持下载日志文件
  - 自动滚动到底部

#### 新增 API 端点
- `GET /api/logs/sessions` - 获取所有日志会话
- `GET /api/logs/sessions/bot/:botId` - 获取指定机器人的会话
- `GET /api/logs/sessions/:sessionId` - 获取会话日志（支持过滤和分页）
- `DELETE /api/logs/sessions/:sessionId` - 删除日志会话
- `GET /api/logs/active/:botId` - 获取活跃会话信息

#### UI 改进
- 在机器人详情页的"实时监控"面板添加"历史日志"按钮
- 日志会话列表显示运行状态标识
- 支持相对时间显示（如"2小时前"）

### 🔧 技术改进

#### 后端
- 新增 `LogStorageService` 服务
  - 管理日志会话生命周期
  - 异步写入日志文件
  - 维护会话元数据索引
  
- 集成到 `ProcessManagerService`
  - 自动在机器人启动时创建会话
  - 自动在机器人停止时结束会话
  - 实时写入日志到文件

- 新增 `logs` 路由模块
  - RESTful API 设计
  - 支持分页和过滤
  - 错误处理

#### 前端
- 新增 `logs` API 客户端
- 新增 `LogHistory` 和 `LogSessionViewer` 组件
- 更新路由配置
- 安装 `date-fns` 用于日期格式化

#### 数据格式
- 使用 JSON Lines (.jsonl) 格式存储日志
- 每行一个 JSON 对象，便于流式处理
- 包含会话开始/结束标记

### 📁 文件变更

#### 新增文件
```
server/src/services/logStorageService.ts
server/src/routes/logs.ts
server/src/services/__tests__/logStorageService.test.ts
client/src/api/logs.ts
client/src/pages/LogHistory.tsx
client/src/pages/LogSessionViewer.tsx
docs/LOG_PERSISTENCE.md
docs/LOG_QUICKSTART.md
docs/LOG_MIGRATION.md
```

#### 修改文件
```
server/src/index.ts
server/src/services/processManagerService.ts
client/src/App.tsx
client/src/components/monitor/MonitorPanel.tsx
shared/types/index.ts
README.md
```

#### 新增目录
```
logs/                    # 日志存储目录
├── sessions.json        # 会话元数据
└── *.jsonl             # 日志文件
```

### 🔄 兼容性

- ✅ 完全向后兼容
- ✅ 不影响现有功能
- ✅ 实时日志显示方式不变
- ✅ 无需数据迁移

### 📊 性能影响

- **内存**: 无明显变化（仍保留最近 1000 条）
- **磁盘**: 每小时约 1-5 MB（取决于日志量）
- **CPU**: 异步写入，影响可忽略

### 📚 文档

- [快速入门指南](docs/LOG_QUICKSTART.md) - 如何使用新功能
- [技术文档](docs/LOG_PERSISTENCE.md) - 详细的技术实现
- [迁移指南](docs/LOG_MIGRATION.md) - 升级和故障排查

### 🐛 已知问题

无

### 🔮 未来计划

- [ ] 自动清理旧日志（可配置保留天数）
- [ ] 日志压缩（节省存储空间）
- [ ] 全文搜索（快速查找日志内容）
- [ ] 日志分析（统计错误率、警告数量等）
- [ ] 多格式导出（CSV、JSON等）
- [ ] 日志聚合视图（多机器人日志合并显示）

### 💡 使用建议

1. **定期清理**: 建议每月清理一次不需要的历史日志
2. **磁盘监控**: 如果机器人运行频繁，注意监控磁盘空间
3. **备份重要日志**: 可以下载重要的日志会话作为备份
4. **日志分析**: 通过历史日志可以分析机器人行为模式

### 🙏 致谢

感谢所有用户的反馈和建议！

---

## 如何升级

```bash
# 1. 拉取最新代码
git pull

# 2. 安装依赖
cd server && npm install
cd ../client && npm install

# 3. 编译
cd ../server && npm run build

# 4. 启动服务
npm start
```

## 反馈

如有问题或建议，欢迎提交 Issue 或 Pull Request！
