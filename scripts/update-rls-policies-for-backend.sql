-- Update RLS policies to work with both client and backend operations
-- This script ensures proper security while allowing backend operations

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

DROP POLICY IF EXISTS "resumes_select_policy" ON resumes;
DROP POLICY IF EXISTS "resumes_insert_policy" ON resumes;
DROP POLICY IF EXISTS "resumes_update_policy" ON resumes;
DROP POLICY IF EXISTS "resumes_delete_policy" ON resumes;

DROP POLICY IF EXISTS "subscriptions_select_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_policy" ON subscriptions;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;

-- Users table policies - Allow service role full access, authenticated users access to own data
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        auth.uid() = id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Resumes table policies
CREATE POLICY "resumes_select_policy" ON resumes
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "resumes_insert_policy" ON resumes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "resumes_update_policy" ON resumes
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Subscriptions table policies - Service role can manage all, users can only read their own
CREATE POLICY "subscriptions_select_policy" ON subscriptions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "subscriptions_insert_policy" ON subscriptions
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "subscriptions_update_policy" ON subscriptions
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "subscriptions_delete_policy" ON subscriptions
    FOR DELETE USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Job applications table policies
CREATE POLICY "job_applications_select_policy" ON job_applications
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "job_applications_insert_policy" ON job_applications
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "job_applications_update_policy" ON job_applications
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Career goals table policies
CREATE POLICY "career_goals_select_policy" ON career_goals
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "career_goals_insert_policy" ON career_goals
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "career_goals_update_policy" ON career_goals
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Ensure all necessary tables exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'free',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    status TEXT NOT NULL DEFAULT 'active',
    paystack_reference TEXT,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Grant necessary permissions
GRANT ALL ON users TO authenticated, service_role;
GRANT ALL ON subscriptions TO authenticated, service_role;
GRANT ALL ON resumes TO authenticated, service_role;
GRANT ALL ON job_applications TO authenticated, service_role;
GRANT ALL ON career_goals TO authenticated, service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_reference ON subscriptions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON career_goals(user_id);
