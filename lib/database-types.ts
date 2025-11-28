// Database type definitions for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          location: string | null
          linkedin_url: string | null
          portfolio_url: string | null
          bio: string | null
          skills: string[] | null
          experience_level: "entry" | "mid" | "senior" | "executive" | null
          industry: string | null
          is_active: boolean
          email_verified: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          bio?: string | null
          skills?: string[] | null
          experience_level?: "entry" | "mid" | "senior" | "executive" | null
          industry?: string | null
          is_active?: boolean
          email_verified?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          bio?: string | null
          skills?: string[] | null
          experience_level?: "entry" | "mid" | "senior" | "executive" | null
          industry?: string | null
          is_active?: boolean
          email_verified?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_name: "user" | "admin" | "super_admin" | "content_moderator" | "job_poster"
          granted_by: string | null
          granted_at: string
          expires_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          role_name: "user" | "admin" | "super_admin" | "content_moderator" | "job_poster"
          granted_by?: string | null
          granted_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          role_name?: "user" | "admin" | "super_admin" | "content_moderator" | "job_poster"
          granted_by?: string | null
          granted_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          plan_type: "free" | "premium" | "professional" | "corporate"
          price_monthly: number
          price_yearly: number | null
          currency: string
          features: any // JSONB
          resume_download_price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          plan_type: "free" | "premium" | "professional" | "corporate"
          price_monthly?: number
          price_yearly?: number | null
          currency?: string
          features: any
          resume_download_price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan_type?: "free" | "premium" | "professional" | "corporate"
          price_monthly?: number
          price_yearly?: number | null
          currency?: string
          features?: any
          resume_download_price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: "active" | "canceled" | "past_due" | "trialing" | "incomplete"
          current_period_start: string
          current_period_end: string
          trial_start: string | null
          trial_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          paystack_subscription_id: string | null
          paystack_customer_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status: "active" | "canceled" | "past_due" | "trialing" | "incomplete"
          current_period_start: string
          current_period_end: string
          trial_start?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          paystack_subscription_id?: string | null
          paystack_customer_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: "active" | "canceled" | "past_due" | "trialing" | "incomplete"
          current_period_start?: string
          current_period_end?: string
          trial_start?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          paystack_subscription_id?: string | null
          paystack_customer_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          paystack_transaction_id: string
          paystack_reference: string | null
          payment_type: "subscription" | "resume_download" | "upgrade"
          amount: number
          currency: string
          status: "pending" | "success" | "failed" | "abandoned" | "cancelled"
          payment_method: string | null
          description: string | null
          metadata: any | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          paystack_transaction_id: string
          paystack_reference?: string | null
          payment_type: "subscription" | "resume_download" | "upgrade"
          amount: number
          currency?: string
          status: "pending" | "success" | "failed" | "abandoned" | "cancelled"
          payment_method?: string | null
          description?: string | null
          metadata?: any | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          paystack_transaction_id?: string
          paystack_reference?: string | null
          payment_type?: "subscription" | "resume_download" | "upgrade"
          amount?: number
          currency?: string
          status?: "pending" | "success" | "failed" | "abandoned" | "cancelled"
          payment_method?: string | null
          description?: string | null
          metadata?: any | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      resume_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: "modern" | "classic" | "creative" | "executive" | "minimal" | "professional"
          template_config: any // JSONB - This is the correct field name
          preview_image_url: string | null
          thumbnail_url: string | null
          css_styles: string | null
          is_premium: boolean
          is_active: boolean
          download_count: number
          rating: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: "modern" | "classic" | "creative" | "executive" | "minimal" | "professional"
          template_config: any
          preview_image_url?: string | null
          thumbnail_url?: string | null
          css_styles?: string | null
          is_premium?: boolean
          is_active?: boolean
          download_count?: number
          rating?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: "modern" | "classic" | "creative" | "executive" | "minimal" | "professional"
          template_config?: any
          preview_image_url?: string | null
          thumbnail_url?: string | null
          css_styles?: string | null
          is_premium?: boolean
          is_active?: boolean
          download_count?: number
          rating?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          template_id: string | null
          title: string
          resume_data: any // JSONB
          file_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id?: string | null
          title: string
          resume_data: any
          file_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string | null
          title?: string
          resume_data?: any
          file_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      cover_letters: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          job_title: string | null
          company_name: string | null
          job_posting_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          job_title?: string | null
          company_name?: string | null
          job_posting_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          job_title?: string | null
          company_name?: string | null
          job_posting_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_postings: {
        Row: {
          id: string
          posted_by: string | null
          company_name: string
          company_logo_url: string | null
          job_title: string
          description: string
          requirements: string[] | null
          responsibilities: string[] | null
          location: string | null
          salary_range: string | null
          salary_min: number | null
          salary_max: number | null
          currency: string
          job_type: "full-time" | "part-time" | "contract" | "remote" | "hybrid"
          experience_level: "entry" | "mid" | "senior" | "executive"
          industry: string | null
          skills_required: string[] | null
          is_private: boolean
          is_featured: boolean
          is_active: boolean
          application_deadline: string | null
          external_url: string | null
          application_email: string | null
          application_instructions: string | null
          view_count: number
          application_count: number
          posted_date: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          posted_by?: string | null
          company_name: string
          company_logo_url?: string | null
          job_title: string
          description: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          location?: string | null
          salary_range?: string | null
          salary_min?: number | null
          salary_max?: number | null
          currency?: string
          job_type: "full-time" | "part-time" | "contract" | "remote" | "hybrid"
          experience_level: "entry" | "mid" | "senior" | "executive"
          industry?: string | null
          skills_required?: string[] | null
          is_private?: boolean
          is_featured?: boolean
          is_active?: boolean
          application_deadline?: string | null
          external_url?: string | null
          application_email?: string | null
          application_instructions?: string | null
          view_count?: number
          application_count?: number
          posted_date?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          posted_by?: string | null
          company_name?: string
          company_logo_url?: string | null
          job_title?: string
          description?: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          location?: string | null
          salary_range?: string | null
          salary_min?: number | null
          salary_max?: number | null
          currency?: string
          job_type?: "full-time" | "part-time" | "contract" | "remote" | "hybrid"
          experience_level?: "entry" | "mid" | "senior" | "executive"
          industry?: string | null
          skills_required?: string[] | null
          is_private?: boolean
          is_featured?: boolean
          is_active?: boolean
          application_deadline?: string | null
          external_url?: string | null
          application_email?: string | null
          application_instructions?: string | null
          view_count?: number
          application_count?: number
          posted_date?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          user_id: string
          job_posting_id: string | null
          company_name: string
          job_title: string
          job_url: string | null
          status: "applied" | "interview" | "rejected" | "offer" | "accepted"
          application_date: string
          deadline: string | null
          notes: string | null
          resume_id: string | null
          cover_letter_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_posting_id?: string | null
          company_name: string
          job_title: string
          job_url?: string | null
          status?: "applied" | "interview" | "rejected" | "offer" | "accepted"
          application_date?: string
          deadline?: string | null
          notes?: string | null
          resume_id?: string | null
          cover_letter_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_posting_id?: string | null
          company_name?: string
          job_title?: string
          job_url?: string | null
          status?: "applied" | "interview" | "rejected" | "offer" | "accepted"
          application_date?: string
          deadline?: string | null
          notes?: string | null
          resume_id?: string | null
          cover_letter_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      external_jobs: {
        Row: {
          id: string
          external_id: string
          title: string
          company: string
          description: string
          location: string
          job_type: string
          salary: string
          experience_level: string
          skills: string[]
          requirements: string[]
          posted_date: string
          application_url: string
          company_logo: string
          source: string
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          external_id: string
          title: string
          company: string
          description: string
          location: string
          job_type: string
          salary: string
          experience_level: string
          skills?: string[]
          requirements?: string[]
          posted_date: string
          application_url: string
          company_logo?: string
          source: string
          category?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          external_id?: string
          title?: string
          company?: string
          description?: string
          location?: string
          job_type?: string
          salary?: string
          experience_level?: string
          skills?: string[]
          requirements?: string[]
          posted_date?: string
          application_url?: string
          company_logo?: string
          source?: string
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      career_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          target_position: string | null
          target_company: string | null
          target_salary: number | null
          target_location: string | null
          deadline: string | null
          status: "active" | "completed" | "paused" | "cancelled"
          progress_percentage: number
          milestones: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          target_position?: string | null
          target_company?: string | null
          target_salary?: number | null
          target_location?: string | null
          deadline?: string | null
          status?: "active" | "completed" | "paused" | "cancelled"
          progress_percentage?: number
          milestones?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_position?: string | null
          target_company?: string | null
          target_salary?: number | null
          target_location?: string | null
          deadline?: string | null
          status?: "active" | "completed" | "paused" | "cancelled"
          progress_percentage?: number
          milestones?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      community_posts: {
        Row: {
          id: string
          posted_by: string | null
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
        Insert: {
          id?: string
          posted_by?: string | null
          post_type: "announcement" | "update" | "tip" | "success_story" | "maintenance"
          title: string
          content: string
          is_pinned?: boolean
          is_active?: boolean
          target_audience?: string[]
          read_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          posted_by?: string | null
          post_type?: "announcement" | "update" | "tip" | "success_story" | "maintenance"
          title?: string
          content?: string
          is_pinned?: boolean
          is_active?: boolean
          target_audience?: string[]
          read_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          notification_type: "system" | "payment" | "download" | "community" | "job_alert" | "subscription"
          title: string
          message: string
          action_url: string | null
          is_read: boolean
          is_important: boolean
          metadata: any | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: "system" | "payment" | "download" | "community" | "job_alert" | "subscription"
          title: string
          message: string
          action_url?: string | null
          is_read?: boolean
          is_important?: boolean
          metadata?: any | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: "system" | "payment" | "download" | "community" | "job_alert" | "subscription"
          title?: string
          message?: string
          action_url?: string | null
          is_read?: boolean
          is_important?: boolean
          metadata?: any | null
          expires_at?: string | null
          created_at?: string
        }
      }
      user_activities: {
        Row: {
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
          metadata: any | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
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
          metadata?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?:
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
          description?: string
          metadata?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          month_year: string
          cover_letters_generated: number
          resumes_generated: number
          resumes_downloaded: number
          ats_optimizations_used: number
          interview_sessions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          cover_letters_generated?: number
          resumes_generated?: number
          resumes_downloaded?: number
          ats_optimizations_used?: number
          interview_sessions?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month_year?: string
          cover_letters_generated?: number
          resumes_generated?: number
          resumes_downloaded?: number
          ats_optimizations_used?: number
          interview_sessions?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_usage: {
        Args: {
          p_user_id: string
          p_month_year: string
          p_feature: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
