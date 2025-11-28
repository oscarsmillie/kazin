-- =============================================
-- KAZI - COMPLETE MASTER DATABASE SCHEMA
-- =============================================
-- This is the single source of truth for all database objects
-- Includes all tables, functions, triggers, policies, and data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- DROP ALL EXISTING TABLES (CLEAN SLATE)
-- =============================================
DROP TABLE IF EXISTS public.candidate_matches CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.company_profiles CASCADE;
DROP TABLE IF EXISTS public.interview_sessions CASCADE;
DROP TABLE IF EXISTS public.ats_optimizations CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.usage_tracking CASCADE;
DROP TABLE IF EXISTS public.download_history CASCADE;
DROP TABLE IF EXISTS public.payment_intents CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.cover_letters CASCADE;
DROP TABLE IF EXISTS public.emails CASCADE;
DROP TABLE IF EXISTS public.resumes CASCADE;
DROP TABLE IF EXISTS public.resume_templates CASCADE;
DROP TABLE IF EXISTS public.job_postings CASCADE;
DROP TABLE IF EXISTS public.career_goals CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.admin_settings CASCADE;
DROP TABLE IF EXISTS public.system_logs CASCADE;
DROP TABLE IF EXISTS public.guest_resumes CASCADE;
DROP TABLE IF EXISTS public.external_jobs CASCADE;
DROP TABLE IF EXISTS public.fetch_logs CASCADE;

-- =============================================
-- CORE USER MANAGEMENT
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
  industry TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (additional profile information)
CREATE TABLE public.profiles (
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
  payment_status TEXT DEFAULT 'free' CHECK (payment_status IN ('free', 'professional')),
  download_credits INTEGER DEFAULT 0,
  last_payment_date TIMESTAMPTZ,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles and permissions
CREATE TABLE public.user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL CHECK (role_name IN ('user', 'admin', 'super_admin')),
  granted_by UUID REFERENCES public.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_name)
);

-- =============================================
-- SUBSCRIPTION MANAGEMENT
-- =============================================

-- Subscription plans (only Free and Professional)
CREATE TABLE public.subscription_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'professional')),
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  paystack_plan_code TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  resume_download_price DECIMAL(10,2) DEFAULT 6.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  paystack_subscription_id TEXT,
  paystack_customer_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking with exact limits
CREATE TABLE public.usage_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: "2024-01"
  cover_letters_generated INTEGER DEFAULT 0,
  emails_generated INTEGER DEFAULT 0,
  resumes_generated INTEGER DEFAULT 0,
  resumes_downloaded INTEGER DEFAULT 0,
  ats_optimizations_used INTEGER DEFAULT 0,
  interview_sessions INTEGER DEFAULT 0,
  job_applications INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- =============================================
-- PAYMENT MANAGEMENT (Paystack)
-- =============================================

-- Payment intents and transactions
CREATE TABLE public.payment_intents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reference VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in subunits (kobo/cents)
  currency VARCHAR(3) DEFAULT 'USD',
  plan VARCHAR(50),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'resume_download', 'upgrade')),
  gateway_response TEXT,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Download history and payments
CREATE TABLE public.download_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
-- CAREER GOALS
-- =============================================

-- Career goals table
CREATE TABLE public.career_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_position TEXT,
  target_company TEXT,
  target_salary DECIMAL(12,2),
  target_location TEXT,
  target_date DATE,
  deadline DATE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  milestones JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESUME TEMPLATES AND MANAGEMENT
-- =============================================

-- Resume templates
CREATE TABLE public.resume_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('modern', 'classic', 'creative', 'executive', 'minimal', 'professional')),
  template_config JSONB NOT NULL DEFAULT '{}',
  html_template TEXT,
  css_styles TEXT,
  preview_image_url TEXT,
  thumbnail_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User resumes
CREATE TABLE public.resumes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.resume_templates(id),
  title TEXT NOT NULL,
  resume_data JSONB NOT NULL DEFAULT '{}',
  generated_html TEXT,
  file_url TEXT,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  payment_required BOOLEAN DEFAULT true,
  payment_intent_id UUID REFERENCES public.payment_intents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COVER LETTERS AND EMAILS
