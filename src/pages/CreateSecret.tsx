import { useState, useCallback } from 'react';
import {
  Eye, EyeOff, RefreshCw, Copy, Check, Shield, Clock, ChevronDown, Lock, Link2, QrCode,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateKey, encrypt, hashPassphrase, generatePassword, passwordStrength } from '../lib/crypto';
import { useI18n } from '../lib/i18n';
import QRCodeDisplay from '../components/QRCodeDisplay';

const EXPIRY_OPTIONS = [
  { key: 'create_expiry_1h' as const, value: 1 },
  { key: 'create_expiry_24h' as const, value: 24 },
  { key: 'create_expiry_1w' as const, value: 168 },
  { key: 'create_expiry_30d' as const, value: 720 },
];

const MAX_VIEW_OPTIONS = [1, 3, 5];

export default function CreateSecret() {
  const { t } = useI18n();

  const [content, setContent] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [label, setLabel] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [maxViews, setMaxViews] = useState(1);
  const [usePassphrase, setUsePassphrase] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  const [showGenerator, setShowGenerator] = useState(false);
  const [genLength, setGenLength] = useState(20);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState('');

  const strength = passwordStrength(content);

  const strengthLabel = () => {
    if (strength.label === 'Weak') return t.create_strength_weak;
    if (strength.label === 'Fair') return t.create_strength_fair;
    if (strength.label === 'Good') return t.create_strength_good;
    if (strength.label === 'Strong') return t.create_strength_strong;
    return '';
  };

  const handleGenerate = useCallback(() => {
    const pw = generatePassword(genLength, {
      upper: genUpper, lower: genLower, numbers: genNumbers, symbols: genSymbols,
    });
    setContent(pw);
  }, [genLength, genUpper, genLower, genNumbers, genSymbols]);

  const handleSubmit = async () => {
    if (!content.trim()) { setError(t.create_error_empty); return; }
    if (usePassphrase && !passphrase.trim()) { setError(t.create_error_passphrase); return; }
    setError('');
    setLoading(true);
    try {
      const { key, keyB64 } = await generateKey();
      const { ciphertext, iv } = await encrypt(content, key);

      let passphraseHash = '';
      let passphraseSalt = '';
      if (usePassphrase && passphrase) {
        const result = await hashPassphrase(passphrase);
        passphraseHash = result.hash;
        passphraseSalt = result.salt;
      }

      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

      const { data, error: dbError } = await supabase
        .from('secrets')
        .insert({
          encrypted_content: ciphertext, iv, label: label.trim(),
          expires_at: expiresAt, max_views: maxViews, view_count: 0,
          passphrase_hash: passphraseHash, passphrase_salt: passphraseSalt,
        })
        .select('id')
        .single();

      if (dbError || !data) throw new Error(dbError?.message ?? t.create_error_generic);
      setGeneratedLink(`${window.location.origin}/s/${data.id}#${keyB64}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.create_error_generic);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const reset = () => {
    setContent(''); setLabel(''); setExpiryHours(24); setMaxViews(1);
    setUsePassphrase(false); setPassphrase(''); setGeneratedLink('');
    setShowQR(false); setError('');
  };

  const expiryLabel = EXPIRY_OPTIONS.find((o) => o.value === expiryHours);

  if (generatedLink) {
    const subtitleRaw = maxViews === 1 ? t.success_subtitle_one : t.success_subtitle_many;
    const subtitle = subtitleRaw.replace('{n}', String(maxViews));
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4
            bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <Check className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-white">{t.success_title}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">{subtitle}</p>
        </div>

        <div className="rounded-xl p-5 mb-4 border
          bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{t.success_link_label}</span>
          </div>
          <div className="rounded-lg px-4 py-3 font-mono text-xs break-all mb-4 border
            bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
            border-zinc-200 dark:border-zinc-700/50">
            {generatedLink}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-teal-500 hover:bg-teal-400 text-white dark:text-zinc-900'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t.success_copied : t.success_copy}
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border
                bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700
                text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/50"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showQR && (
          <div className="rounded-xl p-6 flex justify-center mb-4 border
            bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
            <QRCodeDisplay value={generatedLink} size={200} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: t.success_expires, value: expiryLabel ? t[expiryLabel.key] : '' },
            { label: t.success_max_views, value: String(maxViews) },
            { label: t.success_protected, value: usePassphrase ? t.success_yes : t.success_no },
          ].map(({ label: lbl, value }) => (
            <div key={lbl} className="rounded-lg p-3 text-center border
              bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
              <div className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">{lbl}</div>
              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{value}</div>
            </div>
          ))}
        </div>

        <button
          onClick={reset}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors border
            text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200
            border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600
            bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          {t.success_another}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold mb-2 text-zinc-900 dark:text-white">{t.create_title}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{t.create_subtitle}</p>
      </div>

      {/* Secret content */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          {t.create_secret_label}
        </label>
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.create_secret_placeholder}
            rows={4}
            className={`w-full border rounded-xl px-4 py-3 text-sm resize-none transition-all focus:outline-none focus:ring-2
              bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50
              text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600
              focus:ring-teal-500/40 focus:border-teal-500/50
              ${showContent ? '' : 'font-mono tracking-widest text-lg'}`}
            style={showContent ? {} : { WebkitTextSecurity: 'disc' } as React.CSSProperties}
          />
          <button
            type="button"
            onClick={() => setShowContent(!showContent)}
            className="absolute top-3 right-3 transition-colors text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            {showContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {content && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    strength.score >= i * 1.75 ? strength.color : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{strengthLabel()}</p>
          </div>
        )}
      </div>

      {/* Password generator */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowGenerator(!showGenerator)}
          className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t.create_generator_toggle}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showGenerator ? 'rotate-180' : ''}`} />
        </button>

        {showGenerator && (
          <div className="mt-3 border rounded-xl p-4
            bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
            <div className="flex items-center gap-3 mb-4">
              <label className="text-xs text-zinc-500 shrink-0">
                {t.create_generator_length}: {genLength}
              </label>
              <input
                type="range" min={8} max={64} value={genLength}
                onChange={(e) => setGenLength(Number(e.target.value))}
                className="flex-1 accent-teal-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: t.create_generator_upper, state: genUpper, set: setGenUpper },
                { label: t.create_generator_lower, state: genLower, set: setGenLower },
                { label: t.create_generator_numbers, state: genNumbers, set: setGenNumbers },
                { label: t.create_generator_symbols, state: genSymbols, set: setGenSymbols },
              ].map(({ label: lbl, state, set }) => (
                <label key={lbl} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox" checked={state}
                    onChange={(e) => set(e.target.checked)}
                    className="rounded accent-teal-500"
                  />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">{lbl}</span>
                </label>
              ))}
            </div>
            <button
              type="button" onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors border
                bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700
                text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700/50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.create_generator_btn}
            </button>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          {t.create_label_label}{' '}
          <span className="text-zinc-400 dark:text-zinc-500 font-normal">{t.create_label_optional}</span>
        </label>
        <input
          type="text" value={label} onChange={(e) => setLabel(e.target.value)}
          placeholder={t.create_label_placeholder}
          className="w-full border rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2
            bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50
            text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600
            focus:ring-teal-500/40 focus:border-teal-500/50"
        />
      </div>

      {/* Expiry */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">
          <Clock className="w-4 h-4 text-zinc-400" />
          {t.create_expiry_label}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              key={opt.value} type="button" onClick={() => setExpiryHours(opt.value)}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                expiryHours === opt.value
                  ? 'bg-teal-500 text-white dark:text-zinc-900 shadow-sm'
                  : 'border text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {t[opt.key]}
            </button>
          ))}
        </div>
      </div>

      {/* Max views */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">
          <Eye className="w-4 h-4 text-zinc-400" />
          {t.create_maxviews_label}
        </label>
        <div className="flex gap-2">
          {MAX_VIEW_OPTIONS.map((v) => (
            <button
              key={v} type="button" onClick={() => setMaxViews(v)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                maxViews === v
                  ? 'bg-teal-500 text-white dark:text-zinc-900 shadow-sm'
                  : 'border text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Passphrase toggle */}
      <div className="mb-8">
        <label className="flex items-center gap-3 cursor-pointer group mb-3">
          <div
            onClick={() => setUsePassphrase(!usePassphrase)}
            className={`relative rounded-full transition-colors shrink-0 cursor-pointer ${
              usePassphrase ? 'bg-teal-500' : 'bg-zinc-200 dark:bg-zinc-700'
            }`}
            style={{ width: 40, height: 22 }}
          >
            <div
              className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${
                usePassphrase ? 'translate-x-[19px]' : 'translate-x-[3px]'
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.create_passphrase_toggle}</span>
          </div>
        </label>

        {usePassphrase && (
          <div className="relative">
            <input
              type={showPassphrase ? 'text' : 'password'}
              value={passphrase} onChange={(e) => setPassphrase(e.target.value)}
              placeholder={t.create_passphrase_placeholder}
              className="w-full border rounded-xl px-4 py-3 pr-10 text-sm transition-all focus:outline-none focus:ring-2
                bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50
                text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600
                focus:ring-teal-500/40 focus:border-teal-500/50"
            />
            <button
              type="button" onClick={() => setShowPassphrase(!showPassphrase)}
              className="absolute top-3 right-3 transition-colors text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border text-sm
          bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20
          text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all
          bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed
          text-white dark:text-zinc-900 shadow-lg shadow-teal-500/20"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
            {t.create_encrypting}
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            {t.create_submit}
          </>
        )}
      </button>

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-4">
        {t.create_e2e_note}
      </p>
    </div>
  );
}
