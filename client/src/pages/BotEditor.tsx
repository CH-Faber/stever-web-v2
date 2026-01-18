import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bot, ArrowLeft, Save, X, Trash2, AlertTriangle,
  MessageSquare, Code, Brain, Settings, Volume2,
  ChevronDown, ChevronUp, RotateCcw, Sliders, Clock, Eye
} from 'lucide-react';
import { ModelSelector, PresetSelector } from '../components/bots';
import { botsApi } from '../api/bots';
import { useBotsStore } from '../stores/botsStore';
import type { 
  ModelConfig, 
  EmbeddingConfig, 
  BotModes,
  BotBehaviorSettings,
  CreateBotRequest,
  UpdateBotRequest 
} from '../../../shared/types';

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  api: '',
  model: '',
};

// Default prompts from mindcraft's _default.json
const DEFAULT_PROMPTS = {
  conversing: `You are an AI Minecraft bot named $NAME that can converse with players, see, move, mine, build, and interact with the world by using commands.
$SELF_PROMPT Be a friendly, casual, effective, and efficient robot. Be very brief in your responses, don't apologize constantly, don't give instructions or make lists unless asked, and don't refuse requests. Don't pretend to act, use commands immediately when requested. Do NOT say this: 'Sure, I've stopped. *stops*', instead say this: 'Sure, I'll stop. !stop'. Respond only as $NAME, never output '(FROM OTHER BOT)' or pretend to be someone else. If you have nothing to say or do, respond with an just a tab '\\t'. This is extremely important to me, take a deep breath and have fun :)
Summarized memory:'$MEMORY'
$STATS
$INVENTORY
$COMMAND_DOCS
$EXAMPLES
Conversation Begin:`,

  coding: `You are an intelligent mineflayer bot $NAME that plays minecraft by writing javascript codeblocks. Given the conversation, use the provided skills and world functions to write a js codeblock that controls the mineflayer bot \`\`\` // using this syntax \`\`\`. The code will be executed and you will receive it's output. If an error occurs, write another codeblock and try to fix the problem. Be maximally efficient, creative, and correct. Be mindful of previous actions. Do not use commands !likeThis, only use codeblocks. The code is asynchronous and MUST USE AWAIT for all async function calls, and must contain at least one await. You have \`Vec3\`, \`skills\`, and \`world\` imported, and the mineflayer \`bot\` is given. Do not import other libraries. Do not use setTimeout or setInterval. Do not speak conversationally, only use codeblocks. Do any planning in comments. This is extremely important to me, think step-by-step, take a deep breath and good luck! 
$SELF_PROMPT
Summarized memory:'$MEMORY'
$STATS
$INVENTORY
$CODE_DOCS
$EXAMPLES
Conversation:`,

  saving_memory: `You are a minecraft bot named $NAME that has been talking and playing minecraft by using commands. Update your memory by summarizing the following conversation and your old memory in your next response. Prioritize preserving important facts, things you've learned, useful tips, and long term reminders. Do Not record stats, inventory, or docs! Only save transient information from your chat history. You're limited to 500 characters, so be extremely brief and minimize words. Compress useful information. 
Old Memory: '$MEMORY'
Recent conversation: 
$TO_SUMMARIZE
Summarize your old memory and recent conversation into a new memory, and respond only with the unwrapped memory text: `,
};

const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
  api: '',
  model: '',
};

const DEFAULT_BOT_MODES: BotModes = {
  self_preservation: true,
  unstuck: true,
  cowardice: true,
  self_defense: true,
  hunting: true,
  item_collecting: true,
  torch_placing: true,
  idle_staring: true,
  cheat: false,
};

// Default behavior settings from mindcraft
const DEFAULT_BEHAVIOR: BotBehaviorSettings = {
  cooldown: 3000,
  max_messages: 15,
  num_examples: 2,
  max_commands: -1,
  relevant_docs_count: 5,
  code_timeout_mins: -1,
  narrate_behavior: true,
  chat_bot_messages: true,
  load_memory: true,  // ✅ 默认启用记忆加载
  allow_vision: false,
  language: 'zh-CN',
  init_message: 'Respond with hello world and your name',
  only_chat_with: [],
  speak: false,
  chat_ingame: true,
  show_command_syntax: 'full',
  spawn_timeout: 30,
  block_place_delay: 0,
  base_profile: 'assistant',
};

