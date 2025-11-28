-- Drop existing table if it exists and recreate with correct schema
DROP TABLE IF EXISTS user_usage CASCADE;

-- Create user_usage table with correct columns
CREATE TABLE user_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_generation INTEGER DEFAULT 0,
    cover_letter_generation INTEGER DEFAULT 0,
    email_generation INTEGER DEFAULT 0,
    ats_optimization INTEGER DEFAULT 0,
    interview_prep INTEGER DEFAULT 0,
    career_coaching INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON user_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON user_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX idx_user_usage_updated_at ON user_usage(updated_at);

-- Insert some sample data for testing
INSERT INTO user_usage (user_id, resume_generation, cover_letter_generation, email_generation)
SELECT 
    id,
    0,
    0,
    0
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
