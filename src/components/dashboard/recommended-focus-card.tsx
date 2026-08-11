'use client';

import React from 'react';
import Link from 'next/link';
import { Target, ArrowUpRight } from 'lucide-react';
import type { FocusRecommendation } from '@/lib/analytics/types';

interface Props {
  recommendations: FocusRecommendation[];
}

export function RecommendedFocusCard({ recommendations }: Props) {
  if (recommendations.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Highest Opportunity Topics</p>
        <p className="mt-4 text-sm text-zinc-600">No critical focus opportunities calculated yet. Keep logging practice or mock sets.</p>
      </div>
    );
  }

  const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
    Critical: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    High: { bg: 'bg-amber-500/10', text: 'text-amber-450', border: 'border-amber-500/20' },
    Medium: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Highest Opportunity Topics
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">Ranked by potential score gain in mocks</p>
        </div>
        <Target className="h-5 w-5 text-zinc-500" />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {recommendations.map((rec) => {
          const colors = priorityColors[rec.priority] || priorityColors.Medium;
          const href = `/${rec.section.toLowerCase()}?topic=${encodeURIComponent(rec.topicLabel)}`;

          return (
            <Link
              key={rec.topicLabel}
              href={href}
              className={`group flex flex-col justify-between rounded-lg border ${colors.border} bg-white/[0.01] p-4 transition-all hover:bg-zinc-900 hover:border-zinc-700`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                    {rec.priority}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-655 transition-colors group-hover:text-white" />
                </div>

                <h3 className="mt-3 text-base font-bold text-white tracking-tight">{rec.topicLabel}</h3>
                <p className="text-[10px] font-mono text-zinc-550 uppercase">{rec.section}</p>

                <div className="mt-4 space-y-1.5 border-t border-white/[0.03] pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Current Accuracy</span>
                    <span className="font-mono text-zinc-200 font-semibold">{rec.currentAccuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Mock Frequency</span>
                    <span className="font-mono text-zinc-200 font-semibold">{rec.mockFrequency} mocks</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded bg-emerald-500/10 px-3 py-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Potential Gain</span>
                <span className="font-mono text-sm font-bold text-emerald-400">+{rec.expectedGain} Marks</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
