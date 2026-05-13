import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, LogOut, BarChart2, Languages, Image, Check, AlertCircle,
  RefreshCw, Eye, Clock, Database, TrendingUp, ChevronDown, ChevronUp, Save,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadAllSettings, saveSettings, getAdminToken, verifyAdminToken, clearAdminToken } from '../lib/admin';
import { LOCALES, type Locale } from '../lib/i18n';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SecretRow {
  id: string;
  label: string;
  created_at: string;
  expires_at: string;
  max_views: number;
  view_count: number;
}

type Tab = 'usage' | 'translations' | 'branding';

// ─── Translation keys grouped by section ──────────────────────────────────────

const TRANSLATION_SECTIONS: { title: string; keys: string[] }[] = [
  {
    title: 'Header & Footer',
    keys: ['header_tagline', 'header_e2e', 'footer_tagline'],
  },
  {
    title: 'Create page',
    keys: [
      'create_title', 'create_subtitle', 'create_secret_label', 'create_secret_placeholder',
      'create_label_label', 'create_label_placeholder',
      'create_expiry_label', 'create_expiry_24h', 'create_expiry_1w', 'create_expiry_2w', 'create_expiry_30d',
      'create_maxviews_label', 'create_passphrase_toggle', 'create_passphrase_placeholder',
      'create_submit', 'create_e2e_note',
    ],
  },
  {
    title: 'Success state',
    keys: [
      'success_title', 'success_subtitle_one', 'success_subtitle_many',
      'success_link_label', 'success_copy', 'success_copied',
      'success_expires', 'success_max_views', 'success_protected',
      'success_yes', 'success_no', 'success_another',
    ],
  },
  {
    title: 'View page',
    keys: [
      'view_loading', 'view_passphrase_title', 'view_passphrase_subtitle',
      'view_passphrase_label', 'view_passphrase_placeholder', 'view_passphrase_error',
      'view_passphrase_submit', 'view_confirm_title', 'view_confirm_subtitle',
      'view_confirm_labeled', 'view_confirm_views_remaining', 'view_confirm_expires',
      'view_confirm_reveal', 'view_confirm_cancel',
      'view_revealed_title', 'view_revealed_last', 'view_revealed_remaining',
      'view_revealed_content_label', 'view_copy', 'view_copied', 'view_close',
    ],
  },
  {
    title: 'Status screens',
    keys: [
      'status_not_found_title', 'status_not_found_desc',
      'status_expired_title', 'status_expired_desc',
      'status_consumed_title', 'status_consumed_desc',
      'status_error_title', 'status_error_desc',
      'status_create_new',
    ],
  },
];

// ─── Usage Tab ────────────────────────────────────────────────────────────────

