'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, DEMO_MODE } from '@/lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  target_percentile: number;
  exam_year: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  resetPasswordRequest: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

// ── Demo user used in DEMO_MODE ───────────────────────────────────────────────
const DEMO_USER = {
  id: 'demo-local-user-001',
  email: 'aspirant@demo.local',
  app_metadata: {},
  user_metadata: { full_name: 'Demo Aspirant' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User;

const DEMO_PROFILE: Profile = {
  id: 'demo-local-user-001',
  email: 'aspirant@demo.local',
  full_name: 'Demo Aspirant',
  target_percentile: 99,
  exam_year: 2025,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: 'Auth not initialized' }),
  login: async () => ({ error: 'Auth not initialized' }),
  logout: async () => {},
  resetPasswordRequest: async () => ({ error: 'Auth not initialized' }),
  updatePassword: async () => ({ error: 'Auth not initialized' }),
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── DEMO MODE: skip Supabase, auto-login ─────────────────────────────────
  useEffect(() => {
    if (DEMO_MODE) {
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      setLoading(false);
      return;
    }

    // ── LIVE MODE: use Supabase auth ─────────────────────────────────────────
    const fetchProfile = async (userId: string, userEmail?: string, fullName?: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          setProfile(data as Profile);
        } else {
          // Profile missing — auto-create it (happens for existing auth accounts
          // after tables were recreated, since the trigger only fires on new signups)
          const { data: newProfile, error: insertErr } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: userEmail || '',
              full_name: fullName || null,
              target_percentile: 99,
              exam_year: 2025,
            }, { onConflict: 'id' })
            .select()
            .single();

          if (!insertErr && newProfile) {
            setProfile(newProfile as Profile);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      if (session) {
        setUser(session.user);
        fetchProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.full_name
        );
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    const authRes = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        setUser(session.user);
        fetchProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.full_name
        );
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    const subscription = authRes?.data?.subscription;
    return () => { if (subscription) subscription.unsubscribe(); };
  }, []);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string, fullName: string) => {
    if (DEMO_MODE) {
      // In demo mode just update the profile name and mark as logged in
      setProfile({ ...DEMO_PROFILE, email, full_name: fullName });
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName } },
      });
      return { error };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const login = async (email: string, _password: string) => {
    if (DEMO_MODE) {
      setUser(DEMO_USER);
      setProfile({ ...DEMO_PROFILE, email });
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: _password });
      return { error };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const logout = async () => {
    if (DEMO_MODE) {
      // In demo mode, clear localStorage data and reset state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('demo_mocks');
        localStorage.removeItem('demo_logs');
      }
      setUser(DEMO_USER); // keep user logged in for demo
      return;
    }
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const resetPasswordRequest = async (email: string) => {
    if (DEMO_MODE) return { error: null };
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '';
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
      return { error };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const updatePassword = async (password: string) => {
    if (DEMO_MODE) return { error: null };
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const refreshProfile = async () => {
    if (DEMO_MODE) return;
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) setProfile(data as Profile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, login, logout, resetPasswordRequest, updatePassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
