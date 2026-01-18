// Shared type definitions for Mindcraft Dashboard

// ============================================
// Model Configuration Types
// ============================================

/**
 * 模型能力类型
 */
export type ModelCapability = 'text' | 'code' | 'vision' | 'embedding' | 'function_calling';

/**
 * 模型信息
 */
export interface ModelInfo {
  id: string;                              // 模型标识符，如 "gpt-4o"
  name: string;                            // 显示名称
  provider: string;                        // 提供商标识
  capabilities: ModelCapability[];         // 能力标签
  contextLength?: number;                  // 上下文长度
  description?: string;                    // 描述
}

/**
 * API 格式类型
 */
export type ApiFormat = 'openai' | 'anthropic' | 'custom';

/**
 * 自定义端点配置
 */
export interface CustomEndpoint {
  id: string;                              // 唯一标识
  name: string;                            // 显示名称
  baseUrl: string;                         // API 基础 URL
  apiKey?: string;                         // API 密钥（加密存储）
  headers?: Record<string, string>;        // 自定义请求头
  apiFormat: ApiFormat;                    // API 格式类型
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 模型配置
 */
export interface ModelConfig {
  api: string;                             // API 提供商或 'custom'
  model: string;                           // 模型名称
  url?: string;                            // 自定义 API URL
  endpointId?: string;                     // 引用的自定义端点 ID
  params?: Record<string, unknown>;        // 额外参数
}

/**
 * 收藏的模型配置
 */
export interface FavoriteModelConfig {
  id: string;
  name: string;                            // 用户自定义名称
  modelId: string;                         // 模型 ID
  endpointId?: string;                     // 自定义端点 ID（如果使用）
  provider: string;                        // 提供商
  config: ModelConfig;                     // 完整配置
  createdAt: Date;
}

/**
 * 模型预设用途类型
 */
export type ModelPresetPurpose = 'main' | 'code' | 'vision' | 'embedding';

/**
 * 全局模型预设配置
 */
export interface ModelPreset {
  id: string;
  name: string;                            // 预设名称
  description?: string;                    // 描述
  purpose: ModelPresetPurpose;             // 用途：主模型/代码/视觉/嵌入
  config: ModelConfig;                     // 模型配置
  isDefault?: boolean;                     // 是否为该用途的默认预设
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 模型预设列表响应
 */
export interface ModelPresetsListResponse {
  presets: ModelPreset[];
}

/**
 * 创建模型预设请求
 */
export interface CreateModelPresetRequest {
  name: string;
  description?: string;
  purpose: ModelPresetPurpose;
  config: ModelConfig;
  isDefault?: boolean;
}

/**
 * 更新模型预设请求
 */
export interface UpdateModelPresetRequest extends Partial<CreateModelPresetRequest> {}

/**
 * 模型列表响应
 */
export interface ModelsListResponse {
  models: ModelInfo[];
  provider: string;
  cached: boolean;
}

export interface EmbeddingConfig {
  api: string;
  model: string;
  url?: string;
  endpointId?: string;                     // 引用的自定义端点 ID
}

export interface BotModes {
  self_preservation: boolean;
  unstuck: boolean;
  cowardice: boolean;
  self_defense: boolean;
  hunting: boolean;
  item_collecting: boolean;
  torch_placing: boolean;
  idle_staring: boolean;
  cheat: boolean;
}

/**
 * Bot behavior settings (per-bot configuration)
 */
export interface BotBehaviorSettings {
  cooldown: number;                        // Response cooldown in ms (default: 3000)
  max_messages: number;                    // Max messages in context (default: 15)
  num_examples: number;                    // Number of examples for prompting (default: 2)
  max_commands: number;                    // Max consecutive commands (-1 for unlimited)
  relevant_docs_count: number;             // Number of relevant docs for prompting (default: 5)
  code_timeout_mins: number;               // Code execution timeout (-1 for unlimited)
  narrate_behavior: boolean;               // Chat automatic actions
  chat_bot_messages: boolean;              // Chat messages to other bots
  load_memory: boolean;                    // Load memory from previous session
  allow_vision: boolean;                   // Allow vision model
  language: string;                        // Language for translation (default: 'en')
  // Additional settings
  init_message: string;                    // Message sent on spawn
  only_chat_with: string[];                // Only chat with specific players (empty = public)
  speak: boolean;                          // Enable text-to-speech
  chat_ingame: boolean;                    // Show bot responses in minecraft chat
  show_command_syntax: 'full' | 'shortened' | 'none';  // Command syntax display
  spawn_timeout: number;                   // Seconds allowed for bot to spawn
  block_place_delay: number;               // Delay between placing blocks (ms)
  base_profile: 'survival' | 'assistant' | 'creative' | 'god_mode';  // Base profile type
}

// ============================================
// Bot Profile Types
// ============================================

export interface BotProfile {
  id: string;                    // 唯一标识符
  name: string;                  // 机器人名称
  model: ModelConfig;            // 主模型配置
  codeModel?: ModelConfig;       // 代码生成模型
  visionModel?: ModelConfig;     // 视觉模型
  embedding?: EmbeddingConfig;   // 嵌入模型
  speakModel?: string;           // 语音合成模型
  conversing: string;            // 对话提示词
  coding: string;                // 编码提示词
  saving_memory: string;         // 记忆保存提示词
  modes: BotModes;               // 机器人模式配置
  behavior?: BotBehaviorSettings; // 行为设置
}

// ============================================
// API Keys Types
// ============================================

export interface APIKeys {
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  XAI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  QWEN_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  REPLICATE_API_KEY?: string;
  GROQCLOUD_API_KEY?: string;
  HUGGINGFACE_API_KEY?: string;
  NOVITA_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GHLF_API_KEY?: string;
  HYPERBOLIC_API_KEY?: string;
  CEREBRAS_API_KEY?: string;
  MERCURY_API_KEY?: string;
}

export type APIKeyProvider = keyof APIKeys;

export interface APIKeyStatus {
  provider: string;
  configured: boolean;
}


// ============================================
// Server Settings Types
// ============================================

export interface ServerSettings {
  host: string;                  // Minecraft 服务器地址
  port: number;                  // 服务器端口
  auth: 'offline' | 'microsoft'; // 认证模式
  version: string;               // Minecraft 版本
  allowInsecureCoding: boolean;  // 是否允许不安全代码执行
}

// ============================================
// Task Types
// ============================================

export interface Task {
  id: string;                    // 任务 ID
  name: string;                  // 任务名称
  goal: string;                  // 任务目标描述
  target: string;                // 目标物品
  numberOfTarget: number;        // 目标数量
  timeout: number;               // 超时时间（秒）
  agentCount: number;            // 代理数量
  initialInventory: Record<string, Record<string, number>>; // 初始物品栏
  blockedActions: Record<string, string[]>; // 禁用的动作
  type: 'techtree' | 'construction'; // 任务类型
}

// ============================================
// Bot Status Types
// ============================================

export type BotStatusType = 'offline' | 'starting' | 'online' | 'error' | 'stopping';

export interface BotStatus {
  status: BotStatusType;
  pid?: number;                  // 进程 ID
  startTime?: Date;              // 启动时间
  error?: string;                // 错误信息
}

// ============================================
// Log Types
// ============================================

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: string;
}

// ============================================
// Log Session Types
// ============================================

export interface LogSession {
  sessionId: string;
  botId: string;
  botName: string;
  startTime: Date;
  endTime?: Date;
  logFile: string;
}

export interface LogSessionsResponse {
  sessions: LogSession[];
}

export interface SessionLogsResponse {
  logs: LogEntry[];
  total: number;
}

export interface ActiveSessionResponse {
  active: boolean;
  sessionId?: string;
  session?: LogSession;
}

// ============================================
// Bot Memory Types
// ============================================

export interface BotMemoryTurn {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

export interface BotMemory {
  memory: string;                          // Natural language summary
  turns: BotMemoryTurn[];                  // Recent conversation turns
  self_prompting_state: number;            // Self-prompting state
  self_prompt: string | null;              // Current self-prompt
  taskStart: number;                       // Task start timestamp
  last_sender: string | null;              // Last message sender
}

export interface BotMemoryResponse {
  memory: BotMemory | null;
  exists: boolean;
}

// ============================================
// Position and Inventory Types
// ============================================

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface InventoryItem {
  slot: number;
  name: string;
  count: number;
}


// ============================================
// API Request/Response Types
// ============================================

// Error Response
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

// Bot API
export interface CreateBotRequest {
  name: string;
  model: ModelConfig;
  codeModel?: ModelConfig;
  visionModel?: ModelConfig;
  embedding?: EmbeddingConfig;
  speakModel?: string;
  conversing?: string;
  coding?: string;
  saving_memory?: string;
  modes?: Partial<BotModes>;
  behavior?: Partial<BotBehaviorSettings>;
}

export interface UpdateBotRequest extends Partial<CreateBotRequest> {}

export interface BotResponse {
  bot: BotProfile;
}

export interface BotsListResponse {
  bots: BotProfile[];
}

// API Keys API
export interface UpdateKeyRequest {
  key: string;
}

export interface KeysStatusResponse {
  keys: APIKeyStatus[];
}

// Settings API
export interface UpdateSettingsRequest extends Partial<ServerSettings> {}

export interface SettingsResponse {
  settings: ServerSettings;
}

// Task API
export interface CreateTaskRequest {
  name: string;
  goal: string;
  target: string;
  numberOfTarget: number;
  timeout: number;
  agentCount?: number;
  initialInventory?: Record<string, Record<string, number>>;
  blockedActions?: Record<string, string[]>;
  type?: 'techtree' | 'construction';
}

export interface TaskResponse {
  task: Task;
}

export interface TasksListResponse {
  tasks: Task[];
}

// Bot Control API
export interface BotStartRequest {
  taskId?: string;
}

export interface BotStatusResponse {
  botId: string;
  status: BotStatus;
}

// Import/Export API
export interface ExportResponse {
  bots: BotProfile[];
  settings: ServerSettings;
  tasks: Task[];
}

export interface ImportRequest {
  bots?: BotProfile[];
  settings?: ServerSettings;
  tasks?: Task[];
}

export interface ImportResponse {
  imported: {
    bots: number;
    settings: boolean;
    tasks: number;
  };
}


// ============================================
// WebSocket Event Types
// ============================================

// Server -> Client Events
export interface ServerToClientEvents {
  'bot:status': (data: BotStatusEvent) => void;
  'bot:log': (data: BotLogEvent) => void;
  'bot:position': (data: BotPositionEvent) => void;
  'bot:inventory': (data: BotInventoryEvent) => void;
  'bot:error': (data: BotErrorEvent) => void;
}

export interface BotStatusEvent {
  botId: string;
  status: BotStatus;
}

export interface BotLogEvent {
  botId: string;
  log: LogEntry;
}

export interface BotPositionEvent {
  botId: string;
  position: Position;
}

export interface BotInventoryEvent {
  botId: string;
  inventory: InventoryItem[];
}

export interface BotErrorEvent {
  botId: string;
  error: string;
}

// Client -> Server Events
export interface ClientToServerEvents {
  'subscribe': (botId: string) => void;
  'unsubscribe': (botId: string) => void;
}

// ============================================
// LLM Provider Types
// ============================================

export const LLM_PROVIDERS = [
  'openai',
  'google',
  'anthropic',
  'xai',
  'deepseek',
  'qwen',
  'mistral',
  'replicate',
  'groq',
  'huggingface',
  'novita',
  'openrouter',
  'glhf',
  'hyperbolic',
  'cerebras',
  'mercury',
] as const;

export type LLMProvider = typeof LLM_PROVIDERS[number];

export interface LLMProviderInfo {
  id: LLMProvider;
  name: string;
  keyName: APIKeyProvider;
}

export const LLM_PROVIDER_INFO: LLMProviderInfo[] = [
  { id: 'openai', name: 'OpenAI', keyName: 'OPENAI_API_KEY' },
  { id: 'google', name: 'Google (Gemini)', keyName: 'GEMINI_API_KEY' },
  { id: 'anthropic', name: 'Anthropic', keyName: 'ANTHROPIC_API_KEY' },
  { id: 'xai', name: 'xAI', keyName: 'XAI_API_KEY' },
  { id: 'deepseek', name: 'DeepSeek', keyName: 'DEEPSEEK_API_KEY' },
  { id: 'qwen', name: 'Qwen', keyName: 'QWEN_API_KEY' },
  { id: 'mistral', name: 'Mistral', keyName: 'MISTRAL_API_KEY' },
  { id: 'replicate', name: 'Replicate', keyName: 'REPLICATE_API_KEY' },
  { id: 'groq', name: 'Groq', keyName: 'GROQCLOUD_API_KEY' },
  { id: 'huggingface', name: 'HuggingFace', keyName: 'HUGGINGFACE_API_KEY' },
  { id: 'novita', name: 'Novita', keyName: 'NOVITA_API_KEY' },
  { id: 'openrouter', name: 'OpenRouter', keyName: 'OPENROUTER_API_KEY' },
  { id: 'glhf', name: 'GLHF', keyName: 'GHLF_API_KEY' },
  { id: 'hyperbolic', name: 'Hyperbolic', keyName: 'HYPERBOLIC_API_KEY' },
  { id: 'cerebras', name: 'Cerebras', keyName: 'CEREBRAS_API_KEY' },
  { id: 'mercury', name: 'Mercury', keyName: 'MERCURY_API_KEY' },
];

// ============================================
// Validation Types
// ============================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
