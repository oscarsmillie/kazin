"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  MessageSquare,
  Brain,
  Briefcase,
  Search,
  Lock,
  Mail,
  Crown,
  RefreshCw,
  Clock,
  Activity,
  ExternalLink,
  AlertTriangle,
  Star,
  TrendingUp,
  Calendar,
  Target,
  MapPin,
  Flame,
} from "lucide-react"
import Link from "next/link"
import CareerGoals from "@/components/career-goals"
import { useRouter } from "next/navigation"
import { useUsageTracking } from "@/hooks/use-usage-tracking"
import { supabase } from "@/lib/supabase"
import CareerSnapshot from "@/components/career-snapshot"
import AiTipOfDay from "@/components/ai-tip-of-day"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DashboardStats {
  resumes: number
  coverLetters: number
  applications: number
  interviews: number
  emails: number
}

interface UserActivity {
  id: string
  activity_type: string
  description: string
  created_at: string
  metadata?: any
}

interface CommunityPost {
  id: string
  title: string
  content: string
  post_type: string
  is_pinned: boolean
  created_at: string
  external_link?: string
}

interface JobApplication {
  id: string
  job_title: string
  company_name: string
  status: string
  application_date: string
  job_url?: string
}

interface JobPosting {
  id: string
  job_title: string
  company_name: string
  location?: string
  job_type: string
  created_at: string
  skills_required?: string[]
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { usage, subscription, loading: usageLoading, refreshUsage } = useUsageTracking()

