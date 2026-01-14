# 需求文档

## 简介

本功能旨在重构模型配置系统，将用户体验从"先选供应商再选模型"改为"以模型为中心"的选择方式。同时支持第三方 API 端点配置，让用户可以使用自定义的 API 服务（如本地部署的模型、代理服务等）。

## 术语表

- **Model_Selector**: 模型选择器组件，用于展示和选择可用的 AI 模型
- **Model_Fetcher**: 模型获取器，负责从 API 服务商动态获取可用模型列表
- **Third_Party_Endpoint**: 第三方 API 端点，用户自定义的 API 服务地址
- **Model_Config**: 模型配置对象，包含模型标识、API 端点和参数
- **Provider**: API 提供商，如 OpenAI、Anthropic 等官方服务

## 需求

### 需求 1：以模型为中心的选择体验

**用户故事：** 作为用户，我希望直接选择想要使用的模型，而不是先选择供应商再输入模型名称，这样可以更快速地配置机器人。

#### 验收标准

1. WHEN 用户打开模型配置界面 THEN Model_Selector SHALL 显示按模型分组的列表，而非按供应商分组
2. WHEN 用户搜索模型 THEN Model_Selector SHALL 支持按模型名称、能力标签进行模糊搜索
3. WHEN 用户选择一个模型 THEN Model_Config SHALL 自动填充该模型对应的默认 API 提供商和端点
4. WHEN 模型支持多个供应商 THEN Model_Selector SHALL 显示可用供应商列表供用户选择
5. WHEN 用户悬停在模型上 THEN Model_Selector SHALL 显示模型的详细信息（参数量、上下文长度、能力等）

### 需求 2：动态获取模型列表

**用户故事：** 作为用户，我希望系统能够从 API 服务商动态获取可用的模型列表，这样我可以看到最新的可用模型而不需要手动输入。

#### 验收标准

1. WHEN 用户选择一个 API 端点 THEN Model_Fetcher SHALL 调用该端点的模型列表 API 获取可用模型
2. WHEN 模型列表获取成功 THEN Model_Selector SHALL 显示从服务商返回的所有可用模型
3. IF 模型列表 API 调用失败 THEN Model_Selector SHALL 显示错误信息并允许用户手动输入模型名称
4. WHEN 用户配置了 API 密钥 THEN Model_Fetcher SHALL 使用该密钥进行认证请求
5. WHEN 模型列表加载中 THEN Model_Selector SHALL 显示加载状态指示器
6. FOR ALL 支持模型列表 API 的供应商 THE Model_Fetcher SHALL 实现对应的适配器（OpenAI 兼容格式、Anthropic 等）

### 需求 3：第三方 API 端点支持

**用户故事：** 作为用户，我希望能够配置第三方 API 端点（如本地 Ollama、LM Studio 或代理服务），这样可以使用自部署的模型或特殊的 API 服务。

#### 验收标准

1. WHEN 用户选择"自定义端点"选项 THEN Model_Selector SHALL 显示第三方 API 配置表单
2. WHEN 用户配置第三方端点 THEN Third_Party_Endpoint SHALL 支持设置 API URL、API 密钥、请求头
3. WHEN 用户保存第三方端点配置 THEN Model_Config SHALL 验证 URL 格式的有效性
4. WHEN 第三方端点配置完成 THEN Model_Config SHALL 允许用户手动输入模型名称
5. IF 第三方端点连接失败 THEN Model_Selector SHALL 显示错误信息并保留用户输入

### 需求 4：模型配置持久化

**用户故事：** 作为用户，我希望我的第三方端点配置能够被保存和复用，这样不需要每次都重新配置。

#### 验收标准

1. WHEN 用户保存第三方端点配置 THEN Model_Config SHALL 将配置持久化到本地存储
2. WHEN 用户下次打开模型选择器 THEN Model_Selector SHALL 显示之前保存的自定义端点
3. WHEN 用户编辑已保存的端点 THEN Model_Config SHALL 更新持久化的配置
4. WHEN 用户删除自定义端点 THEN Model_Config SHALL 从存储中移除该配置
5. FOR ALL 持久化的端点配置 THE Model_Config SHALL 使用 JSON 格式存储

### 需求 5：模型兼容性提示

**用户故事：** 作为用户，我希望在选择模型时能看到该模型是否适合特定用途（如代码生成、视觉理解），这样可以做出更好的选择。

#### 验收标准

1. FOR ALL 模型 THE Model_Registry SHALL 标记其支持的能力（文本生成、代码生成、视觉理解、嵌入）
2. WHEN 用户为特定用途选择模型（如代码模型） THEN Model_Selector SHALL 优先显示具有相应能力的模型
3. WHEN 用户选择不兼容的模型 THEN Model_Selector SHALL 显示警告提示但不阻止选择
4. WHEN 显示模型列表 THEN Model_Selector SHALL 用图标或标签标识模型的能力

### 需求 6：快速切换与收藏

**用户故事：** 作为用户，我希望能够收藏常用的模型配置，这样可以快速切换不同的模型设置。

#### 验收标准

1. WHEN 用户点击收藏按钮 THEN Model_Selector SHALL 将当前模型配置添加到收藏列表
2. WHEN 用户打开模型选择器 THEN Model_Selector SHALL 在顶部显示收藏的模型配置
3. WHEN 用户从收藏列表选择配置 THEN Model_Config SHALL 一键应用该配置
4. WHEN 用户取消收藏 THEN Model_Selector SHALL 从收藏列表中移除该配置
5. FOR ALL 收藏的配置 THE Model_Config SHALL 持久化存储收藏状态
