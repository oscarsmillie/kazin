-- Create external_jobs table to store jobs from APIs
CREATE TABLE IF NOT EXISTS external_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  description TEXT,
  location TEXT,
  job_type TEXT,
  salary TEXT,
  experience_level TEXT,
  skills TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  posted_date TIMESTAMPTZ,
  application_url TEXT,
  company_logo TEXT,
  source TEXT NOT NULL,
  category TEXT DEFAULT 'Technology',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(external_id, source)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_external_jobs_source ON external_jobs(source);
CREATE INDEX IF NOT EXISTS idx_external_jobs_posted_date ON external_jobs(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_external_jobs_location ON external_jobs(location);
CREATE INDEX IF NOT EXISTS idx_external_jobs_skills ON external_jobs USING GIN(skills);

-- Enable RLS
ALTER TABLE external_jobs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "external_jobs_read_public" ON external_jobs
  FOR SELECT USING (true);

-- Allow service role to manage
CREATE POLICY "external_jobs_manage_service" ON external_jobs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
