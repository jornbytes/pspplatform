/*
  # Add logo_type setting

  Inserts a default 'logo_type' row into admin_settings so the app knows
  whether the uploaded logo is a light (white/pale) or dark logo.
  This drives the CSS invert filter to ensure visibility in both modes.

  Values: 'light' (white/light logo) | 'dark' (dark/black logo)
  Default: 'dark' (most logos are dark on transparent)
*/

INSERT INTO admin_settings (key, value)
VALUES ('logo_type', 'dark')
ON CONFLICT (key) DO NOTHING;
