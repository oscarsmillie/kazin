-- Fix cover_letters table schema
DO $$ 
BEGIN
    -- Ensure cover_letters table has the correct structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cover_letters' AND column_name = 'metadata') THEN
        ALTER TABLE cover_letters ADD COLUMN metadata JSONB;
    END IF;
    
    -- Remove individual columns that should be in metadata
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cover_letters' AND column_name = 'skills') THEN
        ALTER TABLE cover_letters DROP COLUMN skills;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cover_letters' AND column_name = 'job_description') THEN
        ALTER TABLE cover_letters DROP COLUMN job_description;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cover_letters' AND column_name = 'user_experience') THEN
        ALTER TABLE cover_letters DROP COLUMN user_experience;
    END IF;
END $$;

-- Fix emails table schema
DO $$ 
BEGIN
    -- Ensure emails table has the correct columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'purpose') THEN
        ALTER TABLE emails ADD COLUMN purpose TEXT;
    END IF;
    
    -- Remove recipient column if it exists (we use title instead)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'recipient') THEN
        ALTER TABLE emails DROP COLUMN recipient;
    END IF;
    
    -- Ensure other required columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'company') THEN
        ALTER TABLE emails ADD COLUMN company TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'position') THEN
        ALTER TABLE emails ADD COLUMN position TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'relationship') THEN
        ALTER TABLE emails ADD COLUMN relationship TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'key_points') THEN
        ALTER TABLE emails ADD COLUMN key_points TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'tone') THEN
        ALTER TABLE emails ADD COLUMN tone TEXT DEFAULT 'professional';
    END IF;
END $$;

-- Update existing records to have default values
UPDATE emails SET 
    company = COALESCE(company, ''),
    position = COALESCE(position, ''),
    relationship = COALESCE(relationship, 'unknown'),
    key_points = COALESCE(key_points, ''),
    tone = COALESCE(tone, 'professional'),
    purpose = COALESCE(purpose, 'general')
WHERE company IS NULL OR position IS NULL OR relationship IS NULL OR key_points IS NULL OR tone IS NULL OR purpose IS NULL;

-- Ensure RLS is enabled on both tables
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policies for cover_letters
DROP POLICY IF EXISTS "Users can view own cover letters" ON cover_letters;
DROP POLICY IF EXISTS "Users can update own cover letters" ON cover_letters;
DROP POLICY IF EXISTS "Users can insert own cover letters" ON cover_letters;
DROP POLICY IF EXISTS "Users can delete own cover letters" ON cover_letters;

CREATE POLICY "Users can view own cover letters" ON cover_letters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own cover letters" ON cover_letters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cover letters" ON cover_letters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cover letters" ON cover_letters
  FOR DELETE USING (auth.uid() = user_id);

-- Create or update RLS policies for emails
DROP POLICY IF EXISTS "Users can view own emails" ON emails;
DROP POLICY IF EXISTS "Users can update own emails" ON emails;
DROP POLICY IF EXISTS "Users can insert own emails" ON emails;
DROP POLICY IF EXISTS "Users can delete own emails" ON emails;

CREATE POLICY "Users can view own emails" ON emails
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own emails" ON emails
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails" ON emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emails" ON emails
  FOR DELETE USING (auth.uid() = user_id);

COMMIT;
