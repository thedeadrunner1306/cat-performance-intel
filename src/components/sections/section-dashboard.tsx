'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronRight, Plus, Trash2, Clock, Target, 
  TrendingUp, BarChart3, ArrowLeft, Calendar, 
  AlertTriangle, Filter, Database, BookOpen
} from 'lucide-react';
import { useAppData } from '@/lib/data/app-data-context';
import { useLayout } from '@/components/layout-shell';
import { computeSectionOverview } from '@/lib/analytics/compute';
import type { QuestionLog } from '@/types/database';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Cell,
  Legend
} from 'recharts';

interface Props {
  section: 'VARC' | 'DILR' | 'Quant';
  sectionColor: string;
  sectionLabel: string;
}

// Taxonomy mapping to help show all subtopics even if they have zero logged entries yet
const TAXONOMY: Record<string, Record<string, string[]>> = {
  Quant: {
    Arithmetic: ['Percentages', 'Ratio', 'Average', 'Profit Loss', 'SI CI', 'Mixtures', 'TSD', 'Time Work', 'Partnership', 'Pipes'],
    Algebra: [],
    Geometry: [],
    'Number System': [],
    'Modern Math': [],
  },
  VARC: {
    RC: ['Philosophy', 'History', 'Economics', 'Science', 'Politics', 'Culture', 'Psychology'],
    VA: ['Para Jumbles', 'Para Summary', 'Odd One Out', 'Sentence Placement'],
  },
  DILR: {
    Arrangements: [],
    'Games & Tournaments': [],
    'Venn Diagrams': [],
    'Routes & Networks': [],
    Selection: [],
    Distribution: [],
    Puzzles: [],
    Caselets: [],
    Tables: [],
  }
};