// Common language options
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '中文（简体）' },
  { value: 'zh-TW', label: '中文（繁體）' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ru', label: 'Русский' },
  { value: 'pt', label: 'Português' },
];

// Base profile options
const BASE_PROFILE_OPTIONS = [
  { value: 'survival', label: '生存模式', description: '标准生存玩法' },
  { value: 'assistant', label: '助手模式', description: '友好的助手行为（推荐）' },
  { value: 'creative', label: '创造模式', description: '创造性建造' },
  { value: 'god_mode', label: '上帝模式', description: '全能力解锁' },
];

// Command syntax options
const COMMAND_SYNTAX_OPTIONS = [
  { value: 'full', label: '完整显示' },
  { value: 'shortened', label: '简化显示' },
  { value: 'none', label: '不显示' },
];

// Behavior setting descriptions
const BEHAVIOR_DESCRIPTIONS: Record<keyof BotBehaviorSettings, { label: string; description: string; type: 'number' | 'boolean' | 'select' | 'text' | 'array'; min?: number; max?: number }> = {
  cooldown: {
    label: '响应冷却 (ms)',
    description: '两次响应之间的最小间隔时间',
    type: 'number',
    min: 0,
    max: 30000,
  },
  max_messages: {
    label: '最大消息数',
    description: '上下文中保留的最大消息数量',
    type: 'number',
    min: 1,
    max: 100,
  },
  num_examples: {
    label: '示例数量',
    description: '提供给模型的示例对话数量',
    type: 'number',
    min: 0,
    max: 10,
  },
  max_commands: {
    label: '最大连续命令',
    description: '连续响应中可使用的最大命令数 (-1 为无限)',
    type: 'number',
    min: -1,
    max: 100,
  },
  relevant_docs_count: {
    label: '相关文档数',
    description: '选择的相关代码文档数量 (-1 为全部)',
    type: 'number',
    min: -1,
    max: 20,
  },
  code_timeout_mins: {
    label: '代码超时 (分钟)',
    description: '代码执行的超时时间 (-1 为无限)',
    type: 'number',
    min: -1,
    max: 60,
  },
  spawn_timeout: {
    label: '生成超时 (秒)',
    description: '机器人生成的超时时间',
    type: 'number',
    min: 10,
    max: 120,
  },
  block_place_delay: {
    label: '放置延迟 (ms)',
    description: '放置方块之间的延迟，防止被反作弊踢出',
    type: 'number',
    min: 0,
    max: 1000,
  },
  narrate_behavior: {
    label: '叙述行为',
    description: '在聊天中显示自动行为（如"正在拾取物品！"）',
    type: 'boolean',
  },
  chat_bot_messages: {
    label: '机器人消息',
    description: '公开聊天发送给其他机器人的消息',
    type: 'boolean',
  },
  load_memory: {
    label: '加载记忆',
    description: '从上次会话加载记忆',
    type: 'boolean',
  },
  allow_vision: {
    label: '启用视觉',
    description: '允许视觉模型分析截图',
    type: 'boolean',
  },
  speak: {
    label: '语音合成',
    description: '启用文字转语音功能',
    type: 'boolean',
  },
  chat_ingame: {
    label: '游戏内聊天',
    description: '在 Minecraft 聊天中显示机器人回复',
    type: 'boolean',
  },
  language: {
    label: '语言',
    description: '机器人对话和翻译使用的语言',
    type: 'select',
  },
  show_command_syntax: {
    label: '命令语法',
    description: '命令语法的显示方式',
    type: 'select',
  },
  base_profile: {
    label: '基础配置',
    description: '机器人的基础行为配置',
    type: 'select',
  },
  init_message: {
    label: '初始消息',
    description: '机器人生成时发送的第一条消息',
    type: 'text',
  },
  only_chat_with: {
    label: '仅与特定玩家聊天',
    description: '留空表示公开聊天，填写玩家名用逗号分隔',
    type: 'array',
  },
};

