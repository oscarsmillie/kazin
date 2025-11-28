-- Create user_activity table
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own activity" ON public.user_activity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity" ON public.user_activity
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drop existing community_posts table if it exists to recreate with proper constraints
DROP TABLE IF EXISTS public.community_posts CASCADE;

-- Create community_posts table with proper constraints
CREATE TABLE public.community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'announcement' CHECK (post_type IN ('announcement', 'tip', 'update', 'event', 'discussion')),
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for community_posts
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_pinned ON public.community_posts(is_pinned DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON public.community_posts(post_type);

-- Enable RLS for community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for community_posts (everyone can read)
CREATE POLICY "Anyone can view community posts" ON public.community_posts
    FOR SELECT USING (true);

-- Insert sample community posts with valid post_types
INSERT INTO public.community_posts (title, content, post_type, is_pinned) VALUES
('Welcome to KaziNest!', 'We are excited to have you join our career development platform. Get started by creating your first resume or cover letter.', 'announcement', true),
('5 Tips for Better Cover Letters', 'Learn how to write compelling cover letters that grab recruiters attention and land you more interviews. Focus on personalization, quantifiable achievements, and clear value propositions.', 'tip', false),
('New ATS Optimization Feature', 'We have just launched our new ATS optimization tool to help your resume get past applicant tracking systems and into the hands of hiring managers.', 'update', false),
('Weekly Career Coaching Session', 'Join our weekly group career coaching session every Friday at 2 PM EAT. Topics include salary negotiation, interview preparation, and career planning.', 'event', false),
('Resume Template Updates', 'We have added 5 new professional resume templates to help you stand out in your job applications. Check them out in the resume builder.', 'update', false),
('Share Your Success Stories', 'Have you landed a job using KaziNest? We would love to hear your success story! Share your experience with the community.', 'discussion', false)
ON CONFLICT DO NOTHING;

-- Function to automatically log user activities
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO public.user_activity (user_id, activity_type, description, metadata)
    VALUES (p_user_id, p_activity_type, p_description, p_metadata)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
