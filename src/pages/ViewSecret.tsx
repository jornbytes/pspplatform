import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Copy, Check, Shield, AlertTriangle, Lock, Flame } from 'lucide-react';
import { supabase, Secret } from '../lib/supabase';
import { importKey, decrypt, hashPassphrase } from '../lib/crypto';
import { useI18n } from '../lib/i18n';

type PageState = 'loading' | 'passphrase' | 'confirm' | 'revealed' | 'consumed' | 'expired' | 'not_found' | 'error';

export default function ViewSecret() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [state, setState] = useState<PageState>('loading');
  const [secret, setSecret] = useState<Secret | null>(null);
  const [plaintext, setPlaintext] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseError, setPassphraseError] = useState('');
  const [passphraseChecking, setPassphraseChecking] = useState(false);
  const [keyB64, setKeyB64] = useState('');

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) { setState('not_found'); return; }
    setKeyB64(hash);
    loadSecret(hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadSecret = async (key: string) => {
    if (!id) { setState('not_found'); return; }
    const { data, error } = await supabase.from('secrets').select('*').eq('id', id).maybeSingle();
    if (error || !data) { setState('not_found'); return; }
    if (new Date() > new Date(data.expires_at)) { setState('expired'); return; }
    if (data.view_count >= data.max_views) { setState('consumed'); return; }
    setSecret(data as Secret);
    if (data.passphrase_hash) { setState('passphrase'); }
    else { await decryptAndShow(data as Secret, key); }
  };

  const decryptAndShow = async (s: Secret, key: string) => {
    try {
      const cryptoKey = await importKey(key);
      const text = await decrypt(s.encrypted_content, s.iv, cryptoKey);
      setPlaintext(text);
      setState('confirm');
    } catch {
      setState('error');
    }
  };

  const handlePassphraseSubmit = async () => {
    if (!secret) return;
    setPassphraseError('');
    setPassphraseChecking(true);
    try {
      const { hash } = await hashPassphrase(passphrase, secret.passphrase_salt);
      if (hash !== secret.passphrase_hash) { setPassphraseError(t.view_passphrase_error); return; }
      await decryptAndShow(secret, keyB64);
    } finally {
      setPassphraseChecking(false);
    }
  };

  const handleReveal = async () => {
    if (!secret) return;
    const newCount = secret.view_count + 1;
    await supabase.from('secrets').update({ view_count: newCount }).eq('id', secret.id);
    setState('revealed');
  };

  const copy = async () => {
    await navigator.clipboard.writeText(plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Input classes shared across inputs
  const inputCls = `w-full border rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2
    bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700/50
    text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600
    focus:ring-teal-500/40 focus:border-teal-500/50`;

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 rounded-full animate-spin
            border-zinc-200 dark:border-zinc-700 border-t-teal-500" />
          <p className="text-sm text-zinc-400 dark:text-zinc-500">{t.view_loading}</p>
        </div>
      </div>
    );
  }

  if (['not_found', 'expired', 'consumed', 'error'].includes(state)) {
    const configs = {
      not_found: { icon: <AlertTriangle className="w-8 h-8 text-zinc-400" />, title: t.status_not_found_title, desc: t.status_not_found_desc },
      expired: { icon: <AlertTriangle className="w-8 h-8 text-amber-500" />, title: t.status_expired_title, desc: t.status_expired_desc },
      consumed: { icon: <Flame className="w-8 h-8 text-red-500" />, title: t.status_consumed_title, desc: t.status_consumed_desc },
      error: { icon: <AlertTriangle className="w-8 h-8 text-red-500" />, title: t.status_error_title, desc: t.status_error_desc },
    };
    const cfg = configs[state as keyof typeof configs];
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border mb-6
          bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
          {cfg.icon}
        </div>
        <h1 className="text-2xl font-semibold mb-3 text-zinc-900 dark:text-white">{cfg.title}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">{cfg.desc}</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors
            bg-teal-500 hover:bg-teal-400 text-white dark:text-zinc-900"
        >
          {t.status_create_new}
        </button>
      </div>
    );
  }

  if (state === 'passphrase') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border mb-4
            bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
            <Lock className="w-7 h-7 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-white">{t.view_passphrase_title}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t.view_passphrase_subtitle}</p>
        </div>

        <div className="rounded-xl p-6 border shadow-sm dark:shadow-none
          bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
          <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            {t.view_passphrase_label}
          </label>
          <input
            type="password" value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePassphraseSubmit()}
            placeholder={t.view_passphrase_placeholder}
            autoFocus
            className={`${inputCls} mb-3`}
          />
          {passphraseError && (
            <p className="text-red-500 dark:text-red-400 text-xs mb-3">{passphraseError}</p>
          )}
          <button
            onClick={handlePassphraseSubmit}
            disabled={passphraseChecking || !passphrase}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all
              bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed
              text-white dark:text-zinc-900"
          >
            {passphraseChecking
              ? <div className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
              : <Lock className="w-4 h-4" />
            }
            {passphraseChecking ? t.view_passphrase_unlocking : t.view_passphrase_submit}
          </button>
        </div>
      </div>
    );
  }

  if (state === 'confirm') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border mb-4
            bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20">
            <Eye className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-white">{t.view_confirm_title}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{t.view_confirm_subtitle}</p>
        </div>

        {secret?.label && (
          <div className="rounded-xl p-4 mb-6 text-center border
            bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">{t.view_confirm_labeled}</p>
            <p className="font-medium text-zinc-800 dark:text-zinc-200">{secret.label}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="rounded-lg p-3 text-center border
            bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
            <div className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">{t.view_confirm_views_remaining}</div>
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {secret ? secret.max_views - secret.view_count : '—'}
            </div>
          </div>
          <div className="rounded-lg p-3 text-center border
            bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
            <div className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">{t.view_confirm_expires}</div>
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {secret
                ? new Date(secret.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : '—'}
            </div>
          </div>
        </div>

        <button
          onClick={handleReveal}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all
            bg-teal-500 hover:bg-teal-400 text-white dark:text-zinc-900 shadow-lg shadow-teal-500/20"
        >
          <Eye className="w-4 h-4" />
          {t.view_confirm_reveal}
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 mt-2 rounded-lg text-sm transition-colors text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          {t.view_confirm_cancel}
        </button>
      </div>
    );
  }

  if (state === 'revealed') {
    const isLast = secret ? secret.view_count + 1 >= secret.max_views : true;
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border mb-4
            bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20">
            <Shield className="w-7 h-7 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-white">{t.view_revealed_title}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {isLast ? t.view_revealed_last : t.view_revealed_remaining}
          </p>
        </div>

        {secret?.label && (
          <p className="text-xs text-zinc-400 text-center mb-4">{secret.label}</p>
        )}

        <div className="rounded-xl p-5 mb-4 border shadow-sm dark:shadow-none
          bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {t.view_revealed_content_label}
            </span>
            <button
              onClick={() => setShowContent(!showContent)}
              className="transition-colors text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {showContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div
            className={`rounded-lg px-4 py-4 font-mono text-sm break-all border min-h-[60px] select-all
              bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
              border-zinc-200 dark:border-zinc-700/50
              ${showContent ? '' : 'tracking-widest text-xl'}`}
            style={showContent ? {} : { WebkitTextSecurity: 'disc' } as React.CSSProperties}
          >
            {showContent ? plaintext : '••••••••••••'}
          </div>
        </div>

        <button
          onClick={copy}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all mb-3 ${
            copied
              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
              : 'bg-teal-500 hover:bg-teal-400 text-white dark:text-zinc-900 shadow-lg shadow-teal-500/20'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? t.view_copied : t.view_copy}
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 rounded-lg text-sm transition-colors border
            flex items-center justify-center gap-2
            text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200
            border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600
            bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          <Flame className="w-3.5 h-3.5" />
          {t.view_close}
        </button>
      </div>
    );
  }

  return null;
}
