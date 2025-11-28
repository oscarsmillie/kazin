"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Lock, Star, Bot, TrendingUp, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export default function CareerCoachPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }

    checkAccess()
  }, [user, router])

  const checkAccess = async () => {
    try {
      // Check user subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single()

      setSubscription(subData)

      // Professional users have access
      const isProfessional = subData?.plan_type === "professional"
      setHasAccess(isProfessional)
    } catch (error) {
      console.error("Error checking access:", error)
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Professional Feature</CardTitle>
              <CardDescription className="text-lg text-gray-600">
                AI Career Coach is available for Professional subscribers only
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <Bot className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">AI Guidance</h3>
                  <p className="text-sm text-gray-600">Get personalized career advice from AI</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Career Planning</h3>
                  <p className="text-sm text-gray-600">Create strategic career development plans</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Industry Insights</h3>
                  <p className="text-sm text-gray-600">Get insights about your target industry</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Professional Plan Benefits
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Unlimited AI career coaching sessions</li>
                  <li>• Personalized career roadmaps</li>
                  <li>• Industry trend analysis and insights</li>
                  <li>• Skill gap analysis and recommendations</li>
                  <li>• Salary negotiation strategies</li>
                  <li>• Career transition guidance</li>
                </ul>
              </div>

              <div className="text-center">
                <Badge className="bg-purple-100 text-purple-800 mb-4">Professional Plan - $14.99/month</Badge>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push("/pricing")}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    size="lg"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Upgrade to Professional
                  </Button>
                  <p className="text-sm text-gray-500">30-day money back guarantee • Cancel anytime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Professional user - show actual career coach content
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Career Coach</h1>
          <p className="text-lg text-gray-600">
            Get personalized career guidance and strategic advice from our AI coach
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-500" />
                Start Coaching Session
              </CardTitle>
              <CardDescription>Begin a personalized coaching conversation</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/career-coach/session")} className="w-full">
                Start Session
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Career Roadmap
              </CardTitle>
              <CardDescription>Create your personalized career development plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => router.push("/career-coach/roadmap")}
              >
                Create Roadmap
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Industry Insights
              </CardTitle>
              <CardDescription>Get insights about your target industry and role</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => router.push("/career-coach/insights")}
              >
                View Insights
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
