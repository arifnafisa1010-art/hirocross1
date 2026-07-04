
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (qual ILIKE '%athlete-photos%' OR with_check ILIKE '%athlete-photos%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "athlete-photos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'athlete-photos');

CREATE POLICY "athlete-photos owner insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'athlete-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "athlete-photos owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'athlete-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'athlete-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "athlete-photos owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'athlete-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
