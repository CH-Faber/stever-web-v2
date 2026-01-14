import { useEffect, useState } from 'react';
import {
  Cpu,
  Plus,
  RefreshCw,
  AlertCircle,
  Trash2,
  Edit2,
  Star,
  Code,
  Eye,
  MessageSquare,
  Sparkles,
  Check,
  X,
  Save,
} from 'lucide-react';
import { useModelPresetsStore } from '../stores/modelPresetsStore';
import { modelPresetsApi } from '../api/modelPresets';
import { ModelSelector } from '../components/bots';
import type { ModelPreset, ModelPresetPurpose, ModelConfig } from '../../../shared/types';

const PURPOSE_INFO: Record<ModelPresetPurpose, { label: string; icon: React.ReactNode; description: string }> = {
  main: {
    label: '主模型 (Chat)',
    icon: <MessageSquare size={16} />,
    description: '用于对话和通用任务',
  },
  code: {
    label: '代码模型',
    icon: <Code size={16} />,
    description: '用于代码生成和编程任务',
  },
  vision: {
    label: '视觉模型',
    icon: <Eye size={16} />,
    description: '用于图像理解和视觉任务',
  },
  embedding: {
    label: '嵌入模型',
    icon: <Sparkles size={16} />,
    description: '用于文本嵌入和相似度计算',
  },
};

const PURPOSES: ModelPresetPurpose[] = ['main', 'code', 'vision', 'embedding'];

