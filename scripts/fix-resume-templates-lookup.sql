-- Fix resume templates to ensure proper template lookup
-- First, let's check what templates exist and clean up
DELETE FROM resume_templates WHERE name IS NULL OR name = '';

-- Insert basic templates with proper IDs and names
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
    'entry-level-fresher',
    'Entry Level Fresher',
    'Perfect template for fresh graduates and entry-level professionals',
    'entry-level',
    '<div class="resume-template entry-level-fresher">
        <div class="header">
            <h1>{{fullName}}</h1>
            <div class="contact-info">
                <p>{{email}} | {{phone}}</p>
                <p>{{location}}</p>
            </div>
        </div>
        <div class="section">
            <h2>Professional Summary</h2>
            <p>{{summary}}</p>
        </div>
        <div class="section">
            <h2>Education</h2>
            {{#each education}}
            <div class="education-item">
                <h3>{{degree}} - {{institution}}</h3>
                <p>{{year}} | GPA: {{gpa}}</p>
            </div>
            {{/each}}
        </div>
        <div class="section">
            <h2>Skills</h2>
            <ul class="skills-list">
                {{#each skills}}
                <li>{{this}}</li>
                {{/each}}
            </ul>
        </div>
        <div class="section">
            <h2>Experience</h2>
            {{#each experience}}
            <div class="experience-item">
                <h3>{{title}} - {{company}}</h3>
                <p>{{duration}}</p>
                <ul>
                    {{#each responsibilities}}
                    <li>{{this}}</li>
                    {{/each}}
                </ul>
            </div>
            {{/each}}
        </div>
        <div class="section">
            <h2>Projects</h2>
            {{#each projects}}
            <div class="project-item">
                <h3>{{name}}</h3>
                <p>{{description}}</p>
            </div>
            {{/each}}
        </div>
      </div>', 
    'body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }',
    false,
    true,
    NOW(),
    NOW()
),
(
    'professional-modern',
    'Professional Modern',
    'Clean and modern template for experienced professionals', 
    'professional',
    '<div class="resume-template professional-modern">
        <div class="header">
            <h1>{{fullName}}</h1>
            <div class="contact-info">
                <p>{{email}} | {{phone}} | {{location}}</p>
            </div>
        </div>
        <div class="content">
            <div class="left-column">
                <div class="section">
                    <h2>Contact</h2>
                    <p>{{email}}</p>
                    <p>{{phone}}</p>
                    <p>{{location}}</p>
                </div>
                <div class="section">
                    <h2>Skills</h2>
                    {{#each skills}}
                    <div class="skill-item">{{this}}</div>
                    {{/each}}
                </div>
            </div>
            <div class="right-column">
                <div class="section">
                    <h2>Professional Summary</h2>
                    <p>{{summary}}</p>
                </div>
                <div class="section">
                    <h2>Experience</h2>
                    {{#each experience}}
                    <div class="experience-item">
                        <h3>{{title}}</h3>
                        <h4>{{company}} | {{duration}}</h4>
                        <ul>
                            {{#each responsibilities}}
                            <li>{{this}}</li>
                            {{/each}}
                        </ul>
                    </div>
                    {{/each}}
                </div>
                <div class="section">
                    <h2>Education</h2>
                    {{#each education}}
                    <div class="education-item">
                        <h3>{{degree}}</h3>
                        <p>{{institution}} | {{year}}</p>
                    </div>
                    {{/each}}
                </div>
            </div>
        </div>
      </div>', 
    'body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f8f9fa; }',
    false,
    true,
    NOW(),
    NOW()
),
(
    'creative-designer',
    'Creative Designer',
    'Eye-catching template for creative professionals', 
    'creative',
    '<div class="resume-template creative-designer">
        <div class="header creative-header">
            <h1>{{fullName}}</h1>
            <p class="tagline">{{title}}</p>
            <div class="contact-info">
                <span>{{email}}</span> | <span>{{phone}}</span> | <span>{{location}}</span>
            </div>
        </div>
        <div class="content">
            <div class="section">
                <h2>About Me</h2>
                <p>{{summary}}</p>
            </div>
            <div class="section">
                <h2>Experience</h2>
                {{#each experience}}
                <div class="experience-item">
                    <h3>{{title}} at {{company}}</h3>
                    <p class="duration">{{duration}}</p>
                    <ul>
                        {{#each responsibilities}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                </div>
                {{/each}}
            </div>
            <div class="section">
                <h2>Skills & Expertise</h2>
                <div class="skills-grid">
                    {{#each skills}}
                    <span class="skill-tag">{{this}}</span>
                    {{/each}}
                </div>
            </div>
            <div class="section">
                <h2>Education</h2>
                {{#each education}}
                <div class="education-item">
                    <h3>{{degree}}</h3>
                    <p>{{institution}} | {{year}}</p>
                </div>
                {{/each}}
            </div>
        </div>
      </div>', 
    'body { font-family: "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 20px; background: #fafafa; }',
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    html_template = EXCLUDED.html_template,
    css_styles = EXCLUDED.css_styles,
    is_premium = EXCLUDED.is_premium,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_resume_templates_name ON resume_templates(name);
CREATE INDEX IF NOT EXISTS idx_resume_templates_active ON resume_templates(is_active);

COMMIT;
