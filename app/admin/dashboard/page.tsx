"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import {
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Activity,
  Download,
  Eye,
  UserCheck,
  UserX,
  BarChart,
  PieChart,
  Calendar,
  Mail,
  MapPin,
  Building,
} from "lucide-react"

let debounceTimer: NodeJS.Timeout | null = null
const DEBOUNCE_DELAY = 10000 // 10 seconds

interface JobFormData {
  job_title: string
  company_name: string
  company_website: string
  company_logo_url: string
  location: string
  job_type: string
  experience_level: string
  industry: string
  salary_min: string
  salary_max: string
  currency: string
  description: string
  requirements: string
  responsibilities: string
  skills_required: string
  external_url: string
  application_email: string
  application_instructions: string
  application_deadline: string
  is_premium: boolean
  is_featured: boolean
  expires_at: string
}

interface UserData {
  id: string
  email: string
  full_name: string
  created_at: string
  last_login_at: string
  is_active: boolean
  payment_status: string
  resume_count: number
  application_count: number
  last_activity: string
  usage: {
    cover_letters: number
    emails: number
    resumes_generated: number
    resumes_downloaded: number
    ats_optimizations: number
    interview_sessions: number
    job_applications: number
  }
}

interface Transaction {
  id: string
  user_id: string
  user_email: string
  user_name: string
  amount: number
  currency: string
  status: string
  payment_type: string
  paystack_reference: string
  description: string
  created_at: string
  paid_at: string
}

interface AnalyticsData {
  totalUsers: number
  totalJobs: number
  totalResumes: number
  totalRevenue: number
  totalStudents: number
  newUsersThisMonth: number
  activeUsers: number
  totalDownloads: number
  conversionRate: number
  userGrowth: Array<{ date: string; users: number }>
  jobCategories: Array<{ category: string; count: number }>
  revenueData: Array<{ date: string; revenue: number }>
  totalUsage: {
    cover_letters: number
    emails: number
    resumes_generated: number
    resumes_downloaded: number
    ats_optimizations: number
    interview_sessions: number
    job_applications: number
  }
}

