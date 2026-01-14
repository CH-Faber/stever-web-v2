# 实现计划：第三方 API 与模型选择

## 概述

本计划将模型配置系统从"供应商优先"重构为"模型优先"，实现动态模型列表获取和第三方端点支持。

## 任务

- [x] 1. 扩展类型定义
  - 在 `shared/types/index.ts` 中添加 ModelInfo、CustomEndpoint、FavoriteModelConfig 等类型
  - 扩展 ModelConfig 类型支持 endpointId 字段
  - 添加 ModelsListResponse 类型
  - _需求: 2.2, 3.2, 4.5_

- [x] 2. 实现后端模型获取服务
  - [x] 2.1 创建 ModelFetchService
    - 在 `server/src/services/` 创建 modelFetchService.ts
    - 实现 OpenAI 兼容格式的模型列表获取（GET /v1/models）
    - 实现 5 分钟缓存机制
    - _需求: 2.1, 2.4_
  - [x] 2.2 创建模型列表 API 路由
    - 在 `server/src/routes/` 创建 models.ts
    - 实现 GET /api/models/:provider 端点
    - 实现 POST /api/models/custom 端点（自定义端点获取）
    - _需求: 2.1, 2.6_
  - [ ]* 2.3 编写属性测试：API 请求携带认证信息
    - **属性 4: API 请求携带认证信息**
    - **验证: 需求 2.4**

- [x] 3. 实现前端存储层
  - [x] 3.1 创建 EndpointStore
    - 在 `client/src/stores/` 创建 endpointsStore.ts
    - 实现 CRUD 操作和 localStorage 持久化
    - _需求: 4.1, 4.3, 4.4_
  - [x] 3.2 创建 FavoritesStore
    - 在 `client/src/stores/` 创建 favoritesStore.ts
    - 实现收藏的添加、删除、排序功能
    - _需求: 6.1, 6.4, 6.5_
  - [ ]* 3.3 编写属性测试：端点配置持久化 Round-Trip
    - **属性 6: 端点配置持久化 Round-Trip**
    - **验证: 需求 4.1, 4.2, 4.5**
  - [ ]* 3.4 编写属性测试：收藏配置 Round-Trip
    - **属性 9: 收藏配置 Round-Trip**
    - **验证: 需求 6.1, 6.4, 6.5**

- [x] 4. 实现前端 API 客户端
  - [x] 4.1 创建模型 API 客户端
    - 在 `client/src/api/` 创建 models.ts
    - 实现 fetchModels、fetchModelsFromEndpoint 函数
    - _需求: 2.1, 2.5_
  - [ ]* 4.2 编写属性测试：模型列表完整显示
    - **属性 3: 模型列表完整显示**
    - **验证: 需求 2.2**

- [ ] 5. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

- [x] 6. 实现 URL 验证工具
  - [x] 6.1 创建 URL 验证函数
    - 在 `client/src/lib/` 创建 validation.ts
    - 实现 validateUrl 函数，支持 HTTP/HTTPS 格式验证
    - _需求: 3.3_
  - [ ]* 6.2 编写属性测试：URL 格式验证
    - **属性 5: URL 格式验证**
    - **验证: 需求 3.3**

- [-] 7. 实现模型搜索与筛选逻辑
  - [x] 7.1 创建模型搜索工具函数
    - 在 `client/src/lib/` 创建 modelSearch.ts
    - 实现模糊搜索和能力筛选函数
    - _需求: 1.2, 5.2_
  - [ ]* 7.2 编写属性测试：模型搜索结果包含匹配项
    - **属性 1: 模型搜索结果包含匹配项**
    - **验证: 需求 1.2**
  - [ ]* 7.3 编写属性测试：模型能力筛选正确性
    - **属性 8: 模型能力筛选正确性**
    - **验证: 需求 5.2**

- [x] 8. 实现 EndpointManager 组件
  - 在 `client/src/components/bots/` 创建 EndpointManager.tsx
  - 实现端点列表显示、添加、编辑、删除功能
  - 实现端点表单（URL、密钥、请求头配置）
  - _需求: 3.1, 3.2, 3.4, 3.5_

- [x] 9. 实现 ModelSelector 组件
  - [x] 9.1 创建 ModelSelector 基础结构
    - 在 `client/src/components/bots/` 创建 ModelSelector.tsx
    - 实现搜索框、模型列表、收藏区布局
    - _需求: 1.1, 1.4, 6.2_
  - [x] 9.2 集成模型获取和显示
    - 集成 API 调用获取模型列表
    - 实现加载状态和错误处理
    - 实现模型详情悬停提示
    - _需求: 2.3, 2.5, 1.5_
  - [x] 9.3 集成搜索和筛选功能
    - 集成模型搜索函数
    - 实现按用途筛选（code、vision、embedding）
    - 显示能力标签图标
    - _需求: 1.2, 5.2, 5.3, 5.4_
  - [x] 9.4 集成收藏功能
    - 实现收藏按钮和收藏列表
    - 实现一键应用收藏配置
    - _需求: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 9.5 编写属性测试：模型选择自动填充配置
    - **属性 2: 模型选择自动填充配置**
    - **验证: 需求 1.3**
  - [ ]* 9.6 编写属性测试：收藏配置一键应用
    - **属性 10: 收藏配置一键应用**
    - **验证: 需求 6.3**

- [ ] 10. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

- [x] 11. 集成到现有页面
  - [x] 11.1 更新 BotEditor 页面
    - 将 ModelConfigForm 替换为 ModelSelector
    - 确保主模型、代码模型、视觉模型配置正常工作
    - _需求: 1.1, 1.3_
  - [x] 11.2 更新组件导出
    - 更新 `client/src/components/bots/index.ts` 导出新组件
    - _需求: 无_

- [x] 12. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加快 MVP 开发
- 每个任务都引用了具体的需求以便追溯
- 检查点用于确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
