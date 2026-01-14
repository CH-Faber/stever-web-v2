import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Star,
  StarOff,
  ChevronDown,
  ChevronUp,
  Settings2,
  Server,
  Loader2,
  AlertCircle,
  Code,
  Eye,
  MessageSquare,
  Sparkles,
  Zap,
  Info,
  X,
} from 'lucide-react';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useEndpointsStore } from '../../stores/endpointsStore';
import { modelsApi } from '../../api/models';
import { searchModels, filterByPurpose } from '../../lib/modelSearch';
import { EndpointManager } from './EndpointManager';
import type {
  ModelConfig,
  ModelInfo,
  ModelCapability,
  FavoriteModelConfig,
  CustomEndpoint,
} from '../../../../shared/types';
import { LLM_PROVIDER_INFO } from '../../../../shared/types';

interface ModelSelectorProps {
  label: string;
  value: ModelConfig;
  onChange: (config: ModelConfig) => void;
  purpose?: 'main' | 'code' | 'vision' | 'embedding';
  optional?: boolean;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
}

// Capability icons mapping
const CAPABILITY_ICONS: Record<ModelCapability, React.ReactNode> = {
  text: <MessageSquare size={12} />,
  code: <Code size={12} />,
  vision: <Eye size={12} />,
  embedding: <Sparkles size={12} />,
  function_calling: <Zap size={12} />,
};

// Capability labels
const CAPABILITY_LABELS: Record<ModelCapability, string> = {
  text: '文本',
  code: '代码',
  vision: '视觉',
  embedding: '嵌入',
  function_calling: '函数调用',
};


