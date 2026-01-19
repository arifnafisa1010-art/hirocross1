-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their payment proofs
CREATE POLICY "Users can upload payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view payment proofs (for admin review)
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Allow users to delete their own payment proofs
CREATE POLICY "Users can delete own payment proofs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'payment-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);