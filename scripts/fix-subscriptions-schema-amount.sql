-- =============================================
-- FIX SUBSCRIPTIONS TABLE - ADD MISSING AMOUNT COLUMN
-- =============================================

-- Add the missing amount column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

-- Add currency column if it doesn't exist
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Update existing subscriptions with default amounts based on plan type
UPDATE public.subscriptions 
SET amount = CASE 
  WHEN billing_cycle = 'monthly' AND plan_type = 'professional' THEN 9.99
  WHEN billing_cycle = 'yearly' AND plan_type = 'professional' THEN 99.99
  ELSE 0.00
END
WHERE amount IS NULL;

-- Update subscription plans with new limits
UPDATE public.subscription_plans 
SET features = '{
  "cover_letters": 20,
  "emails": 20,
  "resumes": 0,
  "ats_optimizations": 0,
  "interview_sessions": 0,
  "job_applications": 30,
  "job_board_access": "public",
  "premium_templates": false,
  "ai_features": false,
  "priority_support": false
}', resume_download_price = 4.00
WHERE plan_type = 'free';

UPDATE public.subscription_plans 
SET features = '{
  "cover_letters": -1,
  "emails": -1,
  "resumes": 2,
  "ats_optimizations": -1,
  "interview_sessions": -1,
  "job_applications": -1,
  "job_board_access": "premium",
  "premium_templates": true,
  "ai_features": true,
  "priority_support": true,
  "career_coaching": -1
}', resume_download_price = 4.00
WHERE plan_type = 'professional';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ SUBSCRIPTIONS SCHEMA FIXED!';
  RAISE NOTICE '✅ Added amount and currency columns';
  RAISE NOTICE '✅ Updated subscription plans with new limits';
  RAISE NOTICE '📊 Free: 20 cover letters, 20 emails, 30 applications, $4/resume';
  RAISE NOTICE '💎 Pro: Unlimited letters/emails/apps, 2 free resumes, unlimited features';
END $$;
