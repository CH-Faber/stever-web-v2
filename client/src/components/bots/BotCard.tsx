import { Play, Square, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BotProfile, BotStatus, BotStatusType } from '../../../../shared/types';

interface BotCardProps {
  bot: BotProfile;
  status: BotStatus;
  onStart: () => void;
  onStop: () => void;
}

const statusConfig: Record<BotStatusType, { label: string; color: string; dotColor: string }> = {
  online: { label: '在线', color: 'text-status-online', dotColor: 'bg-status-online' },
  starting: { label: '启动中', color: 'text-status-warning', dotColor: 'bg-status-warning' },
  stopping: { label: '停止中', color: 'text-status-warning', dotColor: 'bg-status-warning' },
  offline: { label: '离线', color: 'text-status-offline', dotColor: 'bg-status-offline' },
  error: { label: '错误', color: 'text-status-error', dotColor: 'bg-status-error' },
};

export function BotCard({ bot, status, onStart, onStop }: BotCardProps) {
  const navigate = useNavigate();
  const statusInfo = statusConfig[status.status];
  const isRunning = status.status === 'online' || status.status === 'starting';
  const isTransitioning = status.status === 'starting' || status.status === 'stopping';

  const handleCardClick = () => {
    navigate(`/bots/${bot.id}`);
  };

  const handleStartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStart();
  };

  const handleStopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStop();
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-background-primary rounded-lg border border-border p-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-md">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-md bg-background-tertiary flex items-center justify-center">
            <Bot size={20} strokeWidth={1.5} className="text-text-secondary" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{bot.name}</h3>
            <p className="text-sm text-text-muted">{bot.model.api} / {bot.model.model}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-xs">
          <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} ${isTransitioning ? 'animate-pulse' : ''}`} />
          <span className={`text-sm ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>

        <div className="flex gap-xs">
          {isRunning ? (
            <button
              onClick={handleStopClick}
              disabled={isTransitioning}
              className="p-sm rounded-md bg-background-tertiary hover:bg-border-light text-text-secondary hover:text-status-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="停止机器人"
            >
              <Square size={16} strokeWidth={1.5} />
            </button>
          ) : (
            <button
              onClick={handleStartClick}
              disabled={isTransitioning}
              className="p-sm rounded-md bg-accent-light hover:bg-accent text-accent hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="启动机器人"
            >
              <Play size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
