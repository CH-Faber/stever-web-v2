# Mindcraft Dashboard

一个用于管理和监控 [Mindcraft](https://github.com/kolbytn/mindcraft) Minecraft AI 机器人的可视化 Web 管理平台。

## 功能特性

- **仪表盘概览** - 查看所有机器人状态，快速启动/停止机器人
- **机器人配置管理** - 创建、编辑、删除机器人配置，支持多模型配置（主模型、代码模型、视觉模型、嵌入模型）
- **API 密钥管理** - 安全管理 16+ 种 LLM 提供商的 API 密钥
- **自定义端点** - 支持配置第三方 API 代理端点（如 OpenAI 兼容 API）
- **模型预设** - 创建可复用的模型配置预设，快速应用到机器人
- **任务管理** - 创建和管理机器人任务
- **实时监控** - WebSocket 实时日志、位置和物品栏更新
- **配置导入导出** - 备份和分享配置

## 技术栈

**前端**
- React 18 + TypeScript
- Vite
- TailwindCSS
- Zustand (状态管理)
- Socket.IO Client

**后端**
- Node.js + Express + TypeScript
- Socket.IO
- 文件系统存储 (JSON)

## 项目结构

```
├── client/          # 前端 React 应用
│   └── src/
│       ├── api/         # API 请求封装
│       ├── components/  # UI 组件
│       ├── pages/       # 页面组件
│       ├── stores/      # Zustand 状态管理
│       └── websocket/   # WebSocket 客户端
├── server/          # 后端 Express 服务
│   └── src/
│       ├── routes/      # API 路由
│       └── services/    # 业务逻辑服务
├── shared/          # 共享类型定义
│   └── types/
├── profiles/        # 机器人配置文件
├── keys.json        # API 密钥存储
├── settings.json    # 服务器设置
├── endpoints.json   # 自定义端点配置
└── model-presets.json  # 模型预设配置
```

## 快速开始

### 前置要求

- Node.js 18+
- [Mindcraft](https://github.com/kolbytn/mindcraft) 项目（本项目需要与 Mindcraft 配合使用）

### 安装

```bash
# 安装服务端依赖
cd server
npm install

# 安装客户端依赖
cd ../client
npm install
```

### 配置

1. 在 `server/.env` 中配置环境变量：

```env
PORT=3001
CLIENT_URL=http://localhost:5173
MINDCRAFT_PATH=../mindcraft  # Mindcraft 项目路径
```

2. 配置 Minecraft 服务器连接（`settings.json`）：

```json
{
  "host": "localhost",
  "port": 25565,
  "auth": "offline",
  "version": "1.19.4"
}
```

### 运行

```bash
# 启动后端服务 (端口 3001)
cd server
npm run dev

# 启动前端开发服务器 (端口 5173)
cd client
npm run dev
```

访问 http://localhost:5173 打开管理界面。

## 支持的 LLM 提供商

OpenAI, Google (Gemini), Anthropic, xAI, DeepSeek, Qwen, Mistral, Replicate, Groq, HuggingFace, Novita, OpenRouter, GLHF, Hyperbolic, Cerebras, Mercury

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/bots` | 获取所有机器人 |
| POST | `/api/bots` | 创建机器人 |
| PUT | `/api/bots/:id` | 更新机器人 |
| DELETE | `/api/bots/:id` | 删除机器人 |
| POST | `/api/bots/:id/start` | 启动机器人 |
| POST | `/api/bots/:id/stop` | 停止机器人 |
| GET | `/api/keys` | 获取 API 密钥状态 |
| PUT | `/api/keys/:provider` | 更新 API 密钥 |
| GET | `/api/settings` | 获取服务器设置 |
| PUT | `/api/settings` | 更新服务器设置 |
| GET | `/api/endpoints` | 获取自定义端点 |
| GET | `/api/model-presets` | 获取模型预设 |
| GET | `/api/export` | 导出配置 |
| POST | `/api/import` | 导入配置 |

## 许可证

MIT
