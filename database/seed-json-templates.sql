-- Insert sample JSON-based resume templates
INSERT INTO resume_templates (
  name, 
  description, 
  category, 
  template_config, 
  is_premium, 
  is_active,
  download_count,
  rating
) VALUES 
(
  'Modern Professional',
  'Clean, modern design perfect for tech and business professionals',
  'modern',
  '{
    "sections": [
      {"id": "header", "type": "header", "title": "Header", "required": true, "order": 1},
      {"id": "summary", "type": "summary", "title": "Professional Summary", "required": false, "order": 2},
      {"id": "experience", "type": "experience", "title": "Work Experience", "required": true, "order": 3, "config": {"showDates": true, "showLocation": true}},
      {"id": "education", "type": "education", "title": "Education", "required": true, "order": 4, "config": {"showDates": true, "showLocation": true}},
      {"id": "skills", "type": "skills", "title": "Skills", "required": false, "order": 5, "config": {"layout": "list"}},
      {"id": "achievements", "type": "achievements", "title": "Key Achievements", "required": false, "order": 6}
    ],
    "layout": {
      "type": "single-column",
      "primaryColumn": ["header", "summary", "experience", "education", "skills", "achievements"]
    },
    "style": {
      "colorScheme": {
        "primary": "#2563eb",
        "secondary": "#64748b",
        "accent": "#3b82f6",
        "text": "#1e293b",
        "background": "#ffffff"
      },
      "typography": {
        "headingFont": "Inter",
        "bodyFont": "Inter",
        "headingSize": "medium",
        "bodySize": "medium"
      },
      "spacing": {
        "sectionGap": "normal",
        "itemGap": "normal"
      },
      "borders": {
        "sectionDividers": false,
        "headerUnderline": true,
        "style": "solid"
      }
    }
  }',
  false,
  true,
  1250,
  4.8
),
(
  'Executive Classic',
  'Traditional, elegant design for senior professionals and executives',
  'executive',
  '{
    "sections": [
      {"id": "header", "type": "header", "title": "Header", "required": true, "order": 1},
      {"id": "summary", "type": "summary", "title": "Executive Summary", "required": true, "order": 2},
      {"id": "experience", "type": "experience", "title": "Professional Experience", "required": true, "order": 3, "config": {"showDates": true, "showLocation": true}},
      {"id": "education", "type": "education", "title": "Education", "required": true, "order": 4, "config": {"showDates": true, "showLocation": true}},
      {"id": "achievements", "type": "achievements", "title": "Key Accomplishments", "required": false, "order": 5},
      {"id": "certifications", "type": "certifications", "title": "Certifications", "required": false, "order": 6}
    ],
    "layout": {
      "type": "single-column",
      "primaryColumn": ["header", "summary", "experience", "education", "achievements", "certifications"]
    },
    "style": {
      "colorScheme": {
        "primary": "#1f2937",
        "secondary": "#6b7280",
        "accent": "#374151",
        "text": "#111827",
        "background": "#ffffff"
      },
      "typography": {
        "headingFont": "Playfair Display",
        "bodyFont": "Source Sans Pro",
        "headingSize": "large",
        "bodySize": "medium"
      },
      "spacing": {
        "sectionGap": "loose",
        "itemGap": "normal"
      },
      "borders": {
        "sectionDividers": true,
        "headerUnderline": true,
        "style": "solid"
      }
    }
  }',
  true,
  true,
  890,
  4.9
),
(
  'Creative Sidebar',
  'Eye-catching design with sidebar layout for creative professionals',
  'creative',
  '{
    "sections": [
      {"id": "header", "type": "header", "title": "Header", "required": true, "order": 1},
      {"id": "summary", "type": "summary", "title": "About Me", "required": false, "order": 2},
      {"id": "experience", "type": "experience", "title": "Experience", "required": true, "order": 3, "config": {"showDates": true, "showLocation": false}},
      {"id": "projects", "type": "projects", "title": "Projects", "required": false, "order": 4},
      {"id": "education", "type": "education", "title": "Education", "required": true, "order": 5, "config": {"showDates": true, "showLocation": false}},
      {"id": "skills", "type": "skills", "title": "Skills", "required": false, "order": 6, "config": {"layout": "grid"}},
      {"id": "languages", "type": "languages", "title": "Languages", "required": false, "order": 7}
    ],
    "layout": {
      "type": "sidebar-left",
      "primaryColumn": ["summary", "experience", "projects"],
      "secondaryColumn": ["header", "education", "skills", "languages"]
    },
    "style": {
      "colorScheme": {
        "primary": "#7c3aed",
        "secondary": "#a78bfa",
        "accent": "#8b5cf6",
        "text": "#1f2937",
        "background": "#ffffff"
      },
      "typography": {
        "headingFont": "Poppins",
        "bodyFont": "Open Sans",
        "headingSize": "medium",
        "bodySize": "medium"
      },
      "spacing": {
        "sectionGap": "normal",
        "itemGap": "tight"
      },
      "borders": {
        "sectionDividers": false,
        "headerUnderline": false,
        "style": "solid"
      }
    }
  }',
  true,
  true,
  567,
  4.7
),
(
  'Minimal Clean',
  'Simple, clean design focusing on content over decoration',
  'minimal',
  '{
    "sections": [
      {"id": "header", "type": "header", "title": "Header", "required": true, "order": 1},
      {"id": "summary", "type": "summary", "title": "Summary", "required": false, "order": 2},
      {"id": "experience", "type": "experience", "title": "Experience", "required": true, "order": 3, "config": {"showDates": true, "showLocation": false}},
      {"id": "education", "type": "education", "title": "Education", "required": true, "order": 4, "config": {"showDates": true, "showLocation": false}},
      {"id": "skills", "type": "skills", "title": "Skills", "required": false, "order": 5, "config": {"layout": "list"}}
    ],
    "layout": {
      "type": "single-column",
      "primaryColumn": ["header", "summary", "experience", "education", "skills"]
    },
    "style": {
      "colorScheme": {
        "primary": "#000000",
        "secondary": "#666666",
        "accent": "#333333",
        "text": "#000000",
        "background": "#ffffff"
      },
      "typography": {
        "headingFont": "Helvetica",
        "bodyFont": "Helvetica",
        "headingSize": "medium",
        "bodySize": "medium"
      },
      "spacing": {
        "sectionGap": "normal",
        "itemGap": "tight"
      },
      "borders": {
        "sectionDividers": false,
        "headerUnderline": false,
        "style": "solid"
      }
    }
  }',
  false,
  true,
  2100,
  4.6
);
