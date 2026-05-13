const toBase64 = (buf: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));

const fromBase64 = (str: string): Uint8Array =>
  Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

export async function generateKey(): Promise<{ key: CryptoKey; keyB64: string }> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
  const raw = await crypto.subtle.exportKey('raw', key);
  return { key, keyB64: toBase64(raw) };
}

export async function importKey(keyB64: string): Promise<CryptoKey> {
  const raw = fromBase64(keyB64);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']);
}

export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return { ciphertext: toBase64(buf), iv: toBase64(iv) };
}

export async function decrypt(
  ciphertext: string,
  ivB64: string,
  key: CryptoKey
): Promise<string> {
  const iv = fromBase64(ivB64);
  const buf = fromBase64(ciphertext);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, buf);
  return new TextDecoder().decode(decrypted);
}

export async function hashPassphrase(
  passphrase: string,
  saltB64?: string
): Promise<{ hash: string; salt: string }> {
  const salt = saltB64 ? fromBase64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return { hash: toBase64(bits), salt: toBase64(salt) };
}

export function generatePassword(length: number, opts: {
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
}): string {
  const sets = [
    opts.upper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
    opts.lower ? 'abcdefghijklmnopqrstuvwxyz' : '',
    opts.numbers ? '0123456789' : '',
    opts.symbols ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '',
  ].filter(Boolean);

  if (sets.length === 0) return '';
  const charset = sets.join('');
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join('');
}

export function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Fair', color: 'bg-amber-400' };
  if (score <= 5) return { score, label: 'Good', color: 'bg-teal-400' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}