-- =============================================

-- Cover letters
CREATE TABLE public.cover_letters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  job_title TEXT,
  company_name TEXT,
  job_posting_id UUID,
  job_description TEXT,
  generated_by_ai BOOLEAN DEFAULT false,
  ai_prompt_used TEXT,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email generator table
CREATE TABLE public.emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('follow_up', 'thank_you', 'networking', 'inquiry', 'application', 'other')),
  title TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  company_name TEXT,
  context TEXT,
  generated_by_ai BOOLEAN DEFAULT false,
  ai_prompt_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- JOB BOARD (WITH PREMIUM/PUBLIC DISTINCTION)
-- =============================================

-- Job postings
CREATE TABLE public.job_postings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  posted_by UUID REFERENCES public.users(id),
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  company_website TEXT,
  job_title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[],
  responsibilities TEXT[],
  location TEXT,
  salary_range TEXT,
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  job_type TEXT NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'contract', 'remote', 'hybrid')),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
  industry TEXT,
  skills_required TEXT[],
  is_premium BOOLEAN DEFAULT false, -- Premium jobs for paid users only
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  application_deadline TIMESTAMPTZ,
  external_url TEXT,
  application_email TEXT,
  application_instructions TEXT,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  posted_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job applications
CREATE TABLE public.job_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'viewed', 'interview', 'rejected', 'offer', 'accepted', 'withdrawn')),
  application_date DATE NOT NULL,
  deadline TIMESTAMPTZ,
  notes TEXT,
  follow_up_date TIMESTAMPTZ,
  interview_date TIMESTAMPTZ,
  salary_offered DECIMAL(12,2),
  location TEXT,
  response_received_at TIMESTAMPTZ,
  resume_id UUID REFERENCES public.resumes(id),
  cover_letter_id UUID REFERENCES public.cover_letters(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ATS OPTIMIZATION (PROFESSIONAL ONLY)
-- =============================================

-- ATS optimization results
CREATE TABLE public.ats_optimizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_description TEXT NOT NULL,
  optimization_type TEXT NOT NULL CHECK (optimization_type IN ('basic', 'full', 'advanced')),
  keyword_score INTEGER NOT NULL CHECK (keyword_score >= 0 AND keyword_score <= 100),
  ats_score INTEGER NOT NULL CHECK (ats_score >= 0 AND ats_score <= 100),
  missing_keywords TEXT[],
  suggestions TEXT[],
  detailed_analysis JSONB,
  optimized_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INTERVIEW PREPARATION (PROFESSIONAL ONLY)
-- =============================================

-- Interview sessions
CREATE TABLE public.interview_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_application_id UUID REFERENCES public.job_applications(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('practice', 'mock', 'ai_coaching')),
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
-- NOTIFICATIONS AND ACTIVITY TRACKING
-- =============================================

-- User notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('system', 'payment', 'download', 'job_alert', 'subscription', 'goal_reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  metadata JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity log
CREATE TABLE public.user_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'resume_created', 'resume_downloaded', 'cover_letter_created', 'cover_letter_downloaded',
    'email_generated', 'job_applied', 'template_viewed', 'ats_optimization', 'interview_session',
    'payment_made', 'subscription_changed', 'goal_created', 'goal_updated', 'payment_completed'
  )),
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMMUNITY AND ADMIN
-- =============================================

-- Community board posts
CREATE TABLE public.community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  posted_by UUID REFERENCES public.users(id),
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

-- Admin settings
CREATE TABLE public.admin_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System logs
CREATE TABLE public.system_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warning', 'error', 'critical')),
  module TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  user_id UUID REFERENCES public.users(id),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GUEST RESUMES AND EXTERNAL JOBS
-- =============================================

-- Added table for guest (non-authenticated) resume storage
CREATE TABLE public.guest_resumes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  resume_data JSONB NOT NULL,
  template_id TEXT NOT NULL,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_reference TEXT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