export function ModelSelector({
  label,
  value,
  onChange,
  purpose,
  optional = false,
  enabled = true,
  onEnabledChange,
}: ModelSelectorProps) {
  // Stores
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { endpoints, getEndpointById } = useEndpointsStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showEndpointManager, setShowEndpointManager] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>(value.api || '');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [showModelList, setShowModelList] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<ModelInfo | null>(null);

  // Load models when provider changes
  useEffect(() => {
    if (selectedProvider && selectedProvider !== 'custom') {
      loadModels(selectedProvider);
    }
  }, [selectedProvider]);

  const loadModels = async (provider: string) => {
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      const response = await modelsApi.fetchModels(provider);
      setModels(response.models);
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : '获取模型列表失败');
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const loadModelsFromEndpoint = async (endpoint: CustomEndpoint) => {
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      const response = await modelsApi.fetchModelsFromEndpoint(endpoint);
      setModels(response.models);
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : '获取模型列表失败');
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Filter and search models
  const filteredModels = useMemo(() => {
    let result = models;
    
    // Apply purpose filter first
    if (purpose) {
      result = filterByPurpose(result, purpose);
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const searchResults = searchModels(result, { query: searchQuery });
      result = searchResults.map(r => r.model);
    }
    
    return result;
  }, [models, searchQuery, purpose]);

  // Handle provider change
  const handleProviderChange = (provider: string) => {
    // Check if selecting a custom endpoint from dropdown
    if (provider.startsWith('endpoint:')) {
      const endpointId = provider.replace('endpoint:', '');
      const endpoint = getEndpointById(endpointId);
      if (endpoint) {
        handleEndpointSelect(endpoint);
        return;
      }
    }
    
    setSelectedProvider(provider);
    onChange({
      ...value,
      api: provider,
      model: '',
      endpointId: undefined,
    });
    setShowModelList(true);
  };

  // Handle model selection
  const handleModelSelect = (model: ModelInfo) => {
    onChange({
      ...value,
      api: model.provider || selectedProvider,
      model: model.id,
    });
    setShowModelList(false);
    setSearchQuery('');
  };

  // Handle manual model input
  const handleModelInputChange = (modelName: string) => {
    onChange({
      ...value,
      model: modelName,
    });
  };

  // Handle custom endpoint selection
  const handleEndpointSelect = (endpoint: CustomEndpoint) => {
    setSelectedProvider('custom');
    onChange({
      ...value,
      api: 'custom',
      endpointId: endpoint.id,
      url: endpoint.baseUrl,
    });
    loadModelsFromEndpoint(endpoint);
    setShowModelList(true);
  };

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(() => {
    if (!value.model || !value.api) return;
    
    const isCurrentlyFavorite = isFavorite(value.model, value.api);
    
    if (isCurrentlyFavorite) {
      const favorite = favorites.find(
        f => f.modelId === value.model && f.provider === value.api
      );
      if (favorite) {
        removeFavorite(favorite.id);
      }
    } else {
      addFavorite({
        name: `${value.model} (${value.api})`,
        modelId: value.model,
        provider: value.api,
        endpointId: value.endpointId,
        config: value,
      });
    }
  }, [value, favorites, isFavorite, addFavorite, removeFavorite]);

  // Apply favorite config
  const handleApplyFavorite = (favorite: FavoriteModelConfig) => {
    onChange(favorite.config);
    setSelectedProvider(favorite.provider);
    setShowModelList(false);
  };

  // Handle URL change (advanced)
  const handleUrlChange = (url: string) => {
    onChange({ ...value, url: url || undefined });
  };

  // Handle params change (advanced)
  const handleParamsChange = (paramsStr: string) => {
    try {
      const params = paramsStr ? JSON.parse(paramsStr) : undefined;
      onChange({ ...value, params });
    } catch {
      // Invalid JSON, ignore
    }
  };

  // Get current endpoint name if using custom
  const currentEndpoint = value.endpointId ? getEndpointById(value.endpointId) : null;

  const isCurrentFavorite = value.model && value.api ? isFavorite(value.model, value.api) : false;


  return (
    <div className="border border-border rounded-lg p-md">
      {/* Header */}
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
        <div className="flex items-center gap-sm">
          {/* Favorite button */}
          {value.model && value.api && (
            <button
              type="button"
              onClick={handleFavoriteToggle}
              className={`p-xs rounded transition-colors ${
                isCurrentFavorite
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-text-muted hover:text-yellow-500'
              }`}
              title={isCurrentFavorite ? '取消收藏' : '添加收藏'}
            >
              {isCurrentFavorite ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
            </button>
          )}
          {/* Advanced toggle */}
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
      </div>

      <div className={`space-y-md ${optional && !enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="mb-md">
            <div className="text-xs font-medium text-text-muted mb-xs flex items-center gap-xs">
              <Star size={12} />
              <span>收藏的配置</span>
            </div>
            <div className="flex flex-wrap gap-xs">
              {favorites.slice(0, 5).map((fav) => (
                <button
                  key={fav.id}
                  type="button"
                  onClick={() => handleApplyFavorite(fav)}
                  className={`px-sm py-xs text-xs rounded-md border transition-colors ${
                    value.model === fav.modelId && value.api === fav.provider
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-light bg-background-tertiary text-text-secondary hover:border-accent hover:text-accent'
                  }`}
                >
                  {fav.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-xs">
            API 提供商
          </label>
          <div className="flex gap-sm">
            <select
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="flex-1 px-md py-sm bg-background-primary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">选择提供商</option>
              {LLM_PROVIDER_INFO.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
              {endpoints.length > 0 && (
                <optgroup label="自定义端点">
                  {endpoints.map((ep) => (
                    <option key={ep.id} value={`endpoint:${ep.id}`}>
                      {ep.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <button
              type="button"
              onClick={() => setShowEndpointManager(true)}
              className="px-sm py-sm border border-border rounded-md text-text-secondary hover:text-accent hover:border-accent transition-colors"
              title="管理自定义端点"
            >
              <Server size={18} />
            </button>
          </div>
        </div>


        {/* Model Selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-text-secondary mb-xs">
            模型
          </label>
          
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-md top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={showModelList ? searchQuery : value.model}
              onChange={(e) => {
                if (showModelList) {
                  setSearchQuery(e.target.value);
                } else {
                  handleModelInputChange(e.target.value);
                }
              }}
              onFocus={() => {
                if (selectedProvider && models.length > 0) {
                  setShowModelList(true);
                  setSearchQuery('');
                }
              }}
              placeholder={
                isLoadingModels
                  ? '加载模型列表...'
                  : selectedProvider
                  ? '搜索或输入模型名称'
                  : '请先选择提供商'
              }
              className="w-full pl-10 pr-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            {isLoadingModels && (
              <Loader2 size={16} className="absolute right-md top-1/2 -translate-y-1/2 text-accent animate-spin" />
            )}
            {showModelList && !isLoadingModels && (
              <button
                type="button"
                onClick={() => {
                  setShowModelList(false);
                  setSearchQuery('');
                }}
                className="absolute right-md top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Error Message */}
          {modelsError && (
            <div className="flex items-center gap-xs mt-xs text-xs text-status-error">
              <AlertCircle size={12} />
              <span>{modelsError}</span>
              <span className="text-text-muted">（可手动输入模型名称）</span>
            </div>
          )}

          {/* Model Dropdown List */}
          {showModelList && !isLoadingModels && filteredModels.length > 0 && (
            <div className="absolute z-10 w-full mt-xs bg-background-secondary border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  className="relative"
                  onMouseEnter={() => setHoveredModel(model)}
                  onMouseLeave={() => setHoveredModel(null)}
                >
                  <button
                    type="button"
                    onClick={() => handleModelSelect(model)}
                    className={`w-full px-md py-sm text-left hover:bg-background-tertiary transition-colors ${
                      value.model === model.id ? 'bg-accent/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-text-primary truncate">
                          {model.name}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {model.id}
                        </div>
                      </div>
                      {/* Capability badges */}
                      <div className="flex items-center gap-xs ml-sm">
                        {model.capabilities.slice(0, 3).map((cap) => (
                          <span
                            key={cap}
                            className="flex items-center gap-0.5 px-xs py-0.5 text-xs bg-accent/10 text-accent rounded"
                            title={CAPABILITY_LABELS[cap]}
                          >
                            {CAPABILITY_ICONS[cap]}
                          </span>
                        ))}
                        {model.capabilities.length > 3 && (
                          <span className="text-xs text-text-muted">
                            +{model.capabilities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Hover tooltip */}
                  {hoveredModel?.id === model.id && (
                    <ModelTooltip model={model} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No results message */}
          {showModelList && !isLoadingModels && filteredModels.length === 0 && searchQuery && (
            <div className="absolute z-10 w-full mt-xs bg-background-secondary border border-border rounded-md shadow-lg p-md">
              <div className="text-sm text-text-muted text-center">
                未找到匹配的模型，可直接输入模型名称
              </div>
            </div>
          )}
        </div>

        {/* Current endpoint info */}
        {currentEndpoint && (
          <div className="flex items-center gap-xs text-xs text-text-muted bg-background-tertiary rounded-md px-sm py-xs">
            <Server size={12} />
            <span>使用端点: {currentEndpoint.name}</span>
            <span className="text-text-muted">({currentEndpoint.baseUrl})</span>
          </div>
        )}


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
                value={value.url || ''}
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
                value={value.params ? JSON.stringify(value.params, null, 2) : ''}
                onChange={(e) => handleParamsChange(e.target.value)}
                placeholder='{"temperature": 0.7, "max_tokens": 1000}'
                rows={3}
                className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Endpoint Manager Modal */}
      <EndpointManager
        open={showEndpointManager}
        onClose={() => setShowEndpointManager(false)}
        onSelect={handleEndpointSelect}
      />
    </div>
  );
}

/**
 * Model tooltip component for displaying detailed model information
 * Validates: Requirement 1.5 - WHEN 用户悬停在模型上 THEN Model_Selector SHALL 显示模型的详细信息
 */
function ModelTooltip({ model }: { model: ModelInfo }) {
  return (
    <div className="absolute left-full top-0 ml-sm z-20 w-64 bg-background-primary border border-border rounded-md shadow-lg p-md">
      <div className="flex items-start gap-sm mb-sm">
        <Info size={16} className="text-accent flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-medium text-text-primary">{model.name}</div>
          <div className="text-xs text-text-muted">{model.id}</div>
        </div>
      </div>
      
      {model.description && (
        <p className="text-xs text-text-secondary mb-sm">{model.description}</p>
      )}
      
      {model.contextLength && (
        <div className="text-xs text-text-muted mb-sm">
          上下文长度: {model.contextLength.toLocaleString()} tokens
        </div>
      )}
      
      <div className="flex flex-wrap gap-xs">
        {model.capabilities.map((cap) => (
          <span
            key={cap}
            className="flex items-center gap-xs px-xs py-0.5 text-xs bg-accent/10 text-accent rounded"
          >
            {CAPABILITY_ICONS[cap]}
            <span>{CAPABILITY_LABELS[cap]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

