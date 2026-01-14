import { useState } from 'react';
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import type { ModelConfig } from '../../../../shared/types';
import { LLM_PROVIDER_INFO } from '../../../../shared/types';

interface ModelConfigFormProps {
  label: string;
  config: ModelConfig;
  onChange: (config: ModelConfig) => void;
  optional?: boolean;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
}

export function ModelConfigForm({
  label,
  config,
  onChange,
  optional = false,
  enabled = true,
  onEnabledChange,
}: ModelConfigFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleApiChange = (api: string) => {
    onChange({ ...config, api });
  };

  const handleModelChange = (model: string) => {
    onChange({ ...config, model });
  };

  const handleUrlChange = (url: string) => {
    onChange({ ...config, url: url || undefined });
  };

  const handleParamsChange = (paramsStr: string) => {
    try {
      const params = paramsStr ? JSON.parse(paramsStr) : undefined;
      onChange({ ...config, params });
    } catch {
      // Invalid JSON, ignore
    }
  };

  return (
    <div className="border border-border rounded-lg p-md">
      <div className="flex items-center justify-between mb-md">
        <div className="flex items-center gap-sm">
          {optional && onEnabledChange && (
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
            />
          )}
          <h4 className="font-medium text-text-primary">{label}</h4>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-xs text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <Settings2 size={14} strokeWidth={1.5} />
          <span>高级</span>
          {showAdvanced ? (
            <ChevronUp size={14} strokeWidth={1.5} />
          ) : (
            <ChevronDown size={14} strokeWidth={1.5} />
          )}
        </button>
      </div>

      <div className={`space-y-md ${optional && !enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* API Provider Select */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-xs">
            API 提供商
          </label>
          <select
            value={config.api}
            onChange={(e) => handleApiChange(e.target.value)}
            className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">选择提供商</option>
            {LLM_PROVIDER_INFO.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        {/* Model Name Input */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-xs">
            模型名称
          </label>
          <input
            type="text"
            value={config.model}
            onChange={(e) => handleModelChange(e.target.value)}
            placeholder="例如: gpt-4, claude-3-opus"
            className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-md pt-md border-t border-border-light">
            {/* Custom URL */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-xs">
                自定义 API URL (可选)
              </label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {/* Extra Parameters */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-xs">
                额外参数 (JSON 格式, 可选)
              </label>
              <textarea
                value={config.params ? JSON.stringify(config.params, null, 2) : ''}
                onChange={(e) => handleParamsChange(e.target.value)}
                placeholder='{"temperature": 0.7, "max_tokens": 1000}'
                rows={3}
                className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
