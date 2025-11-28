"use client"

import { useEffect, useState } from "react"
import { getUserSubscription, checkUsageLimit } from "@/lib/subscription"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function UsageDisplay() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const fetchUsageData = async () => {
      try {
        const sub = await getUserSubscription(user.id)
        setSubscription(sub)

        // Fetch all limits
        const coverLetterCheck = await checkUsageLimit(user.id, "cover_letters")
        const emailCheck = await checkUsageLimit(user.id, "emails")
        const resumeCheck = await checkUsageLimit(user.id, "resumes")
        const jobAppCheck = await checkUsageLimit(user.id, "job_applications")

        setUsage({
          cover_letters: coverLetterCheck,
          emails: emailCheck,
          resumes: resumeCheck,
          job_applications: jobAppCheck,
        })
      } catch (error) {
        console.error("[v0] Error fetching usage:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageData()
  }, [user?.id])

  if (loading || !usage) return null
  if (subscription?.plan_type === "professional") {
    return (
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-sm text-purple-900">Professional Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-purple-800">Unlimited access to all features</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Monthly Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(usage).map(([feature, data]: [string, any]) => (
          <div key={feature} className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="capitalize">{feature.replace(/_/g, " ")}</span>
              <span className="text-gray-600">
                {data.current} / {data.limit === -1 ? "∞" : data.limit}
              </span>
            </div>
            {data.limit !== -1 && <Progress value={(data.current / data.limit) * 100} className="h-2" />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
