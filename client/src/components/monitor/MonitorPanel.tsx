import { Activity } from 'lucide-react';
import { LogViewer } from './LogViewer';
import { PositionDisplay } from './PositionDisplay';
import { InventoryDisplay } from './InventoryDisplay';
import type { LogEntry, Position, InventoryItem } from '../../../../shared/types';

interface MonitorPanelProps {
  botId: string;
  botName: string;
  logs: LogEntry[];
  position: Position | null;
  inventory: InventoryItem[];
  onClearLogs?: () => void;
}

export function MonitorPanel({
  botName,
  logs,
  position,
  inventory,
  onClearLogs,
}: MonitorPanelProps) {
  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex items-center gap-sm">
        <Activity size={20} strokeWidth={1.5} className="text-text-secondary" />
        <h2 className="text-lg font-medium text-text-primary">
          {botName} - 实时监控
        </h2>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <PositionDisplay position={position} />
        <InventoryDisplay inventory={inventory} />
      </div>

      {/* Log Viewer */}
      <div className="bg-background-primary rounded-lg border border-border overflow-hidden">
        <div className="relative" style={{ height: '400px' }}>
          <LogViewer 
            logs={logs} 
            onClear={onClearLogs}
            maxHeight="400px"
          />
        </div>
      </div>
    </div>
  );
}