function UsageTab() {
  const [secrets, setSecrets] = useState<SecretRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof SecretRow>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('secrets')
      .select('id, label, created_at, expires_at, max_views, view_count')
      .order('created_at', { ascending: false })
      .limit(200);
    setSecrets(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const active = secrets.filter((s) => new Date(s.expires_at) > now && s.view_count < s.max_views);
  const expired = secrets.filter((s) => new Date(s.expires_at) <= now);
  const consumed = secrets.filter((s) => new Date(s.expires_at) > now && s.view_count >= s.max_views);
  const totalViews = secrets.reduce((sum, s) => sum + s.view_count, 0);

  const sorted = [...secrets].sort((a, b) => {
    const av = a[sortField] ?? '';
    const bv = b[sortField] ?? '';
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (field: keyof SecretRow) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const SortIcon = ({ field }: { field: keyof SecretRow }) =>
    sortField === field
      ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
      : <ChevronDown className="w-3 h-3 opacity-30" />;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Database, label: 'Total secrets', value: secrets.length, color: 'text-zinc-600 dark:text-zinc-300' },
          { icon: TrendingUp, label: 'Active', value: active.length, color: 'text-emerald-600 dark:text-emerald-400' },
          { icon: Eye, label: 'Total views', value: totalViews, color: 'text-teal-600 dark:text-teal-400' },
          { icon: Clock, label: 'Expired/consumed', value: expired.length + consumed.length, color: 'text-zinc-400 dark:text-zinc-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl p-4 border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
            </div>
            <div className={`text-2xl font-semibold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Recent secrets</span>
          <button
            onClick={load}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {[
                  { field: 'label' as const, label: 'Label' },
                  { field: 'created_at' as const, label: 'Created' },
                  { field: 'expires_at' as const, label: 'Expires' },
                  { field: 'view_count' as const, label: 'Views' },
                ].map(({ field, label }) => (
                  <th
                    key={field}
                    onClick={() => toggleSort(field)}
                    className="text-left px-4 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 select-none"
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <SortIcon field={field} />
                    </div>
                  </th>
                ))}
                <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-600">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-zinc-200 dark:border-zinc-700 border-t-teal-500 rounded-full animate-spin" />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-600 text-sm">
                    No secrets yet.
                  </td>
                </tr>
              ) : sorted.map((s) => {
                const isExpired = new Date(s.expires_at) <= now;
                const isConsumed = !isExpired && s.view_count >= s.max_views;
                const isActive = !isExpired && !isConsumed;
                return (
                  <tr key={s.id} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-mono text-xs max-w-[160px] truncate">
                      {s.label || <span className="text-zinc-400 dark:text-zinc-600 italic">unlabeled</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                      {new Date(s.expires_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 text-xs">
                      {s.view_count} / {s.max_views}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : isConsumed
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}>
                        {isActive ? 'Active' : isConsumed ? 'Consumed' : 'Expired'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Translations Tab ─────────────────────────────────────────────────────────

function TranslationsTab({ settings, onSaved }: { settings: Record<string, string>; onSaved: () => void }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Seed overrides from DB settings on mount / when settings change
  useEffect(() => {
    const filtered: Record<string, string> = {};
    Object.entries(settings).forEach(([k, v]) => {
      if (k.startsWith(`${locale}.`)) {
        filtered[k.replace(`${locale}.`, '')] = v;
      }
    });
    setOverrides(filtered);
  }, [settings, locale]);

  const handleChange = (key: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, string> = {};
      Object.entries(overrides).forEach(([k, v]) => {
        payload[`${locale}.${k}`] = v;
      });
      await saveSettings(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Locale picker */}
      <div className="flex gap-2 mb-6">
        {LOCALES.map((l) => (
          <button
            key={l.value}
            onClick={() => setLocale(l.value)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all border ${
              locale === l.value
                ? 'bg-teal-500 text-white dark:text-zinc-900 border-teal-500 shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">
        Leave a field blank to use the default translation. Changes apply globally for all users.
      </p>

      {TRANSLATION_SECTIONS.map((section) => (
        <div key={section.title} className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
            {section.title}
          </h3>
          <div className="rounded-xl border overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
            {section.keys.map((key, i) => (
              <div
                key={key}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 ${
                  i < section.keys.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''
                }`}
              >
                <div className="sm:w-56 shrink-0">
                  <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">{key}</span>
                </div>
                <input
                  type="text"
                  value={overrides[key] ?? ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder="(default)"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2
                    bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700/50
                    text-zinc-800 dark:text-zinc-200 placeholder-zinc-300 dark:placeholder-zinc-600
                    focus:ring-teal-500/40 focus:border-teal-500/50"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm
          bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
          saved
            ? 'bg-emerald-500 text-white cursor-default'
            : 'bg-teal-500 hover:bg-teal-400 text-white dark:text-zinc-900 shadow-teal-500/20'
        } disabled:opacity-50`}
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : saving ? 'Saving…' : 'Save translations'}
      </button>
    </div>
  );
}

// ─── Branding Tab ─────────────────────────────────────────────────────────────

function BrandingTab({ settings, onSaved }: { settings: Record<string, string>; onSaved: () => void }) {
  const [appName, setAppName] = useState(settings['app_name'] ?? '');
  const [logoUrl, setLogoUrl] = useState(settings['logo_url'] ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAppName(settings['app_name'] ?? '');
    setLogoUrl(settings['logo_url'] ?? '');
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await saveSettings({ app_name: appName, logo_url: logoUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="rounded-xl border p-6 mb-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Application name</h3>
        <input
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="PSP"
          className="w-full border rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2
            bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50
            text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600
            focus:ring-teal-500/40 focus:border-teal-500/50"
        />
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
          Shown in the header and footer. Leave blank for the default "PSP".
        </p>
      </div>

      <div className="rounded-xl border p-6 mb-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Logo URL</h3>
        <input
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          className="w-full border rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2
            bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/50
            text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600
            focus:ring-teal-500/40 focus:border-teal-500/50"
        />
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
          Enter a URL to an image to replace the default shield icon. Recommended: 32×32 px or SVG.
        </p>
        {logoUrl && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-zinc-500">Preview:</span>
            <img
              src={logoUrl}
              alt="Logo preview"
              className="w-8 h-8 rounded-lg object-contain border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm
          bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
          saved
            ? 'bg-emerald-500 text-white cursor-default'
            : 'bg-teal-500 hover:bg-teal-400 text-white dark:text-zinc-900 shadow-teal-500/20'
        } disabled:opacity-50`}
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : saving ? 'Saving…' : 'Save branding'}
      </button>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('usage');
  const [authChecked, setAuthChecked] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const token = getAdminToken();
      if (!token || !(await verifyAdminToken(token))) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setAuthChecked(true);
      const s = await loadAllSettings();
      setSettings(s);
    })();
  }, [navigate]);

  const reloadSettings = useCallback(async () => {
    const s = await loadAllSettings();
    setSettings(s);
  }, []);

  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin/login', { replace: true });
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'usage', label: 'Usage', icon: BarChart2 },
    { id: 'translations', label: 'Translations', icon: Languages },
    { id: 'branding', label: 'Branding', icon: Image },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Admin header */}
      <header className="sticky top-0 z-50 border-b transition-colors
        bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm
        border-zinc-200/80 dark:border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center
              bg-teal-500/10 border border-teal-500/20">
              <Shield className="w-4 h-4 text-teal-500" />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white">Admin Panel</span>
            <span className="hidden sm:block text-xs text-zinc-400 dark:text-zinc-600 font-medium">PSP</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-500 dark:text-zinc-400
              hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Log out</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-zinc-200 dark:border-zinc-800">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === id
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'usage' && <UsageTab />}
        {tab === 'translations' && <TranslationsTab settings={settings} onSaved={reloadSettings} />}
        {tab === 'branding' && <BrandingTab settings={settings} onSaved={reloadSettings} />}
      </div>
    </div>
  );
}
