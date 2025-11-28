-- First, let's see what template IDs we have
SELECT DISTINCT template_id FROM resumes WHERE template_id IS NOT NULL;

-- Create a mapping table for template names to UUIDs
CREATE TABLE IF NOT EXISTS template_mappings (
    old_name TEXT PRIMARY KEY,
    new_uuid UUID DEFAULT gen_random_uuid()
);

-- Insert mappings for common template names
INSERT INTO template_mappings (old_name) VALUES 
('storage-Blue-and-pink-modern'),
('modern-professional'),
('classic-simple'),
('creative-design'),
('executive-style')
ON CONFLICT (old_name) DO NOTHING;

-- Update resumes table to use proper UUIDs
UPDATE resumes 
SET template_id = (
    SELECT new_uuid::text 
    FROM template_mappings 
    WHERE old_name = resumes.template_id
)
WHERE template_id IN (
    SELECT old_name FROM template_mappings
);

-- For any remaining non-UUID template_ids, set them to NULL
UPDATE resumes 
SET template_id = NULL 
WHERE template_id IS NOT NULL 
AND template_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Clean up the mapping table
DROP TABLE IF EXISTS template_mappings;
