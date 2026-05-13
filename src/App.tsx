import { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Sun, Moon, ChevronDown } from 'lucide-react';
import { ThemeProvider, useTheme } from './lib/theme';
import { I18nProvider, useI18n, LOCALES } from './lib/i18n';
import { loadAllSettings } from './lib/admin';
import CreateSecret from './pages/CreateSecret';
import ViewSecret from './pages/ViewSecret';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';

function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LOCALES.find((l) => l.value === locale)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors
          text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200
          hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent
          hover:border-zinc-200 dark:hover:border-zinc-700"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:block">{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border shadow-xl z-50
          bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/60
          shadow-zinc-200/50 dark:shadow-black/40">
          {LOCALES.map((l) => (
            <button
              key={l.value}
              onClick={() => { setLocale(l.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl
                ${locale === l.value
                  ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="p-2 rounded-lg transition-colors
        text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200
        hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent
        hover:border-zinc-200 dark:hover:border-zinc-700"
    >
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}

function Header({ appName, logoUrl }: { appName: string; logoUrl: string }) {
  const location = useLocation();
  const isViewPage = location.pathname.startsWith('/s/');
  const isAdminPage = location.pathname.startsWith('/admin');
  const { t } = useI18n();

  if (isAdminPage) return null;

  return (
    <header className="border-b sticky top-0 z-50 transition-colors
      bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm
      border-zinc-200/80 dark:border-zinc-800/60">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors
            bg-teal-500/10 dark:bg-teal-500/10 border border-teal-500/20
            group-hover:bg-teal-500/20 overflow-hidden">
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            }
          </div>
          <span className="font-semibold tracking-tight text-zinc-900 dark:text-white">
            {appName || 'PSP'}
          </span>
          <span className="text-zinc-400 dark:text-zinc-600 text-xs font-medium hidden sm:block">
            {t.header_tagline}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {!isViewPage && (
            <span className="text-xs text-zinc-400 dark:text-zinc-600 mr-2 hidden md:block">
              {t.header_e2e}
            </span>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function NotFound() {
  const { t } = useI18n();
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="text-6xl font-bold text-zinc-200 dark:text-zinc-800 mb-4">404</div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">{t.not_found_title}</h1>
      <p className="text-zinc-500 text-sm mb-8">{t.not_found_desc}</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white dark:text-zinc-900 font-medium text-sm transition-colors"
      >
        {t.not_found_home}
      </Link>
    </div>
  );
}

function AppShell() {
  const { t, applyOverrides } = useI18n();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const [appName, setAppName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    loadAllSettings().then((s) => {
      applyOverrides(s);
      setAppName(s['app_name'] ?? '');
      setLogoUrl(s['logo_url'] ?? '');
    }).catch(() => {});
  }, [applyOverrides]);

  return (
    <div className="min-h-screen transition-colors bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      {!isAdminPage && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px]
            bg-teal-500/5 dark:bg-teal-500/5" />
        </div>
      )}

      <Header appName={appName} logoUrl={logoUrl} />

      <main className="relative">
        <Routes>
          <Route path="/" element={<CreateSecret />} />
          <Route path="/s/:id" element={<ViewSecret />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdminPage && (
        <footer className="border-t mt-16 transition-colors border-zinc-200/80 dark:border-zinc-800/60">
          <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-teal-500/50" />
              <span className="text-xs text-zinc-400 dark:text-zinc-600">
                {appName || 'PSP'} — {t.header_tagline}
              </span>
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-700">{t.footer_tagline}</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}
