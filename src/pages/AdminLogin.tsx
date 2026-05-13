import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { adminLogin, adminSetup, hasAdminSetup, getAdminToken, verifyAdminToken } from '../lib/admin';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const token = getAdminToken();
      if (token && await verifyAdminToken(token)) {
        navigate('/admin', { replace: true });
        return;
      }
      const setup = await hasAdminSetup();
      setIsSetup(!setup);
      setLoading(false);
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isSetup) {
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }
    }
    setSubmitting(true);
    try {
      if (isSetup) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4
            bg-teal-500/10 border border-teal-500/20">
            <Shield className="w-6 h-6 text-teal-500" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
            {isSetup ? 'Set up admin account' : 'Admin panel'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isSetup
              ? 'Create a password to protect the admin panel.'
              : 'Enter your admin password to continue.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border p-6 shadow-sm
          bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                Password
              </div>
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
          </div>

          {isSetup && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
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
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all
              bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed
              text-white dark:text-zinc-900 shadow-lg shadow-teal-500/20"
          >
            {submitting
              ? (isSetup ? 'Setting up…' : 'Logging in…')
              : (isSetup ? 'Create admin account' : 'Log in')}
          </button>
        </form>
      </div>
    </div>
  );
}
