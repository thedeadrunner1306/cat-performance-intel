'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Calendar, BarChart3, Edit2, Trash2, ArrowLeft, X, Save, Award } from 'lucide-react';
import { useAppData } from '@/lib/data/app-data-context';
import { supabase } from '@/lib/supabase';
import type { Mock } from '@/types/database';

const COMMON_TOPICS: Record<string, string[]> = {
  Quant: ['Arithmetic', 'Algebra', 'Geometry', 'Number System', 'Modern Math'],
  VARC: ['Reading Comprehension', 'Verbal Ability'],
  DILR: ['Arrangements', 'Games & Tournaments', 'Venn Diagrams', 'Puzzles', 'Tables', 'Caselets']
};

export function MockHistoryView() {
  const { mocks, logs, updateMock, deleteMock } = useAppData();

  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [sortAsc, setSortAsc] = useState(false);

  // Edit State
  const [editingMock, setEditingMock] = useState<Mock | null>(null);
  const [editName, setEditName] = useState('');
  const [editProvider, setEditProvider] = useState('IMS');
  const [editDate, setEditDate] = useState('');
  const [editPercentile, setEditPercentile] = useState('90');

  const [editVarcScore, setEditVarcScore] = useState('');
  const [editVarcAttempted, setEditVarcAttempted] = useState('');
  const [editVarcCorrect, setEditVarcCorrect] = useState('');
  const [editVarcTime, setEditVarcTime] = useState('40');

  const [editDilrScore, setEditDilrScore] = useState('');
  const [editDilrAttempted, setEditDilrAttempted] = useState('');
  const [editDilrCorrect, setEditDilrCorrect] = useState('');
  const [editDilrTime, setEditDilrTime] = useState('40');

  const [editQuantScore, setEditQuantScore] = useState('');
  const [editQuantAttempted, setEditQuantAttempted] = useState('');
  const [editQuantCorrect, setEditQuantCorrect] = useState('');
  const [editQuantTime, setEditQuantTime] = useState('40');

  const [editTopicBreakdown, setEditTopicBreakdown] = useState<Record<string, { attempted: string; correct: string }>>({});
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Retrieve breakdowns for the mock being edited
  useEffect(() => {
    if (editingMock) {
      // Find breakdowns in our loaded logs
      const breakdownLogs = logs.filter(l => l.mock_id === editingMock.id);
      const breakdownMap: Record<string, { attempted: string; correct: string }> = {};
      
      breakdownLogs.forEach(l => {
        breakdownMap[l.topic] = {
          attempted: String(l.questions_attempted),
          correct: String(l.questions_correct)
        };
      });
      setEditTopicBreakdown(breakdownMap);
    }
  }, [editingMock, logs]);

  // Filter mocks
  const filteredMocks = useMemo(() => {
    let result = [...mocks];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.mock_name.toLowerCase().includes(q)
      );
    }

    if (selectedProvider !== 'All') {
      result = result.filter(
        (m) => m.mock_provider && m.mock_provider.toLowerCase() === selectedProvider.toLowerCase()
      );
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.mock_date).getTime();
      const dateB = new Date(b.mock_date).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [mocks, search, selectedProvider, sortAsc]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this mock test and all its topic breakdowns? This cannot be undone.')) {
      await deleteMock(id);
    }
  };

  const handleEditClick = (mock: Mock) => {
    setEditingMock(mock);
    setEditName(mock.mock_name);
    // Let's query mock_provider from database if needed or default it
    // Wait, since mock_provider is in database, let's fetch it or default to 'IMS'
    // Let's write a quick database query or let's default to IMS. Let's make it fetch real provider.
    supabase.from('mocks').select('mock_provider, varc_attempted, varc_correct, varc_wrong, dilr_sets_seen, dilr_sets_attempted, dilr_sets_completed, quant_attempted, quant_correct, quant_wrong, notes')
      .eq('id', mock.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEditProvider(data.mock_provider || 'IMS');
          setEditVarcAttempted(String(data.varc_attempted || 0));
          setEditVarcCorrect(String(data.varc_correct || 0));
          setEditDilrAttempted(String(data.dilr_sets_attempted || 0));
          setEditDilrCorrect(String(data.dilr_sets_completed || 0));
          setEditQuantAttempted(String(data.quant_attempted || 0));
          setEditQuantCorrect(String(data.quant_correct || 0));
        }
      });

    setEditDate(mock.mock_date);
    setEditPercentile(String(mock.overall_percentile || 90));
    setEditVarcScore(String(mock.varc_score || 0));
    setEditVarcTime(String(mock.varc_time_minutes || 40));
    setEditDilrScore(String(mock.dilr_score || 0));
    setEditDilrTime(String(mock.dilr_time_minutes || 40));
    setEditQuantScore(String(mock.quant_score || 0));
    setEditQuantTime(String(mock.quant_time_minutes || 40));
    setEditError('');
  };

  const handleTopicChange = (topic: string, field: 'attempted' | 'correct', val: string) => {
    setEditTopicBreakdown(prev => {
      const existing = prev[topic] || { attempted: '', correct: '' };
      return {
        ...prev,
        [topic]: {
          attempted: existing.attempted ?? '',
          correct: existing.correct ?? '',
          [field]: val
        }
      };
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMock) return;
    setEditError('');

    const overallScore = Number(editVarcScore) + Number(editDilrScore) + Number(editQuantScore);

    setEditLoading(true);

    const mockData = {
      mock_name: editName,
      mock_provider: editProvider,
      mock_date: editDate,
      overall_score: overallScore,
      overall_percentile: Number(editPercentile),
      varc_score: Number(editVarcScore),
      dilr_score: Number(editDilrScore),
      quant_score: Number(editQuantScore),
      varc_attempted: Number(editVarcAttempted) || 0,
      varc_correct: Number(editVarcCorrect) || 0,
      varc_wrong: Math.max(0, (Number(editVarcAttempted) || 0) - (Number(editVarcCorrect) || 0)),
      varc_time_minutes: Number(editVarcTime) || 40,
      dilr_sets_seen: 4,
      dilr_sets_attempted: Number(editDilrAttempted) || 0,
      dilr_sets_completed: Number(editDilrCorrect) || 0,
      dilr_time_minutes: Number(editDilrTime) || 40,
      quant_attempted: Number(editQuantAttempted) || 0,
      quant_correct: Number(editQuantCorrect) || 0,
      quant_wrong: Math.max(0, (Number(editQuantAttempted) || 0) - (Number(editQuantCorrect) || 0)),
      quant_time_minutes: Number(editQuantTime) || 40,
      notes: ''
    };

    // Construct mock breakdowns
    const logsData: any[] = [];
    Object.entries(COMMON_TOPICS).forEach(([sec, topics]) => {
      topics.forEach(topic => {
        const entry = editTopicBreakdown[topic];
        const att = Number(entry?.attempted) || 0;
        const corr = Number(entry?.correct) || 0;
        if (att > 0) {
          logsData.push({
            section: sec,
            topic: topic,
            questions_attempted: att,
            questions_correct: corr,
            questions_wrong: Math.max(0, att - corr)
          });
        }
      });
    });

    const { error } = await updateMock(editingMock.id, mockData, logsData);

    if (error) {
      setEditError(typeof error === 'string' ? error : error.message || 'Failed to update mock report.');
      setEditLoading(false);
    } else {
      setEditingMock(null);
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between border-b border-white/[0.04] pb-4">
        <div>
          <Link href="/mocks" className="inline-flex items-center gap-2 text-xs font-mono text-zinc-555 hover:text-zinc-300 transition-colors uppercase">
            <ArrowLeft className="h-3 w-3" /> Back to Mocks Hub
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Mock Exam History Ledger
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Audit, edit, and delete mock reports and breakdowns in public.mocks
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="grid gap-3 sm:grid-cols-4">
        {/* Search */}
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-555" />
          <input
            type="text"
            placeholder="Search mock name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-blue-500/30 transition-all placeholder-zinc-650"
          />
        </div>

        {/* Provider Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-555" />
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-zinc-950 hover:bg-zinc-900/50 py-2 pl-9 pr-4 text-xs text-zinc-300 outline-none focus:border-blue-500/30 transition-all appearance-none cursor-pointer"
          >
            <option value="All">All Providers</option>
            <option value="IMS">IMS</option>
            <option value="CL">CL</option>
            <option value="TIME">T.I.M.E.</option>
            <option value="PYQ">PYQ (Past Year)</option>
          </select>
        </div>

        {/* Date Sort Toggle */}
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] px-4 py-2 text-xs text-zinc-350 transition-colors w-full"
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Sort: Date {sortAsc ? 'Ascending' : 'Descending'}
          </span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] bg-zinc-950 overflow-hidden shadow-xl">
        {filteredMocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.01] text-[10px] uppercase font-bold text-zinc-550 tracking-wider font-mono">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-4 py-3">Mock Name</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-center">Percentile</th>
                  <th className="px-4 py-3 text-center">VARC</th>
                  <th className="px-4 py-3 text-center">DILR</th>
                  <th className="px-4 py-3 text-center">Quant</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredMocks.map((mock) => {
                  return (
                    <tr key={mock.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-5 py-3.5 text-zinc-300 font-mono whitespace-nowrap">
                        {mock.mock_date}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-zinc-200">
                        {mock.mock_name}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-3xl font-extrabold text-white">
                        {mock.overall_score}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-zinc-350">
                        {mock.overall_percentile}%ile
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-violet-400 font-semibold">
                        {mock.varc_score}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-blue-400 font-semibold">
                        {mock.dilr_score}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-cyan-400 font-semibold">
                        {mock.quant_score}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleEditClick(mock)}
                          className="text-zinc-500 hover:text-blue-400 rounded p-1 hover:bg-blue-500/10 transition-all inline-flex"
                          title="Edit mock report"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(mock.id)}
                          className="text-zinc-500 hover:text-rose-450 rounded p-1 hover:bg-rose-500/10 transition-all inline-flex"
                          title="Delete mock report"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-550">
            <BarChart3 className="h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-xs">No mock reports found in history.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingMock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl border border-white/[0.06] bg-zinc-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setEditingMock(null)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-350 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-blue-400" />
              Edit Mock Test Report
            </h2>
            <p className="mt-1 text-xs text-zinc-500">Edit scores, section times, and topic distributions</p>

            {editError && (
              <div className="mt-4 rounded bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-6 space-y-6">
              {/* Metadata */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Mock Name</label>
                  <input
                    type="text" required
                    value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Provider</label>
                  <select
                    value={editProvider} onChange={(e) => setEditProvider(e.target.value)}
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
                    value={editDate} onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Percentile</label>
                  <input
                    type="number" step="0.01" required
                    value={editPercentile} onChange={(e) => setEditPercentile(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                  />
                </div>
              </div>

              {/* Sections details */}
              <div className="space-y-4 border-t border-white/[0.04] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-550">Sectional Scores</h3>

                {/* VARC */}
                <div className="rounded-lg border border-white/[0.03] bg-white/[0.01] p-3">
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">VARC</span>
                  <div className="mt-2 grid gap-2 sm:grid-cols-4">
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Net Score</label>
                      <input
                        type="number" required value={editVarcScore} onChange={(e) => setEditVarcScore(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-violet-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Attempted</label>
                      <input
                        type="number" required value={editVarcAttempted} onChange={(e) => setEditVarcAttempted(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-violet-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Correct</label>
                      <input
                        type="number" required value={editVarcCorrect} onChange={(e) => setEditVarcCorrect(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-violet-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Time (mins)</label>
                      <input
                        type="number" required value={editVarcTime} onChange={(e) => setEditVarcTime(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-violet-500/30"
                      />
                    </div>
                  </div>
                </div>

                {/* DILR */}
                <div className="rounded-lg border border-white/[0.03] bg-white/[0.01] p-3">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">DILR</span>
                  <div className="mt-2 grid gap-2 sm:grid-cols-4">
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Net Score</label>
                      <input
                        type="number" required value={editDilrScore} onChange={(e) => setEditDilrScore(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Attempted Sets</label>
                      <input
                        type="number" required value={editDilrAttempted} onChange={(e) => setEditDilrAttempted(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Solved Sets</label>
                      <input
                        type="number" required value={editDilrCorrect} onChange={(e) => setEditDilrCorrect(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Time (mins)</label>
                      <input
                        type="number" required value={editDilrTime} onChange={(e) => setEditDilrTime(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Quant */}
                <div className="rounded-lg border border-white/[0.03] bg-white/[0.01] p-3">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Quant</span>
                  <div className="mt-2 grid gap-2 sm:grid-cols-4">
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Net Score</label>
                      <input
                        type="number" required value={editQuantScore} onChange={(e) => setEditQuantScore(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-cyan-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Attempted</label>
                      <input
                        type="number" required value={editQuantAttempted} onChange={(e) => setEditQuantAttempted(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-cyan-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Correct</label>
                      <input
                        type="number" required value={editQuantCorrect} onChange={(e) => setEditQuantCorrect(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-cyan-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest text-zinc-500">Time (mins)</label>
                      <input
                        type="number" required value={editQuantTime} onChange={(e) => setEditQuantTime(e.target.value)}
                        className="mt-1 w-full rounded border border-white/[0.06] bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-cyan-500/30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Topic Breakdowns */}
              <div className="space-y-4 border-t border-white/[0.04] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-550">Topic Breakdowns</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(COMMON_TOPICS).map(([secName, topics]) => (
                    <div key={secName} className="rounded-lg border border-white/[0.03] bg-zinc-950/50 p-3 space-y-2.5">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-white/[0.03] pb-1.5 font-mono">{secName}</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {topics.map(topic => {
                          const val = editTopicBreakdown[topic] || { attempted: '', correct: '' };
                          return (
                            <div key={topic} className="flex items-center justify-between text-xs gap-3">
                              <span className="text-zinc-450 truncate w-24">{topic}</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number" placeholder="Att" value={val.attempted ?? ''}
                                  onChange={(e) => handleTopicChange(topic, 'attempted', e.target.value)}
                                  className="w-12 rounded border border-white/[0.06] bg-zinc-950 text-center text-xs py-0.5 text-white outline-none"
                                />
                                <span className="text-zinc-650">/</span>
                                <input
                                  type="number" placeholder="Corr" value={val.correct ?? ''}
                                  onChange={(e) => handleTopicChange(topic, 'correct', e.target.value)}
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
                  type="button" onClick={() => setEditingMock(null)}
                  className="rounded border border-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={editLoading}
                  className="flex items-center gap-2 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-6 py-2 text-xs font-semibold text-white transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {editLoading ? 'Saving...' : 'Save Mock Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
