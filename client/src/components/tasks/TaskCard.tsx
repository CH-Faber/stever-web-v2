import { Play, Trash2, Target, Clock, Package } from 'lucide-react';
import type { Task } from '../../../../shared/types';

interface TaskCardProps {
  task: Task;
  onStart: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function TaskCard({ task, onStart, onDelete, isDeleting }: TaskCardProps) {
  const handleStartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStart();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  // Format timeout to human readable
  const formatTimeout = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    return `${Math.floor(seconds / 3600)}小时`;
  };

  return (
    <div className="bg-background-primary rounded-lg border border-border p-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-md">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-md bg-accent-light flex items-center justify-center">
            <Target size={20} strokeWidth={1.5} className="text-accent" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{task.name}</h3>
            <p className="text-sm text-text-muted">{task.type === 'techtree' ? '科技树' : '建造'}</p>
          </div>
        </div>
      </div>

      {/* Task Details */}
      <div className="space-y-sm mb-md">
        <p className="text-sm text-text-secondary line-clamp-2">{task.goal}</p>
        
        <div className="flex flex-wrap gap-md text-xs text-text-muted">
          <div className="flex items-center gap-xs">
            <Package size={14} strokeWidth={1.5} />
            <span>{task.target} x{task.numberOfTarget}</span>
          </div>
          <div className="flex items-center gap-xs">
            <Clock size={14} strokeWidth={1.5} />
            <span>{formatTimeout(task.timeout)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-xs">
        <button
          onClick={handleStartClick}
          className="flex items-center gap-xs px-sm py-xs text-sm bg-accent-light hover:bg-accent text-accent hover:text-white rounded-md transition-colors"
          title="启动任务"
        >
          <Play size={14} strokeWidth={1.5} />
          <span>启动</span>
        </button>
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="flex items-center gap-xs px-sm py-xs text-sm bg-status-error/10 hover:bg-status-error text-status-error hover:text-white rounded-md transition-colors disabled:opacity-50"
          title="删除任务"
        >
          <Trash2 size={14} strokeWidth={1.5} />
          <span>删除</span>
        </button>
      </div>
    </div>
  );
}
