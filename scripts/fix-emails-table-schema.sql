-- Fix emails table schema to match the application expectations
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
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
    tone = COALESCE(tone, 'professional')
WHERE company IS NULL OR position IS NULL OR relationship IS NULL OR key_points IS NULL OR tone IS NULL;

-- Ensure RLS is enabled
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own emails" ON emails;
DROP POLICY IF EXISTS "Users can update own emails" ON emails;
DROP POLICY IF EXISTS "Users can insert own emails" ON emails;
DROP POLICY IF EXISTS "Users can delete own emails" ON emails;

-- Create RLS policies
CREATE POLICY "Users can view own emails" ON emails
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own emails" ON emails
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails" ON emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emails" ON emails
  FOR DELETE USING (auth.uid() = user_id);

COMMIT;
