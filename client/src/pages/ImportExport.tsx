import { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  FileJson, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Bot,
  Settings,
  ListTodo,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { importExportApi } from '../api/importExport';
import { toast } from '../components/Toast';
import { handleImportError, handleApiError } from '../lib/errorHandler';
import type { ImportRequest, BotProfile, ServerSettings, Task } from '../../../shared/types';

interface ImportPreview {
  data: ImportRequest;
  selectedBots: Set<string>;
  selectedTasks: Set<string>;
  includeSettings: boolean;
}

export function ImportExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['bots', 'settings', 'tasks']));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await importExportApi.export();
      
      // Create and download JSON file
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mindcraft-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('配置已成功导出');
      toast.success('导出成功', '配置文件已下载');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '导出配置失败';
      setError(message);
      handleApiError(err, '导出配置');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ImportRequest;
        
        // Validate basic structure
        if (!data || typeof data !== 'object') {
          throw new Error('无效的配置文件格式');
        }

        if (!data.bots && !data.settings && !data.tasks) {
          throw new Error('配置文件必须包含至少一项: bots, settings, 或 tasks');
        }

        // Initialize preview with all items selected
        const selectedBots = new Set<string>(data.bots?.map(b => b.id) || []);
        const selectedTasks = new Set<string>(data.tasks?.map(t => t.id) || []);
        
        setImportPreview({
          data,
          selectedBots,
          selectedTasks,
          includeSettings: !!data.settings,
        });
        
        toast.info('文件已加载', '请选择要导入的配置项');
      } catch (err) {
        let message: string;
        if (err instanceof SyntaxError) {
          message = '无效的 JSON 格式，请确保文件是有效的 JSON';
        } else {
          message = err instanceof Error ? err.message : '解析配置文件失败';
        }
        setError(message);
        handleImportError(err);
      }
    };
    reader.onerror = () => {
      const message = '读取文件失败，请检查文件是否可访问';
      setError(message);
      toast.error('读取失败', message);
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (!importPreview) return;

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    try {
      // Build import request with only selected items
      const importData: ImportRequest = {};

      if (importPreview.data.bots && importPreview.selectedBots.size > 0) {
        importData.bots = importPreview.data.bots.filter(b => importPreview.selectedBots.has(b.id));
      }

      if (importPreview.includeSettings && importPreview.data.settings) {
        importData.settings = importPreview.data.settings;
      }

      if (importPreview.data.tasks && importPreview.selectedTasks.size > 0) {
        importData.tasks = importPreview.data.tasks.filter(t => importPreview.selectedTasks.has(t.id));
      }

      const result = await importExportApi.import(importData);
      
      const messages: string[] = [];
      if (result.imported.bots > 0) {
        messages.push(`${result.imported.bots} 个机器人`);
      }
      if (result.imported.settings) {
        messages.push('服务器设置');
      }
      if (result.imported.tasks > 0) {
        messages.push(`${result.imported.tasks} 个任务`);
      }

      const successMessage = `成功导入: ${messages.join(', ')}`;
      setSuccess(successMessage);
      toast.success('导入成功', successMessage);
      setImportPreview(null);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '导入配置失败';
      setError(message);
      handleImportError(err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportCancel = () => {
    setImportPreview(null);
    setError(null);
  };

  const toggleBotSelection = (botId: string) => {
    if (!importPreview) return;
    const newSelected = new Set(importPreview.selectedBots);
    if (newSelected.has(botId)) {
      newSelected.delete(botId);
    } else {
      newSelected.add(botId);
    }
    setImportPreview({ ...importPreview, selectedBots: newSelected });
  };

  const toggleTaskSelection = (taskId: string) => {
    if (!importPreview) return;
    const newSelected = new Set(importPreview.selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setImportPreview({ ...importPreview, selectedTasks: newSelected });
  };

  const toggleSettingsSelection = () => {
    if (!importPreview) return;
    setImportPreview({ ...importPreview, includeSettings: !importPreview.includeSettings });
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const selectAllBots = () => {
    if (!importPreview?.data.bots) return;
    setImportPreview({
      ...importPreview,
      selectedBots: new Set(importPreview.data.bots.map(b => b.id)),
    });
  };

  const deselectAllBots = () => {
    if (!importPreview) return;
    setImportPreview({ ...importPreview, selectedBots: new Set() });
  };

  const selectAllTasks = () => {
    if (!importPreview?.data.tasks) return;
    setImportPreview({
      ...importPreview,
      selectedTasks: new Set(importPreview.data.tasks.map(t => t.id)),
    });
  };

  const deselectAllTasks = () => {
    if (!importPreview) return;
    setImportPreview({ ...importPreview, selectedTasks: new Set() });
  };

  const hasSelectedItems = importPreview && (
    importPreview.selectedBots.size > 0 ||
    importPreview.includeSettings ||
    importPreview.selectedTasks.size > 0
  );

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex items-center gap-md">
        <FileJson size={24} strokeWidth={1.5} className="text-text-secondary" />
        <h2 className="text-2xl font-semibold text-text-primary">导入导出</h2>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-status-error/10 border border-status-error/20 rounded-md p-md">
          <div className="flex items-center gap-sm">
            <AlertCircle size={16} strokeWidth={1.5} className="text-status-error flex-shrink-0" />
            <p className="text-sm text-status-error">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-status-online/10 border border-status-online/20 rounded-md p-md">
          <div className="flex items-center gap-sm">
            <Check size={16} strokeWidth={1.5} className="text-status-online flex-shrink-0" />
            <p className="text-sm text-status-online">{success}</p>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-background-primary rounded-lg border border-border shadow-sm">
        <div className="p-md border-b border-border">
          <div className="flex items-center gap-sm">
            <Download size={18} strokeWidth={1.5} className="text-text-secondary" />
            <h3 className="font-medium text-text-primary">导出配置</h3>
          </div>
          <p className="text-sm text-text-muted mt-xs">将所有机器人配置、服务器设置和任务导出为 JSON 文件</p>
        </div>
        <div className="p-md">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-sm px-lg py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <Download size={16} strokeWidth={1.5} />
            )}
            <span>导出所有配置</span>
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-background-primary rounded-lg border border-border shadow-sm">
        <div className="p-md border-b border-border">
          <div className="flex items-center gap-sm">
            <Upload size={18} strokeWidth={1.5} className="text-text-secondary" />
            <h3 className="font-medium text-text-primary">导入配置</h3>
          </div>
          <p className="text-sm text-text-muted mt-xs">从 JSON 文件导入机器人配置、服务器设置和任务</p>
        </div>
        <div className="p-md">
          {!importPreview ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="flex items-center gap-sm px-lg py-sm bg-background-tertiary hover:bg-border-light text-text-primary rounded-md transition-colors cursor-pointer inline-flex"
              >
                <Upload size={16} strokeWidth={1.5} />
                <span>选择配置文件</span>
              </label>
              <p className="text-xs text-text-muted mt-sm">支持 .json 格式的配置文件</p>
            </div>
          ) : (
            <ImportPreviewPanel
              preview={importPreview}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
              onToggleBot={toggleBotSelection}
              onToggleTask={toggleTaskSelection}
              onToggleSettings={toggleSettingsSelection}
              onSelectAllBots={selectAllBots}
              onDeselectAllBots={deselectAllBots}
              onSelectAllTasks={selectAllTasks}
              onDeselectAllTasks={deselectAllTasks}
              onConfirm={handleImportConfirm}
              onCancel={handleImportCancel}
              isImporting={isImporting}
              hasSelectedItems={!!hasSelectedItems}
            />
          )}
        </div>
      </div>
    </div>
  );
}


