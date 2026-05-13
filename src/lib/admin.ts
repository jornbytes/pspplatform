import { supabase } from './supabase';

const ADMIN_TOKEN_KEY = 'psp-admin-token';
const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const fnHeaders = {
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminLogin(password: string): Promise<{ token: string } | { error: string }> {
  const res = await fetch(`${FN_BASE}/admin-auth/login`, {
    method: 'POST',
    headers: fnHeaders,
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? 'Login failed.' };
  sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
  return { token: data.token };
}

export async function adminSetup(password: string): Promise<{ ok: boolean } | { error: string }> {
  const res = await fetch(`${FN_BASE}/admin-auth/setup`, {
    method: 'POST',
    headers: fnHeaders,
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error ?? 'Setup failed.' };
  return { ok: true };
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  const res = await fetch(`${FN_BASE}/admin-auth/verify`, {
    method: 'POST',
    headers: fnHeaders,
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.valid === true;
}

export async function saveSettings(settings: Record<string, string>): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Not authenticated.');
  const res = await fetch(`${FN_BASE}/admin-settings`, {
    method: 'PUT',
    headers: { ...fnHeaders, Authorization: `Bearer ${token}` },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Failed to save settings.');
  }
}

export async function loadAllSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('admin_settings').select('key, value');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

export async function hasAdminSetup(): Promise<boolean> {
  const { count } = await supabase.from('admin_users').select('id', { count: 'exact', head: true });
  return (count ?? 0) > 0;
}
