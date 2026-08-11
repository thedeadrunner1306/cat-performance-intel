'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { PerformanceCommand } from '@/components/dashboard/performance-command';
import { TopicTrendsCard } from '@/components/dashboard/topic-trends-card';
import { ScoreLeakageCard } from '@/components/dashboard/score-leakage-card';
import { RecommendedFocusCard } from '@/components/dashboard/recommended-focus-card';
import { StudyRoiCard } from '@/components/dashboard/study-roi-card';
import {
  computeSnapshotMetrics,
  getStrengtheningTopics,
  getWeakeningTopics,
  computeScoreLeakage,
  computeRecommendations,
  computeStudyRoi,
} from '@/lib/analytics/compute';
import { useAppData } from '@/lib/data/app-data-context';

export default function DashboardPage() {
  const { mocks, logs, isLoading } = useAppData();

  const snapshot = useMemo(() => computeSnapshotMetrics(mocks, logs), [mocks, logs]);
  const improving = useMemo(() => getStrengtheningTopics(mocks, logs, 5), [mocks, logs]);
  const declining = useMemo(() => getWeakeningTopics(mocks, logs, 5), [mocks, logs]);
  const scoreLeakage = useMemo(() => computeScoreLeakage(logs), [logs]);
  const recommendations = useMemo(() => computeRecommendations(mocks, logs), [mocks, logs]);
  const studyRoi = useMemo(() => computeStudyRoi(logs), [logs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-transparent" />
      </div>
    );
  }

  const hasData = mocks.length > 0 || logs.length > 0;

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="relative border-b border-white/[0.04] pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-mono tracking-[0.25em] text-zinc-500 uppercase">SYSTEM_INTELLIGENCE // LIVE_FEED</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
          Mission <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent px-2.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-2xl font-mono">CAT</span>
        </h1>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] rounded-2xl border border-white/[0.04] bg-[#0c0c0f] p-8 text-center shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <svg className="h-6 w-6 text-blue-400 font-bold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">No data yet.</h2>
          <p className="mt-2 text-xs text-zinc-400 max-w-sm leading-relaxed">
            Log your first mock or practice run to activate performance intelligence.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/mocks"
              className="rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              Add Mock Report
            </Link>
            <Link
              href="/quant"
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Log Practice Session
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Section 1: Current Snapshot */}
          <PerformanceCommand metrics={snapshot} />

          {/* Section 2 & 3: Improving & Declining Topics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TopicTrendsCard topics={improving} type="strengthening" />
            <TopicTrendsCard topics={declining} type="weakening" />
          </div>

          {/* Section 4 & 5: Marks Lost & Highest Opportunity Topics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ScoreLeakageCard leakages={scoreLeakage} />
            <RecommendedFocusCard recommendations={recommendations} />
          </div>

          {/* Section 6: Study ROI */}
          <StudyRoiCard roiList={studyRoi} />
        </>
      )}
    </div>
  );
}
