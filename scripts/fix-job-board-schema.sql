-- First, let's check if the columns exist before adding them
DO $$ 
BEGIN
    -- Add is_premium column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_postings' AND column_name = 'is_premium') THEN
        ALTER TABLE public.job_postings ADD COLUMN is_premium BOOLEAN DEFAULT false;
    END IF;
    
    -- Add premium_features column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_postings' AND column_name = 'premium_features') THEN
        ALTER TABLE public.job_postings ADD COLUMN premium_features JSONB DEFAULT '{}';
    END IF;
END $$;

-- Update column comments
COMMENT ON COLUMN public.job_postings.is_private IS 'Private jobs are only accessible to Professional plan users (paid users)';
COMMENT ON COLUMN public.job_postings.is_premium IS 'Premium jobs have additional features like direct contact, priority application, etc.';
COMMENT ON COLUMN public.job_postings.premium_features IS 'Additional premium features like direct contact, priority application, etc.';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_postings_is_premium ON public.job_postings(is_premium);
CREATE INDEX IF NOT EXISTS idx_job_postings_access ON public.job_postings(is_active, is_private, is_premium);

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view active job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Users can view job postings based on subscription" ON public.job_postings;

-- Create new RLS policy with correct logic:
-- Public jobs: everyone can see (is_private = false)
-- Private jobs: only Professional subscribers can see (is_private = true)
CREATE POLICY "Job postings access based on subscription" ON public.job_postings
  FOR SELECT USING (
    is_active = true AND (
      -- Public jobs: everyone can see
      is_private = false OR
      -- Private jobs: only professional subscribers can see
      (is_private = true AND auth.uid() IS NOT NULL AND 
       EXISTS (
         SELECT 1 FROM public.subscriptions s 
         WHERE s.user_id = auth.uid() 
         AND s.status = 'active' 
         AND s.plan_type = 'professional'
       ))
    )
  );

-- Clear existing sample data to avoid conflicts
DELETE FROM public.job_postings WHERE company_name IN (
  'TechCorp Kenya', 'Digital Solutions Ltd', 'Global Tech Solutions', 
  'International Finance Corp', 'Stealth Startup'
);

-- Insert sample jobs with correct access logic
INSERT INTO public.job_postings (
  company_name, job_title, description, requirements, location, salary_range,
  job_type, experience_level, skills_required, is_private, is_premium, is_active,
  premium_features, posted_date
) VALUES 
-- Public Jobs (Free users can see these)
('TechCorp Kenya', 'Junior Software Developer', 
 'Join our growing team as a junior developer. Work on exciting projects using modern technologies.', 
 'Bachelor degree in Computer Science, 1+ years experience, Knowledge of JavaScript', 
 'Nairobi, Kenya', 'KES 80,000 - 120,000', 'full-time', 'entry', 
 ARRAY['JavaScript', 'React', 'Node.js'], false, false, true, '{}', NOW()),

('Digital Solutions Ltd', 'Marketing Coordinator', 
 'Coordinate marketing campaigns and manage social media presence for our clients.',
 'Diploma in Marketing, 2+ years experience, Social media expertise',
 'Mombasa, Kenya', 'KES 60,000 - 90,000', 'full-time', 'mid',
 ARRAY['Digital Marketing', 'Social Media', 'Content Creation'], false, false, true, '{}', NOW()),

('StartupHub Kenya', 'UI/UX Designer', 
 'Design beautiful and intuitive user interfaces for our mobile and web applications.',
 'Degree in Design or related field, 2+ years experience, Figma proficiency',
 'Nairobi, Kenya', 'KES 70,000 - 100,000', 'full-time', 'mid',
 ARRAY['UI/UX Design', 'Figma', 'Prototyping'], false, false, true, '{}', NOW()),

-- Private Jobs (Only Professional subscribers can see these)
('Global Tech Solutions', 'Senior Full Stack Developer', 
 'Lead development of enterprise applications. Remote work available with competitive benefits.',
 '5+ years experience, React/Node.js expertise, Team leadership experience',
 'Remote/Nairobi', 'KES 200,000 - 300,000', 'remote', 'senior',
 ARRAY['React', 'Node.js', 'AWS', 'Team Leadership'], true, true, true,
 '{"direct_contact": true, "priority_application": true, "salary_negotiable": true, "remote_work": true}', NOW()),

('International Finance Corp', 'Data Science Manager', 
 'Lead our data science team in developing ML models for financial products. Excellent benefits package.',
 'PhD/Masters in Data Science, 7+ years experience, Team management',
 'Nairobi, Kenya', 'KES 350,000 - 500,000', 'full-time', 'senior',
 ARRAY['Python', 'Machine Learning', 'SQL', 'Team Management'], true, true, true,
 '{"direct_contact": true, "priority_application": true, "signing_bonus": true, "relocation_assistance": true}', NOW()),

('Fintech Innovations', 'Product Manager', 
 'Join our fintech team as we build the next generation of financial products for Africa.',
 '3+ years product management, Fintech experience preferred, Startup mindset',
 'Nairobi, Kenya', 'KES 180,000 - 250,000 + Equity', 'full-time', 'mid',
 ARRAY['Product Management', 'Fintech', 'Agile'], true, true, true,
 '{"direct_contact": true, "equity_package": true, "flexible_hours": true}', NOW()),

('Enterprise Solutions Ltd', 'DevOps Engineer', 
 'Build and maintain our cloud infrastructure. Work with cutting-edge technologies.',
 '4+ years DevOps experience, AWS/Azure expertise, Kubernetes knowledge',
 'Nairobi, Kenya', 'KES 160,000 - 220,000', 'full-time', 'senior',
 ARRAY['DevOps', 'AWS', 'Kubernetes', 'Docker'], true, false, true, '{}', NOW());

-- Update existing subscription plans to match new structure
INSERT INTO public.subscription_plans (plan_type, name, price_monthly, price_yearly, features, is_active, resume_download_price)
VALUES 
('free', 'Free Plan', 0.00, 0.00, 
 '{"cover_letters": 5, "emails": 5, "resumes": 0, "ats_optimizations": 0, "interview_sessions": 0, "job_applications": 10, "job_board_access": "public", "resume_download_price": 6.00}'::jsonb, 
 true, 6.00),
('professional', 'Professional Plan', 14.99, 149.90, 
 '{"cover_letters": 25, "emails": 40, "resumes": 5, "ats_optimizations": 6, "interview_sessions": 3, "job_applications": 60, "job_board_access": "full", "resume_download_price": 0}'::jsonb, 
 true, 0.00)
ON CONFLICT (plan_type) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  resume_download_price = EXCLUDED.resume_download_price;

-- Deactivate old plans
UPDATE public.subscription_plans 
SET is_active = false 
WHERE plan_type NOT IN ('free', 'professional');
