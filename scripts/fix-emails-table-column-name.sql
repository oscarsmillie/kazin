-- Fix emails table schema - rename 'purpose' to 'email_type' if it exists
-- or add 'email_type' column if 'purpose' doesn't exist

DO $$
BEGIN
    -- Check if 'purpose' column exists and rename it to 'email_type'
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'emails' 
        AND column_name = 'purpose'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.emails RENAME COLUMN purpose TO email_type;
        RAISE NOTICE 'Renamed purpose column to email_type';
    END IF;

    -- If 'email_type' doesn't exist, create it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'emails' 
        AND column_name = 'email_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.emails ADD COLUMN email_type TEXT;
        RAISE NOTICE 'Added email_type column';
    END IF;

    -- Ensure the emails table has all required columns
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'emails' 
        AND column_name = 'key_points'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.emails ADD COLUMN key_points TEXT;
        RAISE NOTICE 'Added key_points column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'emails' 
        AND column_name = 'relationship'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.emails ADD COLUMN relationship TEXT;
        RAISE NOTICE 'Added relationship column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'emails' 
        AND column_name = 'company'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.emails ADD COLUMN company TEXT;
        RAISE NOTICE 'Added company column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'emails' 
        AND column_name = 'position'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.emails ADD COLUMN position TEXT;
        RAISE NOTICE 'Added position column';
    END IF;

END $$;

-- Update RLS policies for emails table
DROP POLICY IF EXISTS "Users can view own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can insert own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can update own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can delete own emails" ON public.emails;

CREATE POLICY "Users can view own emails" ON public.emails
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails" ON public.emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emails" ON public.emails
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emails" ON public.emails
    FOR DELETE USING (auth.uid() = user_id);
