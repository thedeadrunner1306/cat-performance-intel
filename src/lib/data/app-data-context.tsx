'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Mock, QuestionLog } from '@/types/database';
import { useAuth } from '@/lib/context/auth-context';
import { supabase, DEMO_MODE } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE KEYS
// ─────────────────────────────────────────────────────────────────────────────
const LS_MOCKS = 'demo_mocks';
const LS_LOGS  = 'demo_logs';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function loadFromLS<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[]; }
  catch { return []; }
}

function saveToLS<T>(key: string, data: T[]) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(data));
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT TYPE
// ─────────────────────────────────────────────────────────────────────────────
interface AppDataContextType {
  mocks: Mock[];
  logs: QuestionLog[];
  addMock: (newMockData: any, newLogsData: any[]) => Promise<{ error: any | null }>;
  addPracticeSession: (session: any) => Promise<{ error: any | null }>;
  updatePracticeSession: (sessionId: string, session: any) => Promise<{ error: any | null }>;
  updateMock: (mockId: string, newMockData: any, newLogsData: any[]) => Promise<{ error: any | null }>;
  deleteLog: (logId: string) => Promise<void>;
  deleteMock: (mockId: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  loadSeedData: () => Promise<void>;
  isLoading: boolean;
}

const AppDataContext = createContext<AppDataContextType>({
  mocks: [],
  logs: [],
  addMock: async () => ({ error: 'Not initialized' }),
  addPracticeSession: async () => ({ error: 'Not initialized' }),
  updatePracticeSession: async () => ({ error: 'Not initialized' }),
  updateMock: async () => ({ error: 'Not initialized' }),
  deleteLog: async () => {},
  deleteMock: async () => {},
  clearAllData: async () => {},
  loadSeedData: async () => {},
  isLoading: true,
});

export const useAppData = () => useContext(AppDataContext);

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mocks, setMocks] = useState<Mock[]>([]);
  const [logs, setLogs]   = useState<QuestionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── DEMO MODE: read/write localStorage ─────────────────────────────────────
  const loadLocalData = useCallback(() => {
    setMocks(loadFromLS<Mock>(LS_MOCKS));
    setLogs(loadFromLS<QuestionLog>(LS_LOGS));
    setIsLoading(false);
  }, []);

  // ── LIVE MODE: read from Supabase ──────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) { setMocks([]); setLogs([]); setIsLoading(false); return; }

    setIsLoading(true);
    try {
      const { data: dbMocks, error: mocksErr } = await supabase
        .from('mocks').select('*').eq('user_id', user.id).order('mock_date', { ascending: true });
      if (mocksErr) throw mocksErr;

      const { data: dbSessions, error: sessionsErr } = await supabase
        .from('practice_sessions').select('*').eq('user_id', user.id).order('session_date', { ascending: true });
      if (sessionsErr) throw sessionsErr;

      const { data: dbBreakdowns, error: breakdownsErr } = await supabase
        .from('mock_topic_breakdown')
        .select(`id, mock_id, section, topic, attempted, correct, wrong, marks_gained, marks_lost, created_at, mocks!inner(user_id, mock_date)`)
        .eq('mocks.user_id', user.id);
      if (breakdownsErr) throw breakdownsErr;

      const mappedMocks: Mock[] = (dbMocks || []).map((m: any) => ({
        id: m.id, user_id: m.user_id, mock_name: m.mock_name, mock_provider: m.mock_provider || 'IMS',
        mock_date: m.mock_date,
        overall_score: m.overall_score !== null ? Number(m.overall_score) : null,
        overall_percentile: m.percentile !== null ? Number(m.percentile) : null,
        varc_score: m.varc_score !== null ? Number(m.varc_score) : null,
        dilr_score: m.dilr_score !== null ? Number(m.dilr_score) : null,
        quant_score: m.quant_score !== null ? Number(m.quant_score) : null,
        total_time_minutes: (Number(m.varc_time) || 0) + (Number(m.dilr_time) || 0) + (Number(m.quant_time) || 0),
        varc_time_minutes: m.varc_time !== null ? Number(m.varc_time) : null,
        dilr_time_minutes: m.dilr_time !== null ? Number(m.dilr_time) : null,
        quant_time_minutes: m.quant_time !== null ? Number(m.quant_time) : null,
        notes: m.notes || null, created_at: m.created_at,
      }));

      const mappedSessions: QuestionLog[] = (dbSessions || []).map((s: any) => ({
        id: s.id, user_id: s.user_id, mock_id: null, section: s.section, topic: s.topic,
        subtopic: s.subtopic, questions_attempted: s.attempted, questions_correct: s.correct,
        questions_wrong: s.wrong, time_spent_minutes: s.time_spent_minutes ? Number(s.time_spent_minutes) : null,
        difficulty: s.difficulty, mistake_type: null, date: s.session_date, notes: s.notes || null,
        created_at: s.created_at,
      }));

      const mappedBreakdowns: QuestionLog[] = (dbBreakdowns || []).map((b: any) => {
        const lost = b.marks_lost !== null ? Number(b.marks_lost) : 0;
        return {
          id: b.id, user_id: user.id, mock_id: b.mock_id, section: b.section, topic: b.topic,
          subtopic: null, questions_attempted: b.attempted, questions_correct: b.correct,
          questions_wrong: b.wrong, time_spent_minutes: null, difficulty: 'Medium' as const,
          mistake_type: lost > 0 ? 'Concept Error' as const : null,
          date: b.mocks.mock_date, notes: null, created_at: b.created_at,
        };
      });

      setMocks(mappedMocks);
      setLogs([...mappedSessions, ...mappedBreakdowns].sort(
        (a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at)
      ));
    } catch (err) {
      console.error('Error synchronizing database data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (DEMO_MODE) {
      loadLocalData();
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DEMO_MODE ? 'demo' : user?.id]);

  // ─────────────────────────────────────────────────────────────────────────
  // DEMO MODE CRUD — localStorage
  // ─────────────────────────────────────────────────────────────────────────
  const addMock = async (newMockData: any, newLogsData: any[]) => {
    if (DEMO_MODE) {
      const mockId = uuid();
      const now = new Date().toISOString();
      const newMock: Mock = {
        id: mockId,
        user_id: user?.id || 'demo-local-user-001',
        mock_name: newMockData.mock_name,
        mock_provider: newMockData.mock_provider || 'IMS',
        mock_date: newMockData.mock_date,
        overall_score: Number(newMockData.overall_score) || 0,
        overall_percentile: Number(newMockData.overall_percentile) || null,
        varc_score: Number(newMockData.varc_score) || 0,
        dilr_score: Number(newMockData.dilr_score) || 0,
        quant_score: Number(newMockData.quant_score) || 0,
        total_time_minutes: (Number(newMockData.varc_time_minutes) || 40) + (Number(newMockData.dilr_time_minutes) || 40) + (Number(newMockData.quant_time_minutes) || 40),
        varc_time_minutes: Number(newMockData.varc_time_minutes) || 40,
        dilr_time_minutes: Number(newMockData.dilr_time_minutes) || 40,
        quant_time_minutes: Number(newMockData.quant_time_minutes) || 40,
        notes: newMockData.notes || null,
        created_at: now,
      };
      const breakdownLogs: QuestionLog[] = newLogsData.map(l => ({
        id: uuid(), user_id: user?.id || 'demo-local-user-001',
        mock_id: mockId, section: l.section, topic: l.topic, subtopic: null,
        questions_attempted: l.questions_attempted, questions_correct: l.questions_correct,
        questions_wrong: l.questions_wrong, time_spent_minutes: null, difficulty: 'Medium' as const,
        mistake_type: l.questions_wrong > 0 ? 'Concept Error' as const : null,
        date: newMockData.mock_date, notes: null, created_at: now,
      }));

      const updatedMocks = [...mocks, newMock].sort((a, b) => a.mock_date.localeCompare(b.mock_date));
      const updatedLogs = [...logs, ...breakdownLogs].sort((a, b) => a.date.localeCompare(b.date));
      setMocks(updatedMocks);
      setLogs(updatedLogs);
      saveToLS(LS_MOCKS, updatedMocks);
      saveToLS(LS_LOGS, updatedLogs);
      return { error: null };
    }

    // Live mode
    if (!user) return { error: 'Unauthorized' };
    try {
      const { data: dbMock, error: mockErr } = await supabase.from('mocks').insert({
        user_id: user.id, mock_name: newMockData.mock_name, mock_provider: newMockData.mock_provider || 'IMS',
        mock_date: newMockData.mock_date, overall_score: newMockData.overall_score || 0,
        percentile: newMockData.overall_percentile || 90, varc_score: newMockData.varc_score || 0,
        dilr_score: newMockData.dilr_score || 0, quant_score: newMockData.quant_score || 0,
        varc_attempted: newMockData.varc_attempted || 0, varc_correct: newMockData.varc_correct || 0,
        varc_wrong: newMockData.varc_wrong || 0, varc_time: newMockData.varc_time_minutes || 40,
        dilr_sets_seen: newMockData.dilr_sets_seen || 4, dilr_sets_attempted: newMockData.dilr_sets_attempted || 0,
        dilr_sets_completed: newMockData.dilr_sets_completed || 0, dilr_time: newMockData.dilr_time_minutes || 40,
        quant_attempted: newMockData.quant_attempted || 0, quant_correct: newMockData.quant_correct || 0,
        quant_wrong: newMockData.quant_wrong || 0, quant_time: newMockData.quant_time_minutes || 40,
        notes: newMockData.notes || '',
      }).select().single();
      if (mockErr) throw mockErr;
      if (newLogsData.length > 0) {
        const { error: bErr } = await supabase.from('mock_topic_breakdown').insert(
          newLogsData.map(l => ({ mock_id: dbMock.id, section: l.section, topic: l.topic,
            attempted: l.questions_attempted, correct: l.questions_correct, wrong: l.questions_wrong,
            marks_gained: l.questions_correct * 3, marks_lost: l.questions_wrong * 1 }))
        );
        if (bErr) throw bErr;
      }
      await fetchData();
      return { error: null };
    } catch (err: any) { return { error: err.message || err }; }
  };

  const addPracticeSession = async (session: any) => {
    if (DEMO_MODE) {
      const now = new Date().toISOString();
      const newLog: QuestionLog = {
        id: uuid(),
        user_id: user?.id || 'demo-local-user-001',
        mock_id: null,
        section: session.section,
        topic: session.topic,
        subtopic: session.subtopic || null,
        questions_attempted: Number(session.questions_attempted),
        questions_correct: Number(session.questions_correct),
        questions_wrong: Number(session.questions_wrong),
        time_spent_minutes: Number(session.time_spent_minutes) || null,
        difficulty: session.difficulty || 'Medium',
        mistake_type: null,
        date: session.date,
        notes: session.notes || null,
        created_at: now,
      };
      const updatedLogs = [...logs, newLog].sort((a, b) => a.date.localeCompare(b.date));
      setLogs(updatedLogs);
      saveToLS(LS_LOGS, updatedLogs);
      return { error: null };
    }

    if (!user) return { error: 'Unauthorized' };
    try {
      const { error } = await supabase.from('practice_sessions').insert({
        user_id: user.id, section: session.section, topic: session.topic, subtopic: session.subtopic,
        attempted: session.questions_attempted, correct: session.questions_correct, wrong: session.questions_wrong,
        time_spent_minutes: session.time_spent_minutes || 0, difficulty: session.difficulty || 'Medium',
        source: session.source || 'Self Practice', confidence: session.confidence || 3,
        notes: session.notes || '', session_date: session.date,
      });
      if (error) throw error;
      await fetchData();
      return { error: null };
    } catch (err: any) { return { error: err.message || err }; }
  };

  const updatePracticeSession = async (sessionId: string, session: any) => {
    if (DEMO_MODE) {
      const updatedLogs = logs.map(l => l.id !== sessionId ? l : {
        ...l,
        section: session.section, topic: session.topic, subtopic: session.subtopic || null,
        questions_attempted: Number(session.questions_attempted), questions_correct: Number(session.questions_correct),
        questions_wrong: Number(session.questions_wrong), time_spent_minutes: Number(session.time_spent_minutes) || null,
        difficulty: session.difficulty || 'Medium', date: session.date, notes: session.notes || null,
      });
      setLogs(updatedLogs);
      saveToLS(LS_LOGS, updatedLogs);
      return { error: null };
    }

    if (!user) return { error: 'Unauthorized' };
    try {
      const { error } = await supabase.from('practice_sessions').update({
        section: session.section, topic: session.topic, subtopic: session.subtopic,
        attempted: session.questions_attempted, correct: session.questions_correct, wrong: session.questions_wrong,
        time_spent_minutes: session.time_spent_minutes || 0, difficulty: session.difficulty || 'Medium',
        source: session.source || 'Self Practice', confidence: session.confidence || 3,
        notes: session.notes || '', session_date: session.date, updated_at: new Date().toISOString(),
      }).eq('id', sessionId);
      if (error) throw error;
      await fetchData();
      return { error: null };
    } catch (err: any) { return { error: err.message || err }; }
  };

  const updateMock = async (mockId: string, newMockData: any, newLogsData: any[]) => {
    if (DEMO_MODE) {
      const updatedMocks = mocks.map(m => m.id !== mockId ? m : {
        ...m,
        mock_name: newMockData.mock_name, mock_provider: newMockData.mock_provider || 'IMS',
        mock_date: newMockData.mock_date,
        overall_score: Number(newMockData.overall_score),
        overall_percentile: Number(newMockData.overall_percentile),
        varc_score: Number(newMockData.varc_score), dilr_score: Number(newMockData.dilr_score),
        quant_score: Number(newMockData.quant_score),
        total_time_minutes: (Number(newMockData.varc_time_minutes) || 40) + (Number(newMockData.dilr_time_minutes) || 40) + (Number(newMockData.quant_time_minutes) || 40),
        varc_time_minutes: Number(newMockData.varc_time_minutes) || 40,
        dilr_time_minutes: Number(newMockData.dilr_time_minutes) || 40,
        quant_time_minutes: Number(newMockData.quant_time_minutes) || 40,
        notes: newMockData.notes || null,
      });
      const now = new Date().toISOString();
      const newBreakdowns: QuestionLog[] = newLogsData.map(l => ({
        id: uuid(), user_id: user?.id || 'demo-local-user-001',
        mock_id: mockId, section: l.section, topic: l.topic, subtopic: null,
        questions_attempted: l.questions_attempted, questions_correct: l.questions_correct,
        questions_wrong: l.questions_wrong, time_spent_minutes: null, difficulty: 'Medium' as const,
        mistake_type: l.questions_wrong > 0 ? 'Concept Error' as const : null,
        date: newMockData.mock_date, notes: null, created_at: now,
      }));
      const updatedLogs = [...logs.filter(l => l.mock_id !== mockId), ...newBreakdowns];
      setMocks(updatedMocks);
      setLogs(updatedLogs);
      saveToLS(LS_MOCKS, updatedMocks);
      saveToLS(LS_LOGS, updatedLogs);
      return { error: null };
    }

    if (!user) return { error: 'Unauthorized' };
    try {
      const { error: mockErr } = await supabase.from('mocks').update({
        mock_name: newMockData.mock_name, mock_provider: newMockData.mock_provider || 'IMS',
        mock_date: newMockData.mock_date, overall_score: newMockData.overall_score || 0,
        percentile: newMockData.overall_percentile || 90, varc_score: newMockData.varc_score || 0,
        dilr_score: newMockData.dilr_score || 0, quant_score: newMockData.quant_score || 0,
        varc_attempted: newMockData.varc_attempted || 0, varc_correct: newMockData.varc_correct || 0,
        varc_wrong: newMockData.varc_wrong || 0, varc_time: newMockData.varc_time_minutes || 40,
        dilr_sets_seen: newMockData.dilr_sets_seen || 4, dilr_sets_attempted: newMockData.dilr_sets_attempted || 0,
        dilr_sets_completed: newMockData.dilr_sets_completed || 0, dilr_time: newMockData.dilr_time_minutes || 40,
        quant_attempted: newMockData.quant_attempted || 0, quant_correct: newMockData.quant_correct || 0,
        quant_wrong: newMockData.quant_wrong || 0, quant_time: newMockData.quant_time_minutes || 40,
        notes: newMockData.notes || '', updated_at: new Date().toISOString(),
      }).eq('id', mockId);
      if (mockErr) throw mockErr;
      await supabase.from('mock_topic_breakdown').delete().eq('mock_id', mockId);
      if (newLogsData.length > 0) {
        const { error: bErr } = await supabase.from('mock_topic_breakdown').insert(
          newLogsData.map(l => ({ mock_id: mockId, section: l.section, topic: l.topic,
            attempted: l.questions_attempted, correct: l.questions_correct, wrong: l.questions_wrong,
            marks_gained: l.questions_correct * 3, marks_lost: l.questions_wrong * 1 }))
        );
        if (bErr) throw bErr;
      }
      await fetchData();
      return { error: null };
    } catch (err: any) { return { error: err.message || err }; }
  };

  const deleteLog = async (logId: string) => {
    if (DEMO_MODE) {
      const updatedLogs = logs.filter(l => l.id !== logId);
      setLogs(updatedLogs);
      saveToLS(LS_LOGS, updatedLogs);
      return;
    }
    if (!user) return;
    try {
      await supabase.from('practice_sessions').delete().eq('id', logId);
      await fetchData();
    } catch (err) { console.error('Error deleting log:', err); }
  };

  const deleteMock = async (mockId: string) => {
    if (DEMO_MODE) {
      const updatedMocks = mocks.filter(m => m.id !== mockId);
      const updatedLogs = logs.filter(l => l.mock_id !== mockId);
      setMocks(updatedMocks);
      setLogs(updatedLogs);
      saveToLS(LS_MOCKS, updatedMocks);
      saveToLS(LS_LOGS, updatedLogs);
      return;
    }
    if (!user) return;
    try {
      await supabase.from('mocks').delete().eq('id', mockId);
      await fetchData();
    } catch (err) { console.error('Error deleting mock:', err); }
  };

  const clearAllData = async () => {
    if (DEMO_MODE) {
      setMocks([]);
      setLogs([]);
      saveToLS(LS_MOCKS, []);
      saveToLS(LS_LOGS, []);
      return;
    }
    if (!user) return;
    try {
      await supabase.from('practice_sessions').delete().eq('user_id', user.id);
      await supabase.from('mocks').delete().eq('user_id', user.id);
      await fetchData();
    } catch (err) { console.error('Error clearing data:', err); }
  };

  const loadSeedData = async () => {
    if (DEMO_MODE) {
      const { getDemoMocks, getDemoQuestionLogs } = await import('./seed-data');
      const dMocks = getDemoMocks();
      const dLogs = getDemoQuestionLogs();
      setMocks(dMocks);
      setLogs(dLogs);
      saveToLS(LS_MOCKS, dMocks);
      saveToLS(LS_LOGS, dLogs);
      return;
    }
    if (!user) return;
    try {
      setIsLoading(true);
      // 1. Wipe existing data
      await supabase.from('practice_sessions').delete().eq('user_id', user.id);
      await supabase.from('mocks').delete().eq('user_id', user.id);

      // 2. Load demo data structures
      const { getDemoMocks, getDemoQuestionLogs } = await import('./seed-data');
      const dMocks = getDemoMocks();
      const dLogs = getDemoQuestionLogs();

      // 3. Insert mocks and record mapping
      const insertedMocksMap: Record<string, string> = {};
      for (const m of dMocks) {
        const { data, error } = await supabase.from('mocks').insert({
          user_id: user.id,
          mock_name: m.mock_name,
          mock_provider: m.mock_provider,
          mock_date: m.mock_date,
          overall_score: m.overall_score || 0,
          percentile: m.overall_percentile || null,
          varc_score: m.varc_score || 0,
          dilr_score: m.dilr_score || 0,
          quant_score: m.quant_score || 0,
          varc_time: m.varc_time_minutes || 40,
          dilr_time: m.dilr_time_minutes || 40,
          quant_time: m.quant_time_minutes || 40,
          notes: m.notes || ''
        }).select().single();
        if (error) throw error;
        if (data) {
          insertedMocksMap[m.id] = data.id;
        }
      }

      // 4. Insert mock breakdowns
      const breakdownsToInsert = dLogs
        .filter(l => l.mock_id && insertedMocksMap[l.mock_id])
        .map(l => ({
          mock_id: insertedMocksMap[l.mock_id!],
          section: l.section,
          topic: l.topic,
          attempted: l.questions_attempted,
          correct: l.questions_correct,
          wrong: l.questions_wrong,
          marks_gained: l.questions_correct * 3,
          marks_lost: l.questions_wrong * 1
        }));

      for (let i = 0; i < breakdownsToInsert.length; i += 50) {
        const chunk = breakdownsToInsert.slice(i, i + 50);
        const { error } = await supabase.from('mock_topic_breakdown').insert(chunk);
        if (error) throw error;
      }

      // 5. Insert standalone practice sessions
      const practiceSessions = [
        { section: 'Quant', topic: 'Arithmetic', subtopic: 'Percentages', attempted: 15, correct: 12, wrong: 3, time_spent_minutes: 20, difficulty: 'Medium', source: 'Self Practice', confidence: 4, notes: 'Good accuracy in percentages', session_date: '2025-03-24' },
        { section: 'Quant', topic: 'Algebra', subtopic: 'Equations', attempted: 12, correct: 7, wrong: 5, time_spent_minutes: 25, difficulty: 'Hard', source: 'IMS', confidence: 2, notes: 'Struggled with quadratic formulations', session_date: '2025-03-25' },
        { section: 'VARC', topic: 'Reading Comprehension', subtopic: 'Philosophy', attempted: 8, correct: 5, wrong: 3, time_spent_minutes: 18, difficulty: 'Hard', source: 'Self Practice', confidence: 3, notes: 'Dense passage from Kant', session_date: '2025-03-26' },
        { section: 'DILR', topic: 'Games & Tournaments', subtopic: null, attempted: 4, correct: 4, wrong: 0, time_spent_minutes: 15, difficulty: 'Medium', source: 'CL', confidence: 5, notes: 'Solved the grid quickly', session_date: '2025-03-27' },
      ].map(s => ({
        user_id: user.id,
        section: s.section,
        topic: s.topic,
        subtopic: s.subtopic,
        attempted: s.attempted,
        correct: s.correct,
        wrong: s.wrong,
        time_spent_minutes: s.time_spent_minutes,
        difficulty: s.difficulty,
        source: s.source,
        confidence: s.confidence,
        notes: s.notes,
        session_date: s.session_date
      }));

      const { error: pErr } = await supabase.from('practice_sessions').insert(practiceSessions);
      if (pErr) throw pErr;

      await fetchData();
    } catch (err) {
      console.error('Error seeding data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppDataContext.Provider value={{
      mocks, logs, addMock, addPracticeSession, updatePracticeSession,
      updateMock, deleteLog, deleteMock, clearAllData, loadSeedData, isLoading,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}
