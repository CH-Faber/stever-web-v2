import { Package } from 'lucide-react';
import type { InventoryItem } from '../../../../shared/types';

interface InventoryDisplayProps {
  inventory: InventoryItem[];
}

export function InventoryDisplay({ inventory }: InventoryDisplayProps) {
  // Group items by name and sum counts
  const groupedItems = inventory.reduce((acc, item) => {
    const existing = acc.find(i => i.name === item.name);
    if (existing) {
      existing.count += item.count;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as InventoryItem[]);

  // Sort by count descending
  const sortedItems = groupedItems.sort((a, b) => b.count - a.count);

  return (
    <div className="bg-background-primary rounded-lg border border-border p-md">
      <div className="flex items-center justify-between mb-md">
        <div className="flex items-center gap-sm">
          <Package size={18} strokeWidth={1.5} className="text-text-secondary" />
          <h3 className="font-medium text-text-primary">物品栏</h3>
        </div>
        <span className="text-sm text-text-muted">
          {sortedItems.length} 种物品
        </span>
      </div>
      
      {sortedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-sm max-h-48 overflow-y-auto">
          {sortedItems.map((item, index) => (
            <InventoryItemCard key={`${item.name}-${index}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-md text-text-muted text-sm">
          物品栏为空
        </div>
      )}
    </div>
  );
}

interface InventoryItemCardProps {
  item: InventoryItem;
}

function InventoryItemCard({ item }: InventoryItemCardProps) {
  // Format item name: minecraft:diamond_sword -> Diamond Sword
  const formatItemName = (name: string) => {
    const cleanName = name.replace('minecraft:', '');
    return cleanName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex items-center gap-sm p-sm bg-background-tertiary rounded-md">
      <div className="w-8 h-8 bg-background-secondary rounded flex items-center justify-center text-xs font-mono text-text-muted">
        {item.count}
      </div>
      <span className="text-sm text-text-primary truncate" title={item.name}>
        {formatItemName(item.name)}
      </span>
    </div>
  );
}
