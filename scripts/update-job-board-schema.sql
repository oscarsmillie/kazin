-- Update job_postings table to include premium/public job distinction
ALTER TABLE public.job_postings 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_features JSONB DEFAULT '{}';

-- Update the existing is_private column description for clarity
COMMENT ON COLUMN public.job_postings.is_private IS 'Private jobs are only visible to logged-in users';
COMMENT ON COLUMN public.job_postings.is_premium IS 'Premium jobs are only accessible to Professional plan users';
COMMENT ON COLUMN public.job_postings.premium_features IS 'Additional premium features like direct contact, priority application, etc.';

-- Create index for premium jobs
CREATE INDEX IF NOT EXISTS idx_job_postings_is_premium ON public.job_postings(is_premium);

-- Update RLS policy for job postings to handle premium access
DROP POLICY IF EXISTS "Public can view active job postings" ON public.job_postings;

CREATE POLICY "Users can view job postings based on subscription" ON public.job_postings
  FOR SELECT USING (
    is_active = true AND (
      -- Public jobs: everyone can see
      (is_private = false AND is_premium = false) OR
      -- Private jobs: logged-in users only
      (is_private = true AND is_premium = false AND auth.uid() IS NOT NULL) OR
      -- Premium jobs: professional subscribers only
      (is_premium = true AND auth.uid() IS NOT NULL AND 
       EXISTS (
         SELECT 1 FROM public.subscriptions s 
         WHERE s.user_id = auth.uid() 
         AND s.status = 'active' 
         AND s.plan_type = 'professional'
       ))
    )
  );

-- Insert sample premium and public jobs
INSERT INTO public.job_postings (
  company_name, job_title, description, requirements, location, salary_range,
  job_type, experience_level, skills_required, is_premium, is_private, is_active,
  premium_features, posted_date
) VALUES 
-- Public Jobs
('TechCorp Kenya', 'Junior Software Developer', 'Join our growing team as a junior developer. Work on exciting projects using modern technologies.', 
 ARRAY['Bachelor''s degree in Computer Science', '1+ years experience', 'Knowledge of JavaScript'], 
 'Nairobi, Kenya', 'KES 80,000 - 120,000', 'full-time', 'entry', 
 ARRAY['JavaScript', 'React', 'Node.js'], false, false, true, '{}', NOW()),

('Digital Solutions Ltd', 'Marketing Coordinator', 'Coordinate marketing campaigns and manage social media presence for our clients.',
 ARRAY['Diploma in Marketing', '2+ years experience', 'Social media expertise'],
 'Mombasa, Kenya', 'KES 60,000 - 90,000', 'full-time', 'mid',
 ARRAY['Digital Marketing', 'Social Media', 'Content Creation'], false, false, true, '{}', NOW()),

-- Premium Jobs (Professional plan required)
('Global Tech Solutions', 'Senior Full Stack Developer', 'Lead development of enterprise applications. Remote work available with competitive benefits.',
 ARRAY['5+ years experience', 'React/Node.js expertise', 'Team leadership experience'],
 'Remote/Nairobi', 'KES 200,000 - 300,000', 'remote', 'senior',
 ARRAY['React', 'Node.js', 'AWS', 'Team Leadership'], true, false, true,
 '{"direct_contact": true, "priority_application": true, "salary_negotiable": true, "remote_work": true}', NOW()),

('International Finance Corp', 'Data Science Manager', 'Lead our data science team in developing ML models for financial products. Excellent benefits package.',
 ARRAY['PhD/Masters in Data Science', '7+ years experience', 'Team management'],
 'Nairobi, Kenya', 'KES 350,000 - 500,000', 'full-time', 'senior',
 ARRAY['Python', 'Machine Learning', 'SQL', 'Team Management'], true, false, true,
 '{"direct_contact": true, "priority_application": true, "signing_bonus": true, "relocation_assistance": true}', NOW()),

-- Private Jobs (logged-in users only)
('Stealth Startup', 'Product Manager', 'Join our stealth mode startup as we build the next big thing in fintech.',
 ARRAY['3+ years product management', 'Fintech experience preferred', 'Startup mindset'],
 'Nairobi, Kenya', 'Competitive + Equity', 'full-time', 'mid',
 ARRAY['Product Management', 'Fintech', 'Agile'], false, true, true, '{}', NOW());

-- Update subscription plans table to match new structure
UPDATE public.subscription_plans 
SET 
  price_monthly = CASE 
    WHEN plan_type = 'free' THEN 0.00
    WHEN plan_type = 'professional' THEN 14.99
    ELSE price_monthly
  END,
  features = CASE 
    WHEN plan_type = 'free' THEN '{
      "cover_letters": 5,
      "emails": 5,
      "resumes": 0,
      "ats_optimizations": 0,
      "interview_sessions": 0,
      "job_applications": 10,
      "job_board_access": "public",
      "resume_download_price": 6.00
    }'::jsonb
    WHEN plan_type = 'professional' THEN '{
      "cover_letters": 25,
      "emails": 40,
      "resumes": 5,
      "ats_optimizations": 6,
      "interview_sessions": 3,
      "job_applications": 60,
      "job_board_access": "full",
      "resume_download_price": 0
    }'::jsonb
    ELSE features
  END,
  resume_download_price = CASE 
    WHEN plan_type = 'free' THEN 6.00
    WHEN plan_type = 'professional' THEN 0.00
    ELSE resume_download_price
  END
WHERE plan_type IN ('free', 'professional');

-- Remove old plans that are no longer needed
UPDATE public.subscription_plans 
SET is_active = false 
WHERE plan_type NOT IN ('free', 'professional');
