import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { supabaseService } from '../services/supabase';

interface PasswordResetPageProps {
  user: User | null;
  onCompleted: (user: User | null) => void;
  onBackToSite: () => void;
}

export function PasswordResetPage({ user, onCompleted, onBackToSite }: PasswordResetPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user) {
      setErrorMessage('This password reset link is invalid or has expired. Please request a new link.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Your new password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Your passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await supabaseService.updatePassword(password);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Your password could not be updated.');
      return;
    }

    setSuccessMessage('Password updated. Opening your dashboard...');
    window.setTimeout(() => onCompleted(result.user || user), 700);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F294A] text-white">
            <KeyRound className="h-6 w-6" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-orange-600">Sam Edu Hub</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Create a new password</h1>
          <p className="mt-2 text-sm text-slate-500">Choose a new password for your student account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">New password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Confirm new password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your new password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F294A] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#123761] disabled:bg-slate-400"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>

        <button
          type="button"
          onClick={onBackToSite}
          className="mt-4 w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Return to Sam Edu Hub
        </button>
      </div>
    </div>
  );
}
