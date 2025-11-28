import type { JSONResumeTemplate, ResumeData, TemplateSection } from "./template-types"

export class JSONTemplateRenderer {
  private template: JSONResumeTemplate
  private data: ResumeData

  constructor(template: JSONResumeTemplate, data: ResumeData) {
    this.template = template
    this.data = data
  }

  render(): string {
    const { layout, style, sections } = this.template.template_config

    const css = this.generateCSS(style)
    const html = this.generateHTML(layout, sections)

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${this.data.personalInfo.fullName} - Resume</title>
          <style>${css}</style>
        </head>
        <body>
          <div class="resume-container">
            ${html}
          </div>
        </body>
      </html>
    `
  }

  private generateCSS(style: JSONResumeTemplate["template_config"]["style"]): string {
    const { colorScheme, typography, spacing, borders } = style

    return `
      @import url('https://fonts.googleapis.com/css2?family=${typography.headingFont.replace(" ", "+")}:wght@400;600;700&family=${typography.bodyFont.replace(" ", "+")}:wght@300;400;500&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .resume-container {
        max-width: 8.5in;
        margin: 0 auto;
        padding: 0.75in;
        background: ${colorScheme.background};
        color: ${colorScheme.text};
        font-family: '${typography.bodyFont}', sans-serif;
        font-size: ${typography.bodySize === "small" ? "0.875rem" : typography.bodySize === "large" ? "1.125rem" : "1rem"};
        line-height: 1.5;
      }

      .layout-single-column {
        display: block;
      }

      .layout-two-column {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 2rem;
      }

      .layout-sidebar-left {
        display: grid;
        grid-template-columns: 1fr 2.5fr;
        gap: 2rem;
      }

      .layout-sidebar-right {
        display: grid;
        grid-template-columns: 2.5fr 1fr;
        gap: 2rem;
      }

      .primary-column,
      .secondary-column {
        display: flex;
        flex-direction: column;
        gap: ${spacing.sectionGap === "tight" ? "1rem" : spacing.sectionGap === "loose" ? "2.5rem" : "1.5rem"};
      }

      .section {
        margin-bottom: ${spacing.sectionGap === "tight" ? "1rem" : spacing.sectionGap === "loose" ? "2.5rem" : "1.5rem"};
      }

      .section-header {
        font-family: '${typography.headingFont}', sans-serif;
        font-size: ${typography.headingSize === "small" ? "1.125rem" : typography.headingSize === "large" ? "1.5rem" : "1.25rem"};
        font-weight: 600;
        color: ${colorScheme.primary};
        margin-bottom: ${spacing.itemGap === "tight" ? "0.5rem" : spacing.itemGap === "loose" ? "1.5rem" : "1rem"};
        ${borders.headerUnderline ? `border-bottom: 2px ${borders.style} ${colorScheme.accent}; padding-bottom: 0.25rem;` : ""}
      }

      .header-section {
        text-align: center;
        margin-bottom: 2rem;
        ${borders.sectionDividers ? `border-bottom: 1px ${borders.style} ${colorScheme.accent}; padding-bottom: 1.5rem;` : ""}
      }

      .header-name {
        font-family: '${typography.headingFont}', sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: ${colorScheme.primary};
        margin-bottom: 0.5rem;
      }

      .header-contact {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 1rem;
        color: ${colorScheme.secondary};
        font-size: 0.9rem;
      }

      .contact-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .summary-text {
        text-align: justify;
        line-height: 1.6;
        color: ${colorScheme.text};
      }

      .experience-item,
      .education-item,
      .project-item,
      .certification-item {
        margin-bottom: ${spacing.itemGap === "tight" ? "1rem" : spacing.itemGap === "loose" ? "2rem" : "1.5rem"};
        ${borders.sectionDividers ? `border-bottom: 1px solid ${colorScheme.background}; padding-bottom: 1rem;` : ""}
      }

      .item-title {
        font-weight: 600;
        color: ${colorScheme.primary};
        font-size: 1.1rem;
      }

      .item-subtitle {
        color: ${colorScheme.secondary};
        font-weight: 500;
        margin: 0.25rem 0;
      }

      .item-meta {
        color: ${colorScheme.secondary};
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }

      .item-description {
        margin-top: 0.5rem;
        line-height: 1.6;
      }

      .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.5rem;
      }

