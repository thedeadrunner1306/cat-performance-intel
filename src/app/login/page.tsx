'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { Award, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { error } = await login(email, password);
    if (error) {
      setErrorMsg(error.message || 'Invalid login credentials.');
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-white/[0.06] bg-zinc-950 p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Award className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-white uppercase font-sans">
            Mission <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent px-2 rounded border border-blue-500/20 bg-blue-500/5 text-lg font-mono">CAT</span>
          </h2>
          <p className="mt-2 text-xs text-zinc-400 font-medium">
            Elevate your CAT preparation with precision analytics.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-550" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aspirant@catintel.app"
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder-zinc-700 focus:border-blue-500/30 focus:bg-white/[0.04] transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Security Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-550" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder-zinc-700 focus:border-blue-500/30 focus:bg-white/[0.04] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-600/50 disabled:cursor-not-allowed py-2.5 text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authorizing User...</span>
              </>
            ) : (
              <span>Access Terminal</span>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 pt-2 border-t border-white/[0.04]">
          <span>New aspirant? </span>
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
}