const normalizeName = (s: string | null | undefined): string => {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const isFuzzyMatch = (a: string | null | undefined, b: string | null | undefined): boolean => {
  if (!a || !b) return a === b;
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  // Direct match or partial sub-matching
  return normA === normB || normA.includes(normB) || normB.includes(normA);
};

function SectionDashboardInner({ section, sectionColor, sectionLabel }: Props) {
  const { mocks, logs, deleteLog, isLoading } = useAppData();
  const { openLogDrawer } = useLayout();
  const searchParams = useSearchParams();
  const router = useRouter();

  const topicParam = searchParams.get('topic');
  const subtopicParam = searchParams.get('subtopic');

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter logs for this section
  const sectionLogs = useMemo(() => {
    return logs.filter(l => l.section === section);
  }, [logs, section]);

  // Compute overall overview stats
  const overview = useMemo(() => {
    return computeSectionOverview(logs, section);
  }, [logs, section]);

  // Extract all unique topic names in logs or taxonomy for this section
  const availableTopics = useMemo(() => {
    const list = Object.keys(TAXONOMY[section] || {});
    // merge with any other topic names present in logs
    sectionLogs.forEach(l => {
      if (l.topic && !list.includes(l.topic)) {
        list.push(l.topic);
      }
    });
    return list;
  }, [sectionLogs, section]);

  // Filter logs based on active drill-down topic and subtopic
  const filteredLogs = useMemo(() => {
    return sectionLogs.filter(l => {
      if (!topicParam) return true;
      const topicMatch = isFuzzyMatch(l.topic, topicParam);
      if (!topicMatch) return false;
      if (!subtopicParam) return true;
      return isFuzzyMatch(l.subtopic, subtopicParam);
    });
  }, [sectionLogs, topicParam, subtopicParam]);

  // Calculate detailed stats for the selected topic
  const topicStats = useMemo(() => {
    if (!topicParam) return null;
    
    const attempted = filteredLogs.reduce((sum, l) => sum + l.questions_attempted, 0);
    const correct = filteredLogs.reduce((sum, l) => sum + l.questions_correct, 0);
    const wrong = filteredLogs.reduce((sum, l) => sum + l.questions_wrong, 0);
    const totalTime = filteredLogs.reduce((sum, l) => sum + (l.time_spent_minutes || 0), 0);
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const avgTimePerQ = attempted > 0 ? Math.round((totalTime / attempted) * 10) / 10 : 0;

    // Weekly and Monthly filters
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyLogs = filteredLogs.filter(l => new Date(l.date) >= sevenDaysAgo);
    const monthlyLogs = filteredLogs.filter(l => new Date(l.date) >= thirtyDaysAgo);
    const earlierLogs = filteredLogs.filter(l => new Date(l.date) < thirtyDaysAgo);

    const weeklyAttempted = weeklyLogs.reduce((sum, l) => sum + l.questions_attempted, 0);
    const weeklyCorrect = weeklyLogs.reduce((sum, l) => sum + l.questions_correct, 0);
    const weeklyAcc = weeklyAttempted > 0 ? Math.round((weeklyCorrect / weeklyAttempted) * 100) : null;

    const monthlyAttempted = monthlyLogs.reduce((sum, l) => sum + l.questions_attempted, 0);
    const monthlyCorrect = monthlyLogs.reduce((sum, l) => sum + l.questions_correct, 0);
    const monthlyAcc = monthlyAttempted > 0 ? Math.round((monthlyCorrect / monthlyAttempted) * 100) : 0;

    const earlierAttempted = earlierLogs.reduce((sum, l) => sum + l.questions_attempted, 0);
    const earlierCorrect = earlierLogs.reduce((sum, l) => sum + l.questions_correct, 0);
    const earlierAcc = earlierAttempted > 0 ? Math.round((earlierCorrect / earlierAttempted) * 100) : monthlyAcc;

    const improvement = monthlyAcc - earlierAcc;

    // Mock Contribution
    const mockLogs = filteredLogs.filter(l => l.mock_id !== null);
    const mockCorrect = mockLogs.reduce((sum, l) => sum + l.questions_correct, 0);
    const mockWrong = mockLogs.reduce((sum, l) => sum + l.questions_wrong, 0);
    const mockContribution = mockCorrect * 3 - mockWrong * 1;

    return {
      attempted,
      accuracy,
      avgTimePerQ,
      weeklyAcc,
      monthlyAcc,
      improvement,
      mockContribution,
      wrong
    };
  }, [filteredLogs, topicParam]);

  // Visualizations Calculations
  const chartData = useMemo(() => {
    if (filteredLogs.length === 0) return { trend: [], scatter: [], difficulty: [], mistakes: [] };

    // 1. Line Trend Data Grouped by Date
    const dateMap = new Map<string, { attempted: number; correct: number; time: number }>();
    filteredLogs.forEach(l => {
      const prev = dateMap.get(l.date) || { attempted: 0, correct: 0, time: 0 };
      dateMap.set(l.date, {
        attempted: prev.attempted + l.questions_attempted,
        correct: prev.correct + l.questions_correct,
        time: prev.time + (l.time_spent_minutes || 0)
      });
    });

    const trend = [...dateMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        rawDate: date,
        date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        Accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0,
        'Speed (Time/Q)': data.attempted > 0 ? Math.round((data.time / data.attempted) * 10) / 10 : 0
      }));

    // 2. Scatter Plot Data
    const scatter = filteredLogs.map((l, index) => ({
      name: `Session ${index + 1}`,
      accuracy: l.questions_attempted > 0 ? Math.round((l.questions_correct / l.questions_attempted) * 100) : 0,
      avgTime: l.questions_attempted > 0 ? Math.round(((l.time_spent_minutes || 0) / l.questions_attempted) * 10) / 10 : 0,
      attempted: l.questions_attempted
    }));

    // 3. Difficulty Data
    const diffMap = {
      Easy: { attempted: 0, correct: 0 },
      Medium: { attempted: 0, correct: 0 },
      Hard: { attempted: 0, correct: 0 }
    };
    filteredLogs.forEach(l => {
      const diff = (l.difficulty || 'Medium') as 'Easy' | 'Medium' | 'Hard';
      if (diffMap[diff]) {
        diffMap[diff].attempted += l.questions_attempted;
        diffMap[diff].correct += l.questions_correct;
      }
    });
    const difficulty = Object.entries(diffMap).map(([name, data]) => ({
      name,
      Attempted: data.attempted,
      Correct: data.correct,
      Accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0
    }));

    // 4. Mistake Breakdown
    const mistakeMap: Record<string, number> = {};
    filteredLogs.forEach(l => {
      if (l.questions_wrong > 0) {
        const type = l.mistake_type || 'Unclassified';
        mistakeMap[type] = (mistakeMap[type] || 0) + l.questions_wrong;
      }
    });
    const mistakes = Object.entries(mistakeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { trend, scatter, difficulty, mistakes };
  }, [filteredLogs]);

  // Topic card calculations for standard Section list
  const topicListCards = useMemo(() => {
    return availableTopics.map(tName => {
      const logsForTopic = sectionLogs.filter(l => isFuzzyMatch(l.topic, tName));
      const attempted = logsForTopic.reduce((sum, l) => sum + l.questions_attempted, 0);
      const correct = logsForTopic.reduce((sum, l) => sum + l.questions_correct, 0);
      const time = logsForTopic.reduce((sum, l) => sum + (l.time_spent_minutes || 0), 0);
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      const avgTime = attempted > 0 ? Math.round((time / attempted) * 10) / 10 : 0;

      // Calculate recent accuracy vs earlier for trend delta
      const sorted = [...logsForTopic].sort((a, b) => a.date.localeCompare(b.date));
      const latestTime = Math.max(...logsForTopic.map((l) => new Date(l.date).getTime()), 0);
      const thirtyDaysAgo = new Date(latestTime - 30 * 24 * 60 * 60 * 1000);
      
      const recentLogs = logsForTopic.filter(l => new Date(l.date).getTime() >= thirtyDaysAgo.getTime());
      const earlierLogs = logsForTopic.filter(l => new Date(l.date).getTime() < thirtyDaysAgo.getTime());

      const recentSolved = recentLogs.reduce((sum, l) => sum + l.questions_attempted, 0);
      const recentCorrect = recentLogs.reduce((sum, l) => sum + l.questions_correct, 0);
      const recentAcc = recentSolved > 0 ? recentCorrect / recentSolved : 0;

      let earlierAcc = recentAcc;
      if (earlierLogs.length > 0) {
        const earlierSolved = earlierLogs.reduce((sum, l) => sum + l.questions_attempted, 0);
        const earlierCorrect = earlierLogs.reduce((sum, l) => sum + l.questions_correct, 0);
        earlierAcc = earlierSolved > 0 ? earlierCorrect / earlierSolved : 0;
      }
      const trendDelta = Math.round((recentAcc - earlierAcc) * 100);

      // Subtopics list from taxonomy (e.g. Arithmetic subtopics)
      const subtopicsTax = TAXONOMY[section]?.[tName] || [];

      return {
        name: tName,
        attempted,
        accuracy,
        avgTime,
        trendDelta,
        subtopics: subtopicsTax
      };
    }).sort((a, b) => b.attempted - a.attempted);
  }, [sectionLogs, availableTopics, section]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-transparent" />
      </div>
    );
  }

  // ============================
  // DRILL-DOWN VIEW (ACTIVE TOPIC)
  // ============================
  if (topicParam && topicStats) {
    // Find subtopics list from taxonomy
    const allTaxSubtopics = TAXONOMY[section]?.[topicParam] || [];

    return (
      <div className="space-y-6 p-6">
        {/* Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3 text-zinc-700" />
              <Link href={`/${section.toLowerCase()}`} className="hover:text-white transition-colors uppercase">{section}</Link>
              <ChevronRight className="h-3 w-3 text-zinc-700" />
              <Link href={`/${section.toLowerCase()}?topic=${encodeURIComponent(topicParam)}`} className="hover:text-white transition-colors text-zinc-300 font-semibold">{topicParam}</Link>
              {subtopicParam && (
                <>
                  <ChevronRight className="h-3 w-3 text-zinc-700" />
                  <span className="text-white font-semibold">{subtopicParam}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              {subtopicParam ? subtopicParam : topicParam} Detailed Intelligence
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Back button */}
            <Link 
              href={subtopicParam ? `/${section.toLowerCase()}?topic=${encodeURIComponent(topicParam)}` : `/${section.toLowerCase()}`}
              className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.05] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Link>

            <button 
              onClick={() => openLogDrawer(section.toLowerCase() as any)}
              className="flex items-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Practice</span>
            </button>
          </div>
        </div>

        {/* Subtopic Filters (If topic has subtopics) */}
        {!subtopicParam && allTaxSubtopics.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-white/[0.03] bg-zinc-950/40 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-550 flex items-center gap-1.5">
              <Filter className="h-3 w-3" /> Filter by Subtopic
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {allTaxSubtopics.map(stName => {
                const subLogs = filteredLogs.filter(l => isFuzzyMatch(l.subtopic, stName));
                const subAttempted = subLogs.reduce((sum, l) => sum + l.questions_attempted, 0);
                const subCorrect = subLogs.reduce((sum, l) => sum + l.questions_correct, 0);
                const subAccuracy = subAttempted > 0 ? Math.round((subCorrect / subAttempted) * 100) : 0;

                return (
                  <Link
                    key={stName}
                    href={`/${section.toLowerCase()}?topic=${encodeURIComponent(topicParam)}&subtopic=${encodeURIComponent(stName)}`}
                    className="flex items-center gap-2 rounded-md border border-white/[0.04] bg-white/[0.01] px-3 py-1.5 text-xs text-zinc-350 hover:bg-zinc-900 hover:border-zinc-700 transition-all"
                  >
                    <span>{stName}</span>
                    {subAttempted > 0 && (
                      <span className="rounded bg-white/[0.04] px-1 text-[9px] font-mono font-semibold text-zinc-500">
                        {subAttempted} Qs ({subAccuracy}%)
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Subtopic Banner */}
        {subtopicParam && (
          <div className="flex items-center justify-between rounded-lg border border-blue-500/10 bg-blue-500/[0.02] px-4 py-3">
            <span className="text-xs text-zinc-300">
              Filtering detail scope to subtopic <span className="font-semibold text-white">{subtopicParam}</span>
            </span>
            <Link 
              href={`/${section.toLowerCase()}?topic=${encodeURIComponent(topicParam)}`}
              className="text-[10px] font-mono uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear subtopic filter
            </Link>
          </div>
        )}

        {/* Detailed Topic Snapshot Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
          {[
            { label: 'Solved (Qs)', value: topicStats.attempted, sub: 'Total practice + mocks' },
            { label: 'Accuracy', value: `${topicStats.accuracy}%`, sub: 'Overall accuracy rate' },
            { label: 'Avg Time/Q', value: `${topicStats.avgTimePerQ}m`, sub: 'Pace per question' },
            { label: 'Weekly Accuracy', value: topicStats.weeklyAcc !== null ? `${topicStats.weeklyAcc}%` : 'N/A', sub: 'Last 7 days performance' },
            { label: 'Monthly Accuracy', value: `${topicStats.monthlyAcc}%`, sub: 'Last 30 days performance' },
            { label: 'Mock Score impact', value: `${topicStats.mockContribution >= 0 ? '+' : ''}${topicStats.mockContribution}`, sub: 'Net Mock points generated' },
          ].map((card, idx) => (
            <div key={idx} className="rounded-lg border border-white/[0.05] bg-zinc-950 p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{card.label}</p>
              <p className="mt-2 text-xl font-extrabold text-white tracking-tight">{card.value}</p>
              <p className="mt-1 text-[9px] text-zinc-550 leading-none">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Visualizations Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Trend Chart (Line) */}
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Accuracy & Speed Trend</h3>
            <div className="mt-4 h-64 w-full">
              {isMounted && chartData.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis yAxisId="left" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10, marginTop: 10 }} />
                    <Line yAxisId="left" type="monotone" dataKey="Accuracy" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} name="Accuracy (%)" />
                    <Line yAxisId="right" type="monotone" dataKey="Speed (Time/Q)" stroke="#f59e0b" strokeWidth={2} name="Time/Q (m)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-650">Not enough data to calculate timeline trends</div>
              )}
            </div>
          </div>

          {/* Scatter Plot (Accuracy vs Speed) */}
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Accuracy vs Speed Scatter Plot</h3>
            <p className="text-[10px] text-zinc-550 mt-0.5">Plot of solved logs: top-left is optimal (fast & correct)</p>
            <div className="mt-4 h-64 w-full">
              {isMounted && chartData.scatter.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                    <XAxis type="number" dataKey="avgTime" name="Time/Q" unit="m" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis type="number" dataKey="accuracy" name="Accuracy" unit="%" tick={{ fill: '#71717a', fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: 11 }} />
                    <Scatter name="Logs" data={chartData.scatter} fill="#8b5cf6">
                      {chartData.scatter.map((entry, index) => {
                        const col = entry.accuracy >= 70 ? '#10b981' : entry.accuracy >= 45 ? '#f59e0b' : '#f43f5e';
                        return <Cell key={`cell-${index}`} fill={col} />;
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-650">Not enough log points yet</div>
              )}
            </div>
          </div>

          {/* Difficulty Handling Breakdown */}
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Difficulty Distribution</h3>
            <div className="mt-4 h-64 w-full">
              {isMounted && chartData.difficulty.some(d => d.Attempted > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.difficulty} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Attempted" fill="rgba(255,255,255,0.1)" name="Attempted" />
                    <Bar dataKey="Correct" fill="#3b82f6" name="Correct" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-650">No graded logs found</div>
              )}
            </div>
          </div>

          {/* Mistake Pattern Analysis */}
          <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mistake Pattern Analysis</h3>
              <p className="text-[10px] text-zinc-550 mt-0.5">Distribution of incorrect answers by root cause</p>
            </div>
            
            {chartData.mistakes.length > 0 ? (
              <div className="mt-5 space-y-3 flex-1 overflow-y-auto">
                {chartData.mistakes.map((mistake) => {
                  const maxVal = Math.max(...chartData.mistakes.map(m => m.value), 1);
                  const pct = Math.round((mistake.value / maxVal) * 100);
                  
                  return (
                    <div key={mistake.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-300">{mistake.name}</span>
                        <span className="font-mono text-rose-400">{mistake.value} wrong</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded bg-white/[0.02]">
                        <div 
                          className="h-full rounded bg-rose-500/60 transition-all duration-500" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-zinc-650 py-10">
                Excellent! Zero incorrect answers logged in this scope.
              </div>
            )}
          </div>
        </div>

        {/* Ledger */}
        <div className="rounded-xl border border-white/[0.06] bg-zinc-950 overflow-hidden">
          <div className="border-b border-white/[0.06] bg-zinc-900/50 px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Performance History Ledger</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Chronological record of raw log entries for audit or removal</p>
            </div>
            <span className="rounded bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-400 font-mono">
              {filteredLogs.length} entries
            </span>
          </div>

          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.01] text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-center">Attempted</th>
                    <th className="px-4 py-3 text-center">Correct</th>
                    <th className="px-4 py-3 text-center">Wrong</th>
                    <th className="px-4 py-3 text-center">Accuracy</th>
                    <th className="px-4 py-3 text-center">Avg Time</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Mistake Type</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {filteredLogs.map((log) => {
                    const rowAccuracy = log.questions_attempted > 0 ? Math.round((log.questions_correct / log.questions_attempted) * 100) : 0;
                    const diffColors = {
                      Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      Medium: 'text-amber-450 bg-amber-500/10 border-amber-500/20',
                      Hard: 'text-rose-450 bg-rose-500/10 border-rose-500/20'
                    }[log.difficulty || 'Medium'];

                    return (
                      <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-5 py-3.5 text-zinc-300 font-mono whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-400">
                          {log.mock_id ? (
                            <span className="rounded bg-violet-550/15 border border-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold text-violet-400 uppercase">
                              Mock Log
                            </span>
                          ) : (
                            <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 uppercase">
                              Practice
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-zinc-250">
                          {log.questions_attempted}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-emerald-450 font-semibold">
                          {log.questions_correct}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-rose-455">
                          {log.questions_wrong}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono">
                          <span className={`font-semibold ${rowAccuracy >= 75 ? 'text-emerald-400' : rowAccuracy >= 45 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {rowAccuracy}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-zinc-300">
                          {log.time_spent_minutes !== null ? `${log.time_spent_minutes}m` : '—'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${diffColors}`}>
                            {log.difficulty || 'Medium'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-400 whitespace-nowrap">
                          {log.questions_wrong > 0 ? (log.mistake_type || 'Unclassified') : <span className="text-zinc-700">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button 
                            onClick={() => deleteLog(log.id)}
                            className="text-zinc-600 hover:text-rose-450 rounded p-1 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete log entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-600">
              <Database className="h-8 w-8 text-zinc-700 mb-2" />
              <p className="text-xs">No logged sessions found in this scope.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================
  // MAIN SECTION LIST VIEW
  // ============================
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">{sectionLabel} Module</h1>
          <p className="mt-1 text-sm text-zinc-500">Complete performance ledger and topic analytics</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href={`/${section.toLowerCase()}/history`}
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] px-4 py-1.5 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <span>View History Ledger</span>
          </Link>
          <button 
            onClick={() => openLogDrawer(section.toLowerCase() as any)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Practice</span>
          </button>
        </div>
      </div>

      {/* Inline quick logging alert banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-blue-500/25 bg-blue-500/[0.03] p-4.5 gap-4">
        <div>
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-blue-400" />
            Fast Practice Logging
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Keep analytics honest: log questions solved, correct questions, and time spent in under 30 seconds.
          </p>
        </div>
        <button
          onClick={() => openLogDrawer(section.toLowerCase() as any)}
          className="shrink-0 rounded bg-blue-500 hover:bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
        >
          Open Logging Panel
        </button>
      </div>

      {sectionLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[35vh] rounded-2xl border border-white/[0.04] bg-[#0c0c0f] p-8 text-center shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Log your first session.</h2>
          <p className="mt-2 text-xs text-zinc-500 max-w-sm leading-relaxed">
            No practice logs have been recorded for {sectionLabel} yet. Start logging your self-practice or mock topic breakdowns to populate charts and track subtopic accuracy.
          </p>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              { label: 'Accuracy', value: `${overview.accuracy}%`, icon: Target, color: sectionColor },
              { label: 'Avg Time/Q', value: `${overview.avgTimePerQuestion}m`, icon: Clock, color: 'text-zinc-400' },
              { label: 'Efficiency', value: `${overview.efficiency}`, icon: BarChart3, color: 'text-blue-400' },
              { label: 'Consistency', value: `${overview.consistency}%`, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Total Solved', value: `${overview.totalAttempted}`, icon: BarChart3, color: 'text-violet-400' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/[0.05] bg-zinc-950 p-5">
                <div className="flex items-center gap-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-550">{stat.label}</p>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-white tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Accuracy & Speed Trend over time for Section */}
          {overview.trendData.length > 1 && (
            <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-550 mb-4">Section Performance Timeline</p>
              <div className="h-56 w-full">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overview.trendData.map(d => ({
                      ...d,
                      date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                      'Section Accuracy': d.accuracy
                    }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: 11 }} />
                      <Line type="monotone" dataKey="Section Accuracy" stroke="#3b82f6" strokeWidth={2} name="Accuracy (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full bg-zinc-950/20 animate-pulse rounded-lg" />
                )}
              </div>
            </div>
          )}

          {/* Topic Cards Breakdown */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Topic Breakdown</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topicListCards.map((topic) => (
                <div
                  key={topic.name}
                  className="group rounded-xl border border-white/[0.06] bg-zinc-950 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight">{topic.name}</h3>
                      </div>
                      {topic.attempted > 0 && topic.trendDelta !== 0 && (
                        <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          topic.trendDelta > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {topic.trendDelta > 0 ? '+' : ''}{topic.trendDelta}%
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-center border-y border-white/[0.03] py-3 text-xs">
                      <div>
                        <p className="text-lg font-extrabold text-white font-mono">{topic.accuracy}%</p>
                        <p className="text-[10px] text-zinc-550">Accuracy</p>
                      </div>
                      <div>
                        <p className="text-lg font-extrabold text-white font-mono">{topic.avgTime}m</p>
                        <p className="text-[10px] text-zinc-550">Avg Time/Q</p>
                      </div>
                      <div>
                        <p className="text-lg font-extrabold text-white font-mono">{topic.attempted}</p>
                        <p className="text-[10px] text-zinc-550">Solved Qs</p>
                      </div>
                    </div>

                    {/* Accuracy progress bar */}
                    <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded bg-white/[0.03]">
                      <div
                        className={`h-full rounded transition-all ${
                          topic.accuracy >= 70 ? 'bg-emerald-500/60' :
                          topic.accuracy >= 45 ? 'bg-amber-500/60' :
                          'bg-rose-500/60'
                        }`}
                        style={{ width: `${topic.accuracy}%` }}
                      />
                    </div>

                    {/* Subtopic badges/links (roadmap UX) */}
                    {topic.subtopics.length > 0 && (
                      <div className="mt-4 border-t border-white/[0.03] pt-3">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-550 mb-1.5">Subtopics</p>
                        <div className="flex flex-wrap gap-1.5">
                          {topic.subtopics.map(st => {
                            const stHref = `/${section.toLowerCase()}?topic=${encodeURIComponent(topic.name)}&subtopic=${encodeURIComponent(st)}`;
                            return (
                              <Link
                                key={st}
                                href={stHref}
                                className="rounded bg-white/[0.03] px-2 py-0.5 text-[9px] text-zinc-450 hover:bg-blue-500/15 hover:text-blue-400 border border-transparent hover:border-blue-500/20 transition-all font-mono"
                              >
                                {st}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Main Drill Down Trigger button */}
                  <Link
                    href={`/${section.toLowerCase()}?topic=${encodeURIComponent(topic.name)}`}
                    className="mt-5 w-full flex items-center justify-center gap-1.5 rounded bg-white/[0.02] border border-white/[0.04] py-2 text-xs font-bold text-zinc-350 hover:bg-zinc-800 hover:text-white transition-all uppercase tracking-wider"
                  >
                    <span>Topic Analytics</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function SectionDashboard(props: Props) {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-transparent" />
      </div>
    }>
      <SectionDashboardInner {...props} />
    </React.Suspense>
  );
}
