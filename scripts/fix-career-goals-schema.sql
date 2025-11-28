-- Fix career goals table schema
-- This script ensures the career_goals table has all required columns

-- First, check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS career_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')) DEFAULT 'not_started',
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add progress column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'career_goals' AND column_name = 'progress') THEN
        ALTER TABLE career_goals ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'career_goals' AND column_name = 'status') THEN
        ALTER TABLE career_goals ADD COLUMN status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')) DEFAULT 'not_started';
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'career_goals' AND column_name = 'priority') THEN
        ALTER TABLE career_goals ADD COLUMN priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium';
    END IF;

    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'career_goals' AND column_name = 'category') THEN
        ALTER TABLE career_goals ADD COLUMN category TEXT DEFAULT 'general';
    END IF;

    -- Add target_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'career_goals' AND column_name = 'target_date') THEN
        ALTER TABLE career_goals ADD COLUMN target_date DATE;
    END IF;
END $$;

-- Update existing records to have default values for new columns
UPDATE career_goals 
SET 
    progress = COALESCE(progress, 0),
    status = COALESCE(status, 'not_started'),
    priority = COALESCE(priority, 'medium'),
    category = COALESCE(category, 'general')
WHERE progress IS NULL OR status IS NULL OR priority IS NULL OR category IS NULL;

-- Create or replace the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_career_goals_updated_at ON career_goals;
CREATE TRIGGER update_career_goals_updated_at
    BEFORE UPDATE ON career_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON career_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_career_goals_status ON career_goals(status);
CREATE INDEX IF NOT EXISTS idx_career_goals_priority ON career_goals(priority);
CREATE INDEX IF NOT EXISTS idx_career_goals_target_date ON career_goals(target_date);

-- Enable RLS
ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own career goals" ON career_goals;
DROP POLICY IF EXISTS "Users can insert their own career goals" ON career_goals;
DROP POLICY IF EXISTS "Users can update their own career goals" ON career_goals;
DROP POLICY IF EXISTS "Users can delete their own career goals" ON career_goals;

-- Create RLS policies
CREATE POLICY "Users can view their own career goals" ON career_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career goals" ON career_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career goals" ON career_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own career goals" ON career_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON career_goals TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'career_goals'
ORDER BY ordinal_position;
