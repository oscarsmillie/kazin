-- Function to initialize new user data
CREATE OR REPLACE FUNCTION initialize_new_user()
RETURNS TRIGGER AS $$
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user initialization
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.usage_tracking TO authenticated;
GRANT ALL ON public.user_activities TO authenticated;