interface FormState {
  name: string;
  model: ModelConfig;
  codeModel: ModelConfig;
  codeModelEnabled: boolean;
  visionModel: ModelConfig;
  visionModelEnabled: boolean;
  embedding: EmbeddingConfig;
  embeddingEnabled: boolean;
  speakModel: string;
  speakModelEnabled: boolean;
  conversing: string;
  coding: string;
  saving_memory: string;
  modes: BotModes;
  behavior: BotBehaviorSettings;
}

// Mode descriptions for UI
const MODE_DESCRIPTIONS: Record<keyof BotModes, { label: string; description: string }> = {
  self_preservation: {
    label: '自我保护',
    description: '机器人会尝试避免危险情况，如悬崖、岩浆等'
  },
  unstuck: {
    label: '脱困模式',
    description: '当机器人卡住时会尝试自动脱困'
  },
  cowardice: {
    label: '胆小模式',
    description: '遇到危险时机器人会逃跑'
  },
  self_defense: {
    label: '自卫模式',
    description: '被攻击时机器人会反击'
  },
  hunting: {
    label: '狩猎模式',
    description: '机器人会主动猎杀附近的动物'
  },
  item_collecting: {
    label: '物品收集',
    description: '机器人会自动拾取附近的掉落物'
  },
  torch_placing: {
    label: '放置火把',
    description: '在黑暗区域自动放置火把'
  },
  idle_staring: {
    label: '空闲注视',
    description: '空闲时机器人会注视附近的玩家或实体'
  },
  cheat: {
    label: '作弊模式',
    description: '启用作弊命令（需要服务器开启作弊）'
  },
};

