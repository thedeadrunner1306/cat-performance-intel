'use client';

import React from 'react';
import { Bell, Search, Plus } from 'lucide-react';

interface Props {
  onOpenLog: () => void;
}

export function TopBar({ onOpenLog }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#09090b]/80 px-6 backdrop-blur-xl">
      {/* Left: Page context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search topics, mocks..."
            className="w-48 bg-transparent text-sm text-zinc-300 placeholder-zinc-600 outline-none"
          />
          <kbd className="hidden rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Log Button */}
        <button 
          onClick={onOpenLog}
          className="flex items-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Log Session</span>
        </button>


        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-300">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
            3
          </span>
        </button>

        {/* Avatar */}
        <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-sm font-semibold text-blue-400 ring-1 ring-white/[0.08] transition-all hover:ring-blue-500/30">
          A
        </button>
      </div>
    </header>
  );
}
