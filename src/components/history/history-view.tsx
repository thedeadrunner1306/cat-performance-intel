'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Filter, Calendar, Clock, Target, Edit2, Trash2, ArrowLeft, X, Save, AlertTriangle } from 'lucide-react';
import { useAppData } from '@/lib/data/app-data-context';
import type { QuestionLog } from '@/types/database';

interface HistoryViewProps {
  section: 'Quant' | 'VARC' | 'DILR';
  sectionLabel: string;
  sectionColor: string;
  topics: string[];
}

export function HistoryView({ section, sectionLabel, sectionColor, topics }: HistoryViewProps) {
  const router = useRouter();
  const { logs, updatePracticeSession, deleteLog } = useAppData();

  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [sortAsc, setSortAsc] = useState(false);

  // Edit State
  const [editingLog, setEditingLog] = useState<QuestionLog | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editSubtopic, setEditSubtopic] = useState('');
  const [editAttempted, setEditAttempted] = useState(0);
  const [editCorrect, setEditCorrect] = useState(0);
  const [editTime, setEditTime] = useState(0);
  const [editDifficulty, setEditDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Filter logs for this section
  const sectionLogs = useMemo(() => {
    return logs.filter((l) => l.section === section && l.mock_id === null);
  }, [logs, section]);

  // Apply search and dropdown filters
  const filteredLogs = useMemo(() => {
    let result = [...sectionLogs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.topic.toLowerCase().includes(q) ||
          (l.subtopic && l.subtopic.toLowerCase().includes(q)) ||
          (l.notes && l.notes.toLowerCase().includes(q))
      );
    }

    if (selectedTopic !== 'All') {
      result = result.filter((l) => l.topic === selectedTopic);
    }

    if (selectedDifficulty !== 'All') {
      result = result.filter((l) => l.difficulty === selectedDifficulty);
    }

    // Sort by Date
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [sectionLogs, search, selectedTopic, selectedDifficulty, sortAsc]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this practice record?')) {
      await deleteLog(id);
    }
  };

  const handleEditClick = (log: QuestionLog) => {
    setEditingLog(log);
    setEditTopic(log.topic);
    setEditSubtopic(log.subtopic || '');
    setEditAttempted(log.questions_attempted);
    setEditCorrect(log.questions_correct);
    setEditTime(log.time_spent_minutes || 0);
    setEditDifficulty((log.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium');
    setEditNotes(log.notes || '');
    setEditDate(log.date);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    setEditError('');

    if (editCorrect > editAttempted) {
      setEditError('Correct count cannot exceed solved count.');
      return;
    }

    setEditLoading(true);

    const updatedSession = {
      section: section,
      topic: editTopic,
      subtopic: editSubtopic || null,
      questions_attempted: Number(editAttempted),
      questions_correct: Number(editCorrect),
      questions_wrong: Math.max(0, Number(editAttempted) - Number(editCorrect)),
      time_spent_minutes: Number(editTime),
      difficulty: editDifficulty,
      notes: editNotes,
      date: editDate,
      source: 'Self Practice',
      confidence: 3
    };

    const { error } = await updatePracticeSession(editingLog.id, updatedSession);

    if (error) {
      setEditError(typeof error === 'string' ? error : error.message || 'Failed to update record.');
      setEditLoading(false);
    } else {
      setEditingLog(null);
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header breadcrumbs & actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between border-b border-white/[0.04] pb-4">
        <div>
          <Link href={`/${section.toLowerCase()}`} className="inline-flex items-center gap-2 text-xs font-mono text-zinc-550 hover:text-zinc-300 transition-colors uppercase">
            <ArrowLeft className="h-3 w-3" /> Back to {sectionLabel}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {sectionLabel} Practice Ledger
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Audit, edit, search and filter practice logs
          </p>
        </div>
      </div>

      {/* Filters & search toolbar */}
      <div className="grid gap-3 sm:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-550" />
          <input
            type="text"
            placeholder="Search notes, subtopics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-blue-500/30 transition-all placeholder-zinc-650"
          />
        </div>

        {/* Topic Filter */}
        <div className="relative">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-zinc-950 px-3 py-2 text-xs text-zinc-350 outline-none focus:border-blue-500/30"
          >
            <option value="All">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="relative">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-zinc-950 px-3 py-2 text-xs text-zinc-350 outline-none focus:border-blue-500/30"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Date Sort Toggle */}
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] px-4 py-2 text-xs text-zinc-350 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Sort: Date {sortAsc ? 'Ascending' : 'Descending'}
          </span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl border border-white/[0.06] bg-zinc-950 overflow-hidden shadow-xl">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.01] text-[10px] uppercase font-bold text-zinc-550 tracking-wider font-mono">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-4 py-3">Topic</th>
                  <th className="px-4 py-3">Subtopic</th>
                  <th className="px-4 py-3 text-center">Attempted</th>
                  <th className="px-4 py-3 text-center">Correct</th>
                  <th className="px-4 py-3 text-center">Wrong</th>
                  <th className="px-4 py-3 text-center">Accuracy</th>
                  <th className="px-4 py-3 text-center">Time Spent</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredLogs.map((log) => {
                  const accuracy = log.questions_attempted > 0 
                    ? Math.round((log.questions_correct / log.questions_attempted) * 100) 
                    : 0;
                  const diffColors = {
                    Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    Medium: 'text-amber-450 bg-amber-500/10 border-amber-500/20',
                    Hard: 'text-rose-450 bg-rose-500/10 border-rose-500/20',
                  }[log.difficulty || 'Medium'];

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-5 py-3.5 text-zinc-300 font-mono whitespace-nowrap">
                        {log.date}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-zinc-200">
                        {log.topic}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-400 whitespace-nowrap">
                        {log.subtopic || <span className="text-zinc-650">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-zinc-200">
                        {log.questions_attempted}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-emerald-450 font-semibold">
                        {log.questions_correct}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-rose-455">
                        {log.questions_wrong}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono">
                        <span className={`font-semibold ${accuracy >= 75 ? 'text-emerald-400' : accuracy >= 45 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {accuracy}%
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
                      <td className="px-4 py-3.5 text-zinc-400 max-w-xs truncate" title={log.notes || undefined}>
                        {log.notes || <span className="text-zinc-650">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleEditClick(log)}
                          className="text-zinc-500 hover:text-blue-400 rounded p-1 hover:bg-blue-500/10 transition-all inline-flex"
                          title="Edit record"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="text-zinc-500 hover:text-rose-450 rounded p-1 hover:bg-rose-500/10 transition-all inline-flex"
                          title="Delete record"
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
            <Filter className="h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-xs">No matching ledger records found.</p>
            <p className="text-[10px] mt-0.5 text-zinc-600">Try adjusting your filters or logging new sessions.</p>
          </div>
        )}
      </div>

      {/* Edit Modal Dialog */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-xl border border-white/[0.06] bg-zinc-950 p-6 shadow-2xl">
            <button
              onClick={() => setEditingLog(null)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-350 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Edit2 className="h-4.5 w-4.5 text-blue-400" />
              Edit Practice Record
            </h2>
            <p className="mt-1 text-xs text-zinc-500">Modify logs stored in public.practice_sessions</p>

            {editError && (
              <div className="mt-4 rounded bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Topic</label>
                  <select
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                  >
                    {topics.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Subtopic</label>
                  <input
                    type="text"
                    value={editSubtopic}
                    onChange={(e) => setEditSubtopic(e.target.value)}
                    placeholder="e.g. Percentages"
                    className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Solved Qs</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editAttempted}
                    onChange={(e) => setEditAttempted(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30 text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Correct</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editCorrect}
                    onChange={(e) => setEditCorrect(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30 text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30 text-center font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Difficulty</label>
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value as any)}
                    className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Session Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-zinc-500 font-mono">Notes / Gaps</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record sillies, conceptual holes or notes here..."
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30 placeholder-zinc-700 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.04] mt-6">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="rounded border border-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/[0.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center gap-2 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-6 py-2 text-xs font-semibold text-white transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
