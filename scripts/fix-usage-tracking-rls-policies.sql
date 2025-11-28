-- Fix RLS policies for usage_tracking table to allow proper initialization

-- First, create the is_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND email = 'odimaoscar@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "usage_tracking_select_own" ON public.usage_tracking;
DROP POLICY IF EXISTS "usage_tracking_insert_own" ON public.usage_tracking;
DROP POLICY IF EXISTS "usage_tracking_update_own" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_tracking;

-- Create new policies that allow proper initialization
CREATE POLICY "usage_tracking_select_own" ON public.usage_tracking
  FOR SELECT USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

CREATE POLICY "usage_tracking_insert_own" ON public.usage_tracking
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    public.is_admin()
  );

CREATE POLICY "usage_tracking_update_own" ON public.usage_tracking
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    public.is_admin()
  );

-- Also fix profiles table policies to ensure proper initialization
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    public.is_admin()
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.usage_tracking TO postgres;
GRANT ALL ON public.user_activities TO postgres;

-- Update the initialization function to use proper security context
CREATE OR REPLACE FUNCTION initialize_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

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
    job_applications,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    TO_CHAR(NOW(), 'YYYY-MM'),
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, month_year) DO NOTHING;

  -- Create default subscription
  INSERT INTO public.subscriptions (user_id, plan_type, status, created_at, updated_at)
  VALUES (NEW.id, 'free', 'active', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_new_user();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Usage tracking RLS policies fixed!';
  RAISE NOTICE '✅ User initialization function updated with proper security context';
  RAISE NOTICE '✅ Triggers recreated for automatic user setup';
END $$;
