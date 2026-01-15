-- Create storage bucket for athlete photos
INSERT INTO storage.buckets (id, name, public) VALUES ('athlete-photos', 'athlete-photos', true);

-- RLS policies for athlete photos bucket
CREATE POLICY "Anyone can view athlete photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'athlete-photos');

CREATE POLICY "Authenticated users can upload athlete photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'athlete-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own athlete photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'athlete-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own athlete photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'athlete-photos' AND auth.role() = 'authenticated');