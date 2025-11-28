-- Create admin access for odimaoscar@gmail.com
-- This script sets up the admin user and necessary permissions

-- First, ensure the users table exists with proper structure
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    is_admin BOOLEAN DEFAULT FALSE,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    permissions JSONB DEFAULT '[]',
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert or update the super admin user
INSERT INTO users (email, full_name, role, is_admin, email_confirmed_at, created_at, updated_at)
VALUES (
    'odimaoscar@gmail.com',
    'Oscar Odima',
    'super_admin',
    TRUE,
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
    role = 'super_admin',
    is_admin = TRUE,
    updated_at = NOW();

-- Grant super admin role
INSERT INTO admin_roles (user_id, role, permissions, granted_at, is_active)
SELECT 
    u.id,
    'super_admin',
    '["all"]'::jsonb,
    NOW(),
    TRUE
FROM users u 
WHERE u.email = 'odimaoscar@gmail.com'
ON CONFLICT DO NOTHING;

-- Create admin dashboard statistics view
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
    (SELECT COUNT(*) FROM resumes) as total_resumes,
    (SELECT COUNT(*) FROM resumes WHERE created_at >= NOW() - INTERVAL '30 days') as new_resumes_30d,
    (SELECT COUNT(*) FROM payments WHERE status = 'completed') as total_payments,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
    (SELECT COUNT(*) FROM job_applications) as total_applications,
    (SELECT COUNT(*) FROM job_applications WHERE created_at >= NOW() - INTERVAL '30 days') as new_applications_30d;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Super admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.is_admin = TRUE
        )
    );

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Admin roles policies
CREATE POLICY "Admins can view admin roles" ON admin_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.is_admin = TRUE
        )
    );

-- Admin activity log policies
CREATE POLICY "Admins can view activity log" ON admin_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.is_admin = TRUE
        )
    );

CREATE POLICY "Admins can insert activity log" ON admin_activity_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.is_admin = TRUE
        )
    );

-- Create function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check admin status by email
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user email is the admin email
  RETURN user_email = 'odimaoscar@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(TEXT) TO authenticated;

-- Create function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
    action_name TEXT,
    resource_type TEXT DEFAULT NULL,
    resource_id TEXT DEFAULT NULL,
    details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_activity_log (
        admin_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        auth.uid(),
        action_name,
        resource_type,
        resource_id,
        details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the admin email exists in profiles
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'odimaoscar@gmail.com',
  'Oscar Odima',
  'admin',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'odimaoscar@gmail.com'
);

-- Update existing profile to admin if it exists
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'odimaoscar@gmail.com';

-- Create admin-only RLS policies for sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Allow admin to see all profiles
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    is_admin((SELECT auth.jwt() ->> 'email'))
  );

-- Allow admin to see all payments
CREATE POLICY "Admin can view all payments" ON payment_intents
  FOR SELECT USING (
    is_admin((SELECT auth.jwt() ->> 'email'))
  );

-- Allow admin to see all applications
CREATE POLICY "Admin can view all applications" ON job_applications
  FOR SELECT USING (
    is_admin((SELECT auth.jwt() ->> 'email'))
  );

-- Grant necessary permissions
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_activity TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);

-- Insert initial admin activity log
SELECT log_admin_activity('admin_setup', 'system', 'initial_setup', '{"message": "Admin access configured"}');

COMMIT;
