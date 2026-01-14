import { useEffect, useState } from 'react';
import { LayoutDashboard, Plus, Activity, CircleOff, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BotCard } from '../components/bots';
import { useBotsStore } from '../stores/botsStore';
import { botsApi } from '../api/bots';
import { toast } from '../components/Toast';
import { handleApiError, handleBotStartError, handleBotStopError } from '../lib/errorHandler';

export function Dashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    bots, 
    setBots, 
    botStatuses, 
    setBotStatus,
    getActiveCount, 
    getInactiveCount 
  } = useBotsStore();

  const fetchBots = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const botsData = await botsApi.getAll();
      setBots(botsData);
      
      // Fetch status for each bot
      for (const bot of botsData) {
        try {
          const statusResponse = await botsApi.getStatus(bot.id);
          setBotStatus(bot.id, statusResponse.status);
        } catch {
          setBotStatus(bot.id, { status: 'offline' });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载机器人列表失败';
      setError(message);
      handleApiError(err, '加载机器人列表');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const handleStartBot = async (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    const botName = bot?.name || botId;
    
    try {
      setBotStatus(botId, { status: 'starting' });
      const response = await botsApi.start(botId);
      setBotStatus(botId, response.status);
      toast.success('启动成功', `机器人 "${botName}" 正在启动`);
    } catch (err) {
      handleBotStartError(err, botName);
      const errorMessage = err instanceof Error ? err.message : '启动失败';
      setBotStatus(botId, { status: 'error', error: errorMessage });
    }
  };

  const handleStopBot = async (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    const botName = bot?.name || botId;
    
    try {
      setBotStatus(botId, { status: 'stopping' });
      const response = await botsApi.stop(botId);
      setBotStatus(botId, response.status);
      toast.success('停止成功', `机器人 "${botName}" 已停止`);
    } catch (err) {
      handleBotStopError(err, botName);
      const errorMessage = err instanceof Error ? err.message : '停止失败';
      setBotStatus(botId, { status: 'error', error: errorMessage });
    }
  };

  const handleCreateBot = () => {
    navigate('/bots/new');
  };

  const activeCount = getActiveCount();
  const inactiveCount = getInactiveCount();

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-md">
          <LayoutDashboard size={24} strokeWidth={1.5} className="text-text-secondary" />
          <h2 className="text-2xl font-semibold text-text-primary">仪表盘</h2>
        </div>
        <button
          onClick={handleCreateBot}
          className="flex items-center gap-sm px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors"
        >
          <Plus size={18} strokeWidth={1.5} />
          <span>创建机器人</span>
        </button>
      </div>

      {/* Status Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
        <div className="bg-background-primary rounded-lg border border-border p-lg shadow-sm">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-md bg-status-online/10 flex items-center justify-center">
              <Activity size={20} strokeWidth={1.5} className="text-status-online" />
            </div>
            <div>
              <p className="text-sm text-text-muted">活跃机器人</p>
              <p className="text-2xl font-semibold text-text-primary">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-background-primary rounded-lg border border-border p-lg shadow-sm">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-md bg-status-offline/10 flex items-center justify-center">
              <CircleOff size={20} strokeWidth={1.5} className="text-status-offline" />
            </div>
            <div>
              <p className="text-sm text-text-muted">非活跃机器人</p>
              <p className="text-2xl font-semibold text-text-primary">{inactiveCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-background-primary rounded-lg border border-border p-lg shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-md bg-accent-light flex items-center justify-center">
              <LayoutDashboard size={20} strokeWidth={1.5} className="text-accent" />
            </div>
            <div>
              <p className="text-sm text-text-muted">总计</p>
              <p className="text-2xl font-semibold text-text-primary">{bots.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-md">
          <h3 className="text-lg font-medium text-text-primary">机器人列表</h3>
          <button
            onClick={fetchBots}
            disabled={isLoading}
            className="flex items-center gap-xs text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} strokeWidth={1.5} className={isLoading ? 'animate-spin' : ''} />
            <span>刷新</span>
          </button>
        </div>

        {error && (
          <div className="bg-status-error/10 border border-status-error/20 rounded-md p-md mb-md">
            <p className="text-sm text-status-error">{error}</p>
          </div>
        )}

        {isLoading && bots.length === 0 ? (
          <div className="bg-background-primary rounded-lg border border-border p-xl shadow-sm">
            <div className="flex flex-col items-center justify-center text-center">
              <RefreshCw size={32} strokeWidth={1.5} className="text-text-muted animate-spin mb-md" />
              <p className="text-text-secondary">加载中...</p>
            </div>
          </div>
        ) : bots.length === 0 ? (
          <div className="bg-background-primary rounded-lg border border-border p-xl shadow-sm">
            <div className="flex flex-col items-center justify-center text-center">
              <LayoutDashboard size={48} strokeWidth={1} className="text-text-muted mb-md" />
              <h4 className="text-lg font-medium text-text-primary mb-sm">暂无机器人</h4>
              <p className="text-text-secondary mb-lg">点击上方按钮创建您的第一个机器人</p>
              <button
                onClick={handleCreateBot}
                className="flex items-center gap-sm px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors"
              >
                <Plus size={18} strokeWidth={1.5} />
                <span>创建机器人</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
            {bots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                status={botStatuses[bot.id] || { status: 'offline' }}
                onStart={() => handleStartBot(bot.id)}
                onStop={() => handleStopBot(bot.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