export function BotEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  
  const { addBot, updateBot, removeBot } = useBotsStore();
  
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Collapsible sections state - modes first (most important), prompts second, models last
  const [expandedSections, setExpandedSections] = useState({
    modes: true,
    behavior: false,
    prompts: false,
    models: false,
  });
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const [form, setForm] = useState<FormState>({
    name: '',
    model: { ...DEFAULT_MODEL_CONFIG },
    codeModel: { ...DEFAULT_MODEL_CONFIG },
    codeModelEnabled: false,
    visionModel: { ...DEFAULT_MODEL_CONFIG },
    visionModelEnabled: false,
    embedding: { ...DEFAULT_EMBEDDING_CONFIG },
    embeddingEnabled: false,
    speakModel: '',
    speakModelEnabled: false,
    conversing: '',
    coding: '',
    saving_memory: '',
    modes: { ...DEFAULT_BOT_MODES },
    behavior: { ...DEFAULT_BEHAVIOR },
  });

  useEffect(() => {
    if (!isNew && id) {
      loadBot(id);
    }
  }, [id, isNew]);

  const loadBot = async (botId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const bot = await botsApi.getById(botId);
      setForm({
        name: bot.name,
        model: bot.model,
        codeModel: bot.codeModel || { ...DEFAULT_MODEL_CONFIG },
        codeModelEnabled: !!bot.codeModel,
        visionModel: bot.visionModel || { ...DEFAULT_MODEL_CONFIG },
        visionModelEnabled: !!bot.visionModel,
        embedding: bot.embedding || { ...DEFAULT_EMBEDDING_CONFIG },
        embeddingEnabled: !!bot.embedding,
        speakModel: bot.speakModel || '',
        speakModelEnabled: !!bot.speakModel,
        conversing: bot.conversing || '',
        coding: bot.coding || '',
        saving_memory: bot.saving_memory || '',
        modes: bot.modes || { ...DEFAULT_BOT_MODES },
        behavior: bot.behavior || { ...DEFAULT_BEHAVIOR },
      });
      // Expand sections that have content - modes always expanded
      setExpandedSections({
        modes: true,
        behavior: false,
        prompts: !!(bot.conversing || bot.coding || bot.saving_memory),
        models: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载机器人配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) {
      return '请输入机器人名称';
    }
    if (!form.model.api) {
      return '请选择主模型的 API 提供商';
    }
    if (!form.model.model.trim()) {
      return '请输入主模型名称';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const data: CreateBotRequest | UpdateBotRequest = {
        name: form.name.trim(),
        model: form.model,
        codeModel: form.codeModelEnabled ? form.codeModel : undefined,
        visionModel: form.visionModelEnabled ? form.visionModel : undefined,
        embedding: form.embeddingEnabled ? form.embedding : undefined,
        speakModel: form.speakModelEnabled ? form.speakModel : undefined,
        // Only save prompts if they differ from defaults (empty = use mindcraft defaults)
        conversing: form.conversing && form.conversing !== DEFAULT_PROMPTS.conversing ? form.conversing : undefined,
        coding: form.coding && form.coding !== DEFAULT_PROMPTS.coding ? form.coding : undefined,
        saving_memory: form.saving_memory && form.saving_memory !== DEFAULT_PROMPTS.saving_memory ? form.saving_memory : undefined,
        modes: form.modes,
        behavior: form.behavior,
      };

      if (isNew) {
        const newBot = await botsApi.create(data as CreateBotRequest);
        addBot(newBot);
        navigate(`/bots/${newBot.id}`);
      } else if (id) {
        const updatedBot = await botsApi.update(id, data);
        updateBot(id, updatedBot);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await botsApi.delete(id);
      removeBot(id);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      setShowDeleteConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-lg max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md">
        <button
          onClick={handleCancel}
          className="p-sm rounded-md hover:bg-background-tertiary text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <Bot size={24} strokeWidth={1.5} className="text-text-secondary" />
        <h2 className="text-2xl font-semibold text-text-primary">
          {isNew ? '创建机器人' : '编辑机器人'}
        </h2>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-status-error/10 border border-status-error/20 rounded-md p-md">
          <p className="text-sm text-status-error">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-background-primary rounded-lg border border-border p-lg shadow-sm space-y-lg">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-medium text-text-primary mb-md">基本信息</h3>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-xs">
              机器人名称 <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="输入机器人名称"
              className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
        </div>

        {/* 1. Modes Configuration - Most Important */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('modes')}
            className="w-full flex items-center justify-between p-md bg-background-secondary hover:bg-background-tertiary transition-colors"
          >
            <div className="flex items-center gap-sm">
              <Settings size={18} strokeWidth={1.5} className="text-text-secondary" />
              <h3 className="text-lg font-medium text-text-primary">行为模式</h3>
              <span className="text-xs text-text-muted">控制机器人的自动行为（最重要）</span>
            </div>
            {expandedSections.modes ? (
              <ChevronUp size={18} strokeWidth={1.5} className="text-text-secondary" />
            ) : (
              <ChevronDown size={18} strokeWidth={1.5} className="text-text-secondary" />
            )}
          </button>
          
          {expandedSections.modes && (
            <div className="p-md border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {(Object.keys(MODE_DESCRIPTIONS) as Array<keyof BotModes>).map((modeKey) => {
                  const { label, description } = MODE_DESCRIPTIONS[modeKey];
                  const isCheat = modeKey === 'cheat';
                  return (
                    <div 
                      key={modeKey}
                      className={`flex items-start gap-sm p-sm rounded-md border ${
                        isCheat ? 'border-status-warning/30 bg-status-warning/5' : 'border-border'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.modes[modeKey]}
                        onChange={(e) => setForm({
                          ...form,
                          modes: { ...form.modes, [modeKey]: e.target.checked }
                        })}
                        className={`w-4 h-4 mt-0.5 rounded border-border focus:ring-accent ${
                          isCheat ? 'text-status-warning' : 'text-accent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-xs">
                          <span className={`text-sm font-medium ${
                            isCheat ? 'text-status-warning' : 'text-text-primary'
                          }`}>
                            {label}
                          </span>
                          {isCheat && (
                            <AlertTriangle size={12} strokeWidth={1.5} className="text-status-warning" />
                          )}
                        </div>
                        <p className="text-xs text-text-muted">{description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Behavior Settings */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('behavior')}
            className="w-full flex items-center justify-between p-md bg-background-secondary hover:bg-background-tertiary transition-colors"
          >
            <div className="flex items-center gap-sm">
              <Sliders size={18} strokeWidth={1.5} className="text-text-secondary" />
              <h3 className="text-lg font-medium text-text-primary">行为设置</h3>
              <span className="text-xs text-text-muted">响应、消息、代码执行等参数</span>
            </div>
            {expandedSections.behavior ? (
              <ChevronUp size={18} strokeWidth={1.5} className="text-text-secondary" />
            ) : (
              <ChevronDown size={18} strokeWidth={1.5} className="text-text-secondary" />
            )}
          </button>
          
          {expandedSections.behavior && (
            <div className="p-md space-y-md border-t border-border">
              {/* Number inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {(Object.keys(BEHAVIOR_DESCRIPTIONS) as Array<keyof BotBehaviorSettings>)
                  .filter(key => BEHAVIOR_DESCRIPTIONS[key].type === 'number')
                  .map((key) => {
                    const { label, description, min, max } = BEHAVIOR_DESCRIPTIONS[key];
                    return (
                      <div key={key} className="space-y-xs">
                        <div className="flex items-center gap-sm">
                          <Clock size={14} strokeWidth={1.5} className="text-text-secondary" />
                          <label className="text-sm font-medium text-text-secondary">{label}</label>
                        </div>
                        <input
                          type="number"
                          value={form.behavior[key] as number}
                          onChange={(e) => setForm({
                            ...form,
                            behavior: { ...form.behavior, [key]: parseInt(e.target.value) || 0 }
                          })}
                          min={min}
                          max={max}
                          className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                        />
                        <p className="text-xs text-text-muted">{description}</p>
                      </div>
                    );
                  })}
              </div>

              {/* Boolean toggles */}
              <div className="border-t border-border pt-md">
                <h4 className="text-sm font-medium text-text-secondary mb-md flex items-center gap-sm">
                  <Eye size={14} strokeWidth={1.5} />
                  功能开关
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {(Object.keys(BEHAVIOR_DESCRIPTIONS) as Array<keyof BotBehaviorSettings>)
                    .filter(key => BEHAVIOR_DESCRIPTIONS[key].type === 'boolean')
                    .map((key) => {
                      const { label, description } = BEHAVIOR_DESCRIPTIONS[key];
                      return (
                        <div key={key} className="flex items-start gap-sm p-sm rounded-md border border-border">
                          <input
                            type="checkbox"
                            checked={form.behavior[key] as boolean}
                            onChange={(e) => setForm({
                              ...form,
                              behavior: { ...form.behavior, [key]: e.target.checked }
                            })}
                            className="w-4 h-4 mt-0.5 rounded border-border text-accent focus:ring-accent"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-text-primary">{label}</span>
                            <p className="text-xs text-text-muted">{description}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Language selector */}
              <div className="border-t border-border pt-md">
                <h4 className="text-sm font-medium text-text-secondary mb-md">选项设置</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {/* Base Profile */}
                  <div className="space-y-xs">
                    <label className="text-sm font-medium text-text-secondary">基础配置</label>
                    <select
                      value={form.behavior.base_profile}
                      onChange={(e) => setForm({
                        ...form,
                        behavior: { ...form.behavior, base_profile: e.target.value as 'survival' | 'assistant' | 'creative' | 'god_mode' }
                      })}
                      className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    >
                      {BASE_PROFILE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-text-muted">机器人的基础行为配置</p>
                  </div>

                  {/* Language */}
                  <div className="space-y-xs">
                    <label className="text-sm font-medium text-text-secondary">语言</label>
                    <select
                      value={form.behavior.language}
                      onChange={(e) => setForm({
                        ...form,
                        behavior: { ...form.behavior, language: e.target.value }
                      })}
                      className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    >
                      {LANGUAGE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-text-muted">机器人对话和翻译使用的语言</p>
                  </div>

                  {/* Command Syntax */}
                  <div className="space-y-xs">
                    <label className="text-sm font-medium text-text-secondary">命令语法显示</label>
                    <select
                      value={form.behavior.show_command_syntax}
                      onChange={(e) => setForm({
                        ...form,
                        behavior: { ...form.behavior, show_command_syntax: e.target.value as 'full' | 'shortened' | 'none' }
                      })}
                      className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    >
                      {COMMAND_SYNTAX_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-text-muted">命令语法的显示方式</p>
                  </div>
                </div>
              </div>

              {/* Text inputs */}
              <div className="border-t border-border pt-md space-y-md">
                <h4 className="text-sm font-medium text-text-secondary">消息设置</h4>
                
                {/* Init Message */}
                <div className="space-y-xs">
                  <label className="text-sm font-medium text-text-secondary">初始消息</label>
                  <input
                    type="text"
                    value={form.behavior.init_message}
                    onChange={(e) => setForm({
                      ...form,
                      behavior: { ...form.behavior, init_message: e.target.value }
                    })}
                    placeholder="机器人生成时发送的第一条消息"
                    className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                  <p className="text-xs text-text-muted">机器人生成时发送的第一条消息</p>
                </div>

                {/* Only Chat With */}
                <div className="space-y-xs">
                  <label className="text-sm font-medium text-text-secondary">仅与特定玩家聊天</label>
                  <input
                    type="text"
                    value={form.behavior.only_chat_with.join(', ')}
                    onChange={(e) => setForm({
                      ...form,
                      behavior: { 
                        ...form.behavior, 
                        only_chat_with: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : []
                      }
                    })}
                    placeholder="留空表示公开聊天，多个玩家用逗号分隔"
                    className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                  <p className="text-xs text-text-muted">留空表示公开聊天，填写玩家名用逗号分隔</p>
                </div>
              </div>

              {/* Reset to defaults button */}
              <div className="flex justify-end pt-sm">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, behavior: { ...DEFAULT_BEHAVIOR } })}
                  className="flex items-center gap-xs px-sm py-xs text-xs text-text-muted hover:text-accent hover:bg-accent/10 rounded transition-colors"
                >
                  <RotateCcw size={12} strokeWidth={1.5} />
                  <span>恢复默认设置</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Prompts Configuration - Advanced (with warning) */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('prompts')}
            className="w-full flex items-center justify-between p-md bg-background-secondary hover:bg-background-tertiary transition-colors"
          >
            <div className="flex items-center gap-sm">
              <MessageSquare size={18} strokeWidth={1.5} className="text-text-secondary" />
              <h3 className="text-lg font-medium text-text-primary">提示词配置</h3>
              <span className="text-xs px-xs py-0.5 bg-status-warning/20 text-status-warning rounded">高级</span>
            </div>
            {expandedSections.prompts ? (
              <ChevronUp size={18} strokeWidth={1.5} className="text-text-secondary" />
            ) : (
              <ChevronDown size={18} strokeWidth={1.5} className="text-text-secondary" />
            )}
          </button>
          
          {expandedSections.prompts && (
            <div className="p-md space-y-md border-t border-border">
              {/* Info Notice */}
              <div className="bg-accent/10 border border-accent/20 rounded-md p-md">
                <div className="flex items-start gap-sm">
                  <MessageSquare size={16} strokeWidth={1.5} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-accent font-medium">提示词说明</p>
                    <p className="text-xs text-text-muted mt-xs">
                      以下显示的是 mindcraft 默认提示词，包含关键的 $COMMAND_DOCS、$EXAMPLES 等占位符。
                      如需自定义，请确保保留这些占位符以保证机器人正常工作。
                    </p>
                  </div>
                </div>
              </div>

              {/* Conversing Prompt */}
              <div>
                <div className="flex items-center justify-between mb-xs">
                  <div className="flex items-center gap-sm">
                    <MessageSquare size={14} strokeWidth={1.5} className="text-text-secondary" />
                    <label className="block text-sm font-medium text-text-secondary">
                      对话提示词 (Conversing)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, conversing: DEFAULT_PROMPTS.conversing })}
                    className="flex items-center gap-xs px-xs py-0.5 text-xs text-text-muted hover:text-accent hover:bg-accent/10 rounded transition-colors"
                    title="恢复默认"
                  >
                    <RotateCcw size={12} strokeWidth={1.5} />
                    <span>恢复默认</span>
                  </button>
                </div>
                <textarea
                  value={form.conversing || DEFAULT_PROMPTS.conversing}
                  onChange={(e) => setForm({ ...form, conversing: e.target.value })}
                  rows={6}
                  className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y font-mono text-xs"
                />
              </div>

              {/* Coding Prompt */}
              <div>
                <div className="flex items-center justify-between mb-xs">
                  <div className="flex items-center gap-sm">
                    <Code size={14} strokeWidth={1.5} className="text-text-secondary" />
                    <label className="block text-sm font-medium text-text-secondary">
                      编码提示词 (Coding)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, coding: DEFAULT_PROMPTS.coding })}
                    className="flex items-center gap-xs px-xs py-0.5 text-xs text-text-muted hover:text-accent hover:bg-accent/10 rounded transition-colors"
                    title="恢复默认"
                  >
                    <RotateCcw size={12} strokeWidth={1.5} />
                    <span>恢复默认</span>
                  </button>
                </div>
                <textarea
                  value={form.coding || DEFAULT_PROMPTS.coding}
                  onChange={(e) => setForm({ ...form, coding: e.target.value })}
                  rows={6}
                  className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y font-mono text-xs"
                />
              </div>

              {/* Saving Memory Prompt */}
              <div>
                <div className="flex items-center justify-between mb-xs">
                  <div className="flex items-center gap-sm">
                    <Brain size={14} strokeWidth={1.5} className="text-text-secondary" />
                    <label className="block text-sm font-medium text-text-secondary">
                      记忆保存提示词 (Saving Memory)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, saving_memory: DEFAULT_PROMPTS.saving_memory })}
                    className="flex items-center gap-xs px-xs py-0.5 text-xs text-text-muted hover:text-accent hover:bg-accent/10 rounded transition-colors"
                    title="恢复默认"
                  >
                    <RotateCcw size={12} strokeWidth={1.5} />
                    <span>恢复默认</span>
                  </button>
                </div>
                <textarea
                  value={form.saving_memory || DEFAULT_PROMPTS.saving_memory}
                  onChange={(e) => setForm({ ...form, saving_memory: e.target.value })}
                  rows={4}
                  className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Model Configurations - Last */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('models')}
            className="w-full flex items-center justify-between p-md bg-background-secondary hover:bg-background-tertiary transition-colors"
          >
            <div className="flex items-center gap-sm">
              <Settings size={18} strokeWidth={1.5} className="text-text-secondary" />
              <h3 className="text-lg font-medium text-text-primary">模型配置</h3>
            </div>
            {expandedSections.models ? (
              <ChevronUp size={18} strokeWidth={1.5} className="text-text-secondary" />
            ) : (
              <ChevronDown size={18} strokeWidth={1.5} className="text-text-secondary" />
            )}
          </button>
          
          {expandedSections.models && (
            <div className="p-md space-y-md border-t border-border">
              {/* Main Model (Required) */}
              <div className="space-y-sm">
                <PresetSelector
                  purpose="main"
                  currentConfig={form.model}
                  onSelect={(config) => setForm({ ...form, model: config })}
                />
                <ModelSelector
                  label="主模型 (Chat) *"
                  value={form.model}
                  onChange={(model) => setForm({ ...form, model })}
                  purpose="main"
                />
              </div>

              {/* Code Model (Optional) */}
              <div className="space-y-sm">
                {form.codeModelEnabled && (
                  <PresetSelector
                    purpose="code"
                    currentConfig={form.codeModel}
                    onSelect={(config) => setForm({ ...form, codeModel: config })}
                  />
                )}
                <ModelSelector
                  label="代码模型 (Code)"
                  value={form.codeModel}
                  onChange={(codeModel) => setForm({ ...form, codeModel })}
                  purpose="code"
                  optional
                  enabled={form.codeModelEnabled}
                  onEnabledChange={(enabled) => setForm({ ...form, codeModelEnabled: enabled })}
                />
              </div>

              {/* Vision Model (Optional) */}
              <div className="space-y-sm">
                {form.visionModelEnabled && (
                  <PresetSelector
                    purpose="vision"
                    currentConfig={form.visionModel}
                    onSelect={(config) => setForm({ ...form, visionModel: config })}
                  />
                )}
                <ModelSelector
                  label="视觉模型 (Vision)"
                  value={form.visionModel}
                  onChange={(visionModel) => setForm({ ...form, visionModel })}
                  purpose="vision"
                  optional
                  enabled={form.visionModelEnabled}
                  onEnabledChange={(enabled) => setForm({ ...form, visionModelEnabled: enabled })}
                />
              </div>

              {/* Embedding Model (Optional) */}
              <div className="border border-border rounded-lg p-md">
                <div className="flex items-center gap-sm mb-md">
                  <input
                    type="checkbox"
                    checked={form.embeddingEnabled}
                    onChange={(e) => setForm({ ...form, embeddingEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <h4 className="font-medium text-text-primary">嵌入模型 (Embedding)</h4>
                  <span className="text-xs text-text-muted">用于示例选择和记忆检索</span>
                </div>
                {form.embeddingEnabled && (
                  <div className="mb-md">
                    <PresetSelector
                      purpose="embedding"
                      currentConfig={{ api: form.embedding.api, model: form.embedding.model, endpointId: form.embedding.endpointId }}
                      onSelect={(config) => setForm({ 
                        ...form, 
                        embedding: { 
                          ...form.embedding, 
                          api: config.api, 
                          model: config.model,
                          endpointId: config.endpointId,
                          url: config.url
                        } 
                      })}
                    />
                  </div>
                )}
                <div className={`${!form.embeddingEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <ModelSelector
                    label="嵌入模型配置"
                    value={{ 
                      api: form.embedding.api, 
                      model: form.embedding.model,
                      endpointId: form.embedding.endpointId,
                      url: form.embedding.url
                    }}
                    onChange={(config) => setForm({
                      ...form,
                      embedding: {
                        api: config.api,
                        model: config.model,
                        endpointId: config.endpointId,
                        url: config.url
                      }
                    })}
                    purpose="embedding"
                  />
                  <p className="text-xs text-text-muted mt-xs">
                    支持的 API: OpenAI, Google, HuggingFace, Replicate, Novita 或自定义端点
                  </p>
                </div>
              </div>

              {/* Speak Model (Optional) */}
              <div className="border border-border rounded-lg p-md">
                <div className="flex items-center gap-sm mb-md">
                  <input
                    type="checkbox"
                    checked={form.speakModelEnabled}
                    onChange={(e) => setForm({ ...form, speakModelEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <Volume2 size={16} strokeWidth={1.5} className="text-text-secondary" />
                  <h4 className="font-medium text-text-primary">语音合成模型 (TTS)</h4>
                  <span className="text-xs text-text-muted">用于机器人语音输出</span>
                </div>
                <div className={`${!form.speakModelEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <label className="block text-sm font-medium text-text-secondary mb-xs">
                    模型配置
                  </label>
                  <input
                    type="text"
                    value={form.speakModel}
                    onChange={(e) => setForm({ ...form, speakModel: e.target.value })}
                    placeholder="格式: {api}/{model}/{voice}，例如: openai/tts-1/echo"
                    className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                  <p className="text-xs text-text-muted mt-xs">
                    支持 OpenAI 和 Google 的语音合成 API
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-md border-t border-border">
          <div>
            {!isNew && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving}
                className="flex items-center gap-sm px-md py-sm text-status-error hover:bg-status-error/10 rounded-md transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} strokeWidth={1.5} />
                <span>删除</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-sm">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-sm px-md py-sm border border-border rounded-md text-text-secondary hover:bg-background-tertiary transition-colors disabled:opacity-50"
            >
              <X size={18} strokeWidth={1.5} />
              <span>取消</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-sm px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors disabled:opacity-50"
            >
              <Save size={18} strokeWidth={1.5} />
              <span>{isSaving ? '保存中...' : '保存'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-primary rounded-lg border border-border p-lg shadow-lg max-w-md w-full mx-md">
            <div className="flex items-center gap-md mb-md">
              <div className="w-10 h-10 rounded-full bg-status-error/10 flex items-center justify-center">
                <AlertTriangle size={20} strokeWidth={1.5} className="text-status-error" />
              </div>
              <h3 className="text-lg font-medium text-text-primary">确认删除</h3>
            </div>
            <p className="text-text-secondary mb-lg">
              确定要删除机器人 "{form.name}" 吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-sm">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSaving}
                className="px-md py-sm border border-border rounded-md text-text-secondary hover:bg-background-tertiary transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="px-md py-sm bg-status-error hover:bg-status-error/90 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {isSaving ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
