'use client';

import React from 'react';
import { Target, TrendingUp, TrendingDown, Calendar, Database, Clock } from 'lucide-react';
import type { SnapshotMetrics } from '@/lib/analytics/types';

interface Props {
  metrics: SnapshotMetrics;
}

export function PerformanceCommand({ metrics }: Props) {
  const {
    recentMockScore,
    recentTrend,
    daysStudied,
    questionsSolvedThisMonth,
    hoursInvestedThisMonth,
  } = metrics;

  const trendColor = recentTrend > 0
    ? 'text-emerald-400'
    : recentTrend < 0
    ? 'text-rose-400'
    : 'text-zinc-400';

  const trendBg = recentTrend > 0
    ? 'bg-emerald-500/10'
    : recentTrend < 0
    ? 'bg-rose-500/10'
    : 'bg-zinc-500/10';

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-zinc-900 to-black p-6 shadow-xl">
      {/* Bloomberg-style neon thin top line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />

      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Core Snapshot
        </p>
        <h2 className="text-lg font-bold text-white tracking-tight">Active Preparation Intelligence</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {/* Metric 1: Recent Mock Score */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <Target className="h-4 w-4 text-zinc-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Recent Mock</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">{recentMockScore}</span>
            <span className="ml-1 text-xs text-zinc-500">pts</span>
          </div>
        </div>

        {/* Metric 2: Recent Trend */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            {recentTrend > 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : recentTrend < 0 ? (
              <TrendingDown className="h-4 w-4 text-rose-400" />
            ) : (
              <Target className="h-4 w-4 text-zinc-400" />
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wider">Recent Trend</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-3xl font-bold tracking-tight ${trendColor}`}>
              {recentTrend > 0 ? `+${recentTrend}` : recentTrend}
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${trendBg} ${trendColor}`}>
              {recentTrend > 0 ? 'UP' : recentTrend < 0 ? 'DOWN' : 'FLAT'}
            </span>
          </div>
        </div>

        {/* Metric 3: Days Studied */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Days Studied</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">{daysStudied}</span>
            <span className="ml-1 text-xs text-zinc-500">days</span>
          </div>
        </div>

        {/* Metric 4: Questions Solved This Month */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <Database className="h-4 w-4 text-zinc-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Solved (Month)</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">{questionsSolvedThisMonth}</span>
            <span className="ml-1 text-xs text-zinc-500">qs</span>
          </div>
        </div>

        {/* Metric 5: Hours Invested This Month */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Hours (Month)</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">{hoursInvestedThisMonth}</span>
            <span className="ml-1 text-xs text-zinc-500">hrs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
