'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Save, Award, Check } from 'lucide-react';
import { useAppData } from '@/lib/data/app-data-context';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'quant' | 'varc' | 'dilr' | 'mock';
}

const QUANT_TAXONOMY: Record<string, string[]> = {
  Arithmetic: ['Percentages', 'Ratio', 'Average', 'Profit Loss', 'SI CI', 'Mixtures', 'TSD', 'Time Work', 'Partnership', 'Pipes'],
  Algebra: [],
  Geometry: [],
  'Number System': [],
  'Modern Math': [],
};

const VARC_TAXONOMY = {
  RC: ['Philosophy', 'History', 'Economics', 'Science', 'Politics', 'Culture', 'Psychology'],
  VA: ['Para Summary', 'Para Jumbles', 'Odd One Out', 'Sentence Placement'],
};

const DILR_TOPICS = [
  'Arrangements', 'Games & Tournaments', 'Venn Diagrams', 'Routes & Networks', 
  'Selection', 'Distribution', 'Puzzles', 'Caselets', 'Tables'
];

export function QuickLogDrawer({ isOpen, onClose, defaultTab }: Props) {
  const { addMock, addPracticeSession, mocks } = useAppData();
  const [activeTab, setActiveTab] = useState<'quant' | 'varc' | 'dilr' | 'mock'>('quant');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Common Fields
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [notes, setNotes] = useState('');

  // Quant Fields
  const [quantTopic, setQuantTopic] = useState('Arithmetic');
  const [quantSubtopic, setQuantSubtopic] = useState('Percentages');
  const [quantSolved, setQuantSolved] = useState('');
  const [quantCorrect, setQuantCorrect] = useState('');
  const [quantTime, setQuantTime] = useState('');
  const [quantSource, setQuantSource] = useState('IMS');

  // VARC Fields
  const [varcType, setVarcType] = useState<'RC' | 'VA'>('RC');
  const [varcTopic, setVarcTopic] = useState('Science');
  const [varcAttempted, setVarcAttempted] = useState('');
  const [varcCorrect, setVarcCorrect] = useState('');
  const [varcTime, setVarcTime] = useState('');
  const [varcComfort, setVarcComfort] = useState('3');
  const [varcConfidence, setVarcConfidence] = useState('3');

  // DILR Fields
  const [dilrTopic, setDilrTopic] = useState('Arrangements');
  const [dilrSetsSolved, setDilrSetsSolved] = useState('');
  const [dilrSetsCompleted, setDilrSetsCompleted] = useState('');
  const [dilrCorrect, setDilrCorrect] = useState('');
  const [dilrCorrectAttempted, setDilrCorrectAttempted] = useState('');
  const [dilrTime, setDilrTime] = useState('');
  const [dilrConfidence, setDilrConfidence] = useState('3');
  const [dilrCompleteSet, setDilrCompleteSet] = useState('Yes');

  // Mock Fields
  const [mockName, setMockName] = useState('');
  const [mockScore, setMockScore] = useState('');
  const [mockPercentile, setMockPercentile] = useState('');
  const [mockVarc, setMockVarc] = useState('');
  const [mockDilr, setMockDilr] = useState('');
  const [mockQuant, setMockQuant] = useState('');

  const triggerSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  const handleQuantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const solved = Number(quantSolved) || 0;
    const correct = Number(quantCorrect) || 0;
    const wrong = Math.max(0, solved - correct);
    const timePerQ = Number(quantTime) || 1.5;

    const { error } = await addPracticeSession({
      section: 'Quant',
      topic: quantTopic,
      subtopic: quantSubtopic || null,
      questions_attempted: solved,
      questions_correct: correct,
      questions_wrong: wrong,
      time_spent_minutes: parseFloat((solved * timePerQ).toFixed(1)),
      difficulty,
      source: quantSource,
      confidence: 3,
      notes,
      date,
    });

    if (error) {
      setErrorMessage(typeof error === 'string' ? error : error.message || 'Error saving practice log.');
    } else {
      triggerSuccess();
    }
  };

  const handleVarcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const attempted = Number(varcAttempted) || 0;
    const correct = Number(varcCorrect) || 0;
    const wrong = Math.max(0, attempted - correct);

    const { error } = await addPracticeSession({
      section: 'VARC',
      topic: varcType === 'RC' ? 'Reading Comprehension' : 'Verbal Ability',
      subtopic: varcTopic,
      questions_attempted: attempted,
      questions_correct: correct,
      questions_wrong: wrong,
      time_spent_minutes: Number(varcTime) || 20,
      difficulty,
      source: 'Self Practice',
      confidence: Number(varcConfidence) || 3,
      notes,
      date,
    });

    if (error) {
      setErrorMessage(typeof error === 'string' ? error : error.message || 'Error saving practice log.');
    } else {
      triggerSuccess();
    }
  };

  const handleDilrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const solved = Number(dilrSetsSolved) || 0;
    const correct = Number(dilrCorrect) || 0;
    const wrong = Math.max(0, (solved * 4) - correct);

    const { error } = await addPracticeSession({
      section: 'DILR',
      topic: dilrTopic,
      subtopic: null,
      questions_attempted: solved * 4,
      questions_correct: correct,
      questions_wrong: wrong,
      time_spent_minutes: Number(dilrTime) || 30,
      difficulty,
      source: 'Self Practice',
      confidence: Number(dilrConfidence) || 3,
      notes,
      date,
    });

    if (error) {
      setErrorMessage(typeof error === 'string' ? error : error.message || 'Error saving practice log.');
    } else {
      triggerSuccess();
    }
  };

  const handleMockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const overallScore = Number(mockVarc) + Number(mockDilr) + Number(mockQuant);

    const mockData = {
      id: `mock-custom-${Date.now()}`,
      mock_name: mockName || `SimCAT ${mocks.length + 1}`,
      mock_date: date,
      overall_score: overallScore,
      overall_percentile: Number(mockPercentile) || 90,
      varc_score: Number(mockVarc) || 0,
      dilr_score: Number(mockDilr) || 0,
      quant_score: Number(mockQuant) || 0,
      total_time_minutes: 120,
      varc_time_minutes: 40,
      dilr_time_minutes: 40,
      quant_time_minutes: 40,
      created_at: new Date().toISOString(),
    };

    const { error } = await addMock(mockData, []);
    if (error) {
      setErrorMessage(typeof error === 'string' ? error : error.message || 'Error saving mock report.');
    } else {
      triggerSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="relative h-full w-full max-w-md border-l border-white/[0.06] bg-[#0c0c0f] p-6 shadow-2xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Log Performance</h2>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.04] hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Selector Tabs */}
          <div className="mt-4 grid grid-cols-4 gap-1 rounded-lg bg-white/[0.02] p-1">
            {(['quant', 'varc', 'dilr', 'mock'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Main Success Visual Overlay */}
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">Entry Logged!</h3>
              <p className="mt-1 text-xs text-zinc-500">Recalculating intelligence dashboard...</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4 max-h-[68vh] overflow-y-auto pr-1">
              {errorMessage && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-medium">
                  {errorMessage}
                </div>
              )}
              {/* Date & Common Fields (Only for non-mock) */}
              {activeTab !== 'mock' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Date</label>
                    <input 
                      type="date" value={date} onChange={(e) => setDate(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Difficulty</label>
                    <select 
                      value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}
                      className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
              )}

              {/* QUANT PRACTICE FORM */}
              {activeTab === 'quant' && (
                <form onSubmit={handleQuantSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Topic</label>
                    <select 
                      value={quantTopic} 
                      onChange={(e) => {
                        setQuantTopic(e.target.value);
                        const subs = QUANT_TAXONOMY[e.target.value] || [];
                        setQuantSubtopic(subs[0] || '');
                      }}
                      className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                    >
                      {Object.keys(QUANT_TAXONOMY).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {QUANT_TAXONOMY[quantTopic]?.length > 0 && (
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Subtopic</label>
                      <select 
                        value={quantSubtopic} onChange={(e) => setQuantSubtopic(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      >
                        {QUANT_TAXONOMY[quantTopic].map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Solved Qs</label>
                      <input 
                        type="number" required placeholder="e.g. 15" value={quantSolved} onChange={(e) => setQuantSolved(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Correct Qs</label>
                      <input 
                        type="number" required placeholder="e.g. 11" value={quantCorrect} onChange={(e) => setQuantCorrect(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Avg Time/Q (mins)</label>
                      <input 
                        type="number" step="0.1" required placeholder="e.g. 1.8" value={quantTime} onChange={(e) => setQuantTime(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Source</label>
                      <select 
                        value={quantSource} onChange={(e) => setQuantSource(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      >
                        <option value="IMS">IMS</option>
                        <option value="CL">CL</option>
                        <option value="PYQ">PYQ</option>
                        <option value="Self Practice">Self Practice</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Notes / Concept Mistakes</label>
                    <textarea 
                      rows={2} placeholder="Silly calculations or concept missing..." value={notes} onChange={(e) => setNotes(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-white outline-none focus:border-blue-500/30 resize-none"
                    />
                  </div>

                  <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3 text-xs font-semibold text-white transition-all hover:opacity-90">
                    <Save className="h-4 w-4" /> Save Practice Log
                  </button>
                </form>
              )}

              {/* VARC PRACTICE FORM */}
              {activeTab === 'varc' && (
                <form onSubmit={handleVarcSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">VARC Type</label>
                      <select 
                        value={varcType} 
                        onChange={(e) => {
                          const val = e.target.value as 'RC' | 'VA';
                          setVarcType(val);
                          setVarcTopic(VARC_TAXONOMY[val][0]);
                        }}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      >
                        <option value="RC">Reading Comprehension</option>
                        <option value="VA">Verbal Ability</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Topic Category</label>
                      <select 
                        value={varcTopic} onChange={(e) => setVarcTopic(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      >
                        {VARC_TAXONOMY[varcType].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Attempted Qs</label>
                      <input 
                        type="number" required placeholder="e.g. 8" value={varcAttempted} onChange={(e) => setVarcAttempted(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Correct Qs</label>
                      <input 
                        type="number" required placeholder="e.g. 6" value={varcCorrect} onChange={(e) => setVarcCorrect(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Time (mins)</label>
                      <input 
                        type="number" required placeholder="e.g. 15" value={varcTime} onChange={(e) => setVarcTime(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Comfort (1-5)</label>
                      <select 
                        value={varcComfort} onChange={(e) => setVarcComfort(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      >
                        <option value="1">1 (Poor)</option>
                        <option value="2">2 (Uncomfortable)</option>
                        <option value="3">3 (Neutral)</option>
                        <option value="4">4 (Comfortable)</option>
                        <option value="5">5 (Very Comfortable)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Confidence (1-5)</label>
                      <select 
                        value={varcConfidence} onChange={(e) => setVarcConfidence(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      >
                        <option value="1">1 (Low)</option>
                        <option value="2">2 (Moderate)</option>
                        <option value="3">3 (Average)</option>
                        <option value="4">4 (Confident)</option>
                        <option value="5">5 (Very Confident)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Notes</label>
                    <textarea 
                      rows={2} placeholder="Hard language parameters or style errors..." value={notes} onChange={(e) => setNotes(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-white outline-none focus:border-blue-500/30 resize-none"
                    />
                  </div>

                  <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3 text-xs font-semibold text-white transition-all hover:opacity-90">
                    <Save className="h-4 w-4" /> Save VARC Log
                  </button>
                </form>
              )}

              {/* DILR PRACTICE FORM */}
              {activeTab === 'dilr' && (
                <form onSubmit={handleDilrSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500">DILR Topic</label>
                    <select 
                      value={dilrTopic} onChange={(e) => setDilrTopic(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                    >
                      {DILR_TOPICS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Sets Attempted</label>
                      <input 
                        type="number" required placeholder="e.g. 2" value={dilrSetsSolved} onChange={(e) => setDilrSetsSolved(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Correct Qs</label>
                      <input 
                        type="number" required placeholder="e.g. 6" value={dilrCorrect} onChange={(e) => setDilrCorrect(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Time Spent (mins)</label>
                      <input 
                        type="number" required placeholder="e.g. 30" value={dilrTime} onChange={(e) => setDilrTime(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Could Complete Set?</label>
                      <select 
                        value={dilrCompleteSet} onChange={(e) => setDilrCompleteSet(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-[#0c0c0f] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Notes</label>
                    <textarea 
                      rows={2} placeholder="Set selection errors, puzzle constraints, calculation bottlenecks..." value={notes} onChange={(e) => setNotes(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-white outline-none focus:border-blue-500/30 resize-none"
                    />
                  </div>

                  <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3 text-xs font-semibold text-white transition-all hover:opacity-90">
                    <Save className="h-4 w-4" /> Save DILR Log
                  </button>
                </form>
              )}

              {/* MOCK REPORT FORM */}
              {activeTab === 'mock' && (
                <form onSubmit={handleMockSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Mock Name</label>
                    <input 
                      type="text" required placeholder="e.g. SimCAT 8" value={mockName} onChange={(e) => setMockName(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Date</label>
                      <input 
                        type="date" value={date} onChange={(e) => setDate(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-zinc-500">Percentile</label>
                      <input 
                        type="number" step="0.01" required placeholder="e.g. 96.5" value={mockPercentile} onChange={(e) => setMockPercentile(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-violet-400">VARC Score</label>
                      <input 
                        type="number" required placeholder="Score" value={mockVarc} onChange={(e) => setMockVarc(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-blue-400">DILR Score</label>
                      <input 
                        type="number" required placeholder="Score" value={mockDilr} onChange={(e) => setMockDilr(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-cyan-400">Quant Score</label>
                      <input 
                        type="number" required placeholder="Score" value={mockQuant} onChange={(e) => setMockQuant(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3 text-xs font-semibold text-white transition-all hover:opacity-90">
                    <Save className="h-4 w-4" /> Save Mock Report
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
        
        <p className="text-[10px] text-center text-zinc-600">
          All changes immediately save to client local storage.
        </p>
      </div>
    </div>
  );
}
