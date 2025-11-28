# Admin Login Guide - Kazi Nest

## Super Admin Access

**Email:** `odimaoscar@gmail.com`

## Setup Instructions

### 1. Initial Account Creation
1. Go to `/auth` on the application
2. Sign up with the email `odimaoscar@gmail.com`
3. Check your email for the confirmation link
4. Click the confirmation link to verify your email
5. Complete the sign-in process

### 2. Admin Access Verification
Once logged in, you will automatically have admin privileges. The system will:
- Recognize your email as the super admin
- Grant full administrative permissions
- Allow access to admin-only features

### 3. Accessing Admin Features

#### Admin Dashboard
- URL: `/admin/dashboard`
- Features:
  - Platform statistics
  - User management
  - Payment tracking
  - System overview

#### Admin Jobs Management
- URL: `/admin/jobs`
- Features:
  - Job posting management
  - Application tracking
  - Employer management

### 4. Admin Capabilities

As a super admin, you have access to:

#### User Management
- View all user accounts
- Monitor user activity
- Manage user permissions
- View user statistics

#### Payment Management
- Track all payments
- View revenue statistics
- Monitor payment failures
- Generate financial reports

#### Content Management
- Manage job postings
- Moderate user content
- Update system templates
- Configure platform settings

#### System Administration
- View system logs
- Monitor performance
- Manage integrations
- Configure email templates

### 5. Database Access

The admin system uses Row Level Security (RLS) policies to ensure secure access:

- **Super Admin Role**: Full access to all data
- **Activity Logging**: All admin actions are logged
- **Secure Permissions**: Database-level security enforcement

### 6. Admin Functions Available

#### Dashboard Statistics
\`\`\`sql
SELECT * FROM admin_dashboard_stats;
\`\`\`

#### Check Admin Status
\`\`\`sql
SELECT is_admin(auth.uid());
\`\`\`

#### Log Admin Activity
\`\`\`sql
SELECT log_admin_activity('action_name', 'resource_type', 'resource_id', '{"key": "value"}');
\`\`\`

### 7. Security Features

- **Email Verification Required**: Admin access only after email confirmation
- **Database-Level Security**: RLS policies protect admin data
- **Activity Logging**: All admin actions are tracked
- **Secure Authentication**: Supabase handles authentication securely

### 8. Troubleshooting

#### Cannot Access Admin Features
1. Verify email is confirmed
2. Check that you're logged in with `odimaoscar@gmail.com`
3. Clear browser cache and cookies
4. Try logging out and back in

#### Email Confirmation Issues
1. Check spam/junk folder
2. Use the "Resend Email" button on the auth page
3. Ensure email address is typed correctly

#### Database Connection Issues
1. Verify Supabase environment variables are set
2. Check database connection in admin panel
3. Run the setup SQL script if needed

### 9. Environment Variables Required

Ensure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 10. Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure the database schema is properly set up
4. Contact technical support if issues persist

## Quick Start Checklist

- [ ] Sign up with `odimaoscar@gmail.com`
- [ ] Confirm email address
- [ ] Sign in to the application
- [ ] Navigate to `/admin/dashboard`
- [ ] Verify admin access is working
- [ ] Test admin features

Your admin access is now configured and ready to use!
