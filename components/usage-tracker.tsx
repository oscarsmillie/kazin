"use client"

import type { ReactNode } from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, MessageSquare, Zap, Crown, AlertTriangle, CheckCircle } from "lucide-react"
import { getCurrentUsage, getUserSubscription } from "@/lib/subscription"
import type { Subscription, UsageTracking } from "@/lib/types"
import Link from "next/link"

interface UsageItem {
  label: string
  current: number
  limit: number
  icon: ReactNode
  color: string
  allowed: boolean
  planType: string
}

export default function UsageTracker() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageTracking | null>(null)
  const [usageItems, setUsageItems] = useState<UsageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchUsageData()
    }
  }, [user])

  const fetchUsageData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [subData, usageData] = await Promise.all([
        getUserSubscription(user?.id || ""),
        getCurrentUsage(user?.id || ""),
      ])

      // Determine actual plan type
      const actualPlanType = subData?.plan_type === "professional" && subData?.is_active ? "professional" : "free"

      setSubscription({ ...subData, plan_type: actualPlanType })
      setUsage(usageData)

      const features = [
        { key: "cover_letters", label: "Cover Letters", icon: <FileText className="h-4 w-4" />, color: "blue" },
        { key: "emails", label: "Emails", icon: <MessageSquare className="h-4 w-4" />, color: "green" },
        { key: "resumes", label: "Resume Downloads", icon: <FileText className="h-4 w-4" />, color: "purple" },
        { key: "ats_optimizations", label: "ATS Optimizations", icon: <Zap className="h-4 w-4" />, color: "orange" },
        {
          key: "interview_sessions",
          label: "Interview Sessions",
          icon: <MessageSquare className="h-4 w-4" />,
          color: "pink",
        },
        { key: "job_applications", label: "Job Applications", icon: <FileText className="h-4 w-4" />, color: "indigo" },
      ] as const

      const limits =
        actualPlanType === "professional"
          ? {
              cover_letters: -1,
              emails: -1,
              resumes: 3,
              ats_optimizations: -1,
              interview_sessions: -1,
              job_applications: -1,
            }
          : {
              cover_letters: 10,
              emails: 10,
              resumes: 0,
              ats_optimizations: 10,
              interview_sessions: 1,
              job_applications: 10,
            }

      const usageResults = features.map((feature) => {
        const current = usageData?.[feature.key] || 0
        const limit = limits[feature.key] || 0
        const allowed = limit === -1 ? true : current < limit

        return {
          label: feature.label,
          current,
          limit,
          icon: feature.icon,
          color: feature.color,
          allowed,
          planType: actualPlanType,
        }
      })

      setUsageItems(usageResults)
    } catch (error) {
      console.error("Error fetching usage data:", error)
      setError("Failed to load usage data")
    } finally {
      setLoading(false)
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "free":
        return "bg-gray-100 text-gray-800"
      case "professional":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getUsageStatus = (item: UsageItem) => {
    if (item.limit === -1) return { status: "unlimited", message: "Unlimited usage", color: "text-green-600" }

    const percentage = (item.current / item.limit) * 100

    if (percentage >= 100) return { status: "exceeded", message: "Limit reached", color: "text-red-600" }
    if (percentage >= 90) return { status: "critical", message: "Near limit", color: "text-orange-600" }
    if (percentage >= 75) return { status: "warning", message: "High usage", color: "text-yellow-600" }

    return { status: "normal", message: "Good", color: "text-green-600" }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const planType = subscription?.plan_type || "free"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Crown className="mr-2 h-5 w-5" />
              Usage & Limits
            </CardTitle>
            <CardDescription>Track your monthly usage and plan limits</CardDescription>
          </div>
          <Badge className={getPlanBadgeColor(planType)}>{planType.toUpperCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {usageItems.map((item, index) => {
            const isUnlimited = item.limit === -1
            const percentage = isUnlimited ? 0 : Math.min((item.current / item.limit) * 100, 100)
            const usageStatus = getUsageStatus(item)

            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {item.current} / {isUnlimited ? "∞" : item.limit}
                    </span>
                    <Badge
                      variant={usageStatus.status === "exceeded" ? "destructive" : "outline"}
                      className={`text-xs ${usageStatus.color}`}
                    >
                      {usageStatus.status === "unlimited" && <Crown className="h-3 w-3 mr-1" />}
                      {usageStatus.status === "exceeded" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {usageStatus.status === "normal" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {usageStatus.message}
                    </Badge>
                  </div>
                </div>

                {!isUnlimited && (
                  <div className="space-y-2">
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{Math.round(percentage)}% used</span>
                      <span>{item.limit - item.current} remaining</span>
                    </div>
                  </div>
                )}

                {isUnlimited && (
                  <div className="text-xs text-green-600 flex items-center">
                    <Crown className="h-3 w-3 mr-1" />
                    Unlimited usage with Professional plan
                  </div>
                )}

                {/* Usage limit enforcement warning */}
                {!item.allowed && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      You've reached your {item.label.toLowerCase()} limit for this month.
                      {planType === "free" && <span> Upgrade to Professional for higher limits.</span>}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )
          })}

          {/* Upgrade prompt for free users */}
          {planType === "free" && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Upgrade for More Features</h4>
              <p className="text-sm text-blue-700 mb-3">
                Get higher limits, unlimited ATS optimizations, interview prep sessions, and more with our Professional
                plan.
              </p>
              <Link href="/pricing">
                <Button size="sm" className="w-full">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Professional
                </Button>
              </Link>
            </div>
          )}

          {/* Refresh button */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsageData}
              disabled={loading}
              className="w-full bg-transparent"
            >
              {loading ? "Refreshing..." : "Refresh Usage Data"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
