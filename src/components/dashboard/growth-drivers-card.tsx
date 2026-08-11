'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { GrowthDriver } from '@/lib/analytics/types';

interface Props {
  drivers: GrowthDriver[];
  totalGrowth: number;
}

export function GrowthDriversCard({ drivers, totalGrowth }: Props) {
  if (drivers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f14] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Growth Drivers</p>
        <p className="mt-4 text-sm text-zinc-600">Not enough data yet</p>
      </div>
    );
  }

  const maxContribution = Math.max(...drivers.map((d) => d.contribution));

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f14] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Growth Drivers</p>
          <p className="mt-0.5 text-xs text-zinc-600">Why is your score improving?</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-400/10 px-3 py-1.5">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">+{totalGrowth}</span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {drivers.map((driver) => (
          <div key={driver.topicLabel} className="group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-300">{driver.topicLabel}</span>
                <span className="text-[10px] text-zinc-600">{driver.section}</span>
              </div>
              <span className="text-sm font-semibold text-emerald-400">
                +{driver.contribution}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-400/40 transition-all duration-500"
                style={{ width: `${(driver.contribution / maxContribution) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
