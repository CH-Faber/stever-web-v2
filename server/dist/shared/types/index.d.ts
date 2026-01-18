/**
 * 模型能力类型
 */
export type ModelCapability = 'text' | 'code' | 'vision' | 'embedding' | 'function_calling';
/**
 * 模型信息
 */
export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    capabilities: ModelCapability[];
    contextLength?: number;
    description?: string;
}
/**
 * API 格式类型
 */
export type ApiFormat = 'openai' | 'anthropic' | 'custom';
/**
 * 自定义端点配置
 */
export interface CustomEndpoint {
    id: string;
    name: string;
    baseUrl: string;
    apiKey?: string;
    headers?: Record<string, string>;
    apiFormat: ApiFormat;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * 模型配置
 */
export interface ModelConfig {
    api: string;
    model: string;
    url?: string;
    endpointId?: string;
    params?: Record<string, unknown>;
}
/**
 * 收藏的模型配置
 */
export interface FavoriteModelConfig {
    id: string;
    name: string;
    modelId: string;
    endpointId?: string;
    provider: string;
    config: ModelConfig;
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
    name: string;
    description?: string;
    purpose: ModelPresetPurpose;
    config: ModelConfig;
    isDefault?: boolean;
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
export interface UpdateModelPresetRequest extends Partial<CreateModelPresetRequest> {
}
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
    endpointId?: string;
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
export interface BotProfile {
    id: string;
    name: string;
    model: ModelConfig;
    codeModel?: ModelConfig;
    visionModel?: ModelConfig;
    embedding?: EmbeddingConfig;
    speakModel?: string;
    conversing: string;
    coding: string;
    saving_memory: string;
    modes: BotModes;
}
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
export interface ServerSettings {
    host: string;
    port: number;
    auth: 'offline' | 'microsoft';
    version: string;
    allowInsecureCoding: boolean;
}
export interface Task {
    id: string;
    name: string;
    goal: string;
    target: string;
    numberOfTarget: number;
    timeout: number;
    agentCount: number;
    initialInventory: Record<string, Record<string, number>>;
    blockedActions: Record<string, string[]>;
    type: 'techtree' | 'construction';
}
export type BotStatusType = 'offline' | 'starting' | 'online' | 'error' | 'stopping';
export interface BotStatus {
    status: BotStatusType;
    pid?: number;
    startTime?: Date;
    error?: string;
}
export type LogLevel = 'info' | 'warn' | 'error';
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    source: string;
}
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
export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, string>;
    };
}
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
}
export interface UpdateBotRequest extends Partial<CreateBotRequest> {
}
export interface BotResponse {
    bot: BotProfile;
}
export interface BotsListResponse {
    bots: BotProfile[];
}
export interface UpdateKeyRequest {
    key: string;
}
export interface KeysStatusResponse {
    keys: APIKeyStatus[];
}
export interface UpdateSettingsRequest extends Partial<ServerSettings> {
}
export interface SettingsResponse {
    settings: ServerSettings;
}
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
export interface BotStartRequest {
    taskId?: string;
}
export interface BotStatusResponse {
    botId: string;
    status: BotStatus;
}
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
export interface ClientToServerEvents {
    'subscribe': (botId: string) => void;
    'unsubscribe': (botId: string) => void;
}
export declare const LLM_PROVIDERS: readonly ["openai", "google", "anthropic", "xai", "deepseek", "qwen", "mistral", "replicate", "groq", "huggingface", "novita", "openrouter", "glhf", "hyperbolic", "cerebras", "mercury"];
export type LLMProvider = typeof LLM_PROVIDERS[number];
export interface LLMProviderInfo {
    id: LLMProvider;
    name: string;
    keyName: APIKeyProvider;
}
export declare const LLM_PROVIDER_INFO: LLMProviderInfo[];
export interface ValidationError {
    field: string;
    message: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
