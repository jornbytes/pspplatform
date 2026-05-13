/*
  # Add logo_url_dark setting

  Adds a default 'logo_url_dark' row to admin_settings.
  When set, this logo is used in dark mode instead of the primary logo_url.
  This allows separate logo assets for light and dark themes.
*/

INSERT INTO admin_settings (key, value)
VALUES ('logo_url_dark', '')
ON CONFLICT (key) DO NOTHING;
