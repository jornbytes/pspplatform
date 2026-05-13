/*
  # Create public storage bucket for logo uploads

  1. New bucket
     - `logos` — public bucket, max 2 MB, image types only
  2. Storage policies
     - Public SELECT for reading logos
     - Anon/authenticated INSERT, UPDATE, DELETE for admin uploads
*/

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'logos',
    'logos',
    true,
    2097152,
    ARRAY['image/png','image/jpeg','image/svg+xml','image/webp','image/gif']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read logos'
  ) THEN
    CREATE POLICY "Public read logos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anon upload logos'
  ) THEN
    CREATE POLICY "Anon upload logos"
      ON storage.objects FOR INSERT
      TO anon, authenticated
      WITH CHECK (bucket_id = 'logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anon update logos'
  ) THEN
    CREATE POLICY "Anon update logos"
      ON storage.objects FOR UPDATE
      TO anon, authenticated
      USING (bucket_id = 'logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anon delete logos'
  ) THEN
    CREATE POLICY "Anon delete logos"
      ON storage.objects FOR DELETE
      TO anon, authenticated
      USING (bucket_id = 'logos');
  END IF;
END $$;
