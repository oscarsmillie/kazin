"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Lock, Star, MessageCircle, Target, Brain } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export default function InterviewPrepPage() {
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
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Professional Feature</CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Interview Prep is available for Professional subscribers only
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <MessageCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Mock Interviews</h3>
                  <p className="text-sm text-gray-600">Practice with AI-powered mock interviews</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Targeted Questions</h3>
                  <p className="text-sm text-gray-600">Get questions specific to your role</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <Brain className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">AI Feedback</h3>
                  <p className="text-sm text-gray-600">Receive detailed performance feedback</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Professional Plan Benefits
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 3 interview prep sessions per month</li>
                  <li>• Industry-specific question banks</li>
                  <li>• Real-time feedback and scoring</li>
                  <li>• Performance analytics and improvement tips</li>
                  <li>• Behavioral and technical question practice</li>
                </ul>
              </div>

              <div className="text-center">
                <Badge className="bg-blue-100 text-blue-800 mb-4">Professional Plan - $14.99/month</Badge>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push("/pricing")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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

  // Professional user - show actual interview prep content
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Interview Preparation</h1>
          <p className="text-lg text-gray-600">
            Practice with AI-powered mock interviews and get ready for your dream job
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                Mock Interview
              </CardTitle>
              <CardDescription>Practice with realistic interview scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/interview-prep/mock-interview")} className="w-full">
                Start Mock Interview
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Question Bank
              </CardTitle>
              <CardDescription>Browse common interview questions by category</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => router.push("/interview-prep/questions")}
              >
                Browse Questions
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Performance Analytics
              </CardTitle>
              <CardDescription>Track your progress and improvement areas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => router.push("/interview-prep/analytics")}
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
