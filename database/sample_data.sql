-- =============================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =============================================

-- Sample resume templates with placeholders
INSERT INTO public.resume_templates (name, description, category, html_template, css_styles, is_premium, preview_image_url) VALUES
('Modern Professional', 'Clean and modern design perfect for tech professionals', 'modern', 
'<!DOCTYPE html>
<html>
<head><title>Resume</title></head>
<body>
    <div class="resume-container">
        <header class="header">
            <h1>{FULL_NAME}</h1>
            <p class="tagline">{TAGLINE}</p>
            <div class="contact-info">
                <span>{EMAIL}</span> | <span>{PHONE}</span> | <span>{CITY}, {COUNTY}</span>
            </div>
        </header>
        
        <section class="summary">
            <h2>Professional Summary</h2>
            <p>{PROFESSIONAL_SUMMARY}</p>
        </section>
        
        <section class="experience">
            <h2>Work Experience</h2>
            {WORK_EXPERIENCE}
        </section>
        
        <section class="education">
            <h2>Education</h2>
            {EDUCATION}
        </section>
        
        <section class="skills">
            <h2>Skills</h2>
            <div class="skills-list">{SKILLS}</div>
        </section>
    </div>
</body>
</html>',
'.resume-container { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
.header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
.header h1 { font-size: 2.5em; margin: 0; color: #333; }
.tagline { font-size: 1.2em; color: #666; margin: 10px 0; }
.contact-info { font-size: 1em; color: #555; }
section { margin-bottom: 30px; }
section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
.skills-list { display: flex; flex-wrap: wrap; gap: 10px; }',
false, '/templates/modern-professional-preview.jpg'),

('Executive Classic', 'Traditional executive-style resume for senior positions', 'executive',
'<!DOCTYPE html>
<html>
<head><title>Executive Resume</title></head>
<body>
    <div class="resume-container">
        <header class="header">
            <h1>{FULL_NAME}</h1>
            <h2 class="title">{TAGLINE}</h2>
            <div class="contact">
                <p>{EMAIL} • {PHONE}</p>
                <p>{CITY}, {COUNTY} {POSTCODE}</p>
            </div>
        </header>
        
        <section class="executive-summary">
            <h3>Executive Summary</h3>
            <p>{PROFESSIONAL_SUMMARY}</p>
        </section>
        
        <section class="experience">
            <h3>Professional Experience</h3>
            {WORK_EXPERIENCE}
        </section>
        
        <section class="education">
            <h3>Education</h3>
            {EDUCATION}
        </section>
        
        <section class="achievements">
            <h3>Key Achievements</h3>
            {ACHIEVEMENTS}
        </section>
    </div>
</body>
</html>',
'.resume-container { font-family: "Times New Roman", serif; max-width: 800px; margin: 0 auto; padding: 40px; }
.header { text-align: center; margin-bottom: 40px; }
.header h1 { font-size: 2.2em; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
.title { font-size: 1.3em; color: #555; margin: 10px 0; }
.contact { font-size: 1em; margin-top: 20px; }
section { margin-bottom: 35px; }
section h3 { font-size: 1.4em; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #000; padding-bottom: 5px; }',
true, '/templates/executive-classic-preview.jpg'),

('Creative Designer', 'Colorful and creative template for designers and creatives', 'creative',
'<!DOCTYPE html>
<html>
<head><title>Creative Resume</title></head>
<body>
    <div class="resume-container">
        <div class="sidebar">
            <div class="profile">
                <h1>{NAME}<br>{SURNAME}</h1>
                <p class="role">{TAGLINE}</p>
            </div>
            <div class="contact">
                <h3>Contact</h3>
                <p>{EMAIL}</p>
                <p>{PHONE}</p>
                <p>{CITY}, {COUNTY}</p>
            </div>
            <div class="skills">
                <h3>Skills</h3>
                {SKILLS}
            </div>
        </div>
        <div class="main-content">
            <section class="about">
                <h2>About Me</h2>
                <p>{PROFESSIONAL_SUMMARY}</p>
            </section>
            <section class="experience">
                <h2>Experience</h2>
                {WORK_EXPERIENCE}
            </section>
            <section class="education">
                <h2>Education</h2>
                {EDUCATION}
            </section>
        </div>
    </div>
</body>
</html>',
'.resume-container { display: flex; font-family: "Helvetica Neue", sans-serif; max-width: 900px; margin: 0 auto; }
.sidebar { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 300px; padding: 30px; }
.profile h1 { font-size: 1.8em; margin: 0; line-height: 1.2; }
.role { font-size: 1.1em; opacity: 0.9; margin: 10px 0; }
.main-content { flex: 1; padding: 30px; }
.main-content h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
.sidebar h3 { margin-top: 30px; margin-bottom: 15px; font-size: 1.1em; }',
true, '/templates/creative-designer-preview.jpg');

-- Insert template placeholders for the modern professional template
INSERT INTO public.template_placeholders (template_id, placeholder_name, placeholder_category, description, is_required) 
SELECT 
    id,
    unnest(ARRAY['{FULL_NAME}', '{TAGLINE}', '{EMAIL}', '{PHONE}', '{CITY}', '{COUNTY}']),
    unnest(ARRAY['personal', 'personal', 'personal', 'personal', 'personal', 'personal']),
    unnest(ARRAY['Your complete name', 'Your professional tagline', 'Email address', 'Phone number', 'City location', 'County/state location']),
    unnest(ARRAY[true, false, true, true, false, false])
FROM public.resume_templates 
WHERE name = 'Modern Professional';

-- Sample job postings
INSERT INTO public.job_postings (company_name, job_title, description, requirements, location, salary_range, job_type, experience_level, is_private, skills_required) VALUES
('TechCorp Inc.', 'Senior Software Engineer', 'We are looking for a senior software engineer to join our growing team...', 
ARRAY['5+ years of experience', 'React/Node.js expertise', 'Bachelor''s degree in CS'], 
'San Francisco, CA', '$120,000 - $160,000', 'full-time', 'senior', false,
ARRAY['React', 'Node.js', 'TypeScript', 'AWS']),

('StartupXYZ', 'Product Manager', 'Exciting opportunity to lead product development at a fast-growing startup...', 
ARRAY['3+ years PM experience', 'Agile methodology', 'Data-driven mindset'], 
'Remote', '$90,000 - $130,000', 'remote', 'mid', true,
ARRAY['Product Management', 'Agile', 'Analytics', 'SQL']),

('Enterprise Solutions', 'DevOps Engineer', 'Join our infrastructure team to build scalable cloud solutions...', 
ARRAY['Docker/Kubernetes', 'CI/CD pipelines', 'Cloud platforms'], 
'New York, NY', '$100,000 - $140,000', 'full-time', 'mid', false,
ARRAY['Docker', 'Kubernetes', 'AWS', 'Jenkins']);

-- Sample community posts
INSERT INTO public.community_posts (posted_by, post_type, title, content, is_pinned, target_audience) VALUES
(NULL, 'announcement', 'Welcome to CV Chap Chap!', 'We''re excited to have you join our community of job seekers. Here you''ll find tips, updates, and success stories to help accelerate your career.', true, ARRAY['all']),
(NULL, 'tip', 'Resume Writing Tip: Use Action Verbs', 'Start your bullet points with strong action verbs like "Led", "Developed", "Implemented" to make your achievements stand out to recruiters.', false, ARRAY['all']),
(NULL, 'update', 'New Premium Templates Available', 'We''ve just added 5 new premium resume templates designed specifically for tech professionals. Check them out in the template gallery!', false, ARRAY['premium', 'professional']);

-- Sample admin settings for the super admin
INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES
('super_admin_email', '"odimaoscar@gmail.com"', 'Email address of the super administrator'),
('intasend_api_key', '""', 'IntaSend API key for payment processing'),
('intasend_publishable_key', '""', 'IntaSend publishable key for frontend'),
('gemini_api_key', '""', 'Google Gemini API key for AI features'),
('aws_s3_bucket', '""', 'AWS S3 bucket for file storage'),
('email_smtp_settings', '{}', 'SMTP settings for email notifications');
