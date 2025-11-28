-- Comprehensive fix for usage_tracking table access and initialization
-- This script ensures users can view and update their own usage data

-- Step 1: Ensure the usage_tracking table exists with correct structure
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  cover_letters_generated INTEGER DEFAULT 0,
  emails_generated INTEGER DEFAULT 0,
  resumes_generated INTEGER DEFAULT 0,
  resumes_downloaded INTEGER DEFAULT 0,
  ats_optimizations_used INTEGER DEFAULT 0,
  interview_sessions INTEGER DEFAULT 0,
  job_applications INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Step 2: Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "usage_tracking_select_own" ON public.usage_tracking;
DROP POLICY IF EXISTS "usage_tracking_insert_own" ON public.usage_tracking;
DROP POLICY IF EXISTS "usage_tracking_update_own" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.usage_tracking;

-- Step 4: Create simple, clear RLS policies
CREATE POLICY "Users can view own usage" 
  ON public.usage_tracking
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" 
  ON public.usage_tracking
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" 
  ON public.usage_tracking
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Initialize usage tracking for the current user if not exists
DO $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Insert usage tracking for current authenticated user
  INSERT INTO public.usage_tracking (
    user_id,
    month_year,
    cover_letters_generated,
    emails_generated,
    resumes_generated,
    resumes_downloaded,
    ats_optimizations_used,
    interview_sessions,
    job_applications
  )
  SELECT 
    id,
    current_month,
    0, 0, 0, 0, 0, 0, 0
  FROM auth.users
  WHERE NOT EXISTS (
    SELECT 1 FROM public.usage_tracking 
    WHERE user_id = auth.users.id 
    AND month_year = current_month
  )
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  RAISE NOTICE '✅ Usage tracking initialized for existing users';
END $$;

-- Step 6: Create or replace the trigger function for new users
CREATE OR REPLACE FUNCTION public.initialize_usage_tracking()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Initialize usage tracking for current month
  INSERT INTO public.usage_tracking (
    user_id,
    month_year,
    cover_letters_generated,
    emails_generated,
    resumes_generated,
    resumes_downloaded,
    ats_optimizations_used,
    interview_sessions,
    job_applications
  )
  VALUES (
    NEW.id,
    TO_CHAR(NOW(), 'YYYY-MM'),
    0, 0, 0, 0, 0, 0, 0
  )
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for automatic initialization
DROP TRIGGER IF EXISTS on_user_created_init_usage ON auth.users;
CREATE TRIGGER on_user_created_init_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.initialize_usage_tracking();

-- Step 8: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.usage_tracking TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Usage tracking table setup complete!';
  RAISE NOTICE '✅ RLS policies created - users can view/update their own data';
  RAISE NOTICE '✅ Automatic initialization enabled for new users';
  RAISE NOTICE '✅ Existing users initialized with current month data';
END $$;
