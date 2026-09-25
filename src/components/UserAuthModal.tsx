import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Save,
  UserPlus,
  UserRound,
  X
} from 'lucide-react';
import { supabaseService } from '../services/supabase';

interface UserAuthModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
  onSignOut: () => Promise<void>;
}

export function UserAuthModal({ isOpen, user, onClose, onAuthenticated, onSignOut }: UserAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
    setPhone(user.user_metadata?.phone || '');
    setInstitution(user.user_metadata?.institution || '');
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handlePasswordAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    if (mode === 'forgot') {
      setLoading(true);
      const result = await supabaseService.sendPasswordResetEmail(email);
      setLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Could not send the password reset link.');
        return;
      }

      setSuccessMessage(result.message || 'Password reset link sent. Check your email to continue.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Your passwords do not match.');
      return;
    }

    setLoading(true);
    const result = mode === 'signup'
      ? await supabaseService.signUpStudent(email, password, fullName)
      : await supabaseService.signInWithPassword(email, password);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Authentication failed. Please try again.');
      return;
    }

    if (result.user && result.session) {
      onAuthenticated(result.user);
      onClose();
      return;
    }

    setPassword('');
    setConfirmPassword('');
    setMode('signin');
    setSuccessMessage(result.message || 'Check your email to finish creating your account.');
  };

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();
    setLoading(true);
    const result = await supabaseService.updateUserProfile({ fullName, phone, institution });
    setLoading(false);

    if (!result.success || !result.user) {
      setErrorMessage(result.error || 'Your profile could not be updated.');
      return;
    }

    onAuthenticated(result.user);
    setSuccessMessage('Profile updated successfully.');
  };

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Sam Edu Hub</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {user
                ? 'Your personal profile'
                : mode === 'signup'
                  ? 'Create your student account'
                  : mode === 'forgot'
                    ? 'Reset your password'
                    : 'Welcome back'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close account dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {user ? (
            <>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-12 w-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F294A] text-white">
                    <UserRound className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{fullName || 'Sam Edu Hub student'}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Full name</label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="0916..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Target institution</label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(event) => setInstitution(event.target.value)}
                      placeholder="UNILAG, UI..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>

                {errorMessage && <StatusMessage type="error" message={errorMessage} />}
                {successMessage && <StatusMessage type="success" message={successMessage} />}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:bg-slate-400"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {loading ? 'Saving...' : 'Save profile'}
                </button>
              </form>

              <button
                type="button"
                onClick={onSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                      type="button"
                      onClick={() => { setMode('signin'); resetMessages(); }}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Sign in
                </button>
                <button
                      type="button"
                      onClick={() => { setMode('signup'); resetMessages(); }}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Create account
                </button>
              </div>

              <form onSubmit={handlePasswordAuth} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Full name</label>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Confirm password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repeat your password"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                )}

                {errorMessage && <StatusMessage type="error" message={errorMessage} />}
                {successMessage && <StatusMessage type="success" message={successMessage} />}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F294A] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#123761] disabled:bg-slate-400"
                >
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : mode === 'signup'
                      ? <UserPlus className="h-4 w-4" />
                      : mode === 'forgot'
                        ? <Mail className="h-4 w-4" />
                        : <LogIn className="h-4 w-4" />}
                  {loading
                    ? 'Please wait...'
                    : mode === 'signup'
                      ? 'Create student account'
                      : mode === 'forgot'
                        ? 'Send reset link'
                        : 'Sign in'}
                </button>
              </form>

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); resetMessages(); }}
                  className="w-full text-center text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  Forgot password?
                </button>
              )}

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => { setMode('signin'); resetMessages(); }}
                  className="w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Back to sign in
                </button>
              )}

              {mode !== 'forgot' && (
                <p className="text-center text-[11px] leading-relaxed text-slate-500">
                  Your account is optional. Students can still pay and download as guests.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusMessage({ type, message }: { type: 'error' | 'success'; message: string }) {
  const isError = type === 'error';
  return (
    <div className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${isError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
      {isError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
      <span>{message}</span>
    </div>
  );
}
