"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Brain, TrendingUp, Award } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface AnalyticsData {
  totalSessions: number
  averageScore: number
  improvementRate: number
  strongAreas: Array<{ name: string; score: number }>
  areasToImprove: Array<{ name: string; score: number }>
  recentSessions: Array<{ profession: string; score: number; date: string }>
}

export default function InterviewAnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSessions: 0,
    averageScore: 0,
    improvementRate: 0,
    strongAreas: [],
    areasToImprove: [],
    recentSessions: [],
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }
    checkAccessAndLoadAnalytics()
  }, [user, router])

  const checkAccessAndLoadAnalytics = async () => {
    try {
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single()

      setHasAccess(subData?.plan_type === "professional")

      if (subData?.plan_type === "professional") {
        const { data: sessions } = await supabase
          .from("mock_interview_sessions")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })

        if (sessions && sessions.length > 0) {
          const completedSessions = sessions.filter((s) => s.status === "completed")
          const totalSessions = completedSessions.length
          const averageScore =
            totalSessions > 0
              ? completedSessions.reduce((sum, s) => sum + (s.average_score || 0), 0) / totalSessions
              : 0

          // Calculate improvement rate
          let improvementRate = 0
          if (completedSessions.length >= 2) {
            const firstScore = completedSessions[completedSessions.length - 1].average_score || 0
            const lastScore = completedSessions[0].average_score || 0
            improvementRate = ((lastScore - firstScore) / firstScore) * 100
          }

          // Analyze strong and weak areas based on professions
          const professionScores: { [key: string]: number[] } = {}
          completedSessions.forEach((session) => {
            if (!professionScores[session.profession]) {
              professionScores[session.profession] = []
            }
            professionScores[session.profession].push(session.average_score || 0)
          })

          const professionAverages = Object.entries(professionScores).map(([profession, scores]) => ({
            name: profession,
            score: scores.reduce((a, b) => a + b, 0) / scores.length,
          }))

          const strongAreas = professionAverages.sort((a, b) => b.score - a.score).slice(0, 3)
          const areasToImprove = professionAverages.sort((a, b) => a.score - b.score).slice(0, 3)

          const recentSessions = completedSessions.slice(0, 5).map((s) => ({
            profession: s.profession,
            score: Math.round(s.average_score || 0),
            date: new Date(s.created_at).toLocaleDateString(),
          }))

          setAnalytics({
            totalSessions,
            averageScore: Math.round(averageScore),
            improvementRate: Math.round(improvementRate),
            strongAreas,
            areasToImprove,
            recentSessions,
          })
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="border-2 border-amber-200">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/pricing")}>Upgrade to Professional</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Interview Prep
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Performance Analytics
          </h1>
          <p className="text-gray-600">Track your interview preparation progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{analytics.totalSessions}</div>
              <p className="text-xs text-gray-500 mt-1">Mock interviews completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{analytics.averageScore}%</div>
              <p className="text-xs text-gray-500 mt-1">Overall performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${analytics.improvementRate >= 0 ? "text-purple-600" : "text-red-600"}`}
              >
                {analytics.improvementRate >= 0 ? "+" : ""}
                {analytics.improvementRate}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Overall trend</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Readiness</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${analytics.averageScore >= 75 ? "text-amber-600" : "text-orange-600"}`}
              >
                {analytics.averageScore >= 75 ? "Ready" : "Improving"}
              </div>
              <p className="text-xs text-gray-500 mt-1">For interviews</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Strong Areas
              </CardTitle>
              <CardDescription>Professions you excel at</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.strongAreas.length === 0 ? (
                  <p className="text-sm text-gray-500">Complete more interviews to see insights</p>
                ) : (
                  analytics.strongAreas.map((area, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      <span className="text-sm text-gray-700">{area.name}</span>
                      <div className="ml-auto text-xs font-semibold text-green-600">{Math.round(area.score)}%</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Areas to Improve
              </CardTitle>
              <CardDescription>Focus areas for better performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.areasToImprove.length === 0 ? (
                  <p className="text-sm text-gray-500">Complete more interviews to see insights</p>
                ) : (
                  analytics.areasToImprove.map((area, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-600 rounded-full" />
                      <span className="text-sm text-gray-700">{area.name}</span>
                      <div className="ml-auto text-xs font-semibold text-orange-600">{Math.round(area.score)}%</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {analytics.recentSessions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.recentSessions.map((session, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{session.profession}</p>
                      <p className="text-xs text-gray-500">{session.date}</p>
                    </div>
                    <div className="text-lg font-bold text-blue-600">{session.score}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
