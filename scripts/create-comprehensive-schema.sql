-- =============================================
-- KAZI - COMPREHENSIVE DATABASE SCHEMA
-- Create all missing tables, functions, and policies
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PROFILES TABLE (Missing from current schema)
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  avatar_url TEXT,
  job_title TEXT,
  company TEXT,
  skills TEXT[],
  email_notifications BOOLEAN DEFAULT TRUE,
  theme_preference TEXT DEFAULT 'light',
  phone_number TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  twitter_url TEXT,
  payment_status TEXT DEFAULT 'free' CHECK (payment_status IN ('free', 'premium', 'professional', 'enterprise')),
  download_credits INTEGER DEFAULT 0,
  last_payment_date TIMESTAMPTZ,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USER ROLES TABLE (Missing from current schema)
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL CHECK (role_name IN ('user', 'admin', 'super_admin', 'content_moderator', 'job_poster')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_name)
);

-- =============================================
-- PAYMENT INTENTS TABLE (Updated structure)
-- =============================================

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reference VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in subunits (kobo/cents)
  currency VARCHAR(3) DEFAULT 'KES',
  plan VARCHAR(50),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'resume_download', 'upgrade', 'one_time_download')),
  gateway_response TEXT,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EMAILS TABLE (Missing from current schema)
-- =============================================

CREATE TABLE IF NOT EXISTS public.emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('follow_up', 'thank_you', 'networking', 'inquiry', 'application', 'other')),
  title TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  company_name TEXT,
  context TEXT, -- Additional context for AI generation
  generated_by_ai BOOLEAN DEFAULT false,
  ai_prompt_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INTERVIEW SESSIONS TABLE (Missing from current schema)
-- =============================================

CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_application_id UUID REFERENCES public.job_applications(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('practice', 'mock', 'ai_coaching', 'basic', 'premium', 'professional')),
  job_title TEXT,
  company_name TEXT,
  industry TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  ai_feedback JSONB,
  feedback TEXT,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  duration_minutes INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ATS OPTIMIZATIONS TABLE (Missing from current schema)
-- =============================================

CREATE TABLE IF NOT EXISTS public.ats_optimizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_description TEXT NOT NULL,
  optimization_type TEXT NOT NULL CHECK (optimization_type IN ('basic', 'full', 'advanced')),
  keyword_score INTEGER NOT NULL CHECK (keyword_score >= 0 AND keyword_score <= 100),
  ats_score INTEGER NOT NULL CHECK (ats_score >= 0 AND ats_score <= 100),
  missing_keywords TEXT[],
  suggestions TEXT[],
  detailed_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMMUNITY POSTS TABLE (Missing from current schema)
-- =============================================

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  posted_by UUID REFERENCES auth.users(id),
  post_type TEXT NOT NULL CHECK (post_type IN ('announcement', 'update', 'tip', 'success_story', 'maintenance')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  target_audience TEXT[] DEFAULT ARRAY['all'],
  read_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOWNLOAD HISTORY TABLE (Missing from current schema)
-- =============================================

CREATE TABLE IF NOT EXISTS public.download_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('resume', 'cover_letter')),
  item_id UUID NOT NULL,
  payment_intent_id UUID REFERENCES public.payment_intents(id),
  download_format TEXT NOT NULL CHECK (download_format IN ('pdf', 'docx')),
  file_url TEXT,
  is_paid_download BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON public.profiles(payment_status);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON public.user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON public.user_roles(is_active);

-- Payment intents indexes
CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON public.payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_reference ON public.payment_intents(reference);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents(status);

-- Emails indexes
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON public.emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_email_type ON public.emails(email_type);

-- Interview sessions indexes
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_session_type ON public.interview_sessions(session_type);

-- ATS optimizations indexes
CREATE INDEX IF NOT EXISTS idx_ats_optimizations_user_id ON public.ats_optimizations(user_id);
CREATE INDEX IF NOT EXISTS idx_ats_optimizations_resume_id ON public.ats_optimizations(resume_id);

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_post_type ON public.community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_active ON public.community_posts(is_active);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_pinned ON public.community_posts(is_pinned);

-- Download history indexes
CREATE INDEX IF NOT EXISTS idx_download_history_user_id ON public.download_history(user_id);
CREATE INDEX IF NOT EXISTS idx_download_history_item_type ON public.download_history(item_type);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_intents_updated_at ON public.payment_intents;
CREATE TRIGGER update_payment_intents_updated_at 
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emails_updated_at ON public.emails;
CREATE TRIGGER update_emails_updated_at 
  BEFORE UPDATE ON public.emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON public.community_posts;
