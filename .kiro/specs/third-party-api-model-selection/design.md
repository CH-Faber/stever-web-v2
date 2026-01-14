# 设计文档

## 概述

本设计实现以模型为中心的选择体验，支持从 API 服务商动态获取模型列表，并允许用户配置第三方 API 端点。核心思路是将模型选择器从"供应商优先"改为"模型优先"，同时提供灵活的自定义端点配置能力。

## 架构

```mermaid
graph TB
    subgraph Client["客户端"]
        MS[ModelSelector 组件]
        MF[ModelFetcher 服务]
        ES[EndpointStore 存储]
        FS[FavoritesStore 存储]
    end
    
    subgraph Server["服务端"]
        MR[/models 路由]
        MFS[ModelFetchService]
        EPS[EndpointService]
    end
    
    subgraph External["外部 API"]
        OAI[OpenAI API]
        ANT[Anthropic API]
        TP[第三方端点]
    end
    
    MS --> MF
    MS --> ES
    MS --> FS
    MF --> MR
    MR --> MFS
    MFS --> OAI
    MFS --> ANT
    MFS --> TP
    ES --> EPS
```

## 组件与接口

### 1. 数据类型定义

```typescript
// 模型信息
interface ModelInfo {
  id: string;              // 模型标识符，如 "gpt-4o"
  name: string;            // 显示名称
  provider: string;        // 提供商标识
  capabilities: ModelCapability[];  // 能力标签
  contextLength?: number;  // 上下文长度
  description?: string;    // 描述
}

type ModelCapability = 'text' | 'code' | 'vision' | 'embedding' | 'function_calling';

// 自定义端点配置
interface CustomEndpoint {
  id: string;              // 唯一标识
  name: string;            // 显示名称
  baseUrl: string;         // API 基础 URL
  apiKey?: string;         // API 密钥（加密存储）
  headers?: Record<string, string>;  // 自定义请求头
  apiFormat: ApiFormat;    // API 格式类型
  createdAt: Date;
  updatedAt: Date;
}

type ApiFormat = 'openai' | 'anthropic' | 'custom';

// 收藏的模型配置
interface FavoriteModelConfig {
  id: string;
  name: string;            // 用户自定义名称
  modelId: string;         // 模型 ID
  endpointId?: string;     // 自定义端点 ID（如果使用）
  provider: string;        // 提供商
  config: ModelConfig;     // 完整配置
  createdAt: Date;
}

// 模型列表响应
interface ModelsListResponse {
  models: ModelInfo[];
  provider: string;
  cached: boolean;
}
```

### 2. 前端组件

#### ModelSelector 组件

主要的模型选择器组件，替代现有的 ModelConfigForm。

```typescript
interface ModelSelectorProps {
  label: string;
  value: ModelConfig;
  onChange: (config: ModelConfig) => void;
  purpose?: 'main' | 'code' | 'vision' | 'embedding';  // 用途筛选
  optional?: boolean;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
}
```

组件结构：
- 搜索框：支持模型名称模糊搜索
- 收藏区：显示用户收藏的配置
- 模型列表：按提供商分组显示，支持展开/折叠
- 自定义端点入口：添加/管理第三方端点
- 高级设置：URL 覆盖、额外参数

#### EndpointManager 组件

管理自定义端点的弹窗组件。

```typescript
interface EndpointManagerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (endpoint: CustomEndpoint) => void;
}
```

### 3. 后端服务

#### ModelFetchService

负责从各个 API 服务商获取模型列表。

```typescript
class ModelFetchService {
  // 获取指定提供商的模型列表
  async fetchModels(provider: string, apiKey?: string): Promise<ModelInfo[]>;
  
  // 获取自定义端点的模型列表
  async fetchModelsFromEndpoint(endpoint: CustomEndpoint): Promise<ModelInfo[]>;
  
  // 缓存模型列表（5分钟过期）
  private cache: Map<string, { models: ModelInfo[], expiry: Date }>;
}
```

#### API 适配器

针对不同 API 格式的适配器：

```typescript
// OpenAI 兼容格式适配器（支持大多数第三方服务）
class OpenAIAdapter {
  async listModels(baseUrl: string, apiKey: string): Promise<ModelInfo[]> {
    // GET {baseUrl}/v1/models
    // 响应格式: { data: [{ id, object, created, owned_by }] }
  }
}

// Anthropic 格式适配器
class AnthropicAdapter {
  async listModels(apiKey: string): Promise<ModelInfo[]> {
    // Anthropic 没有公开的模型列表 API，返回预定义列表
  }
}
```

### 4. 存储层

#### EndpointStore（前端）

使用 Zustand 管理自定义端点状态，持久化到 localStorage。

```typescript
interface EndpointStore {
  endpoints: CustomEndpoint[];
  addEndpoint: (endpoint: Omit<CustomEndpoint, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEndpoint: (id: string, updates: Partial<CustomEndpoint>) => void;
  deleteEndpoint: (id: string) => void;
}
```

#### FavoritesStore（前端）

管理收藏的模型配置。

