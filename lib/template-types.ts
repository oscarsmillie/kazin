export interface PersonalInfo {
  firstName?: string
  lastName?: string
  tagline?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  portfolio?: string
}

export interface WorkExperience {
  id: string
  title?: string
  company?: string
  location?: string
  startDate?: string
  endDate?: string
  current?: boolean
  description?: string
  achievements?: string[]
}

export interface Education {
  id: string
  degree?: string
  school?: string
  location?: string
  startDate?: string
  graduationDate?: string
  gpa?: string
  description?: string
  honors?: string[]
}

export interface Certification {
  id: string
  name: string
  issuer?: string
  date?: string
  expiryDate?: string
  credentialId?: string
}

export interface Reference {
  id: string
  name: string
  company?: string
  phone?: string
  email?: string
  relationship?: string
}

export interface ResumeData {
  personalInfo?: PersonalInfo
  professionalSummary?: string
  workExperience?: WorkExperience[]
  education?: Education[]
  technicalSkills?: string[]
  softSkills?: string[]
  achievements?: string[]
  certifications?: Certification[]
  references?: Reference[]
}

export interface TemplateSection {
  id: string
  type: string
  title: string
  required: boolean
  order: number
  config?: {
    maxItems?: number
    showLocation?: boolean
    showDates?: boolean
    layout?: string
  }
}

export interface JSONResumeTemplate {
  id: string
  name: string
  description: string
  category: string
  is_premium: boolean
  template_config: {
    sections: TemplateSection[]
    layout: {
      type: "single-column" | "two-column" | "sidebar-left" | "sidebar-right"
      primaryColumn?: string[]
      secondaryColumn?: string[]
    }
    style: {
      colorScheme: {
        primary: string
        secondary: string
        accent: string
        text: string
        background: string
      }
      typography: {
        headingFont: string
        bodyFont: string
        headingSize: "small" | "medium" | "large"
        bodySize: "small" | "medium" | "large"
      }
      spacing: {
        sectionGap: "tight" | "normal" | "loose"
        itemGap: "tight" | "normal" | "loose"
      }
      borders: {
        style: "solid" | "dashed" | "dotted"
        headerUnderline: boolean
        sectionDividers: boolean
      }
    }
  }
}
