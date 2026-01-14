import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { AlertCircle, AlertTriangle, Info, Filter, Trash2 } from 'lucide-react';
import type { LogEntry, LogLevel } from '../../../../shared/types';

interface LogViewerProps {
  logs: LogEntry[];
  onClear?: () => void;
  maxHeight?: string;
}

const LOG_LEVEL_CONFIG: Record<LogLevel, { 
  icon: typeof Info; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  info: { 
    icon: Info, 
    color: 'text-text-secondary', 
    bgColor: 'bg-background-tertiary',
    label: '信息'
  },
  warn: { 
    icon: AlertTriangle, 
    color: 'text-status-warning', 
    bgColor: 'bg-status-warning/10',
    label: '警告'
  },
  error: { 
    icon: AlertCircle, 
    color: 'text-status-error', 
    bgColor: 'bg-status-error/10',
    label: '错误'
  },
};

const FILTER_OPTIONS: { value: LogLevel | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'info', label: '信息' },
  { value: 'warn', label: '警告' },
  { value: 'error', label: '错误' },
];

export function LogViewer({ logs, onClear, maxHeight = '400px' }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);

  // Filter logs based on selected level
  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    return logs.filter(log => log.level === filter);
  }, [logs, filter]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-md py-sm border-b border-border bg-background-secondary">
        <div className="flex items-center gap-sm">
          <Filter size={16} strokeWidth={1.5} className="text-text-muted" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogLevel | 'all')}
            className="text-sm bg-background-primary border border-border rounded-sm px-sm py-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {FILTER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-text-muted">
            {filteredLogs.length} 条日志
          </span>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-xs text-sm text-text-secondary hover:text-status-error transition-colors"
          >
            <Trash2 size={14} strokeWidth={1.5} />
            <span>清空</span>
          </button>
        )}
      </div>

      {/* Log List with Virtual Scrolling */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-sm"
        style={{ maxHeight }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-text-muted">
            暂无日志
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {filteredLogs.map((log, index) => (
              <LogItem key={index} log={log} />
            ))}
          </div>
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && filteredLogs.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }}
          className="absolute bottom-4 right-4 px-sm py-xs bg-accent text-white text-xs rounded-md shadow-md hover:bg-accent-dark transition-colors"
        >
          滚动到底部
        </button>
      )}
    </div>
  );
}

interface LogItemProps {
  log: LogEntry;
}

function LogItem({ log }: LogItemProps) {
  const config = LOG_LEVEL_CONFIG[log.level];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-sm px-md py-sm ${config.bgColor}`}>
      <Icon size={14} strokeWidth={1.5} className={`${config.color} mt-0.5 flex-shrink-0`} />
      <span className="text-text-muted flex-shrink-0 w-16">
        {formatTimestamp(log.timestamp)}
      </span>
      <span className="text-text-muted flex-shrink-0 w-20 truncate" title={log.source}>
        [{log.source}]
      </span>
      <span className={`flex-1 break-all ${log.level === 'error' ? 'text-status-error font-medium' : 'text-text-primary'}`}>
        {log.message}
      </span>
    </div>
  );
}

function formatTimestamp(timestamp: Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Export utility functions for testing
export function filterLogs(logs: LogEntry[], level: LogLevel | 'all'): LogEntry[] {
  if (level === 'all') return logs;
  return logs.filter(log => log.level === level);
}

export function isErrorLog(log: LogEntry): boolean {
  return log.level === 'error';
}