export function ModelPresets() {
  const {
    presets,
    setPresets,
    addPreset,
    updatePreset,
    removePreset,
    loading,
    setLoading,
    error,
    setError,
    getPresetsByPurpose,
  } = useModelPresetsStore();

  const [editingPreset, setEditingPreset] = useState<ModelPreset | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState<ModelPresetPurpose>('main');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state for new/edit preset
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPurpose, setFormPurpose] = useState<ModelPresetPurpose>('main');
  const [formConfig, setFormConfig] = useState<ModelConfig>({ api: '', model: '' });
  const [formIsDefault, setFormIsDefault] = useState(false);

  const fetchPresets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await modelPresetsApi.getAll();
      setPresets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载模型预设失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPurpose('main');
    setFormConfig({ api: '', model: '' });
    setFormIsDefault(false);
  };

  const handleStartCreate = () => {
    resetForm();
    setEditingPreset(null);
    setIsCreating(true);
  };

  const handleStartEdit = (preset: ModelPreset) => {
    setFormName(preset.name);
    setFormDescription(preset.description || '');
    setFormPurpose(preset.purpose);
    setFormConfig(preset.config);
    setFormIsDefault(preset.isDefault || false);
    setEditingPreset(preset);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setEditingPreset(null);
    setIsCreating(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formName.trim() || !formConfig.api || !formConfig.model) {
      setError('请填写预设名称和选择模型');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingPreset) {
        const updated = await modelPresetsApi.update(editingPreset.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          purpose: formPurpose,
          config: formConfig,
          isDefault: formIsDefault,
        });
        updatePreset(editingPreset.id, updated);
      } else {
        const created = await modelPresetsApi.create({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          purpose: formPurpose,
          config: formConfig,
          isDefault: formIsDefault,
        });
        addPreset(created);
      }
      handleCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await modelPresetsApi.delete(id);
      removePreset(id);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleSetDefault = async (preset: ModelPreset) => {
    try {
      const updated = await modelPresetsApi.setDefault(preset.id);
      // Update all presets of the same purpose to remove default flag
      presets
        .filter((p) => p.purpose === preset.purpose && p.id !== preset.id)
        .forEach((p) => updatePreset(p.id, { ...p, isDefault: false }));
      updatePreset(preset.id, updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : '设置默认失败');
    }
  };

  const currentPresets = getPresetsByPurpose(selectedPurpose);

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-md">
          <Cpu size={24} strokeWidth={1.5} className="text-text-secondary" />
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">模型预设</h2>
            <p className="text-sm text-text-muted">配置全局模型预设，机器人可直接选用</p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <button
            onClick={fetchPresets}
            disabled={loading}
            className="flex items-center gap-xs text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} strokeWidth={1.5} className={loading ? 'animate-spin' : ''} />
            <span>刷新</span>
          </button>
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-xs px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors"
          >
            <Plus size={16} strokeWidth={1.5} />
            <span>新建预设</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-status-error/10 border border-status-error/20 rounded-md p-md">
          <div className="flex items-center gap-sm">
            <AlertCircle size={16} strokeWidth={1.5} className="text-status-error" />
            <p className="text-sm text-status-error">{error}</p>
          </div>
        </div>
      )}

      {/* Purpose Tabs */}
      <div className="flex gap-sm border-b border-border">
        {PURPOSES.map((purpose) => {
          const info = PURPOSE_INFO[purpose];
          const count = getPresetsByPurpose(purpose).length;
          return (
            <button
              key={purpose}
              onClick={() => setSelectedPurpose(purpose)}
              className={`flex items-center gap-sm px-md py-sm border-b-2 transition-colors ${
                selectedPurpose === purpose
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {info.icon}
              <span>{info.label}</span>
              {count > 0 && (
                <span className="px-xs py-0.5 text-xs bg-background-tertiary rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingPreset) && (
        <div className="bg-background-primary rounded-lg border border-border p-lg shadow-sm">
          <h3 className="text-lg font-medium text-text-primary mb-md">
            {editingPreset ? '编辑预设' : '新建预设'}
          </h3>
          <div className="space-y-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-xs">
                  预设名称 <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：GPT-4o 主力模型"
                  className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-xs">
                  用途
                </label>
                <select
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value as ModelPresetPurpose)}
                  className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                >
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {PURPOSE_INFO[p].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-xs">
                描述 (可选)
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="简短描述这个预设的用途"
                className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              />
            </div>

            <ModelSelector
              label="选择模型"
              value={formConfig}
              onChange={setFormConfig}
              purpose={formPurpose === 'embedding' ? 'embedding' : formPurpose}
            />

            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formIsDefault}
                onChange={(e) => setFormIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <span className="text-sm text-text-primary">设为该用途的默认预设</span>
            </label>

            <div className="flex justify-end gap-sm pt-md border-t border-border">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-sm px-md py-sm border border-border rounded-md text-text-secondary hover:bg-background-tertiary transition-colors disabled:opacity-50"
              >
                <X size={16} strokeWidth={1.5} />
                <span>取消</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-sm px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
                ) : (
                  <Save size={16} strokeWidth={1.5} />
                )}
                <span>{isSaving ? '保存中...' : '保存'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Presets List */}
      {loading && presets.length === 0 ? (
        <div className="bg-background-primary rounded-lg border border-border p-xl shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <RefreshCw size={32} strokeWidth={1.5} className="text-text-muted animate-spin mb-md" />
            <p className="text-text-secondary">加载中...</p>
          </div>
        </div>
      ) : currentPresets.length === 0 ? (
        <div className="bg-background-primary rounded-lg border border-border p-xl shadow-sm">
          <div className="flex flex-col items-center justify-center text-center">
            <Cpu size={48} strokeWidth={1} className="text-text-muted mb-md" />
            <p className="text-text-secondary mb-sm">
              还没有 {PURPOSE_INFO[selectedPurpose].label} 预设
            </p>
            <p className="text-sm text-text-muted mb-md">
              {PURPOSE_INFO[selectedPurpose].description}
            </p>
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-xs px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors"
            >
              <Plus size={16} strokeWidth={1.5} />
              <span>创建第一个预设</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {currentPresets.map((preset) => (
            <div
              key={preset.id}
              className="bg-background-primary rounded-lg border border-border p-md shadow-sm hover:border-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-sm">
                <div className="flex items-center gap-sm">
                  {PURPOSE_INFO[preset.purpose].icon}
                  <h4 className="font-medium text-text-primary">{preset.name}</h4>
                  {preset.isDefault && (
                    <span className="flex items-center gap-xs px-xs py-0.5 text-xs bg-accent/10 text-accent rounded">
                      <Star size={10} fill="currentColor" />
                      默认
                    </span>
                  )}
                </div>
              </div>

              {preset.description && (
                <p className="text-sm text-text-muted mb-sm">{preset.description}</p>
              )}

              <div className="text-xs text-text-muted space-y-xs mb-md">
                <div>提供商: {preset.config.api}</div>
                <div>模型: {preset.config.model}</div>
                {preset.config.url && <div>URL: {preset.config.url}</div>}
              </div>

              <div className="flex items-center justify-between pt-sm border-t border-border">
                <div className="flex items-center gap-xs">
                  {!preset.isDefault && (
                    <button
                      onClick={() => handleSetDefault(preset)}
                      className="p-xs text-text-muted hover:text-accent transition-colors"
                      title="设为默认"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleStartEdit(preset)}
                    className="p-xs text-text-muted hover:text-accent transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(preset.id)}
                    className="p-xs text-text-muted hover:text-status-error transition-colors"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === preset.id && (
                <div className="mt-sm p-sm bg-status-error/10 border border-status-error/20 rounded-md">
                  <p className="text-xs text-status-error mb-sm">确定删除此预设？</p>
                  <div className="flex gap-xs">
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="flex items-center gap-xs px-sm py-xs text-xs bg-status-error text-white rounded transition-colors"
                    >
                      <Check size={12} />
                      确定
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex items-center gap-xs px-sm py-xs text-xs border border-border rounded text-text-secondary hover:bg-background-tertiary transition-colors"
                    >
                      <X size={12} />
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
