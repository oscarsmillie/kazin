// Core types for the application
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  phone?: string
  location?: string
  linkedin_url?: string
  portfolio_url?: string
  bio?: string
  skills?: string[]
  experience_level?: "entry" | "mid" | "senior" | "executive"
  industry?: string
  is_active: boolean
  email_verified: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  plan_type: "free" | "premium" | "professional" | "corporate"
  price_monthly: number
  price_yearly?: number
  currency: string
  features: {
    cover_letters: number // -1 for unlimited
    resumes: number // -1 for unlimited
    ats_optimizations: number // -1 for unlimited
    interview_sessions: number // -1 for unlimited
  }
  resume_download_price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete"
  current_period_start: string
  current_period_end: string
  trial_start?: string
  trial_end?: string
  cancel_at_period_end: boolean
  canceled_at?: string
  paystack_subscription_id?: string
  paystack_customer_code?: string
  created_at: string
  updated_at: string
}

// Template configuration interface
export interface TemplateConfig {
  sections: TemplateSection[]
  layout: {
    type: "single-column" | "two-column"
    primaryColumn: string[]
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
      sectionDividers: boolean
      headerUnderline: boolean
      style: "solid" | "dashed" | "dotted" | "none"
    }
  }
  fonts?: {
    primary: string
    secondary: string
  }
}

export interface TemplateSection {
  id: string
  type: "header" | "summary" | "experience" | "education" | "skills" | "achievements" | "certifications" | "projects"
  title: string
  required: boolean
  order: number
  config?: {
    showDates?: boolean
    showLocation?: boolean
    layout?: "list" | "grid" | "inline"
    [key: string]: any
  }
}

export interface ResumeTemplate {
  id: string
  name: string
  description?: string
  category: "modern" | "classic" | "creative" | "executive" | "minimal" | "professional"
  template_config: TemplateConfig // Changed from template_schema to template_config
  preview_image_url?: string
  thumbnail_url?: string
  css_styles?: string
  is_premium: boolean
  is_active: boolean
  download_count: number
  rating: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Resume {
  id: string
  user_id: string
  template_id?: string
  title: string
  resume_data: ResumeData
  file_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ResumeData {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin?: string
    portfolio?: string
    summary?: string
  }
  professionalSummary?: string
  workExperience: WorkExperience[]
  education: Education[]
  technicalSkills: string[]
  achievements?: string[]
  certifications?: Certification[]
  projects?: Project[]
}

export interface WorkExperience {
  id: string
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  achievements?: string[]
}

export interface Education {
  id: string
  degree: string
  school: string
  location?: string
  graduationDate: string
  gpa?: string
  description?: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  expiryDate?: string
  credentialId?: string
  url?: string
}

export interface Project {
  id: string
  name: string
  description: string
  technologies: string[]
  url?: string
  github?: string
  startDate?: string
  endDate?: string
}

export interface CoverLetter {
  id: string
  user_id: string
  title: string
  content: string
  job_title?: string
  company_name?: string
  job_posting_id?: string
  created_at: string
  updated_at: string
}

export interface JobPosting {
  id: string
  posted_by?: string
  company_name: string
  company_logo_url?: string
  job_title: string
  description: string
  requirements?: string[]
  responsibilities?: string[]
  location?: string
  salary_range?: string
  salary_min?: number
  salary_max?: number
  currency: string
  job_type: "full-time" | "part-time" | "contract" | "remote" | "hybrid"
  experience_level: "entry" | "mid" | "senior" | "executive"
  industry?: string
  skills_required?: string[]
  is_private: boolean
  is_featured: boolean
  is_active: boolean
  application_deadline?: string
  external_url?: string
  application_email?: string
  application_instructions?: string
  view_count: number
  application_count: number
  posted_date: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface JobApplication {
  id: string
  user_id: string
  job_posting_id?: string
  company_name: string
  job_title: string
  job_url?: string
  status: "applied" | "interview" | "rejected" | "offer" | "accepted"
  application_date: string
  deadline?: string
  notes?: string
  resume_id?: string
  cover_letter_id?: string
  created_at: string
  updated_at: string
}

export interface CareerGoal {
  id: string
  user_id: string
  title: string
  description?: string
  target_position?: string
  target_company?: string
  target_salary?: number
  target_location?: string
  deadline?: string
  status: "active" | "completed" | "paused" | "cancelled"
  progress_percentage: number
  milestones?: any[]
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  paystack_transaction_id: string
  paystack_reference?: string
  payment_type: "subscription" | "resume_download" | "upgrade"
  amount: number
  currency: string
  status: "pending" | "success" | "failed" | "abandoned" | "cancelled"
  payment_method?: string
  description?: string
  metadata?: any
  paid_at?: string
  created_at: string
  updated_at: string
}

export interface UserActivity {
  id: string
  user_id: string
  activity_type:
    | "resume_created"
    | "resume_downloaded"
    | "cover_letter_created"
    | "cover_letter_downloaded"
    | "job_applied"
    | "template_viewed"
    | "ats_optimization"
    | "interview_session"
    | "payment_made"
    | "subscription_changed"
    | "goal_created"
    | "goal_updated"
  description: string
  metadata?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface UsageTracking {
  id: string
  user_id: string
  month_year: string // Format: "2024-01"
  cover_letters_generated: number
  resumes_generated: number
  resumes_downloaded: number
  ats_optimizations_used: number
  interview_sessions: number
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  notification_type: "system" | "payment" | "download" | "community" | "job_alert" | "subscription"
  title: string
  message: string
  action_url?: string
  is_read: boolean
  is_important: boolean
  metadata?: any
  expires_at?: string
  created_at: string
}

export interface CommunityPost {
  id: string
  posted_by?: string
  post_type: "announcement" | "update" | "tip" | "success_story" | "maintenance"
  title: string
  content: string
  is_pinned: boolean
  is_active: boolean
  target_audience: string[]
  read_count: number
  created_at: string
  updated_at: string
}
