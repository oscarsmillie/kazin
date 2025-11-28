-- Master script to fix both cover_letters and emails tables

-- First, run the cover letters table fix
\i scripts/fix-cover-letters-table-complete.sql

-- Then, run the emails table fix
\i scripts/fix-emails-table-complete.sql

-- Verify tables exist and have correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('cover_letters', 'emails') 
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('cover_letters', 'emails');

-- Success message
SELECT 'Both tables have been successfully created with correct schemas and RLS policies!' as status;
