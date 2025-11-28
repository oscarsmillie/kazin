-- Check if the payment_required column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'resumes' 
    AND column_name = 'requires_payment'
  ) THEN
    -- Add the requires_payment column
    ALTER TABLE public.resumes ADD COLUMN requires_payment BOOLEAN DEFAULT false;
  END IF;
END $$;

-- If payment_required column exists, migrate data to requires_payment
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'resumes' 
    AND column_name = 'payment_required'
  ) THEN
    -- Copy data from payment_required to requires_payment
    UPDATE public.resumes 
    SET requires_payment = payment_required 
    WHERE requires_payment IS NULL;
    
    -- Optionally drop the old column (uncomment if needed)
    -- ALTER TABLE public.resumes DROP COLUMN payment_required;
  END IF;
END $$;

-- Add other missing columns if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'resumes' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.resumes ADD COLUMN title TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'resumes' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.resumes ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;
