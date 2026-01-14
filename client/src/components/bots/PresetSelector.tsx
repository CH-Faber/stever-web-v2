import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Star, Plus, ExternalLink } from 'lucide-react';
import { useModelPresetsStore } from '../../stores/modelPresetsStore';
import { modelPresetsApi } from '../../api/modelPresets';
import type { ModelConfig, ModelPresetPurpose } from '../../../../shared/types';

interface PresetSelectorProps {
  purpose: ModelPresetPurpose;
  onSelect: (config: ModelConfig) => void;
  currentConfig?: ModelConfig;
}

export function PresetSelector({ purpose, onSelect, currentConfig }: PresetSelectorProps) {
  const { presets, setPresets, getPresetsByPurpose, loading, setLoading } = useModelPresetsStore();

  useEffect(() => {
    if (presets.length === 0) {
      loadPresets();
    }
  }, []);

  const loadPresets = async () => {
    setLoading(true);
    try {
      const data = await modelPresetsApi.getAll();
      setPresets(data);
    } catch (err) {
      console.error('Failed to load presets:', err);
    } finally {
      setLoading(false);
    }
  };

  const purposePresets = getPresetsByPurpose(purpose);

  const isSelected = (presetConfig: ModelConfig) => {
    return (
      currentConfig?.api === presetConfig.api &&
      currentConfig?.model === presetConfig.model
    );
  };

  if (loading) {
    return (
      <div className="text-xs text-text-muted">加载预设中...</div>
    );
  }

  if (purposePresets.length === 0) {
    return (
      <div className="flex items-center gap-sm text-xs text-text-muted">
        <Cpu size={12} />
        <span>暂无预设</span>
        <Link
          to="/model-presets"
          className="flex items-center gap-xs text-accent hover:underline"
        >
          <Plus size={12} />
          创建预设
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs text-xs text-text-muted">
          <Cpu size={12} />
          <span>快速选择预设</span>
        </div>
        <Link
          to="/model-presets"
          className="flex items-center gap-xs text-xs text-accent hover:underline"
        >
          <span>管理预设</span>
          <ExternalLink size={10} />
        </Link>
      </div>
      <div className="flex flex-wrap gap-xs">
        {purposePresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.config)}
            className={`flex items-center gap-xs px-sm py-xs text-xs rounded-md border transition-colors ${
              isSelected(preset.config)
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border-light bg-background-tertiary text-text-secondary hover:border-accent hover:text-accent'
            }`}
          >
            {preset.isDefault && <Star size={10} fill="currentColor" />}
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
