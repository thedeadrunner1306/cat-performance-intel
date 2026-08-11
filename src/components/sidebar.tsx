'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayout } from './layout-shell';
import { useAuth } from '@/lib/context/auth-context';
import { useAppData } from '@/lib/data/app-data-context';
import {
  LayoutDashboard,
  FileBarChart,
  BookOpen,
  BarChart3,
  Calculator,
  Lightbulb,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mocks', label: 'Mocks', icon: FileBarChart },
  { href: '/varc', label: 'VARC', icon: BookOpen },
  { href: '/dilr', label: 'DILR', icon: BarChart3 },
  { href: '/quant', label: 'Quant', icon: Calculator },
  { href: '/insights', label: 'Insights Lab', icon: Lightbulb },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useLayout();
  const { profile, logout } = useAuth();
  const { mocks } = useAppData();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen border-r border-white/[0.06] bg-[#0c0c0f] transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-white tracking-tight">CAT Intel</span>
            <span className="text-[10px] text-zinc-550 uppercase tracking-widest">Performance</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 mt-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                  isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-400'
                }`}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.08] bg-[#0c0c0f] text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Bottom Profile and Settings Section */}
      {!collapsed && (
        <div className="absolute bottom-4 left-3 right-3 space-y-2">
          {/* Target Percentile card */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-3 text-xs">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-550">
              Exam Settings
            </p>
            <div className="mt-2 flex justify-between">
              <span className="text-zinc-500">Target</span>
              <span className="font-semibold text-white">{profile?.target_percentile || 99} %ile</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-zinc-500">Mocks Logged</span>
              <span className="font-semibold text-white">{mocks.length} tests</span>
            </div>
          </div>

          {/* User Signout Row */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate">{profile?.full_name || 'Aspirant'}</p>
              <p className="text-[9px] text-zinc-500 truncate">{profile?.email || '—'}</p>
            </div>
            <button
              onClick={() => logout()}
              className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              title="Logout session"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