-- Added table for external job sources
CREATE TABLE public.external_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  location TEXT,
  job_type TEXT,
  salary TEXT,
  experience_level TEXT,
  skills TEXT[],
  requirements TEXT[],
  posted_date TIMESTAMPTZ,
  application_url TEXT NOT NULL,
  company_logo TEXT,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(external_id, source)
);

-- Added table for tracking job fetch operations for daily caching
CREATE TABLE public.fetch_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source TEXT NOT NULL,
  category TEXT,
  jobs_fetched INTEGER DEFAULT 0,
  jobs_inserted INTEGER DEFAULT 0,
  jobs_filtered INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, category, DATE(created_at))
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_profiles_id ON public.profiles(id);
CREATE INDEX idx_profiles_payment_status ON public.profiles(payment_status);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_name ON public.user_roles(role_name);

-- Subscription indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_usage_tracking_user_month ON public.usage_tracking(user_id, month_year);

-- Payment indexes
CREATE INDEX idx_payment_intents_user_id ON public.payment_intents(user_id);
CREATE INDEX idx_payment_intents_reference ON public.payment_intents(reference);
CREATE INDEX idx_payment_intents_status ON public.payment_intents(status);
CREATE INDEX idx_download_history_user_id ON public.download_history(user_id);

-- Career goals indexes
CREATE INDEX idx_career_goals_user_id ON public.career_goals(user_id);
CREATE INDEX idx_career_goals_status ON public.career_goals(status);

-- Resume and template indexes
CREATE INDEX idx_resume_templates_category ON public.resume_templates(category);
CREATE INDEX idx_resume_templates_is_premium ON public.resume_templates(is_premium);
CREATE INDEX idx_resume_templates_is_active ON public.resume_templates(is_active);
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_template_id ON public.resumes(template_id);
CREATE INDEX idx_cover_letters_user_id ON public.cover_letters(user_id);
CREATE INDEX idx_emails_user_id ON public.emails(user_id);

-- Job board indexes
CREATE INDEX idx_job_postings_is_premium ON public.job_postings(is_premium);
CREATE INDEX idx_job_postings_is_active ON public.job_postings(is_active);
CREATE INDEX idx_job_postings_posted_date ON public.job_postings(posted_date);
CREATE INDEX idx_job_postings_location ON public.job_postings(location);
CREATE INDEX idx_job_postings_job_type ON public.job_postings(job_type);
CREATE INDEX idx_job_postings_experience_level ON public.job_postings(experience_level);
CREATE INDEX idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);

-- ATS and interview indexes
CREATE INDEX idx_ats_optimizations_user_id ON public.ats_optimizations(user_id);
CREATE INDEX idx_interview_sessions_user_id ON public.interview_sessions(user_id);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_type ON public.user_activities(activity_type);

-- Community indexes
CREATE INDEX idx_community_posts_post_type ON public.community_posts(post_type);
CREATE INDEX idx_community_posts_is_active ON public.community_posts(is_active);
CREATE INDEX idx_community_posts_is_pinned ON public.community_posts(is_pinned);

-- Guest resumes indexes
CREATE INDEX idx_guest_resumes_email ON public.guest_resumes(email);
CREATE INDEX idx_guest_resumes_payment_status ON public.guest_resumes(payment_status);
CREATE INDEX idx_guest_resumes_created_at ON public.guest_resumes(created_at);

-- External jobs indexes
CREATE INDEX idx_external_jobs_category ON public.external_jobs(category);
CREATE INDEX idx_external_jobs_source ON public.external_jobs(source);
CREATE INDEX idx_external_jobs_posted_date ON public.external_jobs(posted_date);

-- Fetch logs indexes
CREATE INDEX idx_fetch_logs_source_date ON public.fetch_logs(source, DATE(created_at));

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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_career_goals_updated_at BEFORE UPDATE ON public.career_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_templates_updated_at BEFORE UPDATE ON public.resume_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cover_letters_updated_at BEFORE UPDATE ON public.cover_letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON public.emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage tracking
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_month_year TEXT,
  p_feature TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, month_year)
  VALUES (p_user_id, p_month_year)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  CASE p_feature
    WHEN 'cover_letters_generated' THEN
      UPDATE public.usage_tracking 
      SET cover_letters_generated = cover_letters_generated + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id AND month_year = p_month_year;
    WHEN 'emails_generated' THEN
      UPDATE public.usage_tracking 
      SET emails_generated = emails_generated + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id AND month_year = p_month_year;
    WHEN 'resumes_generated' THEN
      UPDATE public.usage_tracking 
      SET resumes_generated = resumes_generated + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id AND month_year = p_month_year;
    WHEN 'resumes_downloaded' THEN
      UPDATE public.usage_tracking 
      SET resumes_downloaded = resumes_downloaded + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id AND month_year = p_month_year;
    WHEN 'ats_optimizations_used' THEN
      UPDATE public.usage_tracking 
      SET ats_optimizations_used = ats_optimizations_used + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id AND month_year = p_month_year;
    WHEN 'interview_sessions' THEN
      UPDATE public.usage_tracking 
      SET interview_sessions = interview_sessions + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id AND month_year = p_month_year;
    WHEN 'job_applications' THEN
      UPDATE public.usage_tracking 
      SET job_applications = job_applications + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id AND month_year = p_month_year;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile AFTER email confirmation
CREATE OR REPLACE FUNCTION public.handle_confirmed_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Create user record
    INSERT INTO public.users (id, email, full_name, avatar_url, email_verified)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      email_verified = true,
      updated_at = NOW();
    
    -- Create profile record
    INSERT INTO public.profiles (id, full_name, email_notifications)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
      true
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create default usage tracking record
    INSERT INTO public.usage_tracking (user_id, month_year)
    VALUES (NEW.id, TO_CHAR(NOW(), 'YYYY-MM'))
    ON CONFLICT (user_id, month_year) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for confirmed user signup
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_confirmed_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fetch_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER MANAGEMENT POLICIES
-- =============================================

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Profile policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- SUBSCRIPTION AND PAYMENT POLICIES
-- =============================================

-- Subscription policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- Payment policies
CREATE POLICY "Users can view own payments" ON public.payment_intents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.payment_intents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON public.payment_intents
  FOR UPDATE USING (auth.uid() = user_id);

-- Download history policies
CREATE POLICY "Users can view own downloads" ON public.download_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads" ON public.download_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- CONTENT POLICIES
-- =============================================

-- Career goals policies
CREATE POLICY "Users can manage own career goals" ON public.career_goals
  FOR ALL USING (auth.uid() = user_id);

-- Resume policies
CREATE POLICY "Users can manage own resumes" ON public.resumes
  FOR ALL USING (auth.uid() = user_id);

-- Cover letter policies
CREATE POLICY "Users can manage own cover letters" ON public.cover_letters
  FOR ALL USING (auth.uid() = user_id);

-- Email policies
CREATE POLICY "Users can manage own emails" ON public.emails
  FOR ALL USING (auth.uid() = user_id);

-- Job application policies
CREATE POLICY "Users can manage own job applications" ON public.job_applications
  FOR ALL USING (auth.uid() = user_id);

-- ATS optimization policies
CREATE POLICY "Users can view own ATS optimizations" ON public.ats_optimizations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ATS optimizations" ON public.ats_optimizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Interview session policies
CREATE POLICY "Users can view own interview sessions" ON public.interview_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview sessions" ON public.interview_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview sessions" ON public.interview_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Notification policies
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Activity policies
CREATE POLICY "Users can view own activities" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Guest resumes policies
CREATE POLICY "Guest resumes can be viewed by guests" ON public.guest_resumes
  FOR SELECT USING (auth.role() = 'guest');

CREATE POLICY "Guest resumes can be inserted by guests" ON public.guest_resumes
  FOR INSERT WITH CHECK (auth.role() = 'guest');

-- External jobs policies
CREATE POLICY "Users can view external jobs" ON public.external_jobs
  FOR SELECT USING (true);

