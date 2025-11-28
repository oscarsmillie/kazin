// ... existing code at top ...

import type { ResumeData } from "./path-to-resume-data" // Declare or import ResumeData

const renderResumeWithPlaceholders = (template: any, data: ResumeData) => {
  if (!template?.html_template) return ""

  const html = template.html_template

  try {
    const finalHTML = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resume Preview</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            /* Isolated template styles in a namespace to prevent UI contamination */
            #resume-content {
              isolation: isolate;
            }
            #resume-content * {
              all: revert;
            }
            ${template.css_styles || ""}
          </style>
        </head>
        <body>
          <div id="resume-content">
            ${html}
          </div>
        </body>
      </html>
    `

    return finalHTML
  } catch (error) {
    console.error("Error rendering template:", error)
    return "<div>Error rendering preview</div>"
  }
}

// ... rest of existing code ...
