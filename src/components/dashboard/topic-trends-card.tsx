'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TopicTrend } from '@/lib/analytics/types';

interface Props {
  topics: TopicTrend[];
  type: 'strengthening' | 'weakening';
}

export function TopicTrendsCard({ topics, type }: Props) {
  const isImproving = type === 'strengthening';
  const title = isImproving ? 'Improving Topics' : 'Declining Topics';
  const subtitle = isImproving ? 'Direct accuracy gain (last 30 days)' : 'Direct accuracy drop (last 30 days)';
  const accentColor = isImproving ? 'emerald' : 'rose';

  if (topics.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{title}</p>
        <p className="mt-4 text-sm text-zinc-600">Not enough data to calculate trends (last 30 days)</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{title}</p>
          <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
        </div>
        {isImproving ? (
          <TrendingUp className="h-5 w-5 text-emerald-400/80" />
        ) : (
          <TrendingDown className="h-5 w-5 text-rose-400/80" />
        )}
      </div>

      <div className="mt-5 space-y-3">
        {topics.map((topic, i) => {
          const href = `/${topic.section.toLowerCase()}?topic=${encodeURIComponent(topic.topicLabel)}`;
          return (
            <Link
              key={topic.topicId}
              href={href}
              className="flex items-center justify-between rounded-lg border border-white/[0.03] bg-white/[0.01] px-4 py-3 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-white/[0.04] text-[10px] font-mono text-zinc-500">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-200 group-hover:text-white">{topic.topicLabel}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-mono">{topic.section} · {topic.metric}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                    isImproving
                      ? 'bg-emerald-450/10 text-emerald-400'
                      : 'bg-rose-450/10 text-rose-400'
                  }`}
                >
                  {topic.delta > 0 ? '+' : ''}{topic.delta}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