-- Fetch logs policies
CREATE POLICY "Admins can view fetch logs" ON public.fetch_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_name IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- =============================================
-- PUBLIC ACCESS POLICIES
-- =============================================

-- Public read access for certain tables
CREATE POLICY "Public can view active resume templates" ON public.resume_templates
  FOR SELECT USING (is_active = true);

-- Job postings access based on premium status
CREATE POLICY "Users can view appropriate job postings" ON public.job_postings
  FOR SELECT USING (
    is_active = true AND (
      -- Public jobs for everyone
      is_premium = false OR 
      -- Premium jobs only for professional users
      (is_premium = true AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND payment_status = 'professional'
      ))
    )
  );

CREATE POLICY "Public can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view community posts" ON public.community_posts
  FOR SELECT USING (is_active = true);

-- =============================================
-- ADMIN POLICIES
-- =============================================

-- Allow admins to manage templates
CREATE POLICY "Admins can manage resume templates" ON public.resume_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_name IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- Allow admins to manage job postings
CREATE POLICY "Admins can manage job postings" ON public.job_postings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role_name IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- Allow job posters to manage their own job postings
CREATE POLICY "Job posters can manage own job postings" ON public.job_postings
  FOR ALL USING (auth.uid() = posted_by);

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert subscription plans (Free and Professional only)
INSERT INTO public.subscription_plans (name, plan_type, price_monthly, price_yearly, paystack_plan_code, features, resume_download_price) VALUES
('Free Plan', 'free', 0.00, 0.00, NULL, '{
  "cover_letters": 5,
  "emails": 5,
  "resumes": 0,
  "ats_optimizations": 0,
  "interview_sessions": 0,
  "job_applications": 10,
  "job_board_access": "public",
  "premium_templates": false,
  "ai_features": false,
  "priority_support": false
}', 6.00),
('Professional Plan', 'professional', 14.99, 149.99, 'PLN_opg5y5nhwuqh3a6', '{
  "cover_letters": 25,
  "emails": 40,
  "resumes": 5,
  "ats_optimizations": 6,
  "interview_sessions": 3,
  "job_applications": 60,
  "job_board_access": "premium",
  "premium_templates": true,
  "ai_features": true,
  "priority_support": true
}', 0.00);

