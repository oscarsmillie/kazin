-- Fix resume templates to ensure proper template lookup
-- First, let's check what templates exist
SELECT id, name FROM resume_templates LIMIT 10;

-- If the table is empty or has issues, let's create some basic templates
INSERT INTO resume_templates (
    id,
    name,
    description,
    category,
    html_template,
    css_styles,
    is_premium,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'Entry Level Fresher',
    'Perfect template for fresh graduates and entry-level professionals',
    'entry-level',
    '<!DOCTYPE html>
<html>
<head>
    <title>Resume</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .section { margin-bottom: 15px; }
        .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{FULL_NAME}</h1>
        <p>{EMAIL} | {PHONE}</p>
        <p>{CITY}, {POSTCODE}</p>
    </div>
    
    <div class="section">
        <h3>Professional Summary</h3>
        <p>{PROFESSIONAL_SUMMARY}</p>
    </div>
    
    <div class="section">
        <h3>Work Experience</h3>
        <div>
            <h4>{JOB_TITLE_1}</h4>
            <p><strong>{EMPLOYER_1}</strong> | {WSD_1} - {WED_1}</p>
            <p>{WORK_DESCRIPTION_1}</p>
        </div>
    </div>
    
    <div class="section">
        <h3>Education</h3>
        <div>
            <h4>{DEGREE_1}</h4>
            <p><strong>{INSTITUTION_1}</strong> | {ESD_1} - {EED_1}</p>
        </div>
    </div>
    
    <div class="section">
        <h3>Skills</h3>
        <p>{SKILL_1}, {SKILL_2}, {SKILL_3}, {SKILL_4}, {SKILL_5}</p>
    </div>
</body>
</html>',
    'body { font-family: Arial, sans-serif; margin: 20px; }',
    false,
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Professional Modern',
    'Modern professional template for experienced professionals',
    'professional',
    '<!DOCTYPE html>
<html>
<head>
    <title>Resume</title>
    <style>
        body { font-family: "Segoe UI", sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 30px; text-align: center; }
        .content { padding: 20px; }
        .section { margin-bottom: 25px; }
        .section h3 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{FULL_NAME}</h1>
            <p>{TAGLINE}</p>
            <p>{EMAIL} | {PHONE} | {CITY}</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h3>Professional Summary</h3>
                <p>{PROFESSIONAL_SUMMARY}</p>
            </div>
            
            <div class="section">
                <h3>Work Experience</h3>
                <div>
                    <h4>{JOB_TITLE_1}</h4>
                    <p><strong>{EMPLOYER_1}</strong> | {WSD_1} - {WED_1}</p>
                    <p>{WORK_DESCRIPTION_1}</p>
                </div>
            </div>
            
            <div class="section">
                <h3>Education</h3>
                <div>
                    <h4>{DEGREE_1}</h4>
                    <p><strong>{INSTITUTION_1}</strong> | {ESD_1} - {EED_1}</p>
                </div>
            </div>
            
            <div class="section">
                <h3>Technical Skills</h3>
                <p>{SKILL_1} • {SKILL_2} • {SKILL_3} • {SKILL_4} • {SKILL_5}</p>
            </div>
        </div>
    </div>
</body>
</html>',
    'body { font-family: "Segoe UI", sans-serif; margin: 0; padding: 20px; }',
    false,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    html_template = EXCLUDED.html_template,
    css_styles = EXCLUDED.css_styles,
    updated_at = NOW();

COMMIT;
