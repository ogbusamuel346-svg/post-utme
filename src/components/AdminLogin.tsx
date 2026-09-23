import { useState } from 'react';
import { supabaseService } from '../services/supabase';
import { Shield, Lock, Mail, ArrowLeft, AlertCircle, CheckCircle2, Database, KeyRound } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (user: any) => void;
  onBackToSite: () => void;
}

export function AdminLogin({ onLoginSuccess, onBackToSite }: AdminLoginProps) {
  const config = supabaseService.getConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Setup panel if user wants to change or configure Supabase credentials
  const [showConfigSetup, setShowConfigSetup] = useState(!config.connected);
  const [supabaseUrl, setSupabaseUrl] = useState(config.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(config.anonKey);
  const [configTesting, setConfigTesting] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<{ success?: boolean; text?: string } | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please provide both your administrative email and password.');
      return;
    }

    setLoading(true);
    const res = await supabaseService.signInWithPassword(email, password);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Invalid administrator credentials. Please check your email and password.');
    } else {
      onLoginSuccess(res.user);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigTesting(true);
    setConfigFeedback(null);

    const res = await supabaseService.updateConfig(supabaseUrl, supabaseAnonKey);
    setConfigTesting(false);
    setConfigFeedback({
      success: res.success,
      text: res.message
    });

    if (res.success && supabaseService.getConfig().connected) {
      setShowConfigSetup(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between z-10">
        <button
          onClick={onBackToSite}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Website</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500">
          Route: <span className="text-orange-400">/admin</span>
        </span>
      </div>

      {/* Login / Auth Card */}
      <div className="max-w-md w-full mx-auto space-y-6 z-10 my-auto">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-900/30">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight">
            EduJAMB Admin Console
          </h1>
          <p className="text-xs text-slate-400">
            Protected management area for past questions, syllabus guides, and screening papers.
          </p>
        </div>

        {/* Main Box */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          
          {/* Supabase Status Indicator */}
          <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 text-xs">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-orange-400" />
              <span className="text-slate-300 font-medium">Supabase Authentication:</span>
            </div>
            {config.connected ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Auth
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfigSetup(!showConfigSetup)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 cursor-pointer"
              >
                Configure Supabase
              </button>
            )}
          </div>

          {/* Optional Supabase Credential Quick Setup Accordion */}
          {showConfigSetup && (
            <form onSubmit={handleSaveConfig} className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                  Supabase Project Credentials
                </span>
                {config.connected && (
                  <button
                    type="button"
                    onClick={() => setShowConfigSetup(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    Hide
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Project URL</label>
                <input
                  type="url"
                  placeholder="https://xyz.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-[11px] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Anon / Public API Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-[11px] focus:outline-none focus:border-orange-500"
                />
              </div>

              {configFeedback && (
                <div className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
                  configFeedback.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                }`}>
                  {configFeedback.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{configFeedback.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={configTesting}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{configTesting ? 'Connecting to Supabase...' : 'Save & Connect Supabase'}</span>
              </button>
            </form>
          )}

          {/* Header Title */}
          <div className="pb-1 border-b border-slate-700/80">
            <h2 className="text-sm font-semibold text-white">Administrator Sign In</h2>
            <p className="text-[11px] text-slate-400">Enter your staff credentials to access the console</p>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Staff / Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@edujamb.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Status Messages */}
            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {loading ? 'Authenticating with Supabase...' : 'Sign In to Dashboard'}
              </span>
            </button>

          </form>

          {/* Quick Notice */}
          <div className="pt-2 text-center text-[11px] text-slate-500 leading-relaxed">
            Directly authenticated against your Supabase Auth user table (<code className="text-slate-400">auth.users</code>).
          </div>

        </div>

      </div>

      {/* Footer Note */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-slate-600 z-10">
        EduJAMB Academic Repository · Restriced Staff Access Only
      </div>

    </div>
  );
}
