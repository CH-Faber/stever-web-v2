import { MapPin } from 'lucide-react';
import type { Position } from '../../../../shared/types';

interface PositionDisplayProps {
  position: Position | null;
}

export function PositionDisplay({ position }: PositionDisplayProps) {
  return (
    <div className="bg-background-primary rounded-lg border border-border p-md">
      <div className="flex items-center gap-sm mb-md">
        <MapPin size={18} strokeWidth={1.5} className="text-text-secondary" />
        <h3 className="font-medium text-text-primary">位置</h3>
      </div>
      
      {position ? (
        <div className="grid grid-cols-3 gap-md">
          <CoordinateItem label="X" value={position.x} color="text-status-error" />
          <CoordinateItem label="Y" value={position.y} color="text-status-online" />
          <CoordinateItem label="Z" value={position.z} color="text-accent" />
        </div>
      ) : (
        <div className="text-center py-md text-text-muted text-sm">
          暂无位置数据
        </div>
      )}
    </div>
  );
}

interface CoordinateItemProps {
  label: string;
  value: number;
  color: string;
}

function CoordinateItem({ label, value, color }: CoordinateItemProps) {
  return (
    <div className="text-center">
      <div className={`text-xs font-medium ${color} mb-xs`}>{label}</div>
      <div className="font-mono text-lg text-text-primary">
        {Math.round(value * 10) / 10}
      </div>
    </div>
  );
}
