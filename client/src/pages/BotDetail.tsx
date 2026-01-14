import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bot, ArrowLeft, Edit, Play, Square } from 'lucide-react';
import { botsApi } from '../api/bots';
import { useBotsStore } from '../stores/botsStore';
import { useBotSubscription } from '../websocket/useWebSocket';
import { MonitorPanel } from '../components/monitor';
import { handleBotStartError, handleBotStopError, handleApiError } from '../lib/errorHandler';
import type { BotProfile } from '../../../shared/types';

export function BotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bot, setBot] = useState<BotProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { botStatuses, botLogs, botPositions, botInventories, setBotStatus, clearBotLogs } = useBotsStore();
  const status = id ? botStatuses[id] : undefined;
  const logs = id ? botLogs[id] || [] : [];
  const position = id ? botPositions[id] || null : null;
  const inventory = id ? botInventories[id] || [] : [];

  // Subscribe to bot updates via WebSocket
  useBotSubscription(id || null);

  useEffect(() => {
    if (id) {
      loadBot(id);
    }
  }, [id]);

  const loadBot = async (botId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const botData = await botsApi.getById(botId);
      setBot(botData);
      // Also fetch status
      try {
        const statusResponse = await botsApi.getStatus(botId);
        setBotStatus(botId, statusResponse.status);
      } catch {
        setBotStatus(botId, { status: 'offline' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载机器人失败';
      setError(message);
      handleApiError(err, '加载机器人');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!id || !bot) return;
    try {
      setBotStatus(id, { status: 'starting' });
      const response = await botsApi.start(id);
      setBotStatus(id, response.status);
    } catch (err) {
      handleBotStartError(err, bot.name);
      setBotStatus(id, { 
        status: 'error', 
        error: err instanceof Error ? err.message : '启动失败' 
      });
    }
  };

  const handleStop = async () => {
    if (!id || !bot) return;
    try {
      setBotStatus(id, { status: 'stopping' });
      const response = await botsApi.stop(id);
      setBotStatus(id, response.status);
    } catch (err) {
      handleBotStopError(err, bot.name);
      setBotStatus(id, { 
        status: 'error', 
        error: err instanceof Error ? err.message : '停止失败' 
      });
    }
  };

  const isRunning = status?.status === 'online' || status?.status === 'starting';
  const isTransitioning = status?.status === 'starting' || status?.status === 'stopping';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">加载中...</div>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="space-y-lg">
        <div className="flex items-center gap-md">
          <Link 
            to="/" 
            className="p-sm rounded-md hover:bg-background-tertiary text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Link>
          <Bot size={24} strokeWidth={1.5} className="text-text-secondary" />
          <h2 className="text-2xl font-semibold text-text-primary">机器人详情</h2>
        </div>
        <div className="bg-status-error/10 border border-status-error/20 rounded-md p-md">
          <p className="text-sm text-status-error">{error || '机器人不存在'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-md">
          <Link 
            to="/" 
            className="p-sm rounded-md hover:bg-background-tertiary text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Link>
          <Bot size={24} strokeWidth={1.5} className="text-text-secondary" />
          <h2 className="text-2xl font-semibold text-text-primary">{bot.name}</h2>
        </div>
        <div className="flex items-center gap-sm">
          {isRunning ? (
            <button
              onClick={handleStop}
              disabled={isTransitioning}
              className="flex items-center gap-sm px-md py-sm border border-border rounded-md text-text-secondary hover:text-status-error hover:border-status-error transition-colors disabled:opacity-50"
            >
              <Square size={18} strokeWidth={1.5} />
              <span>停止</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isTransitioning}
              className="flex items-center gap-sm px-md py-sm bg-accent-light hover:bg-accent text-accent hover:text-white rounded-md transition-colors disabled:opacity-50"
            >
              <Play size={18} strokeWidth={1.5} />
              <span>启动</span>
            </button>
          )}
          <button
            onClick={() => navigate(`/bots/${id}/edit`)}
            className="flex items-center gap-sm px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors"
          >
            <Edit size={18} strokeWidth={1.5} />
            <span>编辑</span>
          </button>
        </div>
      </div>
      
      <div className="bg-background-primary rounded-lg border border-border p-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-md">基本信息</h3>
            <dl className="space-y-sm">
              <div>
                <dt className="text-sm text-text-muted">名称</dt>
                <dd className="text-text-primary">{bot.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">ID</dt>
                <dd className="text-text-primary font-mono text-sm">{bot.id}</dd>
              </div>
            </dl>
          </div>

          {/* Model Info */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-md">模型配置</h3>
            <dl className="space-y-sm">
              <div>
                <dt className="text-sm text-text-muted">主模型</dt>
                <dd className="text-text-primary">{bot.model.api} / {bot.model.model}</dd>
              </div>
              {bot.codeModel && (
                <div>
                  <dt className="text-sm text-text-muted">代码模型</dt>
                  <dd className="text-text-primary">{bot.codeModel.api} / {bot.codeModel.model}</dd>
                </div>
              )}
              {bot.visionModel && (
                <div>
                  <dt className="text-sm text-text-muted">视觉模型</dt>
                  <dd className="text-text-primary">{bot.visionModel.api} / {bot.visionModel.model}</dd>
                </div>
              )}
              {bot.embedding && (
                <div>
                  <dt className="text-sm text-text-muted">嵌入模型</dt>
                  <dd className="text-text-primary">{bot.embedding.api} / {bot.embedding.model}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Monitor Panel - Show when bot is running */}
      {(isRunning || logs.length > 0) && (
        <MonitorPanel
          botId={id!}
          botName={bot.name}
          logs={logs}
          position={position}
          inventory={inventory}
          onClearLogs={() => clearBotLogs(id!)}
        />
      )}
    </div>
  );
}
