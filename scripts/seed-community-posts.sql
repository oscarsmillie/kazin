-- Insert sample community posts for the dashboard
INSERT INTO community_posts (title, content, post_type, is_pinned, is_active, created_at) VALUES
(
  'Welcome to Kazi Career Platform!',
  'We''re excited to have you join our community of job seekers and career professionals. Explore our AI-powered tools to accelerate your job search.',
  'announcement',
  true,
  true,
  NOW()
),
(
  'New AI Resume Builder Features',
  'Our resume builder now includes advanced AI suggestions for work descriptions and skills. Try the new AI-powered content generation today!',
  'update',
  true,
  true,
  NOW() - INTERVAL '1 day'
),
(
  'Pro Tip: ATS Optimization',
  'Use keywords from the job description in your resume. Our ATS optimizer can help you identify the most important keywords for each application.',
  'tip',
  false,
  true,
  NOW() - INTERVAL '2 days'
),
(
  'Success Story: Sarah Landed Her Dream Job',
  'Sarah used our platform to create her resume and track applications. After 3 weeks, she landed a senior developer role at a top tech company!',
  'success_story',
  false,
  true,
  NOW() - INTERVAL '3 days'
),
(
  'Interview Prep Tips',
  'Practice common interview questions and use our AI interview prep tool to get personalized feedback on your responses.',
  'tip',
  false,
  true,
  NOW() - INTERVAL '5 days'
);
