-- Ensure career_goals table exists with proper structure
CREATE TABLE IF NOT EXISTS career_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON career_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_career_goals_status ON career_goals(status);
CREATE INDEX IF NOT EXISTS idx_career_goals_created_at ON career_goals(created_at DESC);

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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_career_goals_updated_at ON career_goals;
CREATE TRIGGER update_career_goals_updated_at
    BEFORE UPDATE ON career_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
INSERT INTO career_goals (user_id, title, description, target_date, status, priority)
SELECT 
    auth.uid(),
    'Get promoted to Senior Developer',
    'Focus on leadership skills and technical expertise to advance to senior role',
    CURRENT_DATE + INTERVAL '6 months',
    'in_progress',
    'high'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- Verify table creation
SELECT 
    'career_goals table created successfully' as message,
    COUNT(*) as total_goals
FROM career_goals;
