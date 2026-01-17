-- Create admin activity logs table
CREATE TABLE public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_user_email TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Create function to log admin activity (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  _action TEXT,
  _target_user_id UUID DEFAULT NULL,
  _target_user_email TEXT DEFAULT NULL,
  _details TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_email TEXT;
  _log_id UUID;
BEGIN
  -- Only admins can log activity
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Get admin email
  SELECT email INTO _admin_email FROM auth.users WHERE id = auth.uid();
  
  INSERT INTO public.admin_activity_logs (admin_user_id, admin_email, action, target_user_id, target_user_email, details)
  VALUES (auth.uid(), _admin_email, _action, _target_user_id, _target_user_email, _details)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Create function to get admin activity logs
CREATE OR REPLACE FUNCTION public.get_admin_activity_logs(_limit INTEGER DEFAULT 50)
RETURNS TABLE(
  id UUID,
  admin_user_id UUID,
  admin_email TEXT,
  action TEXT,
  target_user_id UUID,
  target_user_email TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can view logs
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    l.id,
    l.admin_user_id,
    l.admin_email,
    l.action,
    l.target_user_id,
    l.target_user_email,
    l.details,
    l.created_at
  FROM public.admin_activity_logs l
  ORDER BY l.created_at DESC
  LIMIT _limit;
END;
$$;