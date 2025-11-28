-- Create admin roles and permissions
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES admin_roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Insert admin roles
INSERT INTO admin_roles (name, description, permissions) VALUES 
('super_admin', 'Full system access', '["all"]'::jsonb),
('admin', 'General admin access', '["users", "subscriptions", "jobs", "analytics"]'::jsonb),
('moderator', 'Content moderation', '["jobs", "community"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Grant admin access to odimaoscar@gmail.com
INSERT INTO admin_users (email, role_id, user_id) 
SELECT 
    'odimaoscar@gmail.com',
    (SELECT id FROM admin_roles WHERE name = 'super_admin'),
    (SELECT id FROM auth.users WHERE email = 'odimaoscar@gmail.com')
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'odimaoscar@gmail.com')
ON CONFLICT (email) DO UPDATE SET 
    role_id = (SELECT id FROM admin_roles WHERE name = 'super_admin'),
    is_active = true,
    updated_at = NOW();

-- Create RLS policies for admin tables
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin roles policies
CREATE POLICY "Admin roles are viewable by admins" ON admin_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Admin users policies  
CREATE POLICY "Admin users are viewable by admins" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Admin users can update themselves" ON admin_users
    FOR UPDATE USING (user_id = auth.uid());

-- Create admin dashboard stats view
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
    (SELECT COUNT(*) FROM resumes WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as resumes_this_month,
    (SELECT COUNT(*) FROM job_applications WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as applications_this_month,
    (SELECT COUNT(*) FROM jobs WHERE is_active = true) as active_jobs,
    (SELECT COUNT(*) FROM jobs WHERE job_type = 'premium' AND is_active = true) as premium_jobs;

-- Grant access to admin view
GRANT SELECT ON admin_dashboard_stats TO authenticated;
