'use client';

import React, { useState, useEffect } from 'react';
import { User, Target, Database, Palette, Shield, Trash2, RefreshCw, Save } from 'lucide-react';
import { useAppData } from '@/lib/data/app-data-context';
import { useAuth } from '@/lib/context/auth-context';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { clearAllData, loadSeedData, mocks, logs } = useAppData();
  
  const [fullName, setFullName] = useState('');
  const [targetPercentile, setTargetPercentile] = useState(99);
  const [preferredProvider, setPreferredProvider] = useState('IMS');
  const [theme, setTheme] = useState('dark');

  const [dataMessage, setDataMessage] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Initialize fields on load
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setTargetPercentile(profile.target_percentile || 99);
    }
    
    // Fetch custom user settings if present
    if (user) {
      supabase.from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
        .then((res: any) => {
          const data = res?.data;
          if (data) {
            setTheme(data.theme || 'dark');
            setPreferredProvider(data.preferred_mock_provider || 'IMS');
          }
        });
    }
  }, [profile, user]);

  const handleSeed = async () => {
    if (window.confirm('This will wipe any existing mocks/practice logs and load 12 mock exams and over 300 performance breakdown logs into the database. Proceed?')) {
      setSaveLoading(true);
      setDataMessage('Hydrating database with CAT prep logs (this might take a few seconds)...');
      try {
        await loadSeedData();
        setDataMessage('Database hydrated successfully.');
      } catch (err: any) {
        console.error(err);
        setDataMessage(`Failed to hydrate data: ${err.message || err}`);
      } finally {
        setSaveLoading(false);
        setTimeout(() => setDataMessage(''), 3000);
      }
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to permanently wipe all mocks and practice sessions from the database? This cannot be undone.')) {
      await clearAllData();
      setDataMessage('All local database records cleared successfully.');
      setTimeout(() => setDataMessage(''), 3000);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaveLoading(true);
    setDataMessage('');

    try {
      // 1. Update profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          target_percentile: Number(targetPercentile),
        })
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      // 2. Upsert user_settings table
      const { error: settingsErr } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          theme: theme,
          target_percentile: Number(targetPercentile),
          preferred_mock_provider: preferredProvider,
        }, { onConflict: 'user_id' });

      if (settingsErr) throw settingsErr;

      await refreshProfile();
      setDataMessage('Configuration updated successfully.');
      setTimeout(() => setDataMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setDataMessage(`Failed to update configurations: ${err.message || err}`);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase">System Configuration</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage user profile settings, targets, and data structures</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Profile Section */}
        <div className="rounded-xl border border-white/[0.05] bg-zinc-950 p-6">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Profile</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-zinc-550 font-mono">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-xs text-white outline-none transition-colors focus:border-blue-500/30 focus:bg-white/[0.04]"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-zinc-550 font-mono">Registered Email</label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="mt-2 w-full rounded-lg border border-white/[0.06] bg-white/[0.01] px-4 py-2.5 text-xs text-zinc-500 cursor-not-allowed outline-none"
              />
            </div>
          </div>
        </div>

        {/* Target Configuration */}
        <div className="rounded-xl border border-white/[0.05] bg-zinc-950 p-6">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Target Configuration</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-zinc-550 font-mono">Target Percentile</label>
              <select
                value={targetPercentile}
                onChange={(e) => setTargetPercentile(Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-white/[0.06] bg-zinc-900 px-4 py-2.5 text-xs text-white outline-none transition-colors focus:border-blue-500/30"
              >
                <option value="99">99 %ile (IIM A/B/C)</option>
                <option value="98">98 %ile (Top Tier IIMs)</option>
                <option value="95">95 %ile (New IIMs)</option>
                <option value="90">90 %ile</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-zinc-550 font-mono">Preferred Mock Provider</label>
              <select
                value={preferredProvider}
                onChange={(e) => setPreferredProvider(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/[0.06] bg-zinc-900 px-4 py-2.5 text-xs text-white outline-none transition-colors focus:border-blue-500/30"
              >
                <option value="IMS">IMS (SimCAT)</option>
                <option value="CL">Career Launcher (Mocks)</option>
                <option value="TIME">T.I.M.E. (AIMCAT)</option>
                <option value="PYQ">Self Practice / Past Papers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-xl border border-white/[0.05] bg-zinc-950 p-6">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Appearance</h2>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                theme === 'dark'
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                  : 'border-white/[0.06] bg-white/[0.02] text-zinc-500'
              }`}
            >
              Dark Theme ( Bloomberg Console )
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="rounded-xl border border-white/[0.05] bg-zinc-950 p-6">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Database Administration</h2>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Current account stats: <span className="font-semibold text-zinc-300">{mocks.length}</span> Mocks | <span className="font-semibold text-zinc-300">{logs.length}</span> Solved logs.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSeed}
              className="flex items-center gap-2 rounded border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin-hover" />
              Hydrate Live Demo Data
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-2 rounded border border-rose-500/20 bg-rose-500/5 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Wipe Account Records
            </button>
          </div>
        </div>

        {/* Global Save Button */}
        {dataMessage && (
          <div className="rounded bg-white/[0.02] border border-white/[0.06] p-3 text-xs text-zinc-350 font-mono">
            {dataMessage}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveLoading}
            className="flex items-center gap-2 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-8 py-3 text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/20"
          >
            <Save className="h-4 w-4" />
            {saveLoading ? 'Saving Settings...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
