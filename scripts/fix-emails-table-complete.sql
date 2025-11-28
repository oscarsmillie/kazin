-- Drop existing table if it exists and recreate with correct schema
DROP TABLE IF EXISTS public.emails CASCADE;

-- Create emails table with correct schema
CREATE TABLE public.emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    email_type TEXT NOT NULL DEFAULT 'general',
    tone TEXT DEFAULT 'professional',
    key_points TEXT,
    relationship TEXT,
    company TEXT,
    position TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_emails_user_id ON public.emails(user_id);
CREATE INDEX idx_emails_created_at ON public.emails(created_at DESC);
CREATE INDEX idx_emails_email_type ON public.emails(email_type);
CREATE INDEX idx_emails_subject ON public.emails(subject);

-- Enable RLS
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own emails" ON public.emails
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emails" ON public.emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emails" ON public.emails
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emails" ON public.emails
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_emails_updated_at 
    BEFORE UPDATE ON public.emails 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.emails TO authenticated;
GRANT ALL ON public.emails TO service_role;
