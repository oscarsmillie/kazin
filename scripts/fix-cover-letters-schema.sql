-- Update cover_letters table schema to include all necessary columns
ALTER TABLE cover_letters 
ADD COLUMN IF NOT EXISTS hiring_manager_name TEXT,
ADD COLUMN IF NOT EXISTS job_description TEXT,
ADD COLUMN IF NOT EXISTS generated_by_ai BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_prompt_used TEXT,
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_downloaded_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to set default values
UPDATE cover_letters 
SET generated_by_ai = true 
WHERE generated_by_ai IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_created_at ON cover_letters(created_at);
