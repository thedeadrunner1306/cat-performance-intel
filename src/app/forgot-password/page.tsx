'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { Award, Mail, Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPasswordRequest } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const { error } = await resetPasswordRequest(email);
    if (error) {
      setErrorMsg(error.message || 'An error occurred. Check email spelling.');
      setLoading(false);
    } else {
      setSuccessMsg('Reset link sent! Please check your email inbox to proceed.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-white/[0.06] bg-zinc-950 p-8 shadow-2xl">
        <div>
          <Link href="/login" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-350 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Login
          </Link>
          <div className="mt-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Award className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
              Password Recovery
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Request a security reset link via email
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 font-medium">
            {successMsg}
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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-600/50 disabled:cursor-not-allowed py-2.5 text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending email...</span>
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
