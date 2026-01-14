import { Bot, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-background-primary border-b border-border flex items-center px-lg">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-sm mr-md text-text-secondary hover:text-text-primary"
        aria-label="Toggle menu"
      >
        <Menu size={24} strokeWidth={1.5} />
      </button>
      
      <div className="flex items-center gap-md">
        <Bot size={28} strokeWidth={1.5} className="text-accent" />
        <h1 className="text-xl font-semibold text-text-primary">Mindcraft Dashboard</h1>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-md">
        <span className="text-sm text-text-secondary">v1.0.0</span>
      </div>
    </header>
  );
}
