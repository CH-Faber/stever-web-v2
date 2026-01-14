import { useEffect, useState } from 'react';
import { Key, Check, X, Eye, EyeOff, Save, Trash2, RefreshCw, AlertCircle, Server, Plus, Edit2 } from 'lucide-react';
import { useKeysStore } from '../stores/keysStore';
import { useEndpointsStore } from '../stores/endpointsStore';
import { keysApi } from '../api/keys';
import { handleApiError } from '../lib/errorHandler';
import { LLM_PROVIDER_INFO } from '../../../shared/types';
import { EndpointManager } from '../components/bots/EndpointManager';

// Mask API key for display - show first 4 and last 4 characters
function maskApiKey(key: string): string {
  if (!key || key.length <= 8) {
    return '••••••••';
  }
  return `${key.slice(0, 4)}${'•'.repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`;
}

interface KeyInputState {
  value: string;
  isEditing: boolean;
  showKey: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: string | null;
}

export function Keys() {
  const { keys, setKeys, updateKeyStatus, loading, setLoading, error, setError } = useKeysStore();
  const { endpoints, updateEndpoint } = useEndpointsStore();
  const [keyInputs, setKeyInputs] = useState<Record<string, KeyInputState>>({});
  const [endpointKeyInputs, setEndpointKeyInputs] = useState<Record<string, KeyInputState>>({});
  const [showEndpointManager, setShowEndpointManager] = useState(false);

  // Initialize key inputs state
  useEffect(() => {
    const initialState: Record<string, KeyInputState> = {};
    LLM_PROVIDER_INFO.forEach((provider) => {
      initialState[provider.id] = {
        value: '',
        isEditing: false,
        showKey: false,
        isSaving: false,
        isDeleting: false,
        error: null,
      };
    });
    setKeyInputs(initialState);
  }, []);

  // Initialize endpoint key inputs state
  useEffect(() => {
    const initialState: Record<string, KeyInputState> = {};
    endpoints.forEach((endpoint) => {
      initialState[endpoint.id] = {
        value: '',
        isEditing: false,
        showKey: false,
        isSaving: false,
        isDeleting: false,
        error: null,
      };
    });
    setEndpointKeyInputs(initialState);
  }, [endpoints]);

  // Fetch keys on mount
  const fetchKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const keysData = await keysApi.getAll();
      setKeys(keysData);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载密钥状态失败';
      setError(message);
      handleApiError(err, '加载密钥');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const getKeyStatus = (providerId: string): boolean => {
    const keyStatus = keys.find((k) => k.provider === providerId);
    return keyStatus?.configured ?? false;
  };

  const updateKeyInput = (providerId: string, updates: Partial<KeyInputState>) => {
    setKeyInputs((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], ...updates },
    }));
  };

  const handleEditClick = (providerId: string) => {
    updateKeyInput(providerId, { isEditing: true, value: '', error: null });
  };

  const handleCancelEdit = (providerId: string) => {
    updateKeyInput(providerId, { isEditing: false, value: '', showKey: false, error: null });
  };

  const handleSaveKey = async (providerId: string) => {
    const input = keyInputs[providerId];
    if (!input?.value.trim()) {
      updateKeyInput(providerId, { error: '请输入 API 密钥' });
      return;
    }

    updateKeyInput(providerId, { isSaving: true, error: null });
    try {
      await keysApi.update(providerId, input.value.trim());
      updateKeyStatus(providerId, true);
      updateKeyInput(providerId, { isEditing: false, value: '', showKey: false, isSaving: false });
    } catch (err) {
      updateKeyInput(providerId, {
        isSaving: false,
        error: err instanceof Error ? err.message : '保存失败',
      });
    }
  };

  const handleDeleteKey = async (providerId: string) => {
    updateKeyInput(providerId, { isDeleting: true, error: null });
    try {
      await keysApi.delete(providerId);
      updateKeyStatus(providerId, false);
      updateKeyInput(providerId, { isDeleting: false, isEditing: false, value: '' });
    } catch (err) {
      updateKeyInput(providerId, {
        isDeleting: false,
        error: err instanceof Error ? err.message : '删除失败',
      });
    }
  };

  const configuredCount = keys.filter((k) => k.configured).length;
  const totalCount = LLM_PROVIDER_INFO.length;
  const endpointsWithKeys = endpoints.filter((ep) => ep.apiKey && ep.apiKey.trim() !== '').length;

  // Endpoint key management functions
  const updateEndpointKeyInput = (endpointId: string, updates: Partial<KeyInputState>) => {
    setEndpointKeyInputs((prev) => ({
      ...prev,
      [endpointId]: { ...prev[endpointId], ...updates },
    }));
  };

  const handleEndpointEditClick = (endpointId: string) => {
    updateEndpointKeyInput(endpointId, { isEditing: true, value: '', error: null });
  };

  const handleEndpointCancelEdit = (endpointId: string) => {
    updateEndpointKeyInput(endpointId, { isEditing: false, value: '', showKey: false, error: null });
  };

  const handleSaveEndpointKey = (endpointId: string) => {
    const input = endpointKeyInputs[endpointId];
    if (!input?.value.trim()) {
      updateEndpointKeyInput(endpointId, { error: '请输入 API 密钥' });
      return;
    }

    updateEndpointKeyInput(endpointId, { isSaving: true, error: null });
    try {
      updateEndpoint(endpointId, { apiKey: input.value.trim() });
      updateEndpointKeyInput(endpointId, { isEditing: false, value: '', showKey: false, isSaving: false });
    } catch (err) {
      updateEndpointKeyInput(endpointId, {
        isSaving: false,
        error: err instanceof Error ? err.message : '保存失败',
      });
    }
  };

  const handleDeleteEndpointKey = (endpointId: string) => {
    updateEndpointKeyInput(endpointId, { isDeleting: true, error: null });
    try {
      updateEndpoint(endpointId, { apiKey: undefined });
      updateEndpointKeyInput(endpointId, { isDeleting: false, isEditing: false, value: '' });
    } catch (err) {
      updateEndpointKeyInput(endpointId, {
        isDeleting: false,
        error: err instanceof Error ? err.message : '删除失败',
      });
    }
  };

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-md">
          <Key size={24} strokeWidth={1.5} className="text-text-secondary" />
          <h2 className="text-2xl font-semibold text-text-primary">密钥管理</h2>
        </div>
        <button
          onClick={fetchKeys}
          disabled={loading}
          className="flex items-center gap-xs text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} strokeWidth={1.5} className={loading ? 'animate-spin' : ''} />
          <span>刷新</span>
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <div className="bg-background-primary rounded-lg border border-border p-lg shadow-sm">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-md bg-status-online/10 flex items-center justify-center">
              <Check size={20} strokeWidth={1.5} className="text-status-online" />
            </div>
            <div>
              <p className="text-sm text-text-muted">已配置</p>
              <p className="text-2xl font-semibold text-text-primary">{configuredCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-background-primary rounded-lg border border-border p-lg shadow-sm">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-md bg-status-offline/10 flex items-center justify-center">
              <X size={20} strokeWidth={1.5} className="text-status-offline" />
            </div>
            <div>
              <p className="text-sm text-text-muted">未配置</p>
              <p className="text-2xl font-semibold text-text-primary">{totalCount - configuredCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-background-primary rounded-lg border border-border p-lg shadow-sm">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center">
              <Server size={20} strokeWidth={1.5} className="text-accent" />
            </div>
            <div>
              <p className="text-sm text-text-muted">自定义端点</p>
              <p className="text-2xl font-semibold text-text-primary">
                {endpointsWithKeys}/{endpoints.length}
              </p>
            </div>
          </div>
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

      {/* Provider List */}
      <div className="bg-background-primary rounded-lg border border-border shadow-sm">
        <div className="p-md border-b border-border">
          <h3 className="font-medium text-text-primary">LLM 提供商</h3>
          <p className="text-sm text-text-muted mt-xs">管理各 AI 提供商的 API 密钥</p>
        </div>

        {loading && keys.length === 0 ? (
          <div className="p-xl flex flex-col items-center justify-center">
            <RefreshCw size={32} strokeWidth={1.5} className="text-text-muted animate-spin mb-md" />
            <p className="text-text-secondary">加载中...</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {LLM_PROVIDER_INFO.map((provider) => {
              const isConfigured = getKeyStatus(provider.id);
              const input = keyInputs[provider.id] || {
                value: '',
                isEditing: false,
                showKey: false,
                isSaving: false,
                isDeleting: false,
                error: null,
              };

              return (
                <div key={provider.id} className="p-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      {/* Status Indicator */}
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isConfigured ? 'bg-status-online' : 'bg-status-offline'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-text-primary">{provider.name}</p>
                        <p className="text-xs text-text-muted">{provider.keyName}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-sm">
                      <span
                        className={`text-xs px-sm py-xs rounded-full ${
                          isConfigured
                            ? 'bg-status-online/10 text-status-online'
                            : 'bg-status-offline/10 text-status-offline'
                        }`}
                      >
                        {isConfigured ? '已配置' : '未配置'}
                      </span>
                    </div>
                  </div>

                  {/* Edit Mode */}
                  {input.isEditing ? (
                    <div className="mt-md space-y-sm">
                      <div className="flex gap-sm">
                        <div className="relative flex-1">
                          <input
                            type={input.showKey ? 'text' : 'password'}
                            value={input.value}
                            onChange={(e) => updateKeyInput(provider.id, { value: e.target.value, error: null })}
                            placeholder="输入 API 密钥"
                            className="w-full px-md py-sm pr-10 bg-background-secondary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                          />
                          <button
                            type="button"
                            onClick={() => updateKeyInput(provider.id, { showKey: !input.showKey })}
                            className="absolute right-sm top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                          >
                            {input.showKey ? (
                              <EyeOff size={16} strokeWidth={1.5} />
                            ) : (
                              <Eye size={16} strokeWidth={1.5} />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => handleSaveKey(provider.id)}
                          disabled={input.isSaving || !input.value.trim()}
                          className="flex items-center gap-xs px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {input.isSaving ? (
                            <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
                          ) : (
                            <Save size={16} strokeWidth={1.5} />
                          )}
                          <span>保存</span>
                        </button>
                        <button
                          onClick={() => handleCancelEdit(provider.id)}
                          disabled={input.isSaving}
                          className="px-md py-sm bg-background-tertiary hover:bg-border-light text-text-secondary rounded-md transition-colors disabled:opacity-50"
                        >
                          取消
                        </button>
                      </div>
                      {input.error && (
                        <p className="text-xs text-status-error">{input.error}</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-md flex items-center justify-between">
                      {/* Masked Key Display */}
                      <div className="flex-1">
                        {isConfigured ? (
                          <code className="text-sm text-text-muted bg-background-tertiary px-sm py-xs rounded">
                            {maskApiKey('configured-key-placeholder')}
                          </code>
                        ) : (
                          <span className="text-sm text-text-muted">尚未配置密钥</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-xs">
                        <button
                          onClick={() => handleEditClick(provider.id)}
                          className="flex items-center gap-xs px-sm py-xs text-sm bg-accent-light hover:bg-accent text-accent hover:text-white rounded-md transition-colors"
                        >
                          <Key size={14} strokeWidth={1.5} />
                          <span>{isConfigured ? '更新' : '配置'}</span>
                        </button>
                        {isConfigured && (
                          <button
                            onClick={() => handleDeleteKey(provider.id)}
                            disabled={input.isDeleting}
                            className="flex items-center gap-xs px-sm py-xs text-sm bg-status-error/10 hover:bg-status-error text-status-error hover:text-white rounded-md transition-colors disabled:opacity-50"
                          >
                            {input.isDeleting ? (
                              <RefreshCw size={14} strokeWidth={1.5} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} strokeWidth={1.5} />
                            )}
                            <span>删除</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Endpoints Section */}
      <div className="bg-background-primary rounded-lg border border-border shadow-sm">
        <div className="p-md border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-medium text-text-primary flex items-center gap-sm">
              <Server size={18} strokeWidth={1.5} className="text-accent" />
              自定义端点
            </h3>
            <p className="text-sm text-text-muted mt-xs">管理第三方 API 端点的密钥</p>
          </div>
          <button
            onClick={() => setShowEndpointManager(true)}
            className="flex items-center gap-xs px-sm py-xs text-sm bg-accent-light hover:bg-accent text-accent hover:text-white rounded-md transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} />
            <span>管理端点</span>
          </button>
        </div>

        {endpoints.length === 0 ? (
          <div className="p-xl flex flex-col items-center justify-center">
            <Server size={32} strokeWidth={1.5} className="text-text-muted mb-md" />
            <p className="text-text-secondary mb-sm">暂无自定义端点</p>
            <p className="text-sm text-text-muted mb-md">
              添加第三方 API 端点以使用本地模型或代理服务
            </p>
            <button
              onClick={() => setShowEndpointManager(true)}
              className="flex items-center gap-xs px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors"
            >
              <Plus size={16} strokeWidth={1.5} />
              <span>添加端点</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {endpoints.map((endpoint) => {
              const hasKey = endpoint.apiKey && endpoint.apiKey.trim() !== '';
              const input = endpointKeyInputs[endpoint.id] || {
                value: '',
                isEditing: false,
                showKey: false,
                isSaving: false,
                isDeleting: false,
                error: null,
              };

              return (
                <div key={endpoint.id} className="p-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      {/* Status Indicator */}
                      <div
                        className={`w-2 h-2 rounded-full ${
                          hasKey ? 'bg-status-online' : 'bg-status-offline'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-text-primary">{endpoint.name}</p>
                        <p className="text-xs text-text-muted truncate max-w-xs">{endpoint.baseUrl}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-sm">
                      <span className="text-xs bg-accent/10 text-accent px-sm py-xs rounded">
                        {endpoint.apiFormat === 'openai' ? 'OpenAI 兼容' : 
                         endpoint.apiFormat === 'anthropic' ? 'Anthropic' : '自定义'}
                      </span>
                      <span
                        className={`text-xs px-sm py-xs rounded-full ${
                          hasKey
                            ? 'bg-status-online/10 text-status-online'
                            : 'bg-status-offline/10 text-status-offline'
                        }`}
                      >
                        {hasKey ? '已配置密钥' : '无密钥'}
                      </span>
                    </div>
                  </div>

                  {/* Edit Mode */}
                  {input.isEditing ? (
                    <div className="mt-md space-y-sm">
                      <div className="flex gap-sm">
                        <div className="relative flex-1">
                          <input
                            type={input.showKey ? 'text' : 'password'}
                            value={input.value}
                            onChange={(e) => updateEndpointKeyInput(endpoint.id, { value: e.target.value, error: null })}
                            placeholder="输入 API 密钥"
                            className="w-full px-md py-sm pr-10 bg-background-secondary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                          />
                          <button
                            type="button"
                            onClick={() => updateEndpointKeyInput(endpoint.id, { showKey: !input.showKey })}
                            className="absolute right-sm top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                          >
                            {input.showKey ? (
                              <EyeOff size={16} strokeWidth={1.5} />
                            ) : (
                              <Eye size={16} strokeWidth={1.5} />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => handleSaveEndpointKey(endpoint.id)}
                          disabled={input.isSaving || !input.value.trim()}
                          className="flex items-center gap-xs px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {input.isSaving ? (
                            <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
                          ) : (
                            <Save size={16} strokeWidth={1.5} />
                          )}
                          <span>保存</span>
                        </button>
                        <button
                          onClick={() => handleEndpointCancelEdit(endpoint.id)}
                          disabled={input.isSaving}
                          className="px-md py-sm bg-background-tertiary hover:bg-border-light text-text-secondary rounded-md transition-colors disabled:opacity-50"
                        >
                          取消
                        </button>
                      </div>
                      {input.error && (
                        <p className="text-xs text-status-error">{input.error}</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-md flex items-center justify-between">
                      {/* Masked Key Display */}
                      <div className="flex-1">
                        {hasKey ? (
                          <code className="text-sm text-text-muted bg-background-tertiary px-sm py-xs rounded">
                            {maskApiKey(endpoint.apiKey || '')}
                          </code>
                        ) : (
                          <span className="text-sm text-text-muted">尚未配置密钥（可选）</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-xs">
                        <button
                          onClick={() => handleEndpointEditClick(endpoint.id)}
                          className="flex items-center gap-xs px-sm py-xs text-sm bg-accent-light hover:bg-accent text-accent hover:text-white rounded-md transition-colors"
                        >
                          <Key size={14} strokeWidth={1.5} />
                          <span>{hasKey ? '更新' : '配置'}</span>
                        </button>
                        {hasKey && (
                          <button
                            onClick={() => handleDeleteEndpointKey(endpoint.id)}
                            disabled={input.isDeleting}
                            className="flex items-center gap-xs px-sm py-xs text-sm bg-status-error/10 hover:bg-status-error text-status-error hover:text-white rounded-md transition-colors disabled:opacity-50"
                          >
                            {input.isDeleting ? (
                              <RefreshCw size={14} strokeWidth={1.5} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} strokeWidth={1.5} />
                            )}
                            <span>删除</span>
                          </button>
                        )}
                        <button
                          onClick={() => setShowEndpointManager(true)}
                          className="flex items-center gap-xs px-sm py-xs text-sm text-text-secondary hover:text-text-primary transition-colors"
                          title="编辑端点"
                        >
                          <Edit2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Endpoint Manager Modal */}
      <EndpointManager
        open={showEndpointManager}
        onClose={() => setShowEndpointManager(false)}
      />
    </div>
  );
}