  const [stats, setStats] = useState<DashboardStats>({
    resumes: 0,
    coverLetters: 0,
    applications: 0,
    interviews: 0,
    emails: 0,
  })
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([])
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([])
  const [recentJobs, setRecentJobs] = useState<JobPosting[]>([])
  const [aiRecommendedJobs, setAiRecommendedJobs] = useState<JobPosting[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
    }
  }, [user, authLoading, router])

  // Memoized features to prevent re-renders
  const features = useMemo(
    () => [
      {
        id: 1,
        title: "Resume Builder",
        description: "Create professional, ATS-optimized resumes",
        icon: FileText,
        route: "/resume-builder/templates",
        isPremium: false,
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
        borderColor: "border-blue-200",
        buttonText: "Craft My Future",
      },
      {
        id: 2,
        title: "Email & Cover Letter Generator",
        description: "AI-powered emails and cover letters for any situation",
        icon: Mail,
        route: "/email-cover-letter",
        isPremium: false,
        bgColor: "bg-green-50",
        iconColor: "text-green-600",
        borderColor: "border-green-200",
        buttonText: "Write Like a Pro",
      },
      {
        id: 3,
        title: "AI Career Coach",
        description: "Get personalized career guidance and professional development advice",
        icon: Brain,
        route: "/career-coach",
        isPremium: true,
        bgColor: "bg-purple-50",
        iconColor: "text-purple-600",
        borderColor: "border-purple-200",
        buttonText: "Get Career Wisdom",
      },
      {
        id: 4,
        title: "Job Applications",
        description: "Track and manage your job applications",
        icon: Briefcase,
        route: "/applications",
        isPremium: false,
        bgColor: "bg-orange-50",
        iconColor: "text-orange-600",
        borderColor: "border-orange-200",
        buttonText: "Track My Journey",
      },
      {
        id: 5,
        title: "Job Board",
        description: "Discover exclusive job opportunities",
        icon: Search,
        route: "/jobs",
        isPremium: false,
        bgColor: "bg-indigo-50",
        iconColor: "text-indigo-600",
        borderColor: "border-indigo-200",
        buttonText: "Find Dream Jobs",
      },
      {
        id: 6,
        title: "Interview Prep",
        description: "AI-powered interview practice and feedback",
        icon: MessageSquare,
        route: "/interview-prep",
        isPremium: true,
        bgColor: "bg-pink-50",
        iconColor: "text-pink-600",
        borderColor: "border-pink-200",
        buttonText: "Ace That Interview",
      },
    ],
    [],
  )

  const fetchRecentActivity = useCallback(async () => {
    if (!user?.id) return []

    try {
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error fetching activity:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching activity:", error)
      return []
    }
  }, [user?.id])

  const fetchCommunityPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Error fetching community posts:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching community posts:", error)
      return []
    }
  }, [])

  const fetchJobApplications = useCallback(async () => {
    if (!user?.id) return []

    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("application_date", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Error fetching job applications:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching job applications:", error)
      return []
    }
  }, [user?.id])

  const fetchRecentJobs = useCallback(async () => {
    try {
      const { data: jobsData, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      return jobsData || []
    } catch (error) {
      console.error("Error fetching recent jobs:", error)
      return []
    }
  }, [])

  const fetchUserProfile = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("job_title, skills, location, bio")
        .eq("id", user.id)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (err) {
      console.error("Error fetching user profile:", err)
    }
  }, [user])

  const generateAiRecommendations = useCallback((jobs: JobPosting[], profile: any) => {
    if (!profile || jobs.length === 0) {
      setAiRecommendedJobs([])
      return
    }

    const profileSkills = profile.skills || []
    const profileTitle = profile.job_title?.toLowerCase() || ""
    const profileLocation = profile.location?.toLowerCase() || ""
    const profileBio = profile.bio?.toLowerCase() || ""

    const scoredJobs = jobs.map((job) => {
      let score = 0

      // Match skills
      if (job.skills_required && profileSkills.length > 0) {
        const jobSkillsLower = job.skills_required.map((s: string) => s.toLowerCase())
        const matchedSkills = profileSkills.filter((skill: string) =>
          jobSkillsLower.some((js: string) => js.includes(skill.toLowerCase()) || skill.toLowerCase().includes(js)),
        )
        score += matchedSkills.length * 10
      }

      // Match job title
      if (profileTitle && job.job_title) {
        const titleWords = profileTitle.split(/\s+/)
        titleWords.forEach((word: string) => {
          if (word.length > 2 && job.job_title.toLowerCase().includes(word)) {
            score += 8
          }
        })
      }

      // Match location
      if (profileLocation && job.location) {
        if (job.location.toLowerCase().includes(profileLocation) || job.location.toLowerCase() === "remote") {
          score += 5
        }
      }

      return { job, score }
    })

    const recommended = scoredJobs
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.job)

    setAiRecommendedJobs(recommended)
  }, [])

  const fetchDashboardData = useCallback(
    async (showRefreshing = false) => {
      if (!user) return

      if (showRefreshing) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const [activityData, postsData, applicationsData, jobsData] = await Promise.all([
          fetchRecentActivity(),
          fetchCommunityPosts(),
          fetchJobApplications(),
          fetchRecentJobs(),
        ])

        setRecentActivity(activityData)
        setCommunityPosts(postsData)
        setRecentApplications(applicationsData)
        setRecentJobs(jobsData)

        const { data: profileData } = await supabase
          .from("profiles")
          .select("job_title, skills, location, bio")
          .eq("id", user.id)
          .single()

        if (profileData) {
          setUserProfile(profileData)
          generateAiRecommendations(jobsData, profileData)
        }
      } catch (error) {
        setError("Failed to load dashboard data. Some features may not be available.")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      user,
      usage,
      fetchRecentActivity,
      fetchCommunityPosts,
      fetchJobApplications,
      fetchRecentJobs,
      generateAiRecommendations,
    ],
  )

  useEffect(() => {
    if (authLoading || !user) return
    fetchDashboardData()
  }, [user, authLoading]) // Removed usageLoading

  const handleRefresh = useCallback(() => {
    refreshUsage().then(() => {
      fetchDashboardData(true)
    })
  }, [fetchDashboardData, refreshUsage])

  const canAccessFeature = useCallback(
    (feature: any) => {
      if (!feature.isPremium) return true
      return subscription?.plan_type === "professional"
    },
    [subscription],
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "resume_created":
      case "resume_downloaded":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "cover_letter_created":
      case "cover_letter_downloaded":
        return <FileText className="h-4 w-4 text-green-500" />
      case "email_generated":
        return <Mail className="h-4 w-4 text-purple-500" />
      case "job_applied":
        return <Briefcase className="h-4 w-4 text-orange-500" />
      case "interview_session":
        return <MessageSquare className="h-4 w-4 text-pink-500" />
      case "career_goal_created":
      case "career_goal_completed":
        return <Target className="h-4 w-4 text-indigo-500" />
      case "payment_made":
      case "subscription_upgraded":
        return <Crown className="h-5 w-5 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getPostTypeColor = (postType: string) => {
    switch (postType) {
      case "announcement":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "tip":
        return "bg-green-100 text-green-800 border-green-200"
      case "update":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "event":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "discussion":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPostTypeIcon = (postType: string) => {
    switch (postType) {
      case "announcement":
        return <AlertTriangle className="h-4 w-4" />
      case "tip":
        return <Star className="h-4 w-4" />
      case "update":
        return <TrendingUp className="h-4 w-4" />
      case "event":
        return <Calendar className="h-4 w-4" />
      case "discussion":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const usageData = useMemo(() => {
    if (!usage || !subscription) {
      return []
    }

    const features = [
      {
        key: "cover_letter_generation",
        name: "Cover Letters",
        limit: subscription.plan_type === "professional" ? -1 : 10, // Changed from 20 to 10
      },
      {
        key: "email_generation",
        name: "Emails",
        limit: subscription.plan_type === "professional" ? -1 : 10, // Changed from 20 to 10
      },
      {
        key: "resume_generation",
        name: "Resume Downloads",
        limit: subscription.plan_type === "professional" ? 3 : 0, // Changed from 2 to 3
      },
      {
        key: "ats_checks",
        name: "Job Applications",
        limit: subscription.plan_type === "professional" ? -1 : 10,
      },
    ]

    const displayData = features.map((feature) => {
      const current = usage[feature.key as keyof typeof usage] || 0
      const limit = feature.limit
      const isUnlimited = limit === -1
      const percentage = isUnlimited ? 0 : limit === 0 ? 0 : Math.min((current / limit) * 100, 100)
      const isNearLimit = percentage >= 80
      const isAtLimit = percentage >= 100

      return {
        feature: feature.name,
        current,
        limit,
        percentage: Math.round(percentage),
        isUnlimited,
        isNearLimit,
        isAtLimit,
        planType: subscription.plan_type,
      }
    })

    return displayData
  }, [usage, subscription])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (isLoading || usageLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there"}!
          </h1>
          <p className="text-gray-600 mt-2">Choose a tool to accelerate your job search</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      {/* Career Snapshot and AI Tip of Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CareerSnapshot />
        <AiTipOfDay />
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {features.map((feature) => {
          const hasAccess = canAccessFeature(feature)
          const FeatureIcon = feature.icon

          return (
            <Card
              key={feature.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${feature.borderColor} ${
                hasAccess ? "hover:scale-105 cursor-pointer" : "opacity-75"
              }`}
            >
              {feature.isPremium && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              )}

              <CardHeader className={`${feature.bgColor} rounded-t-lg`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-white`}>
                    <FeatureIcon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <CardDescription className="text-gray-600 mb-4">{feature.description}</CardDescription>

                {hasAccess ? (
                  <Link href={feature.route}>
                    <div className="w-full bg-gray-900 text-white py-2 px-4 rounded-md text-center hover:bg-gray-800 transition-colors">
                      {feature.buttonText}
                    </div>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 text-gray-500 py-2 px-4 rounded-md text-center flex items-center justify-center">
                      <Lock className="h-4 w-4 mr-2" />
                      Upgrade Required
                    </div>
                    <Link href="/pricing">
                      <div className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-center hover:bg-blue-700 transition-colors text-sm">
                        View Plans
                      </div>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity and Job Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest actions and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">{getActivityIcon(activity.activity_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400">Start using the platform to see your activity here</p>
                </div>
              )}
            </div>
            {recentActivity.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Link href="/activity" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  View all activity
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Jobs & Applications
              </CardTitle>
            </div>
            <CardDescription>Track your applications and find new opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="applications" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="applications">My Applications</TabsTrigger>
                <TabsTrigger value="ai-recommended" className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  AI For You
                </TabsTrigger>
              </TabsList>

              <TabsContent value="applications" className="space-y-4">
                {recentApplications.length > 0 ? (
                  recentApplications.map((application) => (
                    <div key={application.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{application.job_title}</h4>
                          <p className="text-sm text-gray-600">{application.company_name}</p>
                        </div>
                        <Badge
                          className={
                            application.status === "applied"
                              ? "bg-blue-100 text-blue-800"
                              : application.status === "interviewing"
                                ? "bg-purple-100 text-purple-800"
                                : application.status === "offered"
                                  ? "bg-green-100 text-green-800"
                                  : application.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                          }
                        >
                          {application.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{formatDate(application.application_date)}</span>
                        {application.job_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(application.job_url, "_blank")}
                            className="text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Job
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No job applications yet</p>
                    <p className="text-sm text-gray-400">Start applying to jobs to track them here</p>
                  </div>
                )}
                {recentApplications.length > 0 && (
                  <div className="pt-2 border-t">
                    <Link
                      href="/applications"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
                    >
                      View all applications
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ai-recommended" className="space-y-4">
                {aiRecommendedJobs.length > 0 ? (
                  <>
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-3 mb-2">
                      <div className="flex items-center gap-2 text-orange-800 text-sm">
                        <Flame className="h-4 w-4" />
                        <span className="font-medium">Matched based on your profile</span>
                      </div>
                    </div>
                    {aiRecommendedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="border border-orange-200 rounded-lg p-4 hover:bg-orange-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1 mb-1">
                              <Flame className="h-3 w-3 text-orange-500" />
                              <span className="text-[10px] font-semibold text-orange-600 uppercase">AI Match</span>
                            </div>
                            <h4 className="font-medium text-gray-900">{job.job_title}</h4>
                            <p className="text-sm text-gray-600">{job.company_name}</p>
                          </div>
                          <Badge variant="outline" className="bg-gray-50">
                            {job.job_type}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location || "Remote"}
                            <span className="mx-2">•</span>
                            {formatDate(job.created_at)}
                          </div>
                          <Link href={`/job-board?id=${job.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs h-7">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </>
                ) : !userProfile?.job_title && !userProfile?.skills?.length ? (
                  <div className="text-center py-8">
                    <Flame className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                    <p className="text-gray-500">Complete your profile for AI recommendations</p>
                    <p className="text-sm text-gray-400 mb-4">Add job title and skills to get personalized matches</p>
                    <Link href="/settings">
                      <Button variant="outline" size="sm" className="border-orange-300 text-orange-600 bg-transparent">
                        Update Profile
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No matching jobs found</p>
                    <p className="text-sm text-gray-400">Check back later for new opportunities</p>
                  </div>
                )}
                {aiRecommendedJobs.length > 0 && (
                  <div className="pt-2 border-t">
                    <Link
                      href="/job-board"
                      className="text-sm text-orange-600 hover:text-orange-800 flex items-center justify-center"
                    >
                      Browse all jobs
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Career Goals - Full Width */}
      <div className="mb-8">
        <CareerGoals showInDashboard={true} />
      </div>

      {/* Usage & Limits This Month */}
      <Card className="mb-8 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
            Usage & Limits This Month
          </CardTitle>
          <CardDescription>Current usage across all features</CardDescription>
        </CardHeader>
        <CardContent>
          {usageData && usageData.length > 0 ? (
            <div className="space-y-6">
              {usageData.map((item) => (
                <div key={item.feature} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{item.feature}</span>
                    <span
                      className={`text-sm font-semibold ${
                        item.isAtLimit ? "text-red-600" : item.isNearLimit ? "text-orange-600" : "text-green-600"
                      }`}
                    >
                      {item.current}/{item.isUnlimited ? "∞" : item.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        item.isAtLimit ? "bg-red-600" : item.isNearLimit ? "bg-orange-500" : "bg-green-500"
                      }`}
                      style={{ width: `${item.isUnlimited ? 0 : Math.min(item.percentage, 100)}%` }}
                    ></div>
                  </div>
                  {item.isAtLimit && (
                    <p className="text-xs text-red-600 font-medium">Limit reached. Upgrade for more.</p>
                  )}
                  {item.isNearLimit && !item.isAtLimit && <p className="text-xs text-orange-600">Approaching limit</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No usage data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Information */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {subscription?.plan_type === "free" ? "Free Plan" : "Professional Plan"}
            </h3>
            {subscription?.plan_type === "free" ? (
              <div>
                <p className="text-gray-600 mb-4">
                  You're on the Free plan. Upgrade to unlock premium features and higher limits.
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>• 10 cover letters per month</p>
                  <p>• 10 emails per month</p>
                  <p>• 10 job applications tracking per month</p>
                  <p>• Ksh 299 per resume download</p>
                  <p>• Access to Public Job Board</p>
                  <p>• Save and Track Career Goals</p>
                </div>
                <Link href="/pricing">
                  <div className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    <Crown className="h-5 w-5 mr-2" />
                    Upgrade to Professional
                  </div>
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">You're on the Professional plan. Enjoy all premium features!</p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>• Unlimited cover letters</p>
                  <p>• Unlimited emails</p>
                  <p>• Unlimited job applications tracking</p>
                  <p>• 3 free resume downloads per month</p>
                  <p>• Access to Public and Private Job Boards</p>
                  <p>• Unlimited Mock interview sessions</p>
                  <p>• Premium templates</p>
                  <p>• Unlimited AI career coaching</p>
                  <p>• Priority support</p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <Crown className="h-4 w-4 mr-1" />
                  Professional Active
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
