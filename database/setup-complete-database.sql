-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  bio TEXT,
  job_title TEXT,
  location TEXT,
  phone TEXT,
  website TEXT,
  linkedin TEXT,
  github TEXT,
  twitter TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  email_notifications BOOLEAN DEFAULT true,
  job_alerts BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  application_updates BOOLEAN DEFAULT true,
  two_factor_auth BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create career_goals table
CREATE TABLE IF NOT EXISTS public.career_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resume_templates table
CREATE TABLE IF NOT EXISTS public.resume_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'modern',
  html_template TEXT,
  css_styles TEXT,
  template_variables JSONB DEFAULT '{}',
  preview_image_url TEXT,
  thumbnail_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES resume_templates(id),
  title TEXT NOT NULL,
  resume_data JSONB NOT NULL DEFAULT '{}',
  generated_html TEXT,
  is_active BOOLEAN DEFAULT true,
  payment_required BOOLEAN DEFAULT false,
  payment_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'interview', 'offer', 'rejected', 'accepted')),
  application_date DATE DEFAULT CURRENT_DATE,
  deadline DATE,
  job_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_applications_external table (for external job applications)
CREATE TABLE IF NOT EXISTS public.job_applications_external (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  status TEXT DEFAULT 'applied',
  applied_at DATE DEFAULT CURRENT_DATE,
  application_message TEXT,
  job_url TEXT,
  salary_range TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create emails table
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  company_name TEXT,
  context TEXT,
  subject TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cover_letters table
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_type TEXT NOT NULL, -- 'resumes', 'cover_letters', 'emails', etc.
  usage_count INTEGER DEFAULT 1,
  usage_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_type, usage_date)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'premium', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON career_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_external_user_id ON job_applications_external(applicant_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications_external ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User settings policies
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Career goals policies
DROP POLICY IF EXISTS "Users can manage own career goals" ON career_goals;
CREATE POLICY "Users can manage own career goals" ON career_goals FOR ALL USING (auth.uid() = user_id);

-- Resumes policies
DROP POLICY IF EXISTS "Users can manage own resumes" ON resumes;
CREATE POLICY "Users can manage own resumes" ON resumes FOR ALL USING (auth.uid() = user_id);

-- Job applications policies
DROP POLICY IF EXISTS "Users can manage own job applications" ON job_applications;
CREATE POLICY "Users can manage own job applications" ON job_applications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own external job applications" ON job_applications_external;
CREATE POLICY "Users can manage own external job applications" ON job_applications_external FOR ALL USING (auth.uid() = applicant_id);

-- Emails policies
DROP POLICY IF EXISTS "Users can manage own emails" ON emails;
CREATE POLICY "Users can manage own emails" ON emails FOR ALL USING (auth.uid() = user_id);

-- Cover letters policies
DROP POLICY IF EXISTS "Users can manage own cover letters" ON cover_letters;
CREATE POLICY "Users can manage own cover letters" ON cover_letters FOR ALL USING (auth.uid() = user_id);

-- Usage tracking policies
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
CREATE POLICY "Users can view own usage" ON usage_tracking FOR ALL USING (auth.uid() = user_id);

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- Resume templates are public for reading
DROP POLICY IF EXISTS "Anyone can view active templates" ON resume_templates;
CREATE POLICY "Anyone can view active templates" ON resume_templates FOR SELECT USING (is_active = true);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_career_goals_updated_at ON career_goals;
CREATE TRIGGER update_career_goals_updated_at BEFORE UPDATE ON career_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resumes_updated_at ON resumes;
CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_external_updated_at ON job_applications_external;
CREATE TRIGGER update_job_applications_external_updated_at BEFORE UPDATE ON job_applications_external FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emails_updated_at ON emails;
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cover_letters_updated_at ON cover_letters;
CREATE TRIGGER update_cover_letters_updated_at BEFORE UPDATE ON cover_letters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some basic resume templates
INSERT INTO resume_templates (name, description, category, html_template, css_styles, is_premium, is_active) VALUES
('Modern Professional', 'A clean, modern resume template perfect for professionals', 'modern', 
'<div class="resume">
  <header class="header">
    <h1>{{personalInfo.fullName}}</h1>
    <div class="contact">
      <span>{{personalInfo.email}}</span>
      <span>{{personalInfo.phone}}</span>
      <span>{{personalInfo.location}}</span>
    </div>
  </header>
  
  <section class="summary">
    <h2>Professional Summary</h2>
    <p>{{professionalSummary}}</p>
  </section>
  
  <section class="experience">
    <h2>Work Experience</h2>
    {{#each workExperience}}
    <div class="job">
      <h3>{{title}} at {{company}}</h3>
      <div class="job-details">{{location}} | {{startDate}} - {{#if current}}Present{{else}}{{endDate}}{{/if}}</div>
      <p>{{description}}</p>
    </div>
    {{/each}}
  </section>
  
  <section class="education">
    <h2>Education</h2>
    {{#each education}}
    <div class="edu">
      <h3>{{degree}}</h3>
      <div class="edu-details">{{school}}, {{location}} | {{graduationDate}}</div>
      {{#if description}}<p>{{description}}</p>{{/if}}
    </div>
    {{/each}}
  </section>
  
  <section class="skills">
    <h2>Technical Skills</h2>
    <div class="skills-list">
      {{#each technicalSkills}}
      <span class="skill">{{this}}</span>
      {{/each}}
    </div>
  </section>
</div>',
'.resume { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
.header { text-align: center; margin-bottom: 30px; }
.header h1 { margin: 0; font-size: 2.5em; color: #333; }
.contact { margin-top: 10px; }
.contact span { margin: 0 15px; color: #666; }
section { margin-bottom: 25px; }
h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
.job, .edu { margin-bottom: 15px; }
.job h3, .edu h3 { margin: 0; color: #2c3e50; }
.job-details, .edu-details { color: #666; font-style: italic; margin: 5px 0; }
.skills-list { display: flex; flex-wrap: wrap; gap: 10px; }
.skill { background: #3498db; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }',
false, true),

('Classic Executive', 'A traditional, executive-style resume template', 'executive',
'<div class="resume">
  <header class="header">
    <h1>{{personalInfo.fullName}}</h1>
    <div class="contact">
      {{personalInfo.email}} | {{personalInfo.phone}} | {{personalInfo.location}}
    </div>
  </header>
  
  <section class="summary">
    <h2>EXECUTIVE SUMMARY</h2>
    <p>{{professionalSummary}}</p>
  </section>
  
  <section class="experience">
    <h2>PROFESSIONAL EXPERIENCE</h2>
    {{#each workExperience}}
    <div class="job">
      <div class="job-header">
        <h3>{{title}}</h3>
        <span class="dates">{{startDate}} - {{#if current}}Present{{else}}{{endDate}}{{/if}}</span>
      </div>
      <div class="company">{{company}}, {{location}}</div>
      <p>{{description}}</p>
    </div>
    {{/each}}
  </section>
  
  <section class="education">
    <h2>EDUCATION</h2>
    {{#each education}}
    <div class="edu">
      <h3>{{degree}}</h3>
      <div class="edu-details">{{school}}, {{location}} | {{graduationDate}}</div>
    </div>
    {{/each}}
  </section>
  
  <section class="skills">
    <h2>CORE COMPETENCIES</h2>
    <div class="skills-grid">
      {{#each technicalSkills}}
      <div class="skill">{{this}}</div>
      {{/each}}
    </div>
  </section>
</div>',
'.resume { font-family: "Times New Roman", serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.4; }
.header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 15px; }
.header h1 { margin: 0; font-size: 2.2em; font-weight: bold; text-transform: uppercase; }
.contact { margin-top: 10px; font-size: 1.1em; }
h2 { font-size: 1.2em; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 10px 0; }
.job { margin-bottom: 20px; }
.job-header { display: flex; justify-content: space-between; align-items: baseline; }
.job h3 { margin: 0; font-size: 1.1em; font-weight: bold; }
.dates { font-style: italic; }
.company { font-weight: bold; margin: 5px 0; }
.skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
.skill { padding: 2px 0; }',
true, true)
ON CONFLICT (name) DO NOTHING;

COMMIT;
