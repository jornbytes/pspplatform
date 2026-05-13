/*
  # Add logo_url_dark setting support

  No schema change needed — admin_settings is a key-value store.
  This migration is a no-op placeholder to document the new keys:
    - logo_url       (existing) — logo for light mode
    - logo_url_dark  (new)      — logo for dark mode (falls back to logo_url)
*/
SELECT 1;
