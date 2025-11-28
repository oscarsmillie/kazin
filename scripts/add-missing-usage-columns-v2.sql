-- Add missing columns to usage_tracking table
-- Version 2: Adds all required columns for usage tracking

-- First, check if columns exist and add them if they don't
DO $$ 
BEGIN
  -- Add resumes_downloaded if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_tracking' AND column_name = 'resumes_downloaded'
  ) THEN
    ALTER TABLE usage_tracking ADD COLUMN resumes_downloaded INTEGER DEFAULT 0;
    RAISE NOTICE 'Added resumes_downloaded column';
  END IF;

  -- Add cover_letters_generated if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_tracking' AND column_name = 'cover_letters_generated'
  ) THEN
    ALTER TABLE usage_tracking ADD COLUMN cover_letters_generated INTEGER DEFAULT 0;
    RAISE NOTICE 'Added cover_letters_generated column';
  END IF;

  -- Add emails_generated if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_tracking' AND column_name = 'emails_generated'
  ) THEN
    ALTER TABLE usage_tracking ADD COLUMN emails_generated INTEGER DEFAULT 0;
    RAISE NOTICE 'Added emails_generated column';
  END IF;

  -- Add job_applications if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_tracking' AND column_name = 'job_applications'
  ) THEN
    ALTER TABLE usage_tracking ADD COLUMN job_applications INTEGER DEFAULT 0;
    RAISE NOTICE 'Added job_applications column';
  END IF;

  -- Add interview_sessions if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_tracking' AND column_name = 'interview_sessions'
  ) THEN
    ALTER TABLE usage_tracking ADD COLUMN interview_sessions INTEGER DEFAULT 0;
    RAISE NOTICE 'Added interview_sessions column';
  END IF;

  -- Add career_coaching if it doesn't exist (for future use)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage_tracking' AND column_name = 'career_coaching'
  ) THEN
    ALTER TABLE usage_tracking ADD COLUMN career_coaching INTEGER DEFAULT 0;
    RAISE NOTICE 'Added career_coaching column';
  END IF;
END $$;

-- Update existing rows to have default values
UPDATE usage_tracking 
SET 
  resumes_downloaded = COALESCE(resumes_downloaded, 0),
  cover_letters_generated = COALESCE(cover_letters_generated, 0),
  emails_generated = COALESCE(emails_generated, 0),
  job_applications = COALESCE(job_applications, 0),
  interview_sessions = COALESCE(interview_sessions, 0),
  career_coaching = COALESCE(career_coaching, 0)
WHERE 
  resumes_downloaded IS NULL 
  OR cover_letters_generated IS NULL 
  OR emails_generated IS NULL 
  OR job_applications IS NULL 
  OR interview_sessions IS NULL
  OR career_coaching IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'usage_tracking'
ORDER BY ordinal_position;
