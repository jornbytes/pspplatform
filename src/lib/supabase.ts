import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Secret {
  id: string;
  encrypted_content: string;
  iv: string;
  label: string;
  expires_at: string;
  max_views: number;
  view_count: number;
  passphrase_hash: string;
  passphrase_salt: string;
  created_at: string;
}
