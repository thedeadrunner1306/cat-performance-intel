'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import type { ScoreLeakage } from '@/lib/analytics/types';

interface Props {
  leakages: ScoreLeakage[];
}

export function ScoreLeakageCard({ leakages }: Props) {
  if (leakages.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Marks Lost</p>
        <p className="mt-4 text-sm text-zinc-600">No score leakage detected in recent mocks</p>
      </div>
    );
  }

  const totalLost = leakages.reduce((sum, item) => sum + item.lostMarks, 0);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Marks Lost</p>
          <p className="mt-0.5 text-xs text-zinc-400">Score leakage in last 5 mocks (Opportunity Cost: Wrong Qs × 4)</p>
        </div>
        <div className="flex items-center gap-2 rounded bg-rose-500/10 px-2.5 py-1">
          <AlertTriangle className="h-4 w-4 text-rose-450" />
          <span className="text-sm font-mono font-bold text-rose-450">−{totalLost} Marks</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-5 space-y-3">
        {leakages.slice(0, 6).map((leak) => {
          const href = `/${leak.section.toLowerCase()}?topic=${encodeURIComponent(leak.topicLabel)}`;
          return (
            <Link
              key={leak.topicLabel}
              href={href}
              className="flex items-center justify-between rounded-lg border border-white/[0.03] bg-white/[0.01] px-4 py-3 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-rose-500/70" />
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{leak.topicLabel}</p>
                  <p className="text-[10px] text-zinc-550 uppercase font-mono">{leak.section}</p>
                </div>
              </div>
              <span className="text-sm font-mono font-bold text-rose-450">−{leak.lostMarks} Marks</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
