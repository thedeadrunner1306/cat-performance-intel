'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, TrendingDown, Calendar, BarChart3, X, Award, Info, Database } from 'lucide-react';
import { useAppData } from '@/lib/data/app-data-context';
import { computeMockTrends } from '@/lib/analytics/compute';
import type { MockTrend } from '@/lib/analytics/types';

const COMMON_TOPICS: Record<string, string[]> = {
  Quant: ['Arithmetic', 'Algebra', 'Geometry', 'Number System', 'Modern Math'],
  VARC: ['Reading Comprehension', 'Verbal Ability'],
  DILR: ['Arrangements', 'Games & Tournaments', 'Venn Diagrams', 'Puzzles', 'Tables', 'Caselets']
};

function MockCard({ mock, index }: { mock: MockTrend; index: number }) {
  const isPositive = mock.deltaFromPrevious > 0;
  const isFirst = index === 0;

  return (
    <Link href={`/mocks/${mock.mockId}`}>
      <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/0 to-transparent transition-all group-hover:via-blue-500/60" />

        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-bold text-white tracking-tight">{mock.mockName}</p>
            <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase">
              <Calendar className="h-3 w-3" />
              {new Date(mock.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          {!isFirst && mock.deltaFromPrevious !== 0 && (
            <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${
              isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? '+' : ''}{mock.deltaFromPrevious}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-white tracking-tight">{mock.overallScore}</span>
          <span className="text-xs text-zinc-550">/ 198</span>
        </div>

        <div className="mt-0.5 text-xs text-zinc-400 font-mono font-semibold">{mock.percentile}%ile</div>

        {/* Section Scores */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'VARC', score: mock.varcScore, color: 'text-violet-400' },
            { label: 'DILR', score: mock.dilrScore, color: 'text-blue-405' },
            { label: 'Quant', score: mock.quantScore, color: 'text-cyan-400' },
          ].map((sec) => (
            <div key={sec.label} className="rounded border border-white/[0.03] bg-white/[0.01] px-2 py-1.5 text-center">
              <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">{sec.label}</p>
              <p className={`mt-0.5 text-base font-bold ${sec.color}`}>{sec.score}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function MocksPage() {
  const { mocks, addMock, isLoading } = useAppData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState('');

  // Form fields state
  const [mockName, setMockName] = useState('');
  const [mockProvider, setMockProvider] = useState('IMS');
  const [mockDate, setMockDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [percentile, setPercentile] = useState('90');

  const [varcScore, setVarcScore] = useState('');
  const [varcAttempted, setVarcAttempted] = useState('');
  const [varcCorrect, setVarcCorrect] = useState('');
  const [varcTime, setVarcTime] = useState('40');

  const [dilrScore, setDilrScore] = useState('');
  const [dilrAttempted, setDilrAttempted] = useState('');
  const [dilrCorrect, setDilrCorrect] = useState('');
  const [dilrTime, setDilrTime] = useState('40');

  const [quantScore, setQuantScore] = useState('');
  const [quantAttempted, setQuantAttempted] = useState('');
  const [quantCorrect, setQuantCorrect] = useState('');
  const [quantTime, setQuantTime] = useState('40');

  // Topic breakdown inputs: { "Arithmetic": { attempted: "5", correct: "4" } }
  const [topicBreakdown, setTopicBreakdown] = useState<Record<string, { attempted: string; correct: string }>>({});

  const trends = useMemo(() => computeMockTrends(mocks), [mocks]);
  const reversed = useMemo(() => [...trends].reverse(), [trends]);

  // Stats
  const latestScore = trends.length > 0 ? trends[trends.length - 1].overallScore : 0;
  const avgScore = trends.length > 0
    ? Math.round(trends.reduce((s, t) => s + t.overallScore, 0) / trends.length)
    : 0;
  const bestScore = trends.length > 0 ? Math.max(...trends.map((t) => t.overallScore)) : 0;

  const handleTopicChange = (topic: string, field: 'attempted' | 'correct', val: string) => {
    setTopicBreakdown(prev => ({
      ...prev,
      [topic]: {
        ...prev[topic],
        [field]: val
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const overallScore = Number(varcScore) + Number(dilrScore) + Number(quantScore);

    const mockData = {
      id: `mock-custom-${Date.now()}`,
      mock_name: mockName || `Mock Exam ${mocks.length + 1}`,
      mock_provider: mockProvider,
      mock_date: mockDate || new Date().toISOString().split('T')[0],
      overall_score: overallScore,
      overall_percentile: Number(percentile) || 90,
      varc_score: Number(varcScore) || 0,
      dilr_score: Number(dilrScore) || 0,
      quant_score: Number(quantScore) || 0,
      total_time_minutes: Number(varcTime) + Number(dilrTime) + Number(quantTime),
      varc_time_minutes: Number(varcTime) || 40,
      dilr_time_minutes: Number(dilrTime) || 40,
      quant_time_minutes: Number(quantTime) || 40,
      created_at: new Date().toISOString(),
    };

    // Construct mock breakdowns
    const logsData: any[] = [];
    
    // Iterate sections
    Object.entries(COMMON_TOPICS).forEach(([sec, topics]) => {
      topics.forEach(topic => {
        const entry = topicBreakdown[topic];
        const att = Number(entry?.attempted) || 0;
        const corr = Number(entry?.correct) || 0;
        if (att > 0) {
          logsData.push({
            section: sec as any,
            topic: topic,
            questions_attempted: att,
            questions_correct: corr,
            questions_wrong: Math.max(0, att - corr)
          });
        }
      });
    });

    const { error } = await addMock(mockData, logsData);

    if (error) {
      setFormError(typeof error === 'string' ? error : error.message || 'Failed to submit mock report.');
    } else {
      // Reset Form
      setMockName('');
      setMockProvider('IMS');
      setMockDate(new Date().toISOString().split('T')[0]);
      setPercentile('90');
      setVarcScore('');
      setVarcAttempted('');
      setVarcCorrect('');
      setDilrScore('');
      setDilrAttempted('');
      setDilrCorrect('');
      setQuantScore('');
      setQuantAttempted('');
      setQuantCorrect('');
      setTopicBreakdown({});
      setShowAddModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-transparent" />
      </div>
    );
  }

  // ============================
  // EMPTY STATE
  // ============================
  if (mocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center space-y-4">
        <div className="rounded-xl border border-white/[0.06] bg-zinc-950 p-8 max-w-md space-y-4 shadow-xl">
          <Database className="mx-auto h-10 w-10 text-zinc-650" />
          <h2 className="text-lg font-bold text-white tracking-tight">Add your first mock.</h2>
          <p className="text-xs text-zinc-400">
            No mock records have been added to the database. Start tracking mock exams, section contributions, and topic distributions to activate dashboard analytics.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex mx-auto items-center gap-2 rounded bg-blue-500 hover:bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Mock Report
          </button>
        </div>
        
        {/* Render Modal if opened */}
        {showAddModal && <MockFormModal onClose={() => setShowAddModal(false)} onSubmit={handleSubmit} formError={formError} states={{
          mockName, setMockName, mockProvider, setMockProvider, mockDate, setMockDate, percentile, setPercentile,
          varcScore, setVarcScore, varcAttempted, setVarcAttempted, varcCorrect, setVarcCorrect, varcTime, setVarcTime,
          dilrScore, setDilrScore, dilrAttempted, setDilrAttempted, dilrCorrect, setDilrCorrect, dilrTime, setDilrTime,
          quantScore, setQuantScore, quantAttempted, setQuantAttempted, quantCorrect, setQuantCorrect, quantTime, setQuantTime,
          topicBreakdown, handleTopicChange
        }} />}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Mock Intelligence Hub</h1>
          <p className="mt-1 text-sm text-zinc-500">Track and review mock test analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/mocks/history"
            className="flex items-center gap-2 rounded border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <span>View History Ledger</span>
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded bg-blue-500 hover:bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Mock
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Latest Score', value: latestScore, icon: BarChart3, color: 'text-blue-400' },
          { label: 'Average Score', value: avgScore, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Best Score', value: bestScore, icon: TrendingUp, color: 'text-violet-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/[0.05] bg-zinc-950 p-5">
            <div className="flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{stat.label}</p>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Mock Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reversed.map((mock, i) => (
          <MockCard key={mock.mockId} mock={mock} index={trends.length - 1 - i} />
        ))}
      </div>

      {/* Modal Dialog */}
      {showAddModal && <MockFormModal onClose={() => setShowAddModal(false)} onSubmit={handleSubmit} formError={formError} states={{
        mockName, setMockName, mockProvider, setMockProvider, mockDate, setMockDate, percentile, setPercentile,
        varcScore, setVarcScore, varcAttempted, setVarcAttempted, varcCorrect, setVarcCorrect, varcTime, setVarcTime,
        dilrScore, setDilrScore, dilrAttempted, setDilrAttempted, dilrCorrect, setDilrCorrect, dilrTime, setDilrTime,
        quantScore, setQuantScore, quantAttempted, setQuantAttempted, quantCorrect, setQuantCorrect, quantTime, setQuantTime,
        topicBreakdown, handleTopicChange
      }} />}
    </div>
  );
}

// Separate Presentational component for clean Modal layouts
function MockFormModal({ onClose, onSubmit, formError, states }: { 
  onClose: () => void; 
  onSubmit: (e: React.FormEvent) => void;
  formError: string;
  states: any;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-white/[0.06] bg-zinc-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-550 hover:text-zinc-350 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold text-white tracking-tight">Add Mock Report</h2>
        <p className="mt-1 text-xs text-zinc-500">Record mock scores and section-level metrics</p>

        {formError && (
          <div className="mt-4 rounded bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-455">
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          {/* Metadata */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Mock Name</label>
              <input
                type="text" required placeholder="e.g. SimCAT 8"
                value={states.mockName} onChange={(e) => states.setMockName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Provider</label>
              <select
                value={states.mockProvider} onChange={(e) => states.setMockProvider(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
              >
                <option value="IMS">IMS</option>
                <option value="CL">CL</option>
                <option value="TIME">T.I.M.E.</option>
                <option value="PYQ">PYQ (Past Year)</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Date</label>
              <input
                type="date" required
                value={states.mockDate} onChange={(e) => states.setMockDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Percentile</label>
              <input
                type="number" step="0.01" required placeholder="e.g. 97.4"
                value={states.percentile} onChange={(e) => states.setPercentile(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
              />
            </div>
          </div>

          {/* Section Breakdown Grid */}
          <div className="space-y-4 border-t border-white/[0.04] pt-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-550">Sectional Performance</h3>

            {/* VARC */}
            <div className="rounded-lg border border-white/[0.03] bg-white/[0.01] p-3">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">VARC Sectional</span>
              <div className="mt-2.5 grid gap-2.5 grid-cols-2 sm:grid-cols-4">
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Net Score</label>
                  <input
                    type="number" required value={states.varcScore} onChange={(e) => states.setVarcScore(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Attempted</label>
                  <input
                    type="number" required value={states.varcAttempted} onChange={(e) => states.setVarcAttempted(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Correct</label>
                  <input
                    type="number" required value={states.varcCorrect} onChange={(e) => states.setVarcCorrect(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Time (mins)</label>
                  <input
                    type="number" required value={states.varcTime} onChange={(e) => states.setVarcTime(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500/30"
                  />
                </div>
              </div>
            </div>

            {/* DILR */}
            <div className="rounded-lg border border-white/[0.03] bg-white/[0.01] p-3">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">DILR Sectional</span>
              <div className="mt-2.5 grid gap-2.5 grid-cols-2 sm:grid-cols-4">
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Net Score</label>
                  <input
                    type="number" required value={states.dilrScore} onChange={(e) => states.setDilrScore(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Attempted Qs</label>
                  <input
                    type="number" required value={states.dilrAttempted} onChange={(e) => states.setDilrAttempted(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Correct Qs</label>
                  <input
                    type="number" required value={states.dilrCorrect} onChange={(e) => states.setDilrCorrect(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Time (mins)</label>
                  <input
                    type="number" required value={states.dilrTime} onChange={(e) => states.setDilrTime(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500/30"
                  />
                </div>
              </div>
            </div>

            {/* QUANT */}
            <div className="rounded-lg border border-white/[0.03] bg-white/[0.01] p-3">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Quant Sectional</span>
              <div className="mt-2.5 grid gap-2.5 grid-cols-2 sm:grid-cols-4">
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Net Score</label>
                  <input
                    type="number" required value={states.quantScore} onChange={(e) => states.setQuantScore(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Attempted</label>
                  <input
                    type="number" required value={states.quantAttempted} onChange={(e) => states.setQuantAttempted(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Correct</label>
                  <input
                    type="number" required value={states.quantCorrect} onChange={(e) => states.setQuantCorrect(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Time (mins)</label>
                  <input
                    type="number" required value={states.quantTime} onChange={(e) => states.setQuantTime(e.target.value)}
                    className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Topic breakdowns */}
          <div className="space-y-4 border-t border-white/[0.04] pt-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-550 flex items-center gap-1.5">
              <Award className="h-4 w-4" /> Mock Topic Breakdowns (Optional)
            </h3>
            <p className="text-[10px] text-zinc-500">Enter attempted/correct counts for topics in this mock to feed fine-grained leakage analysis.</p>

            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(COMMON_TOPICS).map(([secName, topics]) => (
                <div key={secName} className="rounded-lg border border-white/[0.03] bg-zinc-950/50 p-3 space-y-2.5">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-white/[0.03] pb-1.5 font-mono">{secName}</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {topics.map(topic => {
                      const val = states.topicBreakdown[topic] || { attempted: '', correct: '' };
                      return (
                        <div key={topic} className="flex items-center justify-between text-xs gap-3">
                          <span className="text-zinc-400 truncate w-24">{topic}</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number" placeholder="Att" value={val.attempted}
                              onChange={(e) => states.handleTopicChange(topic, 'attempted', e.target.value)}
                              className="w-12 rounded border border-white/[0.06] bg-zinc-950 text-center text-xs py-0.5 text-white outline-none"
                            />
                            <span className="text-zinc-650">/</span>
                            <input
                              type="number" placeholder="Corr" value={val.correct}
                              onChange={(e) => states.handleTopicChange(topic, 'correct', e.target.value)}
                              className="w-12 rounded border border-white/[0.06] bg-zinc-950 text-center text-xs py-0.5 text-white outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.04]">
            <button
              type="button" onClick={onClose}
              className="rounded border border-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/[0.02]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-500 hover:bg-blue-600 px-6 py-2 text-xs font-semibold text-white transition-colors"
            >
              Save Mock Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
