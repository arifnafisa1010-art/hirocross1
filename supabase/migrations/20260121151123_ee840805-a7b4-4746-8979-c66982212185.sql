-- Fix 1: Deny anonymous access to admin_activity_logs table
-- The existing policy only allows admins via is_admin() function, but we need to ensure
-- anonymous users (auth.uid() IS NULL) cannot access the table at all

-- First, drop existing policy and recreate with explicit null check
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_logs;

CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND public.is_admin(auth.uid())
);

-- Fix 2: Deny anonymous access to athletes table
-- Add a policy to explicitly deny access when user is not authenticated

CREATE POLICY "Deny anonymous access to athletes"
ON public.athletes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix 3: Make payment-proofs bucket private and update policies
-- Update bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'payment-proofs';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;

-- Create proper SELECT policy: only file owners and admins can view
CREATE POLICY "Users can view own payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin(auth.uid())
  )
);