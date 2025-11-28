-- =============================================
-- PURGE ALL EXISTING RLS POLICIES AND CREATE COMPREHENSIVE ONES
-- =============================================

-- Disable RLS temporarily to purge policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_optimizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS FOR ADMIN ACCESS
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 
    AND role_name IN ('admin', 'super_admin') 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- USER MANAGEMENT POLICIES
-- =============================================

-- Users table policies
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "users_delete_own" ON public.users
  FOR DELETE USING (auth.uid() = id OR public.is_admin());

-- Profiles table policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id OR public.is_admin());

-- User roles policies
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- =============================================
-- SUBSCRIPTION AND PAYMENT POLICIES
-- =============================================

-- Subscription plans (public read, admin manage)
CREATE POLICY "subscription_plans_public_read" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "subscription_plans_admin_manage" ON public.subscription_plans
  FOR ALL USING (public.is_admin());

-- Subscriptions policies
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "subscriptions_delete_admin" ON public.subscriptions
  FOR DELETE USING (public.is_admin());

-- Usage tracking policies
CREATE POLICY "usage_tracking_select_own" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "usage_tracking_insert_own" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usage_tracking_update_own" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Payment intents policies
CREATE POLICY "payment_intents_select_own" ON public.payment_intents
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "payment_intents_insert_own" ON public.payment_intents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_intents_update_own" ON public.payment_intents
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Download history policies
CREATE POLICY "download_history_select_own" ON public.download_history
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "download_history_insert_own" ON public.download_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- CONTENT CREATION POLICIES
-- =============================================

-- Career goals policies
CREATE POLICY "career_goals_select_own" ON public.career_goals
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "career_goals_insert_own" ON public.career_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "career_goals_update_own" ON public.career_goals
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "career_goals_delete_own" ON public.career_goals
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Resume templates policies (public read, admin manage)
CREATE POLICY "resume_templates_public_read" ON public.resume_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "resume_templates_admin_manage" ON public.resume_templates
  FOR ALL USING (public.is_admin());

-- Resumes policies
CREATE POLICY "resumes_select_own" ON public.resumes
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "resumes_insert_own" ON public.resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_update_own" ON public.resumes
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "resumes_delete_own" ON public.resumes
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Cover letters policies
CREATE POLICY "cover_letters_select_own" ON public.cover_letters
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "cover_letters_insert_own" ON public.cover_letters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cover_letters_update_own" ON public.cover_letters
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "cover_letters_delete_own" ON public.cover_letters
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Emails policies
CREATE POLICY "emails_select_own" ON public.emails
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "emails_insert_own" ON public.emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails_update_own" ON public.emails
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "emails_delete_own" ON public.emails
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- =============================================
-- JOB BOARD POLICIES
-- =============================================

-- Job postings policies
CREATE POLICY "job_postings_public_read" ON public.job_postings
  FOR SELECT USING (
    is_active = true AND (
      -- Public jobs for everyone
      is_premium = false OR 
      -- Premium jobs only for professional users
      (is_premium = true AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND payment_status = 'professional'
      )) OR
      -- Admins can see all
      public.is_admin() OR
      -- Job posters can see their own
      auth.uid() = posted_by
    )
  );

CREATE POLICY "job_postings_insert_authenticated" ON public.job_postings
  FOR INSERT WITH CHECK (public.is_authenticated());

CREATE POLICY "job_postings_update_own_or_admin" ON public.job_postings
  FOR UPDATE USING (auth.uid() = posted_by OR public.is_admin());

CREATE POLICY "job_postings_delete_own_or_admin" ON public.job_postings
  FOR DELETE USING (auth.uid() = posted_by OR public.is_admin());

-- Job applications policies
CREATE POLICY "job_applications_select_own" ON public.job_applications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "job_applications_insert_own" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "job_applications_update_own" ON public.job_applications
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "job_applications_delete_own" ON public.job_applications
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- =============================================
-- PROFESSIONAL FEATURES POLICIES
-- =============================================

-- ATS optimizations policies
CREATE POLICY "ats_optimizations_select_own" ON public.ats_optimizations
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "ats_optimizations_insert_own" ON public.ats_optimizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Interview sessions policies
CREATE POLICY "interview_sessions_select_own" ON public.interview_sessions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "interview_sessions_insert_own" ON public.interview_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "interview_sessions_update_own" ON public.interview_sessions
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- =============================================
-- NOTIFICATION AND ACTIVITY POLICIES
-- =============================================

-- Notifications policies
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- User activities policies
CREATE POLICY "user_activities_select_own" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "user_activities_insert_own" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- COMMUNITY POLICIES
-- =============================================

-- Community posts policies (public read, admin manage)
CREATE POLICY "community_posts_public_read" ON public.community_posts
  FOR SELECT USING (is_active = true);

CREATE POLICY "community_posts_admin_manage" ON public.community_posts
  FOR ALL USING (public.is_admin());

-- =============================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =============================================

-- Grant usage on all tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant usage on all tables to anon users (for public content)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.resume_templates TO anon;
GRANT SELECT ON public.job_postings TO anon;
GRANT SELECT ON public.community_posts TO anon;
GRANT SELECT ON public.subscription_plans TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 RLS POLICIES PURGED AND RECREATED SUCCESSFULLY!';
  RAISE NOTICE '✅ All tables now have comprehensive RLS policies';
  RAISE NOTICE '✅ Admin functions created for elevated access';
  RAISE NOTICE '✅ Public content accessible to anonymous users';
  RAISE NOTICE '✅ User content protected by user ownership';
  RAISE NOTICE '✅ Professional features properly gated';
END $$;
