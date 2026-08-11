'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { QuickLogDrawer } from './quick-log-drawer';
import { useAuth } from '@/lib/context/auth-context';
import { Loader2 } from 'lucide-react';


const LayoutContext = createContext({
  collapsed: false,
  setCollapsed: (collapsed: boolean) => {},
  openLogDrawer: (tab?: 'quant' | 'varc' | 'dilr' | 'mock') => {},
});

export const useLayout = () => useContext(LayoutContext);

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [logDrawerTab, setLogDrawerTab] = useState<'quant' | 'varc' | 'dilr' | 'mock'>('quant');

  // Load from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapsed = (val: boolean) => {
    setCollapsed(val);
    localStorage.setItem('sidebar-collapsed', String(val));
  };

  const openLogDrawer = (tab: 'quant' | 'varc' | 'dilr' | 'mock' = 'quant') => {
    setLogDrawerTab(tab);
    setLogDrawerOpen(true);
  };

  const isPublicRoute = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname || '');

  // Handle protected route redirect
  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.replace('/login');
    }
  }, [loading, user, isPublicRoute, router]);

  // Loading boot screen
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b]">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="text-xs text-zinc-550 font-mono tracking-widest uppercase">Initializing Core Intel...</p>
        </div>
      </div>
    );
  }

  // Render public routes without shell layout wrapping
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If not authenticated and on a private route, return empty placeholder during redirect
  if (!user) {
    return null;
  }

  return (
    <LayoutContext.Provider value={{ collapsed, setCollapsed: toggleCollapsed, openLogDrawer }}>
      <div className="flex min-h-screen bg-[#09090b]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content container */}
        <main
          className={`flex-1 min-h-screen transition-all duration-300 ${
            collapsed ? 'ml-[68px]' : 'ml-[240px]'
          }`}
        >
          <TopBar onOpenLog={() => openLogDrawer('quant')} />
          {children}
        </main>
      </div>

      {/* Quick Log Drawer */}
      <QuickLogDrawer isOpen={logDrawerOpen} defaultTab={logDrawerTab} onClose={() => setLogDrawerOpen(false)} />
    </LayoutContext.Provider>
  );
}
