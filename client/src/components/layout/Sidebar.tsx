import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Key, 
  Settings, 
  ListTodo,
  Download,
  Cpu,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: '仪表盘' },
  { to: '/tasks', icon: <ListTodo size={20} strokeWidth={1.5} />, label: '任务管理' },
  { to: '/model-presets', icon: <Cpu size={20} strokeWidth={1.5} />, label: '模型预设' },
  { to: '/keys', icon: <Key size={20} strokeWidth={1.5} />, label: '密钥管理' },
  { to: '/settings', icon: <Settings size={20} strokeWidth={1.5} />, label: '服务器设置' },
  { to: '/import-export', icon: <Download size={20} strokeWidth={1.5} />, label: '导入导出' },
];

export function Sidebar() {
  return (
    <aside className="w-60 bg-background-primary border-r border-border h-full flex flex-col">
      <nav className="flex-1 p-md">
        <ul className="space-y-sm">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-md px-md py-sm rounded-md transition-colors',
                    'text-text-secondary hover:text-text-primary hover:bg-background-tertiary',
                    isActive && 'bg-accent-light text-accent-dark font-medium'
                  )
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
