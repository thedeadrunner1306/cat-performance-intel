'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Target, TrendingUp, TrendingDown, AlertTriangle, Trash2 } from 'lucide-react';
import { useAppData } from '@/lib/data/app-data-context';

export default function MockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mockId = params.id as string;

  const { mocks, logs, deleteMock, isLoading } = useAppData();

  const mock = useMemo(() => mocks.find((m) => m.id === mockId), [mocks, mockId]);
  const mockLogs = useMemo(() => logs.filter((l) => l.mock_id === mockId), [logs, mockId]);

  const sortedMocks = useMemo(() =>
    [...mocks].sort((a, b) => new Date(a.mock_date).getTime() - new Date(b.mock_date).getTime()),
    [mocks]
  );
  const mockIndex = sortedMocks.findIndex((m) => m.id === mockId);
  const prevMock = mockIndex > 0 ? sortedMocks[mockIndex - 1] : null;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this mock report and all its topic breakdowns?')) {
      await deleteMock(mockId);
      router.push('/mocks');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!mock) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Mock not found</p>
      </div>
    );
  }

  const delta = prevMock ? (mock.overall_score || 0) - (prevMock.overall_score || 0) : 0;

  // Section time allocation
  const totalTime = (mock.varc_time_minutes || 0) + (mock.dilr_time_minutes || 0) + (mock.quant_time_minutes || 0);

  // Topic performance in this mock
  const sectionData = ['VARC', 'DILR', 'Quant'].map((section) => {
    const sectionLogs = mockLogs.filter((l) => l.section === section);
    const attempted = sectionLogs.reduce((s, l) => s + l.questions_attempted, 0);
    const correct = sectionLogs.reduce((s, l) => s + l.questions_correct, 0);
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return { section, attempted, correct, accuracy, logs: sectionLogs };
  });

  // Mistake distribution
  const mistakeCounts: Record<string, number> = {};
  for (const l of mockLogs) {
    if (l.mistake_type && l.questions_wrong > 0) {
      mistakeCounts[l.mistake_type] = (mistakeCounts[l.mistake_type] || 0) + l.questions_wrong;
    }
  }

  const sectionColors: Record<string, string> = {
    VARC: 'text-violet-400',
    DILR: 'text-blue-400',
    Quant: 'text-cyan-400',
  };

  return (
    <div className="space-y-6 p-6">
      {/* Back + Header */}
      <div className="flex items-center justify-between">
        <Link href="/mocks" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Mocks
        </Link>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 rounded border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Mock Report</span>
        </button>
      </div>
      <div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{mock.mock_name}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {new Date(mock.mock_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {delta !== 0 && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2 ${
              delta > 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'
            }`}>
              {delta > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              <span className="text-lg font-bold">{delta > 0 ? '+' : ''}{delta}</span>
              <span className="text-sm opacity-70">vs previous</span>
            </div>
          )}
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="col-span-2 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0f0f14] to-[#0c0c10] p-6 lg:col-span-1">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 to-violet-500" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Overall</p>
          <p className="mt-2 text-4xl font-bold text-white">{mock.overall_score}</p>
          <p className="mt-1 text-sm text-zinc-500">{mock.overall_percentile} %ile</p>
        </div>
        {['VARC', 'DILR', 'Quant'].map((section) => {
          const score = section === 'VARC' ? mock.varc_score : section === 'DILR' ? mock.dilr_score : mock.quant_score;
          const time = section === 'VARC' ? mock.varc_time_minutes : section === 'DILR' ? mock.dilr_time_minutes : mock.quant_time_minutes;
          return (
            <div key={section} className="rounded-2xl border border-white/[0.06] bg-[#0f0f14] p-5">
              <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${sectionColors[section]}`}>{section}</p>
              <p className="mt-2 text-2xl font-bold text-white">{score}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />
                {time} min
              </div>
            </div>
          );
        })}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f14] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Total Time</p>
          <p className="mt-2 text-2xl font-bold text-white">{totalTime}</p>
          <p className="mt-1 text-xs text-zinc-500">/ 120 minutes</p>
        </div>
      </div>

      {/* Time Allocation */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f14] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Time Allocation</p>
        <div className="mt-4 flex h-6 overflow-hidden rounded-full">
          {totalTime > 0 && ['VARC', 'DILR', 'Quant'].map((section) => {
            const time = section === 'VARC' ? mock.varc_time_minutes : section === 'DILR' ? mock.dilr_time_minutes : mock.quant_time_minutes;
            const pct = ((time || 0) / totalTime) * 100;
            const bg = section === 'VARC' ? 'bg-violet-500' : section === 'DILR' ? 'bg-blue-500' : 'bg-cyan-500';
            return <div key={section} className={`${bg} transition-all`} style={{ width: `${pct}%` }} />;
          })}
        </div>
        <div className="mt-3 flex gap-6">
          {['VARC', 'DILR', 'Quant'].map((section) => {
            const time = section === 'VARC' ? mock.varc_time_minutes : section === 'DILR' ? mock.dilr_time_minutes : mock.quant_time_minutes;
            const dotColor = section === 'VARC' ? 'bg-violet-500' : section === 'DILR' ? 'bg-blue-500' : 'bg-cyan-500';
            return (
              <div key={section} className="flex items-center gap-2 text-sm text-zinc-400">
                <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                {section}: {time} min ({totalTime > 0 ? Math.round(((time || 0) / totalTime) * 100) : 0}%)
              </div>
            );
          })}
        </div>
      </div>

      {/* Section Accuracy */}
      <div className="grid gap-4 lg:grid-cols-3">
        {sectionData.map((s) => (
          <div key={s.section} className="rounded-2xl border border-white/[0.06] bg-[#0f0f14] p-5">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${sectionColors[s.section]}`}>{s.section} Accuracy</p>
            <p className="mt-2 text-3xl font-bold text-white">{s.accuracy}%</p>
            <p className="mt-1 text-xs text-zinc-500">{s.correct} / {s.attempted} correct</p>
            <div className="mt-3 space-y-2">
              {s.logs.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">{l.subtopic || l.topic}</span>
                  <span className={l.questions_attempted > 0 && l.questions_correct / l.questions_attempted >= 0.7 ? 'text-emerald-400' : 'text-rose-400'}>
                    {l.questions_correct}/{l.questions_attempted}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mistake Distribution */}
      {Object.keys(mistakeCounts).length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f14] p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Error Distribution</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.entries(mistakeCounts).sort(([, a], [, b]) => b - a).map(([type, count]) => (
              <div key={type} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center">
                <p className="text-lg font-bold text-rose-400">{count}</p>
                <p className="mt-1 text-[10px] text-zinc-500 leading-tight">{type}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
