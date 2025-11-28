-- Verify and update job_postings table schema
-- This ensures all fields are properly mapped for the admin dashboard

-- Check if job_postings table exists and has all required columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    
    -- Company website field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_postings' AND column_name = 'company_website') THEN
        ALTER TABLE public.job_postings ADD COLUMN company_website TEXT;
    END IF;
    
    -- Application email field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_postings' AND column_name = 'application_email') THEN
        ALTER TABLE public.job_postings ADD COLUMN application_email TEXT;
    END IF;
    
    -- Application instructions field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_postings' AND column_name = 'application_instructions') THEN
        ALTER TABLE public.job_postings ADD COLUMN application_instructions TEXT;
    END IF;
    
    -- View count field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_postings' AND column_name = 'view_count') THEN
        ALTER TABLE public.job_postings ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
    
    -- Application count field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_postings' AND column_name = 'application_count') THEN
        ALTER TABLE public.job_postings ADD COLUMN application_count INTEGER DEFAULT 0;
    END IF;
    
    -- Expires at field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_postings' AND column_name = 'expires_at') THEN
        ALTER TABLE public.job_postings ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;
    
    -- Currency field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_postings' AND column_name = 'currency') THEN
        ALTER TABLE public.job_postings ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;

    RAISE NOTICE 'Job postings table schema verified and updated successfully!';
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_postings_company_name ON public.job_postings(company_name);
CREATE INDEX IF NOT EXISTS idx_job_postings_salary_range ON public.job_postings(salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_job_postings_skills ON public.job_postings USING GIN(skills_required);
CREATE INDEX IF NOT EXISTS idx_job_postings_view_count ON public.job_postings(view_count);
CREATE INDEX IF NOT EXISTS idx_job_postings_application_count ON public.job_postings(application_count);

-- Update existing job postings to have default values
UPDATE public.job_postings 
SET 
    view_count = COALESCE(view_count, 0),
    application_count = COALESCE(application_count, 0),
    currency = COALESCE(currency, 'USD')
WHERE view_count IS NULL OR application_count IS NULL OR currency IS NULL;
