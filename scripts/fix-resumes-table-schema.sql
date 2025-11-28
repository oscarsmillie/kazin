-- Fix resumes table schema to include missing columns
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS template_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS generated_html TEXT,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

-- Update existing records to have a default template_name if null
UPDATE resumes 
SET template_name = 'default-template' 
WHERE template_name IS NULL;

-- Ensure the table has all necessary columns
DO $$
BEGIN
    -- Check if title column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resumes' AND column_name = 'title') THEN
        ALTER TABLE resumes ADD COLUMN title VARCHAR(255);
    END IF;
    
    -- Check if is_active column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resumes' AND column_name = 'is_active') THEN
        ALTER TABLE resumes ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;
