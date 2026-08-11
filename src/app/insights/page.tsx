'use client';

import React, { useMemo } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Zap,
  Timer,
  BarChart3,
  Info,
} from 'lucide-react';
import { useAppData } from '@/lib/data/app-data-context';
import { generateInsights } from '@/lib/analytics/insights-engine';
import type { Insight } from '@/lib/analytics/types';

const severityConfig: Record<string, { bg: string; border: string; icon: typeof AlertTriangle; color: string }> = {
  critical: { bg: 'bg-rose-400/5', border: 'border-rose-400/20', icon: AlertTriangle, color: 'text-rose-400' },
  warning: { bg: 'bg-amber-400/5', border: 'border-amber-400/20', icon: AlertTriangle, color: 'text-amber-400' },
  positive: { bg: 'bg-emerald-400/5', border: 'border-emerald-400/20', icon: TrendingUp, color: 'text-emerald-400' },
  info: { bg: 'bg-blue-400/5', border: 'border-blue-400/20', icon: Info, color: 'text-blue-400' },
};

const typeIcons: Record<string, typeof Lightbulb> = {
  'effort-mismatch': BarChart3,
  'cross-section': Zap,
  'streak': TrendingUp,
  'fastest-improving': TrendingUp,
  'time-allocation': Timer,
  'pattern': Lightbulb,
};

function InsightCard({ insight }: { insight: Insight }) {
  const config = severityConfig[insight.severity] || severityConfig.info;
  const TypeIcon = typeIcons[insight.type] || Lightbulb;

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-6 transition-all hover:bg-opacity-10`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg} border ${config.border}`}>
          <TypeIcon className={`h-5 w-5 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">{insight.title}</h3>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                {insight.type.replace(/-/g, ' ')}
              </p>
            </div>
            {insight.metric && (
              <span className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold ${config.bg} ${config.color} border ${config.border}`}>
                {insight.metric}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{insight.description}</p>

          {/* Suggestion */}
          {insight.actionable && insight.suggestion && (
            <div className="mt-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Suggestion</p>
              </div>
              <p className="mt-1.5 text-sm text-zinc-300">{insight.suggestion}</p>
            </div>
          )}

          {/* Related Topics */}
          {insight.relatedTopics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {insight.relatedTopics.map((topic) => (
                <span key={topic} className="rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-500">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { mocks, logs, isLoading } = useAppData();
  const insights = useMemo(() => generateInsights(mocks, logs), [mocks, logs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const hasInsights = insights.length > 0;
  const criticalCount = insights.filter((i) => i.severity === 'critical').length;
  const warningCount = insights.filter((i) => i.severity === 'warning').length;
  const positiveCount = insights.filter((i) => i.severity === 'positive').length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Insights Lab</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Auto-generated performance intelligence · {insights.length} insights detected
        </p>
      </div>

      {!hasInsights ? (
        <div className="flex flex-col items-center justify-center min-h-[45vh] rounded-2xl border border-white/[0.04] bg-[#0c0c0f] p-8 text-center shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <Lightbulb className="h-6 w-6 text-blue-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Insights will appear after enough data is collected.</h2>
          <p className="mt-2 text-xs text-zinc-500 max-w-sm leading-relaxed">
            The performance intelligence engine requires practice sessions and mock exams to identify streaks, effort mismatches, and mistake patterns.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-rose-400/10 bg-rose-400/5 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Critical</p>
              <p className="mt-1 text-2xl font-bold text-rose-400">{criticalCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/10 bg-amber-400/5 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-550">Warnings</p>
              <p className="mt-1 text-2xl font-bold text-amber-400">{warningCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Positive</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">{positiveCount}</p>
            </div>
          </div>

          {/* Insight Cards */}
          <div className="space-y-4">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
