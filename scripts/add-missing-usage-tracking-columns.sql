-- Add missing columns to usage_tracking table
-- This script safely adds columns that are referenced in the code but missing from the database

-- Add resumes_downloaded column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_tracking' AND column_name = 'resumes_downloaded'
  ) THEN
    ALTER TABLE usage_tracking ADD COLUMN resumes_downloaded INTEGER DEFAULT 0 NOT NULL;
    RAISE NOTICE 'Added resumes_downloaded column';
  ELSE
    RAISE NOTICE 'resumes_downloaded column already exists';
  END IF;
END $$;

-- Add cover_letters_generated column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_tracking' AND column_name = 'cover_letters_generated'
  ) THEN
    ALTER TABLE usage_tracking ADD COLUMN cover_letters_generated INTEGER DEFAULT 0 NOT NULL;
    RAISE NOTICE 'Added cover_letters_generated column';
  ELSE
    RAISE NOTICE 'cover_letters_generated column already exists';
  END IF;
END $$;

-- Add emails_generated column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_tracking' AND column_name = 'emails_generated'
  ) THEN
    ALTER TABLE usage_tracking ADD COLUMN emails_generated INTEGER DEFAULT 0 NOT NULL;
    RAISE NOTICE 'Added emails_generated column';
  ELSE
    RAISE NOTICE 'emails_generated column already exists';
  END IF;
END $$;

-- Add job_applications column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_tracking' AND column_name = 'job_applications'
  ) THEN
    ALTER TABLE usage_tracking ADD COLUMN job_applications INTEGER DEFAULT 0 NOT NULL;
    RAISE NOTICE 'Added job_applications column';
  ELSE
    RAISE NOTICE 'job_applications column already exists';
  END IF;
END $$;

-- Add interview_sessions column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_tracking' AND column_name = 'interview_sessions'
  ) THEN
    ALTER TABLE usage_tracking ADD COLUMN interview_sessions INTEGER DEFAULT 0 NOT NULL;
    RAISE NOTICE 'Added interview_sessions column';
  ELSE
    RAISE NOTICE 'interview_sessions column already exists';
  END IF;
END $$;

-- Update existing rows to have 0 for new columns (in case they were added as NULL)
UPDATE usage_tracking 
SET 
  resumes_downloaded = COALESCE(resumes_downloaded, 0),
  cover_letters_generated = COALESCE(cover_letters_generated, 0),
  emails_generated = COALESCE(emails_generated, 0),
  job_applications = COALESCE(job_applications, 0),
  interview_sessions = COALESCE(interview_sessions, 0),
  updated_at = NOW()
WHERE 
  resumes_downloaded IS NULL 
  OR cover_letters_generated IS NULL 
  OR emails_generated IS NULL 
  OR job_applications IS NULL 
  OR interview_sessions IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'usage_tracking' 
  AND column_name IN (
    'resumes_downloaded', 
    'cover_letters_generated', 
    'emails_generated', 
    'job_applications', 
    'interview_sessions'
  )
ORDER BY column_name;
