import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bot, ArrowLeft, Edit, Play, Square, Brain, RefreshCw } from 'lucide-react';
import { botsApi } from '../api/bots';
import { useBotsStore } from '../stores/botsStore';
import { useBotSubscription } from '../websocket/useWebSocket';
import { MonitorPanel } from '../components/monitor';
import { handleBotStartError, handleBotStopError, handleApiError } from '../lib/errorHandler';
import { getActiveSession, getSessionLogs } from '../api/logs';
import type { BotProfile, BotMemory } from '../../../shared/types';

export function BotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bot, setBot] = useState<BotProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memory, setMemory] = useState<BotMemory | null>(null);
  const [memoryExists, setMemoryExists] = useState(false);
  const [memoryLoading, setMemoryLoading] = useState(false);
  
  const { botStatuses, botLogs, botPositions, botInventories, setBotStatus, setBotLogs, clearBotLogs } = useBotsStore();
  const status = id ? botStatuses[id] : undefined;
  const logs = id ? botLogs[id] || [] : [];
  const position = id ? botPositions[id] || null : null;
  const inventory = id ? botInventories[id] || [] : [];

  // Subscribe to bot updates via WebSocket
  useBotSubscription(id || null);

  useEffect(() => {
    if (id) {
      loadBot(id);
      loadActiveLogs(id);
      loadMemory(id);
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

  const loadActiveLogs = async (botId: string) => {
    try {
      // 尝试加载活跃会话的日志
      const activeSession = await getActiveSession(botId);
      if (activeSession.active && activeSession.sessionId) {
        const { logs: sessionLogs } = await getSessionLogs(activeSession.sessionId);
        // 将历史日志加载到 store 中
        setBotLogs(botId, sessionLogs);
      }
    } catch (err) {
      // 如果没有活跃会话或加载失败，忽略错误
      console.log('No active session logs to load');
    }
  };

  const loadMemory = async (botId: string) => {
    setMemoryLoading(true);
    try {
      const memoryResponse = await botsApi.getMemory(botId);
      setMemory(memoryResponse.memory);
      setMemoryExists(memoryResponse.exists);
    } catch (err) {
      console.error('Failed to load bot memory:', err);
      setMemory(null);
      setMemoryExists(false);
    } finally {
      setMemoryLoading(false);
    }
  };

  const handleRefreshMemory = () => {
    if (id) {
      loadMemory(id);
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

      {/* Memory Section */}
      <div className="bg-background-primary rounded-lg border border-border p-lg shadow-sm">
        <div className="flex items-center justify-between mb-md">
          <div className="flex items-center gap-sm">
            <Brain size={20} strokeWidth={1.5} className="text-text-secondary" />
            <h3 className="text-lg font-medium text-text-primary">机器人记忆</h3>
          </div>
          <button
            onClick={handleRefreshMemory}
            disabled={memoryLoading}
            className="flex items-center gap-sm px-sm py-xs text-sm text-text-secondary hover:text-text-primary border border-border rounded-md hover:border-border-hover transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} strokeWidth={1.5} className={memoryLoading ? 'animate-spin' : ''} />
            <span>刷新</span>
          </button>
        </div>

        {memoryLoading ? (
          <div className="flex items-center justify-center py-lg">
            <div className="text-text-secondary">加载记忆中...</div>
          </div>
        ) : !memoryExists ? (
          <div className="text-center py-lg">
            <Brain size={48} strokeWidth={1} className="text-text-muted mx-auto mb-md" />
            <p className="text-text-muted">该机器人还没有记忆文件</p>
            <p className="text-sm text-text-secondary mt-sm">记忆会在机器人首次运行后生成</p>
          </div>
        ) : memory ? (
          <div className="space-y-lg">
            {/* Memory Summary */}
            <div>
              <h4 className="text-md font-medium text-text-primary mb-sm">记忆摘要</h4>
              {memory.memory ? (
                <div className="bg-background-secondary rounded-md p-md border border-border">
                  <p className="text-text-primary whitespace-pre-wrap">{memory.memory}</p>
                </div>
              ) : (
                <div className="bg-background-secondary rounded-md p-md border border-border">
                  <p className="text-text-muted italic">暂无记忆摘要</p>
                </div>
              )}
            </div>

            {/* Recent Conversations */}
            <div>
              <h4 className="text-md font-medium text-text-primary mb-sm">
                最近对话 ({memory.turns.length} 条)
              </h4>
              {memory.turns.length > 0 ? (
                <div className="space-y-sm max-h-96 overflow-y-auto">
                  {memory.turns.map((turn, index) => (
                    <div
                      key={index}
                      className={`p-md rounded-md border ${
                        turn.role === 'assistant'
                          ? 'bg-accent-light/10 border-accent-light/20'
                          : turn.role === 'user'
                          ? 'bg-blue-500/10 border-blue-500/20'
                          : 'bg-background-secondary border-border'
                      }`}
                    >
                      <div className="flex items-center gap-sm mb-xs">
                        <span
                          className={`text-xs font-medium px-xs py-0.5 rounded ${
                            turn.role === 'assistant'
                              ? 'bg-accent-light text-white'
                              : turn.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-background-tertiary text-text-secondary'
                          }`}
                        >
                          {turn.role === 'assistant' ? '机器人' : turn.role === 'user' ? '用户' : '系统'}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary whitespace-pre-wrap">{turn.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-background-secondary rounded-md p-md border border-border">
                  <p className="text-text-muted italic">暂无对话记录</p>
                </div>
              )}
            </div>

            {/* Memory Statistics */}
            <div>
              <h4 className="text-md font-medium text-text-primary mb-sm">记忆统计</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                <div className="bg-background-secondary rounded-md p-md border border-border">
                  <dt className="text-sm text-text-muted">记忆长度</dt>
                  <dd className="text-lg font-medium text-text-primary">{memory.memory.length} 字符</dd>
                </div>
                <div className="bg-background-secondary rounded-md p-md border border-border">
                  <dt className="text-sm text-text-muted">对话轮数</dt>
                  <dd className="text-lg font-medium text-text-primary">{memory.turns.length} 轮</dd>
                </div>
                <div className="bg-background-secondary rounded-md p-md border border-border">
                  <dt className="text-sm text-text-muted">任务开始时间</dt>
                  <dd className="text-lg font-medium text-text-primary">
                    {memory.taskStart ? new Date(memory.taskStart).toLocaleString('zh-CN') : '未知'}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-lg">
            <p className="text-text-muted">无法加载记忆数据</p>
          </div>
        )}
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
