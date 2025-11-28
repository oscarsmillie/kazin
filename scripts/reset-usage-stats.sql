-- Reset all usage stats to zero for all users
-- This script will reset the usage_tracking table

-- Reset all usage counts to zero
UPDATE usage_tracking
SET 
  resumes_downloaded = 0,
  cover_letters_generated = 0,
  emails_generated = 0,
  job_applications = 0,
  interview_sessions = 0,
  updated_at = NOW()
WHERE month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');

-- Log the reset action
INSERT INTO admin_logs (action, description, created_at)
VALUES ('usage_reset', 'Reset all usage stats to zero for current month', NOW());
