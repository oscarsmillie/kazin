-- =============================================
-- FIX SUBSCRIPTIONS TABLE - CORRECT VERSION
-- =============================================

-- First, let's see what columns actually exist
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Check if amount column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'amount'
        AND table_schema = 'public'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE public.subscriptions ADD COLUMN amount DECIMAL(10,2);
        RAISE NOTICE '✅ Added amount column';
    ELSE
        RAISE NOTICE '✅ Amount column already exists';
    END IF;

    -- Check if currency column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'currency'
        AND table_schema = 'public'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE public.subscriptions ADD COLUMN currency TEXT DEFAULT 'USD';
        RAISE NOTICE '✅ Added currency column';
    ELSE
        RAISE NOTICE '✅ Currency column already exists';
    END IF;

    -- Check if billing_cycle column exists (might be named differently)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'billing_cycle'
        AND table_schema = 'public'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE public.subscriptions ADD COLUMN billing_cycle TEXT DEFAULT 'monthly';
        RAISE NOTICE '✅ Added billing_cycle column';
    ELSE
        RAISE NOTICE '✅ Billing_cycle column already exists';
    END IF;

    -- Update existing subscriptions with default amounts
    UPDATE public.subscriptions 
    SET amount = CASE 
        WHEN plan_type = 'professional' THEN 9.99
        ELSE 0.00
    END
    WHERE amount IS NULL;

    RAISE NOTICE '✅ Updated existing subscription amounts';
    RAISE NOTICE '✅ SUBSCRIPTIONS SCHEMA FIXED!';
END $$;