      .skills-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .skill-tag {
        background: ${colorScheme.accent};
        color: ${colorScheme.background};
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .achievements-list {
        list-style: none;
        padding: 0;
      }

      .achievements-list li {
        position: relative;
        padding-left: 1.5rem;
        margin-bottom: 0.5rem;
        line-height: 1.6;
      }

      .achievements-list li:before {
        content: "▸";
        position: absolute;
        left: 0;
        color: ${colorScheme.accent};
        font-weight: bold;
      }

      .languages-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
      }

      .language-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: ${colorScheme.background};
        border: 1px solid ${colorScheme.accent};
        border-radius: 0.5rem;
      }

      .proficiency-indicator {
        display: flex;
        gap: 0.125rem;
      }

      .proficiency-dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background: ${colorScheme.accent};
      }

      .proficiency-dot.inactive {
        background: ${colorScheme.background};
        border: 1px solid ${colorScheme.accent};
      }

      @media print {
        .resume-container {
          padding: 0.5in;
          box-shadow: none;
        }
      }

      @media (max-width: 768px) {
        .layout-two-column,
        .layout-sidebar-left,
        .layout-sidebar-right {
          grid-template-columns: 1fr;
        }
        
        .header-contact {
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .skills-grid {
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        }
      }
    `
  }

  private generateHTML(layout: JSONResumeTemplate["template_config"]["layout"], sections: TemplateSection[]): string {
    const sortedSections = sections.sort((a, b) => a.order - b.order)

    if (layout.type === "single-column") {
      return `
        <div class="layout-single-column">
          ${sortedSections.map((section) => this.renderSection(section)).join("")}
        </div>
      `
    }

    const primarySections = sortedSections.filter((s) => layout.primaryColumn.includes(s.id))
    const secondarySections = sortedSections.filter((s) => layout.secondaryColumn?.includes(s.id))

    return `
      <div class="layout-${layout.type}">
        <div class="primary-column">
          ${primarySections.map((section) => this.renderSection(section)).join("")}
        </div>
        <div class="secondary-column">
          ${secondarySections.map((section) => this.renderSection(section)).join("")}
        </div>
      </div>
    `
  }

  private renderSection(section: TemplateSection): string {
    switch (section.type) {
      case "header":
        return this.renderHeader()
      case "summary":
        return this.renderSummary()
      case "experience":
        return this.renderExperience(section)
      case "education":
        return this.renderEducation(section)
      case "skills":
        return this.renderSkills(section)
      case "achievements":
        return this.renderAchievements(section)
      case "certifications":
        return this.renderCertifications(section)
      case "projects":
        return this.renderProjects(section)
      case "languages":
        return this.renderLanguages(section)
      default:
        return ""
    }
  }

  private renderHeader(): string {
    const { personalInfo } = this.data

    return `
      <div class="header-section">
        <h1 class="header-name">${personalInfo.fullName || "[Full Name]"}</h1>
        <div class="header-contact">
          ${personalInfo.email ? `<div class="contact-item">📧 ${personalInfo.email}</div>` : ""}
          ${personalInfo.phone ? `<div class="contact-item">📞 ${personalInfo.phone}</div>` : ""}
          ${personalInfo.location ? `<div class="contact-item">📍 ${personalInfo.location}</div>` : ""}
          ${personalInfo.linkedin ? `<div class="contact-item">💼 LinkedIn</div>` : ""}
          ${personalInfo.portfolio ? `<div class="contact-item">🌐 Portfolio</div>` : ""}
        </div>
      </div>
    `
  }

  private renderSummary(): string {
    if (!this.data.professionalSummary) return ""

    return `
      <div class="section">
        <h2 class="section-header">Professional Summary</h2>
        <p class="summary-text">${this.data.professionalSummary}</p>
      </div>
    `
  }

  private renderExperience(section: TemplateSection): string {
    if (!this.data.workExperience || this.data.workExperience.length === 0) return ""

    const maxItems = section.config?.maxItems || this.data.workExperience.length
    const experiences = this.data.workExperience.slice(0, maxItems)

    return `
      <div class="section">
        <h2 class="section-header">${section.title}</h2>
        ${experiences
          .map(
            (exp) => `
          <div class="experience-item">
            <div class="item-title">${exp.title || "[Job Title]"}</div>
            <div class="item-subtitle">${exp.company || "[Company]"}</div>
            ${section.config?.showLocation && exp.location ? `<div class="item-meta">📍 ${exp.location}</div>` : ""}
            ${section.config?.showDates ? `<div class="item-meta">📅 ${exp.startDate || "[Start]"} - ${exp.current ? "Present" : exp.endDate || "[End]"}</div>` : ""}
            ${exp.description ? `<div class="item-description">${exp.description}</div>` : ""}
            ${
              exp.achievements && exp.achievements.length > 0
                ? `
              <ul class="achievements-list">
                ${exp.achievements.map((achievement) => `<li>${achievement}</li>`).join("")}
              </ul>
            `
                : ""
            }
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  private renderEducation(section: TemplateSection): string {
    if (!this.data.education || this.data.education.length === 0) return ""

    const maxItems = section.config?.maxItems || this.data.education.length
    const education = this.data.education.slice(0, maxItems)

    return `
      <div class="section">
        <h2 class="section-header">${section.title}</h2>
        ${education
          .map(
            (edu) => `
          <div class="education-item">
            <div class="item-title">${edu.degree || "[Degree]"}</div>
            <div class="item-subtitle">${edu.school || "[School]"}</div>
            ${section.config?.showLocation && edu.location ? `<div class="item-meta">📍 ${edu.location}</div>` : ""}
            ${section.config?.showDates ? `<div class="item-meta">📅 ${edu.graduationDate || "[Year]"}</div>` : ""}
            ${edu.gpa ? `<div class="item-meta">GPA: ${edu.gpa}</div>` : ""}
            ${edu.description ? `<div class="item-description">${edu.description}</div>` : ""}
            ${
              edu.honors && edu.honors.length > 0
                ? `
              <div class="item-meta">Honors: ${edu.honors.join(", ")}</div>
            `
                : ""
            }
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  private renderSkills(section: TemplateSection): string {
    const allSkills = [...(this.data.technicalSkills || []), ...(this.data.softSkills || [])]
    if (allSkills.length === 0) return ""

    const layout = section.config?.layout || "list"

    return `
      <div class="section">
        <h2 class="section-header">${section.title}</h2>
        <div class="skills-${layout}">
          ${allSkills.map((skill) => `<span class="skill-tag">${skill}</span>`).join("")}
        </div>
      </div>
    `
  }

  private renderAchievements(section: TemplateSection): string {
    if (!this.data.achievements || this.data.achievements.length === 0) return ""

    return `
      <div class="section">
        <h2 class="section-header">${section.title}</h2>
        <ul class="achievements-list">
          ${this.data.achievements.map((achievement) => `<li>${achievement}</li>`).join("")}
        </ul>
      </div>
    `
  }

  private renderCertifications(section: TemplateSection): string {
    if (!this.data.certifications || this.data.certifications.length === 0) return ""

    return `
      <div class="section">
        <h2 class="section-header">${section.title}</h2>
        ${this.data.certifications
          .map(
            (cert) => `
          <div class="certification-item">
            <div class="item-title">${cert.name}</div>
            <div class="item-subtitle">${cert.issuer}</div>
            <div class="item-meta">📅 ${cert.date}${cert.expiryDate ? ` - ${cert.expiryDate}` : ""}</div>
            ${cert.credentialId ? `<div class="item-meta">ID: ${cert.credentialId}</div>` : ""}
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  private renderProjects(section: TemplateSection): string {
    if (!this.data.projects || this.data.projects.length === 0) return ""

    return `
      <div class="section">
        <h2 class="section-header">${section.title}</h2>
        ${this.data.projects
          .map(
            (project) => `
          <div class="project-item">
            <div class="item-title">${project.name}</div>
            <div class="item-description">${project.description}</div>
            <div class="skills-list">
              ${project.technologies.map((tech) => `<span class="skill-tag">${tech}</span>`).join("")}
            </div>
            ${project.url ? `<div class="item-meta">🔗 <a href="${project.url}" target="_blank">View Project</a></div>` : ""}
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  private renderLanguages(section: TemplateSection): string {
    if (!this.data.languages || this.data.languages.length === 0) return ""

    const proficiencyLevels = {
      basic: 1,
      conversational: 2,
      fluent: 3,
      native: 4,
    }

    return `
      <div class="section">
        <h2 class="section-header">${section.title}</h2>
        <div class="languages-grid">
          ${this.data.languages
            .map((lang) => {
              const level = proficiencyLevels[lang.proficiency]
              return `
              <div class="language-item">
                <span>${lang.language}</span>
                <div class="proficiency-indicator">
                  ${Array.from(
                    { length: 4 },
                    (_, i) => `<div class="proficiency-dot ${i < level ? "" : "inactive"}"></div>`,
                  ).join("")}
                </div>
              </div>
            `
            })
            .join("")}
        </div>
      </div>
    `
  }
}

export const renderJSONTemplate = (template: JSONResumeTemplate, data: ResumeData): string => {
  const renderer = new JSONTemplateRenderer(template, data)
  return renderer.render()
}
