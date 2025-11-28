-- Reset all usage tracking data to start fresh with new limits
-- This script will reset all users to zero usage for the current month

-- First, let's see what we have
SELECT COUNT(*) as total_records FROM usage_tracking;

-- Delete all existing usage tracking records to start fresh
DELETE FROM usage_tracking;

-- Reset auto-increment if needed
-- Note: This is for PostgreSQL, the sequence might be different
-- ALTER SEQUENCE usage_tracking_id_seq RESTART WITH 1;

-- Verify the table is empty
SELECT COUNT(*) as remaining_records FROM usage_tracking;

-- The table schema should already be correct, but let's verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usage_tracking' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show the structure
\d usage_tracking;
