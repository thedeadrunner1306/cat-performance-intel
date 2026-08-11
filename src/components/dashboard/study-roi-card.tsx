'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { StudyRoiMetrics } from '@/lib/analytics/types';

interface Props {
  roiList: StudyRoiMetrics[];
}

export function StudyRoiCard({ roiList }: Props) {
  if (roiList.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Study ROI</p>
        <p className="mt-4 text-sm text-zinc-600">No study ROI data computed. Please log practice hours with accuracy to calculate ROI.</p>
      </div>
    );
  }

  const roiColors: Record<string, { bg: string; text: string; border: string }> = {
    High: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    Medium: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    Low: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Study ROI
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">Efficiency of study investment (Accuracy Gain / Hours Logged)</p>
        </div>
        <Sparkles className="h-5 w-5 text-zinc-500" />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {roiList.slice(0, 3).map((item) => {
          const colors = roiColors[item.roi] || roiColors.Low;
          const href = `/${item.section.toLowerCase()}?topic=${encodeURIComponent(item.topicLabel)}`;

          return (
            <Link
              key={item.topicLabel}
              href={href}
              className={`group flex flex-col justify-between rounded-lg border ${colors.border} bg-white/[0.01] p-4 transition-all hover:bg-zinc-900 hover:border-zinc-700`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                    ROI: {item.roi}
                  </span>
                  <ArrowRight className="h-4 w-4 text-zinc-650 transition-colors group-hover:text-white" />
                </div>

                <h3 className="mt-3 text-base font-bold text-white tracking-tight">{item.topicLabel}</h3>
                <p className="text-[10px] font-mono text-zinc-550 uppercase">{item.section}</p>

                <div className="mt-4 space-y-1.5 border-t border-white/[0.03] pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Study Hours</span>
                    <span className="font-mono text-zinc-200 font-semibold">{item.studyHours.toFixed(1)} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Accuracy Gain</span>
                    <span className={`font-mono font-semibold ${item.accuracyGain >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                      {item.accuracyGain >= 0 ? `+${item.accuracyGain}` : item.accuracyGain}%
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