-- Insert resume templates
INSERT INTO public.resume_templates (name, description, category, template_config, is_premium, is_active) VALUES
(
  'Modern Professional',
  'Clean and contemporary design perfect for tech and creative roles',
  'modern',
  '{
    "sections": [
      {"id": "header", "type": "header", "title": "Header", "required": true, "order": 1},
      {"id": "summary", "type": "summary", "title": "Professional Summary", "required": false, "order": 2},
      {"id": "experience", "type": "experience", "title": "Work Experience", "required": true, "order": 3, "config": {"showDates": true, "showLocation": true}},
      {"id": "education", "type": "education", "title": "Education", "required": true, "order": 4, "config": {"showDates": true, "showLocation": true}},
      {"id": "skills", "type": "skills", "title": "Skills", "required": false, "order": 5, "config": {"layout": "list"}},
      {"id": "achievements", "type": "achievements", "title": "Key Achievements", "required": false, "order": 6}
    ],
    "layout": {
      "type": "single-column",
      "primaryColumn": ["header", "summary", "experience", "education", "skills", "achievements"]
    },
    "style": {
      "colorScheme": {
        "primary": "#2563eb",
        "secondary": "#64748b",
        "accent": "#3b82f6",
        "text": "#1e293b",
        "background": "#ffffff"
      },
      "typography": {
        "headingFont": "Inter",
        "bodyFont": "Inter",
        "headingSize": "medium",
        "bodySize": "medium"
      },
      "spacing": {
        "sectionGap": "normal",
        "itemGap": "normal"
      },
      "borders": {
        "sectionDividers": false,
        "headerUnderline": true,
        "style": "solid"
      }
    }
  }'::jsonb,
  false,
  true
),
(
  'Executive Classic',
  'Traditional format ideal for senior executive positions',
  'executive',
  '{
    "sections": [
      {"id": "header", "type": "header", "title": "Header", "required": true, "order": 1},
      {"id": "summary", "type": "summary", "title": "Executive Summary", "required": true, "order": 2},
      {"id": "experience", "type": "experience", "title": "Professional Experience", "required": true, "order": 3, "config": {"showDates": true, "showLocation": true}},
      {"id": "education", "type": "education", "title": "Education", "required": true, "order": 4, "config": {"showDates": true, "showLocation": true}},
      {"id": "achievements", "type": "achievements", "title": "Key Accomplishments", "required": false, "order": 5},
      {"id": "certifications", "type": "certifications", "title": "Certifications", "required": false, "order": 6}
    ],
    "layout": {
      "type": "single-column",
      "primaryColumn": ["header", "summary", "experience", "education", "achievements", "certifications"]
    },
    "style": {
      "colorScheme": {
        "primary": "#1f2937",
        "secondary": "#6b7280",
        "accent": "#374151",
        "text": "#111827",
        "background": "#ffffff"
      },
      "typography": {
        "headingFont": "Playfair Display",
        "bodyFont": "Source Sans Pro",
        "headingSize": "large",
        "bodySize": "medium"
      },
      "spacing": {
        "sectionGap": "loose",
        "itemGap": "normal"
      },
      "borders": {
        "sectionDividers": true,
        "headerUnderline": true,
        "style": "solid"
      }
    }
  }'::jsonb,
  true,
  true
),
(
  'Creative Minimal',
  'Clean, minimalist design for creative professionals',
  'creative',
  '{
    "sections": [
      {"id": "header", "type": "header", "title": "Header", "required": true, "order": 1},
      {"id": "summary", "type": "summary", "title": "About Me", "required": false, "order": 2},
      {"id": "experience", "type": "experience", "title": "Experience", "required": true, "order": 3, "config": {"showDates": true, "showLocation": false}},
      {"id": "projects", "type": "projects", "title": "Projects", "required": false, "order": 4},
      {"id": "education", "type": "education", "title": "Education", "required": true, "order": 5, "config": {"showDates": true, "showLocation": false}},
      {"id": "skills", "type": "skills", "title": "Skills", "required": false, "order": 6, "config": {"layout": "grid"}}
    ],
    "layout": {
      "type": "single-column",
      "primaryColumn": ["header", "summary", "experience", "projects", "education", "skills"]
    },
    "style": {
      "colorScheme": {
        "primary": "#7c3aed",
        "secondary": "#a78bfa",
        "accent": "#8b5cf6",
        "text": "#1f2937",
        "background": "#ffffff"
      },
      "typography": {
        "headingFont": "Poppins",
        "bodyFont": "Open Sans",
        "headingSize": "medium",
        "bodySize": "medium"
      },
      "spacing": {
        "sectionGap": "normal",
        "itemGap": "tight"
      },
      "borders": {
        "sectionDividers": false,
        "headerUnderline": false,
        "style": "solid"
      }
    }
  }'::jsonb,
  true,
  true
),
(
  'Simple Clean',
  'Straightforward design focusing on readability and content',
  'minimal',
  '{
    "sections": [
      {"id": "header", "type": "header", "title": "Contact Information", "required": true, "order": 1},
      {"id": "summary", "type": "summary", "title": "Summary", "required": false, "order": 2},
      {"id": "experience", "type": "experience", "title": "Work Experience", "required": true, "order": 3, "config": {"showDates": true, "showLocation": true}},
      {"id": "education", "type": "education", "title": "Education", "required": true, "order": 4, "config": {"showDates": true, "showLocation": true}},
      {"id": "skills", "type": "skills", "title": "Skills", "required": false, "order": 5, "config": {"layout": "inline"}}
    ],
    "layout": {
      "type": "single-column",
      "primaryColumn": ["header", "summary", "experience", "education", "skills"]
    },
    "style": {
      "colorScheme": {
        "primary": "#000000",
        "secondary": "#666666",
        "accent": "#333333",
        "text": "#000000",
        "background": "#ffffff"
      },
      "typography": {
        "headingFont": "Arial",
        "bodyFont": "Arial",
        "headingSize": "medium",
        "bodySize": "medium"
      },
      "spacing": {
        "sectionGap": "normal",
        "itemGap": "normal"
      },
      "borders": {
        "sectionDividers": false,
        "headerUnderline": false,
        "style": "none"
      }
    }
  }'::jsonb,
  false,
  true
);

