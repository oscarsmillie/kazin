-- Drop existing table if it exists
DROP TABLE IF EXISTS usage_tracking CASCADE;

-- Create usage_tracking table
CREATE TABLE usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: "2024-01"
    cover_letters_generated INTEGER DEFAULT 0,
    emails_generated INTEGER DEFAULT 0,
    resumes_generated INTEGER DEFAULT 0,
    resumes_downloaded INTEGER DEFAULT 0,
    ats_optimizations_used INTEGER DEFAULT 0,
    interview_sessions INTEGER DEFAULT 0,
    job_applications INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own usage" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_usage_tracking_user_month ON usage_tracking(user_id, month_year);

-- Create function to auto-initialize usage tracking for new users
CREATE OR REPLACE FUNCTION initialize_user_usage()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO usage_tracking (
        user_id,
        month_year,
        cover_letters_generated,
        emails_generated,
        resumes_generated,
        resumes_downloaded,
        ats_optimizations_used,
        interview_sessions,
        job_applications
    ) VALUES (
        NEW.id,
        TO_CHAR(NOW(), 'YYYY-MM'),
        0, 0, 0, 0, 0, 0, 0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-initialize usage for new users
DROP TRIGGER IF EXISTS trigger_initialize_user_usage ON auth.users;
CREATE TRIGGER trigger_initialize_user_usage
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_usage();
