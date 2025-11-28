-- Run the comprehensive database schema
\i database/comprehensive-schema.sql

-- Create additional helper functions
CREATE OR REPLACE FUNCTION increment_download_credits(user_id UUID, credits INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET download_credits = COALESCE(download_credits, 0) + credits,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to check user limits
CREATE OR REPLACE FUNCTION check_user_limits(user_id UUID, feature_type TEXT)
RETURNS JSONB AS $$
DECLARE
  user_plan TEXT;
  current_usage INTEGER;
  plan_limits JSONB;
  result JSONB;
BEGIN
  -- Get user's current plan
  SELECT payment_status INTO user_plan
  FROM public.profiles
  WHERE id = user_id;
  
  -- Get plan limits
  SELECT features INTO plan_limits
  FROM public.subscription_plans
  WHERE plan_type = COALESCE(user_plan, 'free')
  AND is_active = true;
  
  -- Get current month usage
  SELECT CASE 
    WHEN feature_type = 'cover_letters' THEN cover_letters_generated
    WHEN feature_type = 'emails' THEN emails_generated
    WHEN feature_type = 'resumes' THEN resumes_generated
    WHEN feature_type = 'ats_optimizations' THEN ats_optimizations_used
    WHEN feature_type = 'interview_sessions' THEN interview_sessions
    ELSE 0
  END INTO current_usage
  FROM public.usage_tracking
  WHERE user_id = check_user_limits.user_id
  AND month_year = TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Build result
  result := jsonb_build_object(
    'plan', COALESCE(user_plan, 'free'),
    'feature', feature_type,
    'current_usage', COALESCE(current_usage, 0),
    'limit', COALESCE(plan_limits->feature_type, '0'::jsonb),
    'unlimited', (plan_limits->feature_type)::text = '-1',
    'can_use', CASE 
      WHEN (plan_limits->feature_type)::text = '-1' THEN true
      WHEN COALESCE(current_usage, 0) < (plan_limits->feature_type)::integer THEN true
      ELSE false
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION increment_usage_tracking(user_id UUID, feature_type TEXT)
RETURNS VOID AS $$
DECLARE
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  -- Insert or update usage tracking
  INSERT INTO public.usage_tracking (user_id, month_year)
  VALUES (user_id, current_month)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  -- Increment the specific feature usage
  CASE feature_type
    WHEN 'cover_letters' THEN
      UPDATE public.usage_tracking 
      SET cover_letters_generated = cover_letters_generated + 1,
          updated_at = NOW()
      WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
    WHEN 'emails' THEN
      UPDATE public.usage_tracking 
      SET emails_generated = emails_generated + 1,
          updated_at = NOW()
      WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
    WHEN 'resumes' THEN
      UPDATE public.usage_tracking 
      SET resumes_generated = resumes_generated + 1,
          updated_at = NOW()
      WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
    WHEN 'resumes_downloaded' THEN
      UPDATE public.usage_tracking 
      SET resumes_downloaded = resumes_downloaded + 1,
          updated_at = NOW()
      WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
    WHEN 'ats_optimizations' THEN
      UPDATE public.usage_tracking 
      SET ats_optimizations_used = ats_optimizations_used + 1,
          updated_at = NOW()
      WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
    WHEN 'interview_sessions' THEN
      UPDATE public.usage_tracking 
      SET interview_sessions = interview_sessions + 1,
          updated_at = NOW()
      WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Database setup completed successfully! All tables, functions, and permissions are ready.' as status;