-- Insert sample job postings (mix of public and premium)
INSERT INTO public.job_postings (company_name, job_title, description, location, job_type, experience_level, is_premium, is_active, salary_range) VALUES
('TechCorp Kenya', 'Software Developer', 'Join our dynamic team building cutting-edge web applications using React and Node.js.', 'Nairobi, Kenya', 'full-time', 'mid', false, true, '$30,000 - $45,000'),
('Global Finance Ltd', 'Senior Financial Analyst', 'Lead financial planning and analysis for our East African operations.', 'Nairobi, Kenya', 'full-time', 'senior', true, true, '$50,000 - $70,000'),
('StartupHub', 'Product Manager', 'Drive product strategy and roadmap for our innovative fintech platform.', 'Remote', 'full-time', 'mid', true, true, '$40,000 - $60,000'),
('Local NGO', 'Project Coordinator', 'Coordinate community development projects across rural Kenya.', 'Kisumu, Kenya', 'full-time', 'entry', false, true, '$20,000 - $30,000');

-- Insert community posts
INSERT INTO public.community_posts (post_type, title, content, is_pinned, is_active) VALUES
('announcement', 'Welcome to Kazi!', 'Welcome to our professional career development platform. Start by creating your resume and exploring job opportunities tailored for the Kenyan market.', true, true),
('tip', 'Resume Writing for Kenyan Job Market', 'Tailor your resume for local employers: highlight relevant experience, include your location, and mention language skills if applicable.', false, true),
('update', 'New ATS Optimization Feature', 'Professional users now have access to our advanced ATS optimization tool to improve resume compatibility with applicant tracking systems.', false, true),
('success_story', 'Success Story: From Unemployed to Employed', 'Mary K. from Mombasa landed her dream marketing role using our platform. She optimized her resume and applied to 15 jobs, getting 4 interviews!', false, true);

-- Insert admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES
('site_maintenance', 'false', 'Enable/disable site maintenance mode'),
('max_file_size_mb', '10', 'Maximum file upload size in MB'),
('allowed_file_types', '["pdf", "docx", "jpg", "png"]', 'Allowed file types for uploads'),
('email_notifications', 'true', 'Enable/disable email notifications'),
('ai_features_enabled', 'true', 'Enable/disable AI features globally'),
('payment_gateway', 'paystack', 'Active payment gateway'),
('default_currency', 'USD', 'Default currency for payments'),
('kenyan_currency_rate', '130', 'USD to KES conversion rate');

-- Grant admin access to specified email
INSERT INTO public.user_roles (user_id, role_name, granted_by, is_active)
SELECT 
  u.id,
  'admin',
  u.id,
  true
FROM auth.users u
WHERE u.email = 'odimaoscar@gmail.com'
ON CONFLICT (user_id, role_name) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 KAZI MASTER SCHEMA CREATED SUCCESSFULLY!';
  RAISE NOTICE '✅ All tables, functions, triggers, and policies created';
  RAISE NOTICE '✅ Two-tier subscription system (Free + Professional)';
  RAISE NOTICE '✅ Premium/Public job board implemented';
  RAISE NOTICE '✅ Profile creation after email confirmation';
  RAISE NOTICE '✅ Admin access granted to odimaoscar@gmail.com';
  RAISE NOTICE '✅ Sample data inserted';
  RAISE NOTICE '🔗 Admin Dashboard: /admin/dashboard';
  RAISE NOTICE '💰 Free: $6/resume, 5 cover letters, 5 emails, 10 applications';
  RAISE NOTICE '💎 Professional: $14.99/month, 5 resumes, 25 cover letters, 40 emails, 3 interviews, 6 ATS, 60 applications';
END $$;
