import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bot, ArrowLeft, Save, X, Trash2, AlertTriangle,
  MessageSquare, Code, Brain, Settings, Volume2,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { ModelSelector, PresetSelector } from '../components/bots';
import { botsApi } from '../api/bots';
import { useBotsStore } from '../stores/botsStore';
import type { 
  ModelConfig, 
  EmbeddingConfig, 
  BotModes,
  CreateBotRequest,
  UpdateBotRequest 
} from '../../../shared/types';

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  api: '',
  model: '',
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
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    models: true,
    prompts: false,
    modes: false,
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
      });
      // Expand sections that have content
      setExpandedSections({
        models: true,
        prompts: !!(bot.conversing || bot.coding || bot.saving_memory),
        modes: true,
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
        conversing: form.conversing || undefined,
        coding: form.coding || undefined,
        saving_memory: form.saving_memory || undefined,
        modes: form.modes,
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

        {/* Model Configurations */}
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

        {/* Prompts Configuration */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('prompts')}
            className="w-full flex items-center justify-between p-md bg-background-secondary hover:bg-background-tertiary transition-colors"
          >
            <div className="flex items-center gap-sm">
              <MessageSquare size={18} strokeWidth={1.5} className="text-text-secondary" />
              <h3 className="text-lg font-medium text-text-primary">提示词配置</h3>
              <span className="text-xs text-text-muted">自定义机器人的行为和响应方式</span>
            </div>
            {expandedSections.prompts ? (
              <ChevronUp size={18} strokeWidth={1.5} className="text-text-secondary" />
            ) : (
              <ChevronDown size={18} strokeWidth={1.5} className="text-text-secondary" />
            )}
          </button>
          
          {expandedSections.prompts && (
            <div className="p-md space-y-md border-t border-border">
              {/* Conversing Prompt */}
              <div>
                <div className="flex items-center gap-sm mb-xs">
                  <MessageSquare size={14} strokeWidth={1.5} className="text-text-secondary" />
                  <label className="block text-sm font-medium text-text-secondary">
                    对话提示词 (Conversing)
                  </label>
                </div>
                <textarea
                  value={form.conversing}
                  onChange={(e) => setForm({ ...form, conversing: e.target.value })}
                  placeholder="定义机器人在对话时的行为和性格，例如：You are a helpful Minecraft assistant who loves building and exploring."
                  rows={4}
                  className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y"
                />
                <p className="text-xs text-text-muted mt-xs">
                  影响机器人与玩家聊天时的响应风格
                </p>
              </div>

              {/* Coding Prompt */}
              <div>
                <div className="flex items-center gap-sm mb-xs">
                  <Code size={14} strokeWidth={1.5} className="text-text-secondary" />
                  <label className="block text-sm font-medium text-text-secondary">
                    编码提示词 (Coding)
                  </label>
                </div>
                <textarea
                  value={form.coding}
                  onChange={(e) => setForm({ ...form, coding: e.target.value })}
                  placeholder="定义机器人生成代码时的行为，例如：You are a coding assistant for Minecraft bots. Write efficient and safe code."
                  rows={4}
                  className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y"
                />
                <p className="text-xs text-text-muted mt-xs">
                  影响机器人使用 newAction 生成代码时的行为
                </p>
              </div>

              {/* Saving Memory Prompt */}
              <div>
                <div className="flex items-center gap-sm mb-xs">
                  <Brain size={14} strokeWidth={1.5} className="text-text-secondary" />
                  <label className="block text-sm font-medium text-text-secondary">
                    记忆保存提示词 (Saving Memory)
                  </label>
                </div>
                <textarea
                  value={form.saving_memory}
                  onChange={(e) => setForm({ ...form, saving_memory: e.target.value })}
                  placeholder="定义机器人保存记忆时的行为，例如：Save important information about locations, items, and player preferences."
                  rows={4}
                  className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y"
                />
                <p className="text-xs text-text-muted mt-xs">
                  影响机器人决定保存哪些信息到长期记忆
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modes Configuration */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('modes')}
            className="w-full flex items-center justify-between p-md bg-background-secondary hover:bg-background-tertiary transition-colors"
          >
            <div className="flex items-center gap-sm">
              <Settings size={18} strokeWidth={1.5} className="text-text-secondary" />
              <h3 className="text-lg font-medium text-text-primary">行为模式</h3>
              <span className="text-xs text-text-muted">控制机器人的自动行为</span>
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
