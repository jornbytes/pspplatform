import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, UserPlus, LogIn } from 'lucide-react';
import { adminLogin, adminSetup, hasAdminSetup, getAdminToken, verifyAdminToken } from '../lib/admin';

type Mode = 'login' | 'register';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const token = getAdminToken();
      if (token && await verifyAdminToken(token)) {
        navigate('/admin', { replace: true });
        return;
      }
      const exists = await hasAdminSetup();
      setAdminExists(exists);
      setMode(exists ? 'login' : 'register');
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }
    }

    setSubmitting(true);
    try {
      if (mode === 'register') {
        const res = await adminSetup(password);
        if ('error' in res) { setError(res.error); return; }
      }
      const res = await adminLogin(password);
      if ('error' in res) { setError(res.error); return; }
      navigate('/admin', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setPassword('');
    setConfirm('');
  };

  if (adminExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isRegister = mode === 'register';

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        {/* Icon + heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4
            bg-teal-500/10 border border-teal-500/20">
            <Shield className="w-6 h-6 text-teal-500" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
            Admin panel
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isRegister
              ? 'Create the first admin account to get started.'
              : 'Sign in to manage your application.'}
          </p>
        </div>

        {/* Tab switcher — only show if an admin already exists (register is then optional) */}
        {adminExists && (
          <div className="flex mb-6 rounded-xl p-1 border gap-1
            bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
            {([['login', 'Log in', LogIn], ['register', 'Register', UserPlus]] as const).map(([m, label, Icon]) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-teal-500 text-white dark:text-zinc-900 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* No admin yet — show a notice */}
        {!adminExists && (
          <div className="mb-5 px-4 py-3 rounded-xl border text-sm
            bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20
            text-teal-700 dark:text-teal-400">
            No admin account exists yet. The first person to register will become the administrator.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border p-6 shadow-sm
            bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50"
        >
          {/* Password field */}
          <div className="mb-4">
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password…"
                autoFocus
                className="w-full border rounded-xl px-4 py-3 pr-10 text-sm transition-all focus:outline-none focus:ring-2
                  bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50
                  text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600
                  focus:ring-teal-500/40 focus:border-teal-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isRegister && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">Minimum 8 characters.</p>
            )}
          </div>

          {/* Confirm field — only for register */}
          {isRegister && (
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                Confirm password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password…"
                className="w-full border rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2
                  bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50
                  text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600
                  focus:ring-teal-500/40 focus:border-teal-500/50"
              />
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg border text-sm
              bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20
              text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all
              bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed
              text-white dark:text-zinc-900 shadow-lg shadow-teal-500/20"
          >
            {isRegister
              ? <UserPlus className="w-4 h-4" />
              : <LogIn className="w-4 h-4" />
            }
            {submitting
              ? (isRegister ? 'Creating account…' : 'Signing in…')
              : (isRegister ? 'Create admin account' : 'Sign in')}
          </button>
        </form>

        {/* Footer note */}
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-5">
          {isRegister
            ? 'Only one admin account is supported.'
            : 'Access restricted to administrators only.'}
        </p>
      </div>
    </div>
  );
}
