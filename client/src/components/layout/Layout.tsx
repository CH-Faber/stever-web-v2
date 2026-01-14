import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '../../lib/utils';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-secondary flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:transform-none',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
          style={{ top: '64px' }}
        >
          <Sidebar />
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-lg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
