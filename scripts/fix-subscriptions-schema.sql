-- =============================================
-- FIX SUBSCRIPTIONS TABLE SCHEMA
-- =============================================
-- This script updates the subscriptions table to match the API requirements

-- First, let's see what columns exist
DO $$
BEGIN
    -- Check if subscriptions table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        RAISE NOTICE '✅ Subscriptions table exists';
    ELSE
        RAISE NOTICE '❌ Subscriptions table does not exist - creating it';
    END IF;
END $$;

-- Drop and recreate the subscriptions table with correct schema
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Create the subscriptions table with all required columns
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'professional')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  
  -- Paystack integration fields
  paystack_reference TEXT UNIQUE,
  paystack_subscription_id TEXT,
  paystack_customer_code TEXT,
  
  -- Pricing fields
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  plan_code TEXT, -- Paystack plan code
  
  -- Subscription period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id) -- One subscription per user
);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_paystack_reference ON public.subscriptions(paystack_reference);
CREATE INDEX idx_subscriptions_plan_type ON public.subscriptions(plan_type);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default free subscription for existing users
INSERT INTO public.subscriptions (user_id, plan_type, status, created_at, updated_at)
SELECT 
  id,
  'free',
  'active',
  NOW(),
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- Create or update the subscription plans table with correct data
INSERT INTO public.subscription_plans (name, plan_type, price_monthly, price_yearly, paystack_plan_code, features, resume_download_price) VALUES
('Free Plan', 'free', 0.00, 0.00, NULL, '{
  "cover_letters": 10,
  "emails": 10,
  "resumes": 0,
  "ats_optimizations": 0,
  "interview_sessions": 0,
  "job_applications": 20,
  "job_board_access": "public",
  "premium_templates": false,
  "ai_features": false,
  "priority_support": false
}', 5.00),
('Professional Plan', 'professional', 9.99, 99.99, 'PLN_opg5y5nhwuqh3a6', '{
  "cover_letters": -1,
  "emails": -1,
  "resumes": 2,
  "ats_optimizations": 6,
  "interview_sessions": 3,
  "job_applications": -1,
  "job_board_access": "premium",
  "premium_templates": true,
  "ai_features": true,
  "priority_support": true
}', 5.00)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  paystack_plan_code = EXCLUDED.paystack_plan_code,
  features = EXCLUDED.features,
  resume_download_price = EXCLUDED.resume_download_price,
  updated_at = NOW();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 SUBSCRIPTIONS SCHEMA UPDATED SUCCESSFULLY!';
  RAISE NOTICE '✅ Subscriptions table recreated with proper schema';
  RAISE NOTICE '✅ All required columns added for Paystack integration';
  RAISE NOTICE '✅ RLS policies and indexes created';
  RAISE NOTICE '✅ Updated usage limits: Free (10/10/20), Pro (∞/∞/∞)';
  RAISE NOTICE '✅ Resume pricing: $5 each (Free), 2 free + $5 each (Pro)';
END $$;
