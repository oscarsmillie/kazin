-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

DROP POLICY IF EXISTS "Users can view own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON resumes;

DROP POLICY IF EXISTS "Users can view own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON job_applications;

DROP POLICY IF EXISTS "Users can view own goals" ON career_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON career_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON career_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON career_goals;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (auth.uid() = id);

-- Resumes table policies
CREATE POLICY "resumes_select_policy" ON resumes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "resumes_insert_policy" ON resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_update_policy" ON resumes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "resumes_delete_policy" ON resumes
    FOR DELETE USING (auth.uid() = user_id);

-- Job applications table policies
CREATE POLICY "job_applications_select_policy" ON job_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "job_applications_insert_policy" ON job_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "job_applications_update_policy" ON job_applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "job_applications_delete_policy" ON job_applications
    FOR DELETE USING (auth.uid() = user_id);

-- Career goals table policies
CREATE POLICY "career_goals_select_policy" ON career_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "career_goals_insert_policy" ON career_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "career_goals_update_policy" ON career_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "career_goals_delete_policy" ON career_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content JSONB,
    template_id TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    position TEXT NOT NULL,
    status TEXT DEFAULT 'applied',
    application_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS career_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON resumes TO authenticated;
GRANT ALL ON job_applications TO authenticated;
GRANT ALL ON career_goals TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON career_goals(user_id);
