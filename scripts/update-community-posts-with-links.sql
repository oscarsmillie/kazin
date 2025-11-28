-- Update community posts to add external links
-- This script adds external_link column if it doesn't exist and updates sample posts

-- Add external_link column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_posts' AND column_name = 'external_link'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN external_link TEXT;
    RAISE NOTICE '✅ Added external_link column to community_posts';
  ELSE
    RAISE NOTICE 'ℹ️ external_link column already exists';
  END IF;
END $$;

-- Update existing posts with sample external links
UPDATE community_posts 
SET external_link = 'https://blog.kazicareer.com/welcome'
WHERE title = 'Welcome to Kazi Career Platform!' AND external_link IS NULL;

UPDATE community_posts 
SET external_link = 'https://blog.kazicareer.com/ai-resume-features'
WHERE title = 'New AI Resume Builder Features' AND external_link IS NULL;

UPDATE community_posts 
SET external_link = 'https://blog.kazicareer.com/ats-optimization-tips'
WHERE title LIKE '%ATS Optimization%' AND external_link IS NULL;

UPDATE community_posts 
SET external_link = 'https://blog.kazicareer.com/success-stories'
WHERE post_type = 'success_story' AND external_link IS NULL;

UPDATE community_posts 
SET external_link = 'https://blog.kazicareer.com/interview-prep'
WHERE title LIKE '%Interview Prep%' AND external_link IS NULL;

-- Add comment to the column
COMMENT ON COLUMN community_posts.external_link IS 'Optional external URL for posts that link to blog articles or resources';

RAISE NOTICE '✅ Community posts updated with external links';