interface SubscriptionAction {
  userId: string
  newPlan: "free" | "professional"
  reason: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalResumes: 0,
    totalRevenue: 0,
    totalStudents: 0,
  })
  const [jobs, setJobs] = useState<any[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [showJobForm, setShowJobForm] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)
  const [formData, setFormData] = useState<JobFormData>({
    job_title: "",
    company_name: "",
    company_website: "",
    company_logo_url: "",
    location: "",
    job_type: "full-time",
    experience_level: "mid",
    industry: "Technology",
    salary_min: "",
    salary_max: "",
    currency: "USD",
    description: "",
    requirements: "",
    responsibilities: "",
    skills_required: "",
    external_url: "",
    application_email: "",
    application_instructions: "",
    application_deadline: "",
    is_premium: false,
    is_featured: false,
    expires_at: "",
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedUserForSub, setSelectedUserForSub] = useState<UserData | null>(null)
  const [subscriptionReason, setSubscriptionReason] = useState("")

  useEffect(() => {
    // Check if user is admin
    if (!user || user.email !== "odimaoscar@gmail.com") {
      router.push("/dashboard")
      return
    }

    loadDashboardData()
  }, [user, router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading dashboard data...")

      const [usersResult, jobsResult, resumesResult, paymentsResult, usageResult] = await Promise.all([
        supabase.from("users").select("id", { count: "exact" }),
        supabase.from("job_postings").select("id", { count: "exact" }),
        supabase.from("resumes").select("id", { count: "exact" }),
        supabase.from("payments").select("amount, user_id").eq("status", "success"),
        supabase.from("usage_tracking").select("*"),
      ])

      console.log("[v0] Users count:", usersResult.count)
      console.log("[v0] Jobs count:", jobsResult.count)
      console.log("[v0] Resumes count:", resumesResult.count)
      console.log("[v0] Payments data:", paymentsResult.data)
      console.log("[v0] Usage tracking data:", usageResult.data)

      const totalRevenue = paymentsResult.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0

      // Calculate unique paying users (students)
      const uniquePayingUsers = new Set(paymentsResult.data?.map((p) => p.user_id) || []).size

      console.log("[v0] Total revenue:", totalRevenue)
      console.log("[v0] Unique paying users:", uniquePayingUsers)

      setStats({
        totalUsers: usersResult.count || 0,
        totalJobs: jobsResult.count || 0,
        totalResumes: resumesResult.count || 0,
        totalRevenue: totalRevenue,
        totalStudents: uniquePayingUsers,
      })

      // Load jobs with all fields
      const { data: jobsData } = await supabase
        .from("job_postings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      setJobs(jobsData || [])

      // Load users data
      await loadUsersData()

      await loadTransactions()

      // Load analytics
      await loadAnalytics()

      console.log("[v0] Dashboard data loaded successfully")
    } catch (error) {
      console.error("[v0] Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const debouncedRefresh = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      console.log("[v0] 🔔 Debounced refresh triggered")
      loadDashboardData()
    }, DEBOUNCE_DELAY)
  }

  useEffect(() => {
    if (!user || user.email !== "odimaoscar@gmail.com") return

    console.log("[v0] Setting up real-time subscriptions...")

    const usersChannel = supabase
      .channel("admin_users_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        () => {
          console.log("[v0] 🔔 Users table updated, scheduling refresh...")
          debouncedRefresh()
        },
      )
      .subscribe()

    const jobsChannel = supabase
      .channel("admin_jobs_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_postings",
        },
        () => {
          console.log("[v0] 🔔 Jobs table updated, scheduling refresh...")
          debouncedRefresh()
        },
      )
      .subscribe()

    const paymentsChannel = supabase
      .channel("admin_payments_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        () => {
          console.log("[v0] 🔔 New payment received, scheduling refresh...")
          debouncedRefresh()
        },
      )
      .subscribe()

    const usageChannel = supabase
      .channel("admin_usage_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "usage_tracking",
        },
        () => {
          console.log("[v0] 🔔 Usage tracking updated, scheduling refresh...")
          debouncedRefresh()
        },
      )
      .subscribe()

    console.log("[v0] Real-time subscriptions set up successfully")

    return () => {
      console.log("[v0] Cleaning up real-time subscriptions...")
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      supabase.removeChannel(usersChannel)
      supabase.removeChannel(jobsChannel)
      supabase.removeChannel(paymentsChannel)
      supabase.removeChannel(usageChannel)
    }
  }, [user])

  const loadUsersData = async () => {
    try {
      console.log("[v0] Loading users data...")
      // Get users with profile data
      const { data: usersData, error } = await supabase
        .from("users")
        .select(`
          id,
          email,
          full_name,
          created_at,
          last_login_at,
          is_active,
          profiles!inner(payment_status)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      console.log("[v0] Users data:", usersData)
      console.log("[v0] Users error:", error)

      if (usersData) {
        const enhancedUsers = await Promise.all(
          usersData.map(async (userData) => {
            const currentMonth = new Date().toISOString().slice(0, 7)

            const [resumeCount, applicationCount, activityData, usageData] = await Promise.all([
              supabase.from("resumes").select("id", { count: "exact" }).eq("user_id", userData.id),
              supabase.from("job_applications").select("id", { count: "exact" }).eq("user_id", userData.id),
              supabase
                .from("user_activities")
                .select("created_at")
                .eq("user_id", userData.id)
                .order("created_at", { ascending: false })
                .limit(1),
              supabase
                .from("usage_tracking")
                .select("*")
                .eq("user_id", userData.id)
                .eq("month_year", currentMonth)
                .single(),
            ])

            return {
              id: userData.id,
              email: userData.email,
              full_name: userData.full_name || "Unknown",
              created_at: userData.created_at,
              last_login_at: userData.last_login_at,
              is_active: userData.is_active,
              payment_status: userData.profiles?.payment_status || "free",
              resume_count: resumeCount.count || 0,
              application_count: applicationCount.count || 0,
              last_activity: activityData.data?.[0]?.created_at || userData.created_at,
              usage: {
                cover_letters: usageData.data?.cover_letters_generated || 0,
                emails: usageData.data?.emails_generated || 0,
                resumes_generated: usageData.data?.resumes_generated || 0,
                resumes_downloaded: usageData.data?.resumes_downloaded || 0,
                ats_optimizations: usageData.data?.ats_optimizations_used || 0,
                interview_sessions: usageData.data?.interview_sessions || 0,
                job_applications: usageData.data?.job_applications || 0,
              },
            }
          }),
        )

        setUsers(enhancedUsers)
        console.log("[v0] Users data loaded:", enhancedUsers.length, "users")
      }
    } catch (error) {
      console.error("[v0] Error loading users data:", error)
    }
  }

  const loadTransactions = async () => {
    try {
      console.log("[v0] Loading transactions...")
      const { data: paymentsData, error } = await supabase
        .from("payments")
        .select(`
          id,
          user_id,
          amount,
          currency,
          status,
          payment_type,
          paystack_reference,
          description,
          created_at,
          paid_at,
          profiles!inner(email, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      console.log("[v0] Transactions data:", paymentsData)
      console.log("[v0] Transactions error:", error)

      if (paymentsData) {
        const formattedTransactions: Transaction[] = paymentsData.map((payment: any) => ({
          id: payment.id,
          user_id: payment.user_id,
          user_email: payment.profiles?.email || "Unknown",
          user_name: payment.profiles?.full_name || "Unknown User",
          amount: payment.amount,
          currency: payment.currency || "USD",
          status: payment.status,
          payment_type: payment.payment_type,
          paystack_reference: payment.paystack_reference || "N/A",
          description: payment.description || "",
          created_at: payment.created_at,
          paid_at: payment.paid_at,
        }))

        setTransactions(formattedTransactions)
        console.log("[v0] Transactions loaded:", formattedTransactions.length, "transactions")
      }
    } catch (error) {
      console.error("[v0] Error loading transactions:", error)
    }
  }

  const loadAnalytics = async () => {
    try {
      // Get current month data
      const currentMonth = new Date().toISOString().slice(0, 7)
      const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)

      const [
        totalUsersResult,
        newUsersResult,
        activeUsersResult,
        totalDownloadsResult,
        jobCategoriesResult,
        revenueResult,
        usageResult,
      ] = await Promise.all([
        supabase.from("users").select("id", { count: "exact" }),
        supabase.from("users").select("id", { count: "exact" }).gte("created_at", `${currentMonth}-01`),
        supabase.from("users").select("id", { count: "exact" }).gte("last_login_at", `${currentMonth}-01`),
        supabase.from("download_history").select("id", { count: "exact" }),
        supabase.from("job_postings").select("industry"),
        supabase.from("payments").select("amount, created_at, user_id").eq("status", "success"),
        supabase.from("usage_tracking").select("*"),
      ])

      // Process job categories
      const jobCategories = jobCategoriesResult.data?.reduce((acc: any, job: any) => {
        const category = job.industry || "Other"
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {})

      const jobCategoriesArray = Object.entries(jobCategories || {}).map(([category, count]) => ({
        category,
        count: count as number,
      }))

      // Process revenue data
      const revenueByMonth = revenueResult.data?.reduce((acc: any, payment: any) => {
        const month = payment.created_at.slice(0, 7)
        acc[month] = (acc[month] || 0) + payment.amount
        return acc
      }, {})

      const revenueData = Object.entries(revenueByMonth || {}).map(([date, revenue]) => ({
        date,
        revenue: revenue as number,
      }))

      // Calculate conversion rate (users who made a payment / total users)
      const uniquePaidUsers = new Set(revenueResult.data?.map((p) => p.user_id) || []).size
      const conversionRate = totalUsersResult.count ? (uniquePaidUsers / totalUsersResult.count) * 100 : 0

      // Generate user growth data (last 6 months)
      const userGrowth = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStr = date.toISOString().slice(0, 7)

        const { count } = await supabase
          .from("users")
          .select("id", { count: "exact" })
          .lte("created_at", `${monthStr}-31`)

        userGrowth.push({
          date: monthStr,
          users: count || 0,
        })
      }

      const totalUsage = usageResult.data?.reduce(
        (acc, usage) => ({
          cover_letters: acc.cover_letters + (usage.cover_letters_generated || 0),
          emails: acc.emails + (usage.emails_generated || 0),
          resumes_generated: acc.resumes_generated + (usage.resumes_generated || 0),
          resumes_downloaded: acc.resumes_downloaded + (usage.resumes_downloaded || 0),
          ats_optimizations: acc.ats_optimizations + (usage.ats_optimizations_used || 0),
          interview_sessions: acc.interview_sessions + (usage.interview_sessions || 0),
          job_applications: acc.job_applications + (usage.job_applications || 0),
        }),
        {
          cover_letters: 0,
          emails: 0,
          resumes_generated: 0,
          resumes_downloaded: 0,
          ats_optimizations: 0,
          interview_sessions: 0,
          job_applications: 0,
        },
      ) || {
        cover_letters: 0,
        emails: 0,
        resumes_generated: 0,
        resumes_downloaded: 0,
        ats_optimizations: 0,
        interview_sessions: 0,
        job_applications: 0,
      }

      setAnalytics({
        totalUsers: totalUsersResult.count || 0,
        totalJobs: jobs.length,
        totalResumes: stats.totalResumes,
        totalRevenue: stats.totalRevenue,
        totalStudents: stats.totalStudents,
        newUsersThisMonth: newUsersResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
        totalDownloads: totalDownloadsResult.count || 0,
        conversionRate: conversionRate,
        userGrowth,
        jobCategories: jobCategoriesArray,
        revenueData,
        totalUsage,
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
    }
  }

  const handleUserStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("users").update({ is_active: !currentStatus }).eq("id", userId)

      if (error) throw error

      setMessage({
        type: "success",
        text: `User ${!currentStatus ? "activated" : "deactivated"} successfully!`,
      })

      // Refresh users data
      await loadUsersData()

      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update user status" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const resetForm = () => {
    setFormData({
      job_title: "",
      company_name: "",
      company_website: "",
      company_logo_url: "",
      location: "",
      job_type: "full-time",
      experience_level: "mid",
      industry: "Technology",
      salary_min: "",
      salary_max: "",
      currency: "USD",
      description: "",
      requirements: "",
      responsibilities: "",
      skills_required: "",
      external_url: "",
      application_email: "",
      application_instructions: "",
      application_deadline: "",
      is_premium: false,
      is_featured: false,
      expires_at: "",
    })
    setShowJobForm(false)
    setEditingJob(null)
  }

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Prepare job data with all fields properly mapped
      const jobData = {
        job_title: formData.job_title.trim(),
        company_name: formData.company_name.trim(),
        company_website: formData.company_website.trim() || null,
        company_logo_url: formData.company_logo_url.trim() || null,
        location: formData.location.trim(),
        job_type: formData.job_type,
        experience_level: formData.experience_level,
        industry: formData.industry,
        salary_min: formData.salary_min ? Number.parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? Number.parseInt(formData.salary_max) : null,
        salary_range:
          formData.salary_min && formData.salary_max
            ? `${formData.currency}${formData.salary_min} - ${formData.currency}${formData.salary_max}`
            : null,
        currency: formData.currency,
        description: formData.description.trim(),
        requirements: formData.requirements
          .split("\n")
          .map((req) => req.trim())
          .filter((req) => req),
        responsibilities: formData.responsibilities
          .split("\n")
          .map((resp) => resp.trim())
          .filter((resp) => resp),
        skills_required: formData.skills_required
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill),
        external_url: formData.external_url.trim() || null,
        application_email: formData.application_email.trim() || null,
        application_instructions: formData.application_instructions.trim() || null,
        application_deadline: formData.application_deadline
          ? new Date(formData.application_deadline).toISOString()
          : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        is_premium: formData.is_premium,
        is_featured: formData.is_featured,
        is_active: true,
        posted_by: user?.id,
        posted_date: new Date().toISOString(),
        view_count: 0,
        application_count: 0,
      }

      if (editingJob) {
        const { error } = await supabase.from("job_postings").update(jobData).eq("id", editingJob.id)

        if (error) throw error
        setMessage({ type: "success", text: "Job updated successfully!" })
      } else {
        const { error } = await supabase.from("job_postings").insert([jobData])

        if (error) throw error
        setMessage({ type: "success", text: "Job posted successfully!" })
      }

      resetForm()
      loadDashboardData()

      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error("Job submission error:", error)
      setMessage({ type: "error", text: error.message || "Failed to save job" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleEditJob = (job: any) => {
    setEditingJob(job)
    setFormData({
      job_title: job.job_title || "",
      company_name: job.company_name || "",
      company_website: job.company_website || "",
      company_logo_url: job.company_logo_url || "",
      location: job.location || "",
      job_type: job.job_type || "full-time",
      experience_level: job.experience_level || "mid",
      industry: job.industry || "Technology",
      salary_min: job.salary_min?.toString() || "",
      salary_max: job.salary_max?.toString() || "",
      currency: job.currency || "USD",
      description: job.description || "",
      requirements: Array.isArray(job.requirements) ? job.requirements.join("\n") : "",
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join("\n") : "",
      skills_required: Array.isArray(job.skills_required) ? job.skills_required.join(", ") : "",
      external_url: job.external_url || "",
      application_email: job.application_email || "",
      application_instructions: job.application_instructions || "",
      application_deadline: job.application_deadline ? job.application_deadline.split("T")[0] : "",
      expires_at: job.expires_at ? job.expires_at.split("T")[0] : "",
      is_premium: job.is_premium || false,
      is_featured: job.is_featured || false,
    })
    setShowJobForm(true)
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return

    try {
      const { error } = await supabase.from("job_postings").delete().eq("id", jobId)

      if (error) throw error

      setMessage({ type: "success", text: "Job deleted successfully!" })
      loadDashboardData()
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to delete job" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "success":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const handleUpdateSubscription = async (userId: string, newPlan: "free" | "professional", reason: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          payment_status: newPlan,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw error

      // Log the action
      await supabase.from("admin_audit_log").insert([
        {
          admin_id: user?.id,
          admin_email: user?.email,
          action: "update_subscription",
          target_user_id: userId,
          details: {
            new_plan: newPlan,
            reason: reason,
          },
          created_at: new Date().toISOString(),
        },
      ])

      setMessage({
        type: "success",
        text: `User subscription updated to ${newPlan} successfully!`,
      })

      await loadUsersData()
      setShowSubscriptionModal(false)
      setSelectedUserForSub(null)
      setSubscriptionReason("")

      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update subscription" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleExportUsers = async () => {
    try {
      const csvContent = [
        ["Name", "Email", "Plan", "Joined", "Active", "Resumes", "Applications"].join(","),
        ...users.map((user) =>
          [
            user.full_name,
            user.email,
            user.payment_status,
            formatDate(user.created_at),
            user.is_active ? "Yes" : "No",
            user.resume_count,
            user.application_count,
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      setMessage({ type: "success", text: "Users exported successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: "Failed to export users" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleExportTransactions = async () => {
    try {
      const csvContent = [
        ["User", "Email", "Amount", "Currency", "Status", "Type", "Reference", "Date"].join(","),
        ...transactions.map((t) =>
          [
            t.user_name,
            t.user_email,
            t.amount,
            t.currency,
            t.status,
            t.payment_type,
            t.paystack_reference,
            formatDateTime(t.created_at),
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      setMessage({ type: "success", text: "Transactions exported successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: "Failed to export transactions" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to permanently delete user ${userEmail}? This action cannot be undone.`)) {
      return
    }

    try {
      // Delete user's related data first
      await Promise.all([
        supabase.from("resumes").delete().eq("user_id", userId),
        supabase.from("job_applications").delete().eq("user_id", userId),
        supabase.from("usage_tracking").delete().eq("user_id", userId),
        supabase.from("download_history").delete().eq("user_id", userId),
        supabase.from("payments").delete().eq("user_id", userId),
        supabase.from("profiles").delete().eq("id", userId),
      ])

      // Finally delete the user
      const { error } = await supabase.from("users").delete().eq("id", userId)

      if (error) throw error

      // Log the action
      await supabase.from("admin_audit_log").insert([
        {
          admin_id: user?.id,
          admin_email: user?.email,
          action: "delete_user",
          target_user_id: userId,
          details: {
            user_email: userEmail,
          },
          created_at: new Date().toISOString(),
        },
      ])

      setMessage({ type: "success", text: "User deleted successfully!" })
      await loadUsersData()
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to delete user" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users, jobs, and platform analytics</p>
      </div>

      {message && (
        <Alert
          className={`mb-6 ${message.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            {analytics && <p className="text-xs text-muted-foreground">+{analytics.newUsersThisMonth} this month</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Paying users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">{jobs.filter((j) => j.is_active).length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            {analytics && (
              <p className="text-xs text-muted-foreground">{analytics.conversionRate.toFixed(1)}% conversion rate</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="jobs">Job Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="usage">Usage Tracking</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Job Management</h2>
              <Button onClick={() => setShowJobForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
            </div>

            {showJobForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingJob ? "Edit Job" : "Post New Job"}</CardTitle>
                  <CardDescription>
                    Fill in all job details below. All fields marked with * are required.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitJob} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Basic Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="job_title">Job Title *</Label>
                          <Input
                            id="job_title"
                            name="job_title"
                            value={formData.job_title}
                            onChange={handleInputChange}
                            placeholder="e.g. Senior Software Engineer"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="company_name">Company Name *</Label>
                          <Input
                            id="company_name"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleInputChange}
                            placeholder="e.g. TechCorp Kenya"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company_website">Company Website</Label>
                          <Input
                            id="company_website"
                            name="company_website"
                            value={formData.company_website}
                            onChange={handleInputChange}
                            placeholder="https://company.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="company_logo_url">Company Logo URL</Label>
                          <Input
                            id="company_logo_url"
                            name="company_logo_url"
                            value={formData.company_logo_url}
                            onChange={handleInputChange}
                            placeholder="https://company.com/logo.png"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Job Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="location">Location *</Label>
                          <Input
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="e.g. Nairobi, Kenya"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="job_type">Job Type *</Label>
                          <Select
                            value={formData.job_type}
                            onValueChange={(value) => handleSelectChange("job_type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full-time">Full Time</SelectItem>
                              <SelectItem value="part-time">Part Time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="remote">Remote</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="experience_level">Experience Level *</Label>
                          <Select
                            value={formData.experience_level}
                            onValueChange={(value) => handleSelectChange("experience_level", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="entry">Entry Level</SelectItem>
                              <SelectItem value="mid">Mid Level</SelectItem>
                              <SelectItem value="senior">Senior Level</SelectItem>
                              <SelectItem value="executive">Executive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="industry">Industry *</Label>
                          <Select
                            value={formData.industry}
                            onValueChange={(value) => handleSelectChange("industry", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Technology">Technology</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                              <SelectItem value="Healthcare">Healthcare</SelectItem>
                              <SelectItem value="Education">Education</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="Engineering">Engineering</SelectItem>
                              <SelectItem value="Design">Design</SelectItem>
                              <SelectItem value="Operations">Operations</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="currency">Currency</Label>
                          <Select
                            value={formData.currency}
                            onValueChange={(value) => handleSelectChange("currency", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="KES">KES (KSh)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="salary_min">Minimum Salary</Label>
                          <Input
                            id="salary_min"
                            name="salary_min"
                            type="number"
                            value={formData.salary_min}
                            onChange={handleInputChange}
                            placeholder="50000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="salary_max">Maximum Salary</Label>
                          <Input
                            id="salary_max"
                            name="salary_max"
                            type="number"
                            value={formData.salary_max}
                            onChange={handleInputChange}
                            placeholder="80000"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Job Content */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Job Content
                      </h3>

                      <div>
                        <Label htmlFor="description">Job Description *</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="Describe the role, company culture, and what makes this opportunity exciting..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="requirements">Requirements (one per line)</Label>
                          <Textarea
                            id="requirements"
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Bachelor's degree in Computer Science&#10;3+ years of experience&#10;Strong communication skills"
                          />
                        </div>
                        <div>
                          <Label htmlFor="responsibilities">Responsibilities (one per line)</Label>
                          <Textarea
                            id="responsibilities"
                            name="responsibilities"
                            value={formData.responsibilities}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Develop web applications&#10;Collaborate with team members&#10;Write clean, maintainable code"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="skills_required">Required Skills (comma-separated)</Label>
                        <Input
                          id="skills_required"
                          name="skills_required"
                          value={formData.skills_required}
                          onChange={handleInputChange}
                          placeholder="JavaScript, React, Node.js, Python, AWS"
                        />
                      </div>
                    </div>

                    {/* Application Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Application Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="external_url">Application URL</Label>
                          <Input
                            id="external_url"
                            name="external_url"
                            value={formData.external_url}
                            onChange={handleInputChange}
                            placeholder="https://company.com/apply"
                          />
                        </div>
                        <div>
                          <Label htmlFor="application_email">Application Email</Label>
                          <Input
                            id="application_email"
                            name="application_email"
                            type="email"
                            value={formData.application_email}
                            onChange={handleInputChange}
                            placeholder="jobs@company.com"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="application_instructions">Application Instructions</Label>
                        <Textarea
                          id="application_instructions"
                          name="application_instructions"
                          value={formData.application_instructions}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Please include your portfolio and cover letter..."
                        />
                      </div>
                    </div>

                    {/* Dates and Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Dates & Settings
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="application_deadline">Application Deadline</Label>
                          <Input
                            id="application_deadline"
                            name="application_deadline"
                            type="date"
                            value={formData.application_deadline}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="expires_at">Job Expires At</Label>
                          <Input
                            id="expires_at"
                            name="expires_at"
                            type="date"
                            value={formData.expires_at}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_premium"
                            checked={formData.is_premium}
                            onCheckedChange={(checked) => handleCheckboxChange("is_premium", checked as boolean)}
                          />
                          <Label htmlFor="is_premium">Premium Job (Professional users only)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_featured"
                            checked={formData.is_featured}
                            onCheckedChange={(checked) => handleCheckboxChange("is_featured", checked as boolean)}
                          />
                          <Label htmlFor="is_featured">Featured Job</Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingJob ? "Update Job" : "Post Job"}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm} className="flex-1 bg-transparent">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Jobs List */}
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{job.job_title}</h3>
                          <Badge variant={job.is_active ? "default" : "secondary"}>
                            {job.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {job.is_premium && <Badge variant="outline">Premium</Badge>}
                          {job.is_featured && <Badge variant="outline">Featured</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {job.company_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {job.job_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {job.experience_level} • {job.industry} •{" "}
                          {job.salary_min && job.salary_max
                            ? `${job.currency || "USD"}${job.salary_min.toLocaleString()} - ${job.currency || "USD"}${job.salary_max.toLocaleString()}`
                            : "Salary not specified"}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {job.view_count || 0} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {job.application_count || 0} applications
                          </span>
                          <span>Posted {formatDate(job.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => handleEditJob(job)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteJob(job.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportUsers}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Users
                </Button>
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {users.length} users
                </Badge>
                <Badge variant="outline">
                  <UserCheck className="h-3 w-3 mr-1" />
                  {users.filter((u) => u.payment_status === "professional").length} professional
                </Badge>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Overview</CardTitle>
                <CardDescription>Manage platform users and their access levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Resumes</TableHead>
                        <TableHead>Applications</TableHead>
                        <TableHead>Cover Letters</TableHead>
                        <TableHead>Emails</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.id.slice(0, 8)}...</div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.payment_status === "professional" ? "default" : "secondary"}>
                              {user.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.last_login_at ? formatDate(user.last_login_at) : "Never"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {user.resume_count}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {user.application_count}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{user.usage.cover_letters}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{user.usage.emails}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? "default" : "destructive"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUserStatusToggle(user.id, user.is_active)}
                                title={user.is_active ? "Deactivate user" : "Activate user"}
                              >
                                {user.is_active ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUserForSub(user)
                                  setShowSubscriptionModal(true)
                                }}
                                title="Change subscription"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                title="Delete user"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Transaction History</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportTransactions}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Transactions
                </Button>
                <Badge variant="outline">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {formatCurrency(stats.totalRevenue)} total
                </Badge>
                <Badge variant="outline">
                  <UserCheck className="h-3 w-3 mr-1" />
                  {stats.totalStudents} paying users
                </Badge>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>All payment transactions on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Paid At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.user_name}</div>
                                <div className="text-sm text-gray-500">{transaction.user_email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.payment_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                              <div className="text-xs text-gray-500">{transaction.currency}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(transaction.status)}>{transaction.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-mono">{transaction.paystack_reference}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{formatDateTime(transaction.created_at)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {transaction.paid_at ? formatDateTime(transaction.paid_at) : "N/A"}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Usage Tracking</h2>
              <Badge variant="outline">
                <Activity className="h-3 w-3 mr-1" />
                Real-time updates
              </Badge>
            </div>

            {/* Total Usage Stats */}
            {analytics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Cover Letters</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalUsage.cover_letters}</div>
                      <p className="text-xs text-muted-foreground">Total generated</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Emails</CardTitle>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalUsage.emails}</div>
                      <p className="text-xs text-muted-foreground">Total generated</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Resumes Downloaded</CardTitle>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalUsage.resumes_downloaded}</div>
                      <p className="text-xs text-muted-foreground">Total downloads</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Interview Sessions</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalUsage.interview_sessions}</div>
                      <p className="text-xs text-muted-foreground">Total sessions</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Resumes Generated</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalUsage.resumes_generated}</div>
                      <p className="text-xs text-muted-foreground">Total created</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">ATS Optimizations</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalUsage.ats_optimizations}</div>
                      <p className="text-xs text-muted-foreground">Total optimizations</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Job Applications</CardTitle>
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalUsage.job_applications}</div>
                      <p className="text-xs text-muted-foreground">Total tracked</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Individual User Usage */}
            <Card>
              <CardHeader>
                <CardTitle>User Usage Details</CardTitle>
                <CardDescription>Detailed usage breakdown by user (current month)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Cover Letters</TableHead>
                        <TableHead>Emails</TableHead>
                        <TableHead>Resumes Gen.</TableHead>
                        <TableHead>Resumes DL</TableHead>
                        <TableHead>ATS Opt.</TableHead>
                        <TableHead>Interviews</TableHead>
                        <TableHead>Applications</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                            No usage data found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.full_name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.payment_status === "professional" ? "default" : "secondary"}>
                                {user.payment_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-center font-medium">{user.usage.cover_letters}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center font-medium">{user.usage.emails}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center font-medium">{user.usage.resumes_generated}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center font-medium">{user.usage.resumes_downloaded}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center font-medium">{user.usage.ats_optimizations}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center font-medium">{user.usage.interview_sessions}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center font-medium">{user.usage.job_applications}</div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Platform Analytics</h2>
              <div className="flex gap-2">
                <Badge variant="outline">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {analytics?.conversionRate.toFixed(1)}% conversion
                </Badge>
                <Badge variant="outline">
                  <Activity className="h-3 w-3 mr-1" />
                  {analytics?.activeUsers} active users
                </Badge>
              </div>
            </div>

            {analytics && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">New Users</p>
                          <p className="text-2xl font-bold">{analytics.newUsersThisMonth}</p>
                          <p className="text-xs text-gray-500">This month</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">Active Users</p>
                          <p className="text-2xl font-bold">{analytics.activeUsers}</p>
                          <p className="text-xs text-gray-500">This month</p>
                        </div>
                        <Activity className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">Downloads</p>
                          <p className="text-2xl font-bold">{analytics.totalDownloads}</p>
                          <p className="text-xs text-gray-500">All time</p>
                        </div>
                        <Download className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                          <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
                          <p className="text-xs text-gray-500">Users to paid</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* User Growth Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-4 w-4" />
                        User Growth (Last 6 Months)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.userGrowth.map((item, index) => (
                          <div key={item.date} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{item.date}</span>
                            <div className="flex items-center gap-2">
                              <div
                                className="bg-blue-500 h-2 rounded"
                                style={{
                                  width: `${(item.users / Math.max(...analytics.userGrowth.map((u) => u.users))) * 100}px`,
                                }}
                              />
                              <span className="text-sm font-medium">{item.users}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Job Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Job Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.jobCategories.slice(0, 8).map((category, index) => (
                          <div key={category.category} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{category.category}</span>
                            <div className="flex items-center gap-2">
                              <div
                                className="bg-green-500 h-2 rounded"
                                style={{
                                  width: `${(category.count / Math.max(...analytics.jobCategories.map((c) => c.count))) * 100}px`,
                                }}
                              />
                              <span className="text-sm font-medium">{category.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Analytics */}
                {analytics.revenueData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Revenue Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {analytics.revenueData.slice(-12).map((item) => (
                          <div key={item.date} className="text-center p-3 border rounded">
                            <div className="text-sm text-gray-600">{item.date}</div>
                            <div className="text-lg font-bold">{formatCurrency(item.revenue)}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showSubscriptionModal && selectedUserForSub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Update Subscription</CardTitle>
              <CardDescription>
                Update subscription for {selectedUserForSub.full_name} ({selectedUserForSub.email})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Plan</Label>
                <div className="mt-2">
                  <Badge variant={selectedUserForSub.payment_status === "professional" ? "default" : "secondary"}>
                    {selectedUserForSub.payment_status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label htmlFor="newPlan">New Plan</Label>
                <Select
                  value={selectedUserForSub.payment_status}
                  onValueChange={(value) =>
                    setSelectedUserForSub({
                      ...selectedUserForSub,
                      payment_status: value as "free" | "professional",
                    })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason">Reason for Change</Label>
                <Textarea
                  id="reason"
                  value={subscriptionReason}
                  onChange={(e) => setSubscriptionReason(e.target.value)}
                  placeholder="Enter reason for subscription change..."
                  rows={3}
                  className="mt-2"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() =>
                    handleUpdateSubscription(
                      selectedUserForSub.id,
                      selectedUserForSub.payment_status as "free" | "professional",
                      subscriptionReason,
                    )
                  }
                  className="flex-1"
                  disabled={!subscriptionReason.trim()}
                >
                  Update Subscription
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSubscriptionModal(false)
                    setSelectedUserForSub(null)
                    setSubscriptionReason("")
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
