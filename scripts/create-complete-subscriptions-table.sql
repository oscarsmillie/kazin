-- =============================================
-- CREATE COMPLETE SUBSCRIPTIONS TABLE
-- =============================================

-- Drop existing table if it exists (be careful with this in production)
-- DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Create subscriptions table with all required columns
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'free',
    billing_cycle TEXT DEFAULT 'monthly',
    paystack_subscription_id TEXT,
    paystack_customer_code TEXT,
    paystack_reference TEXT,
    amount DECIMAL(10,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    plan_code TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON public.subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON public.subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_ref ON public.subscriptions(paystack_reference);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Backend service role policy (for API operations)
DROP POLICY IF EXISTS "Backend can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Backend can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (current_setting('role') = 'service_role');

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ SUBSCRIPTIONS TABLE CREATED SUCCESSFULLY!';
    RAISE NOTICE '✅ All required columns added';
    RAISE NOTICE '✅ Indexes created for performance';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '📊 Ready for subscription management';
END $$;