```typescript
interface FavoritesStore {
  favorites: FavoriteModelConfig[];
  addFavorite: (config: Omit<FavoriteModelConfig, 'id' | 'createdAt'>) => void;
  removeFavorite: (id: string) => void;
  reorderFavorites: (ids: string[]) => void;
}
```

## 数据模型

### 扩展现有类型

```typescript
// 扩展 ModelConfig，支持端点引用
interface ModelConfig {
  api: string;                   // API 提供商或 'custom'
  model: string;                 // 模型名称
  url?: string;                  // 自定义 API URL
  endpointId?: string;           // 引用的自定义端点 ID
  params?: Record<string, unknown>;
}
```

### 本地存储结构

```json
{
  "customEndpoints": [
    {
      "id": "ep_xxx",
      "name": "本地 Ollama",
      "baseUrl": "http://localhost:11434",
      "apiFormat": "openai",
      "createdAt": "2026-01-11T00:00:00Z",
      "updatedAt": "2026-01-11T00:00:00Z"
    }
  ],
  "favoriteModels": [
    {
      "id": "fav_xxx",
      "name": "GPT-4o 默认配置",
      "modelId": "gpt-4o",
      "provider": "openai",
      "config": { "api": "openai", "model": "gpt-4o" },
      "createdAt": "2026-01-11T00:00:00Z"
    }
  ]
}
```



## 正确性属性

*正确性属性是系统在所有有效执行中都应保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1：模型搜索结果包含匹配项

*对于任意* 模型列表和搜索关键词，如果某个模型的名称或能力标签包含该关键词，则该模型必须出现在搜索结果中。

**验证: 需求 1.2**

### 属性 2：模型选择自动填充配置

*对于任意* 有效的模型选择操作，选择后的 ModelConfig 必须包含该模型对应的 provider 和 model 字段，且值非空。

**验证: 需求 1.3**

### 属性 3：模型列表完整显示

*对于任意* 从 API 成功获取的模型列表响应，所有返回的模型都必须在 Model_Selector 的可选项中出现。

**验证: 需求 2.2**

### 属性 4：API 请求携带认证信息

*对于任意* 配置了 API 密钥的端点请求，发出的 HTTP 请求头中必须包含正确格式的认证信息（Authorization 或 x-api-key）。

**验证: 需求 2.4**

### 属性 5：URL 格式验证

*对于任意* 用户输入的 API URL，验证函数必须正确识别有效的 HTTP/HTTPS URL 格式，拒绝无效格式。

**验证: 需求 3.3**

### 属性 6：端点配置持久化 Round-Trip

*对于任意* 有效的 CustomEndpoint 配置，保存到存储后再读取，得到的配置必须与原始配置等价（除自动生成的 id 和时间戳外）。

**验证: 需求 4.1, 4.2, 4.5**

### 属性 7：端点 CRUD 操作一致性

*对于任意* 端点配置的创建、更新、删除操作序列，存储中的端点列表状态必须与操作序列的预期结果一致。

**验证: 需求 4.3, 4.4**

### 属性 8：模型能力筛选正确性

*对于任意* 指定用途（如 code、vision）的模型筛选，返回结果中排在前面的模型必须具有对应的能力标签。

**验证: 需求 5.2**

### 属性 9：收藏配置 Round-Trip

*对于任意* 有效的模型配置，添加到收藏后再从收藏列表获取，得到的配置必须与原始配置等价。

**验证: 需求 6.1, 6.4, 6.5**

### 属性 10：收藏配置一键应用

*对于任意* 收藏列表中的配置，选择应用后，当前的 ModelConfig 必须与收藏的配置完全一致。

**验证: 需求 6.3**

## 错误处理

### API 调用错误

| 错误场景 | 处理方式 |
|---------|---------|
| 网络超时 | 显示"连接超时"错误，允许重试或手动输入 |
| 401 未授权 | 提示"API 密钥无效或已过期" |
| 403 禁止访问 | 提示"无权访问该 API" |
| 404 端点不存在 | 提示"API 端点不存在，请检查 URL" |
| 500 服务器错误 | 提示"服务器错误，请稍后重试" |
| 响应格式错误 | 提示"响应格式不兼容"，允许手动输入 |

### 本地存储错误

| 错误场景 | 处理方式 |
|---------|---------|
| 存储空间不足 | 提示用户清理存储空间 |
| JSON 解析失败 | 重置为默认配置，记录错误日志 |
| 数据迁移失败 | 保留旧数据，提示用户手动迁移 |

## 测试策略

### 单元测试

- URL 验证函数的边界情况测试
- 模型搜索函数的特殊字符处理
- API 适配器的响应解析测试
- 存储操作的错误处理测试

### 属性测试

使用 fast-check 库进行属性测试，每个属性至少运行 100 次迭代。

测试配置示例：
```typescript
import fc from 'fast-check';

// Feature: third-party-api-model-selection, Property 5: URL 格式验证
fc.assert(
  fc.property(fc.string(), (input) => {
    const result = validateUrl(input);
    const isValidUrl = /^https?:\/\/.+/.test(input);
    return result.valid === isValidUrl;
  }),
  { numRuns: 100 }
);
```

### 集成测试

- 端到端的模型选择流程测试
- 自定义端点配置和使用流程测试
- 收藏功能的完整流程测试
