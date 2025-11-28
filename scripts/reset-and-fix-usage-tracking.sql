-- =============================================
-- RESET ALL USAGE TRACKING TO ZERO
-- =============================================

-- Reset all usage tracking records to zero for all features
UPDATE public.usage_tracking
SET 
  cover_letters_generated = 0,
  emails_generated = 0,
  resumes_generated = 0,
  resumes_downloaded = 0,
  ats_optimizations_used = 0,
  interview_sessions = 0,
  job_applications = 0,
  updated_at = NOW();

-- Log the reset action
INSERT INTO public.system_logs (log_level, module, message, metadata, created_at)
VALUES (
  'info',
  'usage_tracking',
  'All usage tracking metrics reset to zero',
  jsonb_build_object(
    'reset_time', NOW(),
    'action', 'system_reset',
    'records_affected', (SELECT COUNT(*) FROM public.usage_tracking)
  ),
  NOW()
);

-- Verify reset was successful
DO $$
DECLARE
  total_usage INTEGER;
BEGIN
  SELECT 
    COALESCE(SUM(cover_letters_generated + emails_generated + resumes_generated + resumes_downloaded + ats_optimizations_used + interview_sessions + job_applications), 0)
  INTO total_usage
  FROM public.usage_tracking;
  
  IF total_usage = 0 THEN
    RAISE NOTICE '✅ Usage tracking reset successfully! All metrics set to 0';
  ELSE
    RAISE NOTICE '⚠️ Warning: Total usage is still %', total_usage;
  END IF;
  
  RAISE NOTICE '📊 Total users with usage records: %', (SELECT COUNT(*) FROM public.usage_tracking);
END $$;
