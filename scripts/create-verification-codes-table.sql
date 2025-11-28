-- Create verification_codes table for OTP authentication
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signup', 'reset_password', 'login')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_type ON public.verification_codes(email, type);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (secure)
CREATE POLICY "Service role can do everything on verification_codes"
  ON public.verification_codes
  USING (true)
  WITH CHECK (true);
