-- Create premium_access table to track which users have premium access
CREATE TABLE public.premium_access (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    granted_by UUID NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.premium_access ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own premium access status
CREATE POLICY "Users can view their own premium access"
ON public.premium_access
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all premium access
CREATE POLICY "Admins can view all premium access"
ON public.premium_access
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can insert premium access
CREATE POLICY "Admins can insert premium access"
ON public.premium_access
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update premium access
CREATE POLICY "Admins can update premium access"
ON public.premium_access
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can delete premium access
CREATE POLICY "Admins can delete premium access"
ON public.premium_access
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_premium_access_updated_at
BEFORE UPDATE ON public.premium_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has premium access
CREATE OR REPLACE FUNCTION public.has_premium_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.premium_access
    WHERE user_id = _user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Create premium_requests table for payment/request tracking
CREATE TABLE public.premium_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_by UUID DEFAULT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    payment_proof_url TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for premium_requests
ALTER TABLE public.premium_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.premium_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users can insert their own requests"
ON public.premium_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.premium_requests
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can update requests
CREATE POLICY "Admins can update requests"
ON public.premium_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add trigger for updated_at on premium_requests
CREATE TRIGGER update_premium_requests_updated_at
BEFORE UPDATE ON public.premium_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();