"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, FileText, Briefcase, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface SnapshotData {
  resumeOptimization: number
  weeklyApplications: number
  profileViews: number
  lastActivity: string
}

export default function CareerSnapshot() {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<SnapshotData>({
    resumeOptimization: 0,
    weeklyApplications: 0,
    profileViews: 0,
    lastActivity: "No recent activity",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchSnapshotData()
    }
  }, [user?.id])

  const fetchSnapshotData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Get resume count and calculate optimization score
      const { data: resumes } = await supabase
        .from("resumes")
        .select("id, content")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)

      // Calculate resume optimization (based on content completeness)
      let optimization = 0
      if (resumes && resumes.length > 0) {
        const resume = resumes[0]
        const content = resume.content || {}

        // Check for key sections
        const hasPersonalInfo = content.personalInfo && Object.keys(content.personalInfo).length > 0
        const hasWorkExperience = content.workExperience && content.workExperience.length > 0
        const hasEducation = content.education && content.education.length > 0
        const hasSkills = content.skills && content.skills.length > 0

        optimization =
          (hasPersonalInfo ? 25 : 0) + (hasWorkExperience ? 35 : 0) + (hasEducation ? 20 : 0) + (hasSkills ? 20 : 0)
      }

      // Get weekly applications count
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const { count: weeklyApps } = await supabase
        .from("job_applications")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .gte("created_at", oneWeekAgo.toISOString())

      // Get profile views (from user activity)
      const { count: views } = await supabase
        .from("user_activity")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .in("activity_type", ["resume_downloaded", "resume_created"])
        .gte("created_at", oneWeekAgo.toISOString())

      // Get last activity
      const { data: lastActivity } = await supabase
        .from("user_activity")
        .select("description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)

      setSnapshot({
        resumeOptimization: optimization,
        weeklyApplications: weeklyApps || 0,
        profileViews: views || 0,
        lastActivity: lastActivity?.[0]?.description || "No recent activity",
      })
    } catch (error) {
      console.error("Error fetching snapshot data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getOptimizationMessage = () => {
    if (snapshot.resumeOptimization >= 90) {
      return "Excellent! Your resume is highly optimized for recruiter scans."
    } else if (snapshot.resumeOptimization >= 70) {
      return "Good progress! Your resume is well-optimized for most recruiters."
    } else if (snapshot.resumeOptimization >= 50) {
      return "Your resume is partially optimized. Add more details to improve."
    } else if (snapshot.resumeOptimization > 0) {
      return "Your resume needs work. Complete all sections for better results."
    } else {
      return "Create your first resume to get started with optimization!"
    }
  }

  const getApplicationMessage = () => {
    if (snapshot.weeklyApplications >= 10) {
      return `You've applied to ${snapshot.weeklyApplications} jobs this week — excellent consistency!`
    } else if (snapshot.weeklyApplications >= 5) {
      return `You've applied to ${snapshot.weeklyApplications} jobs this week — nice momentum!`
    } else if (snapshot.weeklyApplications > 0) {
      return `You've applied to ${snapshot.weeklyApplications} jobs this week — keep going!`
    } else {
      return "No applications this week. Start applying to reach your goals!"
    }
  }

  const getProfileViewsMessage = () => {
    if (snapshot.profileViews >= 5) {
      return `${snapshot.profileViews} resume activities last week — great traction!`
    } else if (snapshot.profileViews > 0) {
      return `${snapshot.profileViews} resume activities last week — update your resume for more impact.`
    } else {
      return "No resume activity this week. Download and share your resume!"
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
            Career Snapshot
          </CardTitle>
          <CardDescription>Your personalized career insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
          Career Snapshot
        </CardTitle>
        <CardDescription>Your personalized career insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resume Optimization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Resume Optimization</span>
            </div>
            <Badge
              variant="outline"
              className={
                snapshot.resumeOptimization >= 80
                  ? "bg-green-100 text-green-800 border-green-200"
                  : snapshot.resumeOptimization >= 50
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : "bg-red-100 text-red-800 border-red-200"
              }
            >
              {snapshot.resumeOptimization}%
            </Badge>
          </div>
          <Progress value={snapshot.resumeOptimization} className="h-2" />
          <p className="text-sm text-gray-600">{getOptimizationMessage()}</p>
        </div>

        {/* Weekly Applications */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Application Activity</span>
          </div>
          <p className="text-sm text-gray-600">{getApplicationMessage()}</p>
        </div>

        {/* Profile Views */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Resume Traction</span>
          </div>
          <p className="text-sm text-gray-600">{getProfileViewsMessage()}</p>
        </div>

        {/* Last Activity */}
        <div className="pt-4 border-t">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Latest Activity</span>
          </div>
          <p className="text-sm text-gray-600 italic">{snapshot.lastActivity}</p>
        </div>
      </CardContent>
    </Card>
  )
}
