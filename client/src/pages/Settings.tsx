import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Server, Save, RefreshCw, AlertCircle, Check, Globe, Wifi } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { settingsApi } from '../api/settings';
import type { ServerSettings } from '../../../shared/types';

// Common Minecraft versions
const MINECRAFT_VERSIONS = [
  '1.21.4',
  '1.21.3',
  '1.21.2',
  '1.21.1',
  '1.21',
  '1.20.6',
  '1.20.5',
  '1.20.4',
  '1.20.3',
  '1.20.2',
  '1.20.1',
  '1.20',
  '1.19.4',
  '1.19.3',
  '1.19.2',
  '1.19.1',
  '1.19',
  '1.18.2',
  '1.18.1',
  '1.18',
];

export function Settings() {
  const { 
    settings, 
    setSettings, 
    loading, 
    setLoading, 
    error, 
    setError,
    isDirty,
    setDirty 
  } = useSettingsStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localSettings, setLocalSettings] = useState<ServerSettings>(settings);

  // Fetch settings on mount
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await settingsApi.get();
      setSettings(data);
      setLocalSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Sync local settings with store when store changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleInputChange = (field: keyof ServerSettings, value: string | number | boolean) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const updated = await settingsApi.update(localSettings);
      setSettings(updated);
      setLocalSettings(updated);
      setDirty(false);
      setSaveSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setDirty(false);
    setSaveSuccess(false);
    setError(null);
  };

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-md">
          <SettingsIcon size={24} strokeWidth={1.5} className="text-text-secondary" />
          <h2 className="text-2xl font-semibold text-text-primary">服务器设置</h2>
        </div>
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="flex items-center gap-xs text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} strokeWidth={1.5} className={loading ? 'animate-spin' : ''} />
          <span>刷新</span>
        </button>
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

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-status-online/10 border border-status-online/20 rounded-md p-md">
          <div className="flex items-center gap-sm">
            <Check size={16} strokeWidth={1.5} className="text-status-online" />
            <p className="text-sm text-status-online">设置已保存</p>
          </div>
        </div>
      )}

      {loading && !localSettings ? (
        <div className="bg-background-primary rounded-lg border border-border p-xl shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <RefreshCw size={32} strokeWidth={1.5} className="text-text-muted animate-spin mb-md" />
            <p className="text-text-secondary">加载中...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Server Connection Settings */}
          <div className="bg-background-primary rounded-lg border border-border shadow-sm">
            <div className="p-md border-b border-border">
              <div className="flex items-center gap-sm">
                <Server size={18} strokeWidth={1.5} className="text-text-secondary" />
                <h3 className="font-medium text-text-primary">Minecraft 服务器连接</h3>
              </div>
              <p className="text-sm text-text-muted mt-xs">配置机器人连接的 Minecraft 服务器</p>
            </div>

            <div className="p-md space-y-lg">
              {/* Host Input */}
              <div className="space-y-sm">
                <label htmlFor="host" className="block text-sm font-medium text-text-primary">
                  服务器地址
                </label>
                <input
                  id="host"
                  type="text"
                  value={localSettings.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  placeholder="localhost"
                  className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
                <p className="text-xs text-text-muted">Minecraft 服务器的 IP 地址或域名</p>
              </div>

              {/* Port Input */}
              <div className="space-y-sm">
                <label htmlFor="port" className="block text-sm font-medium text-text-primary">
                  端口
                </label>
                <input
                  id="port"
                  type="number"
                  value={localSettings.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 0)}
                  placeholder="55916"
                  min={1}
                  max={65535}
                  className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
                <p className="text-xs text-text-muted">服务器端口号（默认: 55916）</p>
              </div>

              {/* Minecraft Version */}
              <div className="space-y-sm">
                <label htmlFor="version" className="block text-sm font-medium text-text-primary">
                  Minecraft 版本
                </label>
                <select
                  id="version"
                  value={localSettings.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                >
                  {MINECRAFT_VERSIONS.map((version) => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-text-muted">选择 Minecraft 游戏版本</p>
              </div>
            </div>
          </div>

          {/* Authentication Settings */}
          <div className="bg-background-primary rounded-lg border border-border shadow-sm">
            <div className="p-md border-b border-border">
              <div className="flex items-center gap-sm">
                <Globe size={18} strokeWidth={1.5} className="text-text-secondary" />
                <h3 className="font-medium text-text-primary">认证模式</h3>
              </div>
              <p className="text-sm text-text-muted mt-xs">选择服务器连接的认证方式</p>
            </div>

            <div className="p-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                {/* Offline Mode */}
                <button
                  type="button"
                  onClick={() => handleInputChange('auth', 'offline')}
                  className={`p-md rounded-lg border-2 transition-all text-left ${
                    localSettings.auth === 'offline'
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-border-dark bg-background-secondary'
                  }`}
                >
                  <div className="flex items-center gap-md">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      localSettings.auth === 'offline'
                        ? 'bg-accent/10'
                        : 'bg-background-tertiary'
                    }`}>
                      <Wifi size={20} strokeWidth={1.5} className={
                        localSettings.auth === 'offline' ? 'text-accent' : 'text-text-secondary'
                      } />
                    </div>
                    <div>
                      <p className={`font-medium ${
                        localSettings.auth === 'offline' ? 'text-accent' : 'text-text-primary'
                      }`}>
                        离线模式
                      </p>
                      <p className="text-xs text-text-muted">本地局域网服务器</p>
                    </div>
                    {localSettings.auth === 'offline' && (
                      <div className="ml-auto">
                        <Check size={20} strokeWidth={1.5} className="text-accent" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Microsoft Mode */}
                <button
                  type="button"
                  onClick={() => handleInputChange('auth', 'microsoft')}
                  className={`p-md rounded-lg border-2 transition-all text-left ${
                    localSettings.auth === 'microsoft'
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-border-dark bg-background-secondary'
                  }`}
                >
                  <div className="flex items-center gap-md">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      localSettings.auth === 'microsoft'
                        ? 'bg-accent/10'
                        : 'bg-background-tertiary'
                    }`}>
                      <Globe size={20} strokeWidth={1.5} className={
                        localSettings.auth === 'microsoft' ? 'text-accent' : 'text-text-secondary'
                      } />
                    </div>
                    <div>
                      <p className={`font-medium ${
                        localSettings.auth === 'microsoft' ? 'text-accent' : 'text-text-primary'
                      }`}>
                        Microsoft 认证
                      </p>
                      <p className="text-xs text-text-muted">在线服务器</p>
                    </div>
                    {localSettings.auth === 'microsoft' && (
                      <div className="ml-auto">
                        <Check size={20} strokeWidth={1.5} className="text-accent" />
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {localSettings.auth === 'microsoft' && (
                <div className="mt-md p-md bg-accent/5 border border-accent/20 rounded-md">
                  <p className="text-sm text-text-secondary">
                    使用 Microsoft 认证时，首次启动机器人将需要通过浏览器登录 Microsoft 账户。
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-background-primary rounded-lg border border-border shadow-sm">
            <div className="p-md border-b border-border">
              <h3 className="font-medium text-text-primary">高级设置</h3>
              <p className="text-sm text-text-muted mt-xs">其他配置选项</p>
            </div>

            <div className="p-md">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-text-primary">允许不安全代码执行</p>
                  <p className="text-sm text-text-muted">允许机器人执行动态生成的代码（可能存在安全风险）</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={localSettings.allowInsecureCoding}
                    onChange={(e) => handleInputChange('allowInsecureCoding', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-md">
            {isDirty && (
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="px-lg py-sm bg-background-tertiary hover:bg-border-light text-text-secondary rounded-md transition-colors disabled:opacity-50"
              >
                重置
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="flex items-center gap-sm px-lg py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Save size={16} strokeWidth={1.5} />
              )}
              <span>保存设置</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