// Import Preview Panel Component
interface ImportPreviewPanelProps {
  preview: ImportPreview;
  expandedSections: Set<string>;
  onToggleSection: (section: string) => void;
  onToggleBot: (botId: string) => void;
  onToggleTask: (taskId: string) => void;
  onToggleSettings: () => void;
  onSelectAllBots: () => void;
  onDeselectAllBots: () => void;
  onSelectAllTasks: () => void;
  onDeselectAllTasks: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  isImporting: boolean;
  hasSelectedItems: boolean;
}

function ImportPreviewPanel({
  preview,
  expandedSections,
  onToggleSection,
  onToggleBot,
  onToggleTask,
  onToggleSettings,
  onSelectAllBots,
  onDeselectAllBots,
  onSelectAllTasks,
  onDeselectAllTasks,
  onConfirm,
  onCancel,
  isImporting,
  hasSelectedItems,
}: ImportPreviewPanelProps) {
  const { data, selectedBots, selectedTasks, includeSettings } = preview;

  return (
    <div className="space-y-md">
      <div className="bg-accent/5 border border-accent/20 rounded-md p-md">
        <p className="text-sm text-text-secondary">
          请选择要导入的配置项。导入将创建新的配置，不会覆盖现有配置。
        </p>
      </div>

      {/* Bots Section */}
      {data.bots && data.bots.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => onToggleSection('bots')}
            className="w-full flex items-center justify-between p-md bg-background-secondary hover:bg-background-tertiary transition-colors"
          >
            <div className="flex items-center gap-sm">
              <Bot size={18} strokeWidth={1.5} className="text-text-secondary" />
              <span className="font-medium text-text-primary">
                机器人配置 ({selectedBots.size}/{data.bots.length})
              </span>
            </div>
            {expandedSections.has('bots') ? (
              <ChevronUp size={18} strokeWidth={1.5} className="text-text-muted" />
            ) : (
              <ChevronDown size={18} strokeWidth={1.5} className="text-text-muted" />
            )}
          </button>
          {expandedSections.has('bots') && (
            <div className="p-md border-t border-border">
              <div className="flex items-center gap-sm mb-md">
                <button
                  onClick={onSelectAllBots}
                  className="text-xs text-accent hover:text-accent-dark transition-colors"
                >
                  全选
                </button>
                <span className="text-text-muted">|</span>
                <button
                  onClick={onDeselectAllBots}
                  className="text-xs text-accent hover:text-accent-dark transition-colors"
                >
                  取消全选
                </button>
              </div>
              <div className="space-y-sm max-h-60 overflow-y-auto">
                {data.bots.map((bot) => (
                  <BotPreviewItem
                    key={bot.id}
                    bot={bot}
                    selected={selectedBots.has(bot.id)}
                    onToggle={() => onToggleBot(bot.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Section */}
      {data.settings && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => onToggleSection('settings')}
            className="w-full flex items-center justify-between p-md bg-background-secondary hover:bg-background-tertiary transition-colors"
          >
            <div className="flex items-center gap-sm">
              <Settings size={18} strokeWidth={1.5} className="text-text-secondary" />
              <span className="font-medium text-text-primary">
                服务器设置 {includeSettings ? '(已选择)' : '(未选择)'}
              </span>
            </div>
            {expandedSections.has('settings') ? (
              <ChevronUp size={18} strokeWidth={1.5} className="text-text-muted" />
            ) : (
              <ChevronDown size={18} strokeWidth={1.5} className="text-text-muted" />
            )}
          </button>
          {expandedSections.has('settings') && (
            <div className="p-md border-t border-border">
              <SettingsPreviewItem
                settings={data.settings}
                selected={includeSettings}
                onToggle={onToggleSettings}
              />
            </div>
          )}
        </div>
      )}

      {/* Tasks Section */}
      {data.tasks && data.tasks.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => onToggleSection('tasks')}
            className="w-full flex items-center justify-between p-md bg-background-secondary hover:bg-background-tertiary transition-colors"
          >
            <div className="flex items-center gap-sm">
              <ListTodo size={18} strokeWidth={1.5} className="text-text-secondary" />
              <span className="font-medium text-text-primary">
                任务 ({selectedTasks.size}/{data.tasks.length})
              </span>
            </div>
            {expandedSections.has('tasks') ? (
              <ChevronUp size={18} strokeWidth={1.5} className="text-text-muted" />
            ) : (
              <ChevronDown size={18} strokeWidth={1.5} className="text-text-muted" />
            )}
          </button>
          {expandedSections.has('tasks') && (
            <div className="p-md border-t border-border">
              <div className="flex items-center gap-sm mb-md">
                <button
                  onClick={onSelectAllTasks}
                  className="text-xs text-accent hover:text-accent-dark transition-colors"
                >
                  全选
                </button>
                <span className="text-text-muted">|</span>
                <button
                  onClick={onDeselectAllTasks}
                  className="text-xs text-accent hover:text-accent-dark transition-colors"
                >
                  取消全选
                </button>
              </div>
              <div className="space-y-sm max-h-60 overflow-y-auto">
                {data.tasks.map((task) => (
                  <TaskPreviewItem
                    key={task.id}
                    task={task}
                    selected={selectedTasks.has(task.id)}
                    onToggle={() => onToggleTask(task.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-md pt-md border-t border-border">
        <button
          onClick={onCancel}
          disabled={isImporting}
          className="px-lg py-sm bg-background-tertiary hover:bg-border-light text-text-secondary rounded-md transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          disabled={isImporting || !hasSelectedItems}
          className="flex items-center gap-sm px-lg py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
          ) : (
            <Check size={16} strokeWidth={1.5} />
          )}
          <span>确认导入</span>
        </button>
      </div>
    </div>
  );
}

// Bot Preview Item Component
interface BotPreviewItemProps {
  bot: BotProfile;
  selected: boolean;
  onToggle: () => void;
}

function BotPreviewItem({ bot, selected, onToggle }: BotPreviewItemProps) {
  return (
    <label className="flex items-center gap-md p-sm rounded-md hover:bg-background-tertiary cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="w-4 h-4 text-accent bg-background-secondary border-border rounded focus:ring-accent/50"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{bot.name}</p>
        <p className="text-xs text-text-muted truncate">
          {bot.model.api} / {bot.model.model}
        </p>
      </div>
    </label>
  );
}

// Settings Preview Item Component
interface SettingsPreviewItemProps {
  settings: ServerSettings;
  selected: boolean;
  onToggle: () => void;
}

function SettingsPreviewItem({ settings, selected, onToggle }: SettingsPreviewItemProps) {
  return (
    <label className="flex items-start gap-md p-sm rounded-md hover:bg-background-tertiary cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="w-4 h-4 mt-1 text-accent bg-background-secondary border-border rounded focus:ring-accent/50"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary">服务器设置</p>
        <div className="text-xs text-text-muted space-y-xs mt-xs">
          <p>地址: {settings.host}:{settings.port}</p>
          <p>认证: {settings.auth === 'offline' ? '离线模式' : 'Microsoft 认证'}</p>
          <p>版本: {settings.version}</p>
        </div>
      </div>
    </label>
  );
}

// Task Preview Item Component
interface TaskPreviewItemProps {
  task: Task;
  selected: boolean;
  onToggle: () => void;
}

function TaskPreviewItem({ task, selected, onToggle }: TaskPreviewItemProps) {
  return (
    <label className="flex items-center gap-md p-sm rounded-md hover:bg-background-tertiary cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="w-4 h-4 text-accent bg-background-secondary border-border rounded focus:ring-accent/50"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{task.name}</p>
        <p className="text-xs text-text-muted truncate">
          目标: {task.target} x{task.numberOfTarget}
        </p>
      </div>
    </label>
  );
}