CREATE TRIGGER update_community_posts_updated_at 
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- USER MANAGEMENT FUNCTIONS
-- =============================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, full_name, email_notifications)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create default usage tracking record if table exists
  INSERT INTO public.usage_tracking (user_id, month_year)
  VALUES (NEW.id, TO_CHAR(NOW(), 'YYYY-MM'))
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment download credits
CREATE OR REPLACE FUNCTION increment_download_credits(user_id UUID, credits INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET download_credits = COALESCE(download_credits, 0) + credits,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check user limits
CREATE OR REPLACE FUNCTION check_user_limits(user_id UUID, feature_type TEXT)
RETURNS JSONB AS $$
DECLARE
  user_plan TEXT;
  current_usage INTEGER := 0;
  plan_limits JSONB;
  result JSONB;
BEGIN
  -- Get user's current plan
  SELECT payment_status INTO user_plan
  FROM public.profiles
  WHERE id = user_id;
  
  -- Get plan limits from subscription_plans if table exists
  SELECT features INTO plan_limits
  FROM public.subscription_plans
  WHERE plan_type = COALESCE(user_plan, 'free')
  AND is_active = true
  LIMIT 1;
  
  -- Get current month usage if usage_tracking table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
    SELECT CASE 
      WHEN feature_type = 'cover_letters' THEN COALESCE(cover_letters_generated, 0)
      WHEN feature_type = 'emails' THEN COALESCE(emails_generated, 0)
      WHEN feature_type = 'resumes' THEN COALESCE(resumes_generated, 0)
      WHEN feature_type = 'ats_optimizations' THEN COALESCE(ats_optimizations_used, 0)
      WHEN feature_type = 'interview_sessions' THEN COALESCE(interview_sessions, 0)
      ELSE 0
    END INTO current_usage
    FROM public.usage_tracking
    WHERE user_id = check_user_limits.user_id
    AND month_year = TO_CHAR(NOW(), 'YYYY-MM');
  END IF;
  
  -- Build result
  result := jsonb_build_object(
    'plan', COALESCE(user_plan, 'free'),
    'feature', feature_type,
    'current_usage', COALESCE(current_usage, 0),
    'limit', COALESCE(plan_limits->feature_type, '0'::jsonb),
    'unlimited', (plan_limits->feature_type)::text = '-1',
    'can_use', CASE 
      WHEN (plan_limits->feature_type)::text = '-1' THEN true
      WHEN COALESCE(current_usage, 0) < COALESCE((plan_limits->feature_type)::integer, 0) THEN true
      ELSE false
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage tracking
CREATE OR REPLACE FUNCTION increment_usage_tracking(user_id UUID, feature_type TEXT)
RETURNS VOID AS $$
DECLARE
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  -- Only proceed if usage_tracking table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
    -- Insert or update usage tracking
    INSERT INTO public.usage_tracking (user_id, month_year)
    VALUES (user_id, current_month)
    ON CONFLICT (user_id, month_year) DO NOTHING;
    
    -- Increment the specific feature usage
    CASE feature_type
      WHEN 'cover_letters' THEN
        UPDATE public.usage_tracking 
        SET cover_letters_generated = COALESCE(cover_letters_generated, 0) + 1,
            updated_at = NOW()
        WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
      WHEN 'emails' THEN
        UPDATE public.usage_tracking 
        SET emails_generated = COALESCE(emails_generated, 0) + 1,
            updated_at = NOW()
        WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
      WHEN 'resumes' THEN
        UPDATE public.usage_tracking 
        SET resumes_generated = COALESCE(resumes_generated, 0) + 1,
            updated_at = NOW()
        WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
      WHEN 'resumes_downloaded' THEN
        UPDATE public.usage_tracking 
        SET resumes_downloaded = COALESCE(resumes_downloaded, 0) + 1,
            updated_at = NOW()
        WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
      WHEN 'ats_optimizations' THEN
        UPDATE public.usage_tracking 
        SET ats_optimizations_used = COALESCE(ats_optimizations_used, 0) + 1,
            updated_at = NOW()
        WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
      WHEN 'interview_sessions' THEN
        UPDATE public.usage_tracking 
        SET interview_sessions = COALESCE(interview_sessions, 0) + 1,
            updated_at = NOW()
        WHERE user_id = increment_usage_tracking.user_id AND month_year = current_month;
    END CASE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Payment intents policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_intents;
CREATE POLICY "Users can view own payments" ON public.payment_intents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payment_intents;
CREATE POLICY "Users can insert own payments" ON public.payment_intents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payments" ON public.payment_intents;
CREATE POLICY "Users can update own payments" ON public.payment_intents
  FOR UPDATE USING (auth.uid() = user_id);

-- Emails policies
DROP POLICY IF EXISTS "Users can manage own emails" ON public.emails;
CREATE POLICY "Users can manage own emails" ON public.emails
  FOR ALL USING (auth.uid() = user_id);

-- Interview sessions policies
DROP POLICY IF EXISTS "Users can manage own interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can manage own interview sessions" ON public.interview_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ATS optimizations policies
DROP POLICY IF EXISTS "Users can manage own ats optimizations" ON public.ats_optimizations;
CREATE POLICY "Users can manage own ats optimizations" ON public.ats_optimizations
  FOR ALL USING (auth.uid() = user_id);

-- Download history policies
DROP POLICY IF EXISTS "Users can view own downloads" ON public.download_history;
CREATE POLICY "Users can view own downloads" ON public.download_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own downloads" ON public.download_history;
CREATE POLICY "Users can insert own downloads" ON public.download_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for community posts
DROP POLICY IF EXISTS "Public can view community posts" ON public.community_posts;
CREATE POLICY "Public can view community posts" ON public.community_posts
  FOR SELECT USING (is_active = true);

-- Admin policies for community posts
DROP POLICY IF EXISTS "Admins can manage community posts" ON public.community_posts;
CREATE POLICY "Admins can manage community posts" ON public.community_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_name IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Comprehensive database schema created successfully! All missing tables, functions, and policies have been added.' as status;
