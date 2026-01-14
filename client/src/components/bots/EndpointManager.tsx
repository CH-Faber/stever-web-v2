import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Save,
  RefreshCw,
  Server,
  Key,
  Globe,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useEndpointsStore } from '../../stores/endpointsStore';
import { validateUrl } from '../../lib/validation';
import type { CustomEndpoint, ApiFormat } from '../../../../shared/types';

interface EndpointManagerProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (endpoint: CustomEndpoint) => void;
}

interface EndpointFormData {
  name: string;
  baseUrl: string;
  apiKey: string;
  apiFormat: ApiFormat;
  headers: Record<string, string>;
}

const initialFormData: EndpointFormData = {
  name: '',
  baseUrl: '',
  apiKey: '',
  apiFormat: 'openai',
  headers: {},
};

const API_FORMAT_OPTIONS: { value: ApiFormat; label: string; description: string }[] = [
  { value: 'openai', label: 'OpenAI 兼容', description: '支持大多数第三方服务（Ollama、LM Studio 等）' },
  { value: 'anthropic', label: 'Anthropic', description: 'Anthropic Claude API 格式' },
  { value: 'custom', label: '自定义', description: '自定义 API 格式' },
];

export function EndpointManager({ open, onClose, onSelect }: EndpointManagerProps) {
  const { endpoints, addEndpoint, updateEndpoint, deleteEndpoint } = useEndpointsStore();
  
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EndpointFormData>(initialFormData);
  const [showHeaders, setShowHeaders] = useState(false);
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setMode('list');
      setEditingId(null);
      setFormData(initialFormData);
      setErrors({});
      setShowHeaders(false);
      setDeleteConfirm(null);
    }
  }, [open]);

  if (!open) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入端点名称';
    }

    const urlValidation = validateUrl(formData.baseUrl);
    if (!urlValidation.valid) {
      newErrors.baseUrl = urlValidation.error || 'URL 格式无效';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddNew = () => {
    setMode('add');
    setFormData(initialFormData);
    setErrors({});
    setShowHeaders(false);
  };

  const handleEdit = (endpoint: CustomEndpoint) => {
    setMode('edit');
    setEditingId(endpoint.id);
    setFormData({
      name: endpoint.name,
      baseUrl: endpoint.baseUrl,
      apiKey: endpoint.apiKey || '',
      apiFormat: endpoint.apiFormat,
      headers: endpoint.headers || {},
    });
    setErrors({});
    setShowHeaders(Object.keys(endpoint.headers || {}).length > 0);
  };

  const handleCancel = () => {
    setMode('list');
    setEditingId(null);
    setFormData(initialFormData);
    setErrors({});
    setShowHeaders(false);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const endpointData = {
        name: formData.name.trim(),
        baseUrl: formData.baseUrl.trim(),
        apiKey: formData.apiKey.trim() || undefined,
        apiFormat: formData.apiFormat,
        headers: Object.keys(formData.headers).length > 0 ? formData.headers : undefined,
      };

      if (mode === 'edit' && editingId) {
        await updateEndpoint(editingId, endpointData);
      } else {
        await addEndpoint(endpointData);
      }

      handleCancel();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : '保存失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteEndpoint(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  const handleSelect = (endpoint: CustomEndpoint) => {
    onSelect?.(endpoint);
    onClose();
  };

  const handleAddHeader = () => {
    if (headerKey.trim() && headerValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        headers: { ...prev.headers, [headerKey.trim()]: headerValue.trim() },
      }));
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    setFormData((prev) => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  };

  const renderForm = () => (
    <div className="space-y-md">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-xs">
          端点名称 <span className="text-status-error">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, name: e.target.value }));
            setErrors((prev) => ({ ...prev, name: '' }));
          }}
          placeholder="例如: 本地 Ollama"
          className={`w-full px-md py-sm bg-background-primary border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
            errors.name ? 'border-status-error' : 'border-border'
          }`}
        />
        {errors.name && (
          <p className="text-xs text-status-error mt-xs">{errors.name}</p>
        )}
      </div>

      {/* Base URL */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-xs">
          API 基础 URL <span className="text-status-error">*</span>
        </label>
        <div className="relative">
          <Globe size={16} className="absolute left-md top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={formData.baseUrl}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, baseUrl: e.target.value }));
              setErrors((prev) => ({ ...prev, baseUrl: '' }));
            }}
            placeholder="https://api.example.com 或 http://localhost:11434"
            className={`w-full pl-10 pr-md py-sm bg-background-primary border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
              errors.baseUrl ? 'border-status-error' : 'border-border'
            }`}
          />
        </div>
        {errors.baseUrl && (
          <p className="text-xs text-status-error mt-xs">{errors.baseUrl}</p>
        )}
      </div>

      {/* API Format */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-xs">
          API 格式
        </label>
        <select
          value={formData.apiFormat}
          onChange={(e) => setFormData((prev) => ({ ...prev, apiFormat: e.target.value as ApiFormat }))}
          className="w-full px-md py-sm bg-background-primary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          {API_FORMAT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-text-muted mt-xs">
          {API_FORMAT_OPTIONS.find((o) => o.value === formData.apiFormat)?.description}
        </p>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-xs">
          API 密钥 (可选)
        </label>
        <div className="relative">
          <Key size={16} className="absolute left-md top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="password"
            value={formData.apiKey}
            onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
            placeholder="如果需要认证，请输入 API 密钥"
            className="w-full pl-10 pr-md py-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
      </div>

      {/* Custom Headers */}
      <div>
        <button
          type="button"
          onClick={() => setShowHeaders(!showHeaders)}
          className="flex items-center gap-xs text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          {showHeaders ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>自定义请求头</span>
          {Object.keys(formData.headers).length > 0 && (
            <span className="text-xs bg-accent/10 text-accent px-xs rounded">
              {Object.keys(formData.headers).length}
            </span>
          )}
        </button>

        {showHeaders && (
          <div className="mt-sm space-y-sm">
            {/* Existing Headers */}
            {Object.entries(formData.headers).map(([key, value]) => (
              <div key={key} className="flex items-center gap-sm bg-background-tertiary rounded-md p-sm">
                <code className="text-xs text-text-secondary flex-1 truncate">{key}</code>
                <code className="text-xs text-text-muted flex-1 truncate">{value}</code>
                <button
                  type="button"
                  onClick={() => handleRemoveHeader(key)}
                  className="text-status-error hover:text-status-error/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* Add New Header */}
            <div className="flex gap-sm">
              <input
                type="text"
                value={headerKey}
                onChange={(e) => setHeaderKey(e.target.value)}
                placeholder="Header 名称"
                className="flex-1 px-sm py-xs text-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <input
                type="text"
                value={headerValue}
                onChange={(e) => setHeaderValue(e.target.value)}
                placeholder="Header 值"
                className="flex-1 px-sm py-xs text-sm bg-background-primary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddHeader}
                disabled={!headerKey.trim() || !headerValue.trim()}
                className="px-sm py-xs bg-accent hover:bg-accent-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="flex items-center gap-sm text-status-error bg-status-error/10 rounded-md p-sm">
          <AlertCircle size={16} />
          <span className="text-sm">{errors.submit}</span>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-sm pt-md border-t border-border">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="px-md py-sm bg-background-tertiary hover:bg-border-light text-text-secondary rounded-md transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-xs px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span>{mode === 'edit' ? '更新' : '添加'}</span>
        </button>
      </div>
    </div>
  );


  const renderList = () => (
    <div className="space-y-md">
      {endpoints.length === 0 ? (
        <div className="text-center py-xl">
          <Server size={48} className="mx-auto text-text-muted mb-md" />
          <p className="text-text-secondary mb-sm">暂无自定义端点</p>
          <p className="text-sm text-text-muted mb-md">
            添加第三方 API 端点以使用本地模型或代理服务
          </p>
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-xs px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors"
          >
            <Plus size={16} />
            <span>添加端点</span>
          </button>
        </div>
      ) : (
        <>
          {/* Endpoint List */}
          <div className="space-y-sm">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className="bg-background-tertiary rounded-lg p-md hover:bg-background-tertiary/80 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sm">
                      <Server size={16} className="text-accent flex-shrink-0" />
                      <h4 className="font-medium text-text-primary truncate">
                        {endpoint.name}
                      </h4>
                      <span className="text-xs bg-accent/10 text-accent px-xs py-0.5 rounded">
                        {API_FORMAT_OPTIONS.find((o) => o.value === endpoint.apiFormat)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted mt-xs truncate">
                      {endpoint.baseUrl}
                    </p>
                    <div className="flex items-center gap-md mt-xs text-xs text-text-muted">
                      {endpoint.apiKey && (
                        <span className="flex items-center gap-xs">
                          <Key size={12} />
                          已配置密钥
                        </span>
                      )}
                      {endpoint.headers && Object.keys(endpoint.headers).length > 0 && (
                        <span>{Object.keys(endpoint.headers).length} 个自定义头</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-xs ml-md">
                    {onSelect && (
                      <button
                        type="button"
                        onClick={() => handleSelect(endpoint)}
                        className="flex items-center gap-xs px-sm py-xs text-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors"
                      >
                        <Check size={14} />
                        <span>选择</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(endpoint)}
                      className="p-xs text-text-secondary hover:text-accent transition-colors"
                      title="编辑"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(endpoint.id)}
                      className={`p-xs transition-colors ${
                        deleteConfirm === endpoint.id
                          ? 'text-white bg-status-error rounded'
                          : 'text-text-secondary hover:text-status-error'
                      }`}
                      title={deleteConfirm === endpoint.id ? '确认删除' : '删除'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={handleAddNew}
            className="w-full flex items-center justify-center gap-xs px-md py-sm border-2 border-dashed border-border hover:border-accent text-text-secondary hover:text-accent rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span>添加新端点</span>
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background-secondary rounded-lg shadow-xl w-full max-w-lg mx-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-md border-b border-border">
          <div className="flex items-center gap-sm">
            <Server size={20} className="text-accent" />
            <h3 className="text-lg font-semibold text-text-primary">
              {mode === 'list' && '自定义端点'}
              {mode === 'add' && '添加端点'}
              {mode === 'edit' && '编辑端点'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-md">
          {mode === 'list' ? renderList() : renderForm()}
        </div>
      </div>
    </div>
  );
}
