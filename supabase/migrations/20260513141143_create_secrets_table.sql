/*
  # Create secrets table for PSP (Password Sharing Platform)

  ## Summary
  Creates the core table for storing encrypted one-time secrets.

  ## New Tables

  ### `secrets`
  Stores encrypted secret payloads shared via one-time links.

  | Column | Type | Description |
  |---|---|---|
  | id | uuid | Primary key, used as the public link identifier |
  | encrypted_content | text | AES-GCM encrypted secret (ciphertext, base64) |
  | iv | text | Initialization vector for AES-GCM decryption (base64) |
  | label | text | Optional human-readable description of the secret |
  | expires_at | timestamptz | Timestamp after which the secret is no longer valid |
  | max_views | int | Maximum number of times the secret can be viewed (default 1) |
  | view_count | int | Number of times the secret has been accessed |
  | passphrase_hash | text | Optional PBKDF2-derived passphrase hash for extra protection |
  | passphrase_salt | text | Salt used when deriving the passphrase hash (base64) |
  | created_at | timestamptz | Creation timestamp |

  ## Security
  - RLS enabled on `secrets` table
  - INSERT policy: any authenticated or anonymous user can create a secret
  - SELECT policy: anyone can read a secret by its ID (needed for one-time link flow)
  - UPDATE policy: anyone can increment the view_count (needed to consume the secret)
  - No DELETE policy — deletion is handled server-side by expiry/view logic
*/

CREATE TABLE IF NOT EXISTS secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encrypted_content text NOT NULL,
  iv text NOT NULL,
  label text DEFAULT '',
  expires_at timestamptz NOT NULL,
  max_views int NOT NULL DEFAULT 1,
  view_count int NOT NULL DEFAULT 0,
  passphrase_hash text DEFAULT '',
  passphrase_salt text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a secret"
  ON secrets
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read a secret by id"
  ON secrets
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can increment view count"
  ON secrets
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
