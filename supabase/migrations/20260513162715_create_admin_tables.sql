/*
  # Admin Tables

  ## Summary
  Creates tables for admin authentication and application settings (translations, branding).

  ## New Tables

  ### `admin_users`
  Stores a single admin account (password hash only — no Supabase Auth dependency).

  | Column | Type | Description |
  |---|---|---|
  | id | uuid | Primary key |
  | password_hash | text | bcrypt or SHA-256 hash of admin password |
  | created_at | timestamptz | Creation timestamp |

  ### `admin_settings`
  Key-value store for all overrideable settings: translation strings, logo URL, app name.

  | Column | Type | Description |
  |---|---|---|
  | id | uuid | Primary key |
  | key | text | Unique setting key, e.g. "en.header_tagline", "logo_url", "app_name" |
  | value | text | The override value |
  | updated_at | timestamptz | Last updated timestamp |

  ## Security
  - RLS enabled on both tables
  - `admin_users`: no public read/write — only service role can access
  - `admin_settings`: public SELECT allowed (app needs to read overrides); INSERT/UPDATE restricted
    to service role (writes happen via Edge Function)

  ## Notes
  - Admin login is handled by an Edge Function that verifies the password and returns a signed token
  - Settings reads are public so the frontend can load overrides without auth
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text        NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- No public policies — only service role (Edge Function) can touch this table


CREATE TABLE IF NOT EXISTS admin_settings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text        UNIQUE NOT NULL,
  value      text        NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read settings"
  ON admin_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- No public INSERT/UPDATE — writes go through Edge Function with service role
