"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, TrendingUp, Zap, Target, Users, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"

export default function CareerInsightsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [selectedOccupation, setSelectedOccupation] = useState<string>("")
  const [showOccupationForm, setShowOccupationForm] = useState(true)
  const [userIndustry, setUserIndustry] = useState<string>("")
  const [generatingInsights, setGeneratingInsights] = useState(false)
  const [insights, setInsights] = useState({
    skillGaps: [] as string[],
    industryTrends: [] as string[],
    recommendations: [] as string[],
    salaryRange: { min: 0, max: 0 },
  })

  const handleOccupationSubmit = async () => {
    if (!selectedOccupation.trim()) {
      alert("Please enter your occupation")
      return
    }

    setGeneratingInsights(true)

    try {
      await supabase.from("users").update({ industry: selectedOccupation }).eq("id", user?.id)

      setUserIndustry(selectedOccupation)
      await fetchAIInsights(selectedOccupation)
      setShowOccupationForm(false)
    } catch (error) {
      console.error("Error updating occupation:", error)
      alert("Failed to save occupation")
    } finally {
      setGeneratingInsights(false)
    }
  }

  const fetchAIInsights = async (occupation: string) => {
    try {
      const response = await fetch("/api/career-coach/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occupation }),
      })

      if (!response.ok) throw new Error("Failed to fetch insights")

      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error("Error fetching insights:", error)
      alert("Failed to load insights. Please try again.")
    }
  }

  const handleChangeOccupation = () => {
    setShowOccupationForm(true)
    setSelectedOccupation(userIndustry)
  }

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }
    checkAccessAndLoadInsights()
  }, [user, router])

  const checkAccessAndLoadInsights = async () => {
    try {
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single()

      setHasAccess(subData?.plan_type === "professional")

      if (subData?.plan_type === "professional") {
        const { data: profile } = await supabase
          .from("users")
          .select("industry, experience_level")
          .eq("id", user?.id)
          .single()

        const industry = profile?.industry || ""
        setUserIndustry(industry)

        if (!industry) {
          setShowOccupationForm(true)
        } else {
          setSelectedOccupation(industry)
          setShowOccupationForm(true)
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const getIndustrySpecificInsights = (industry: string, experienceLevel: string) => {
    const insightsByIndustry: Record<string, any> = {
      Technology: {
        skillGaps: [
          "Advanced System Design",
          "Cloud Architecture (AWS/GCP/Azure)",
          "AI/ML Implementation",
          "DevOps & Infrastructure as Code",
        ],
        industryTrends: [
          "AI/ML Integration in Products",
          "Remote-First Development",
          "Microservices Architecture",
          "Zero-Trust Security",
          "Quantum Computing Basics",
        ],
        salaryRange: { min: 120000, max: 250000 },
      },
      Finance: {
        skillGaps: [
          "Advanced Financial Modeling",
          "Risk Management Frameworks",
          "Regulatory Compliance (GDPR, SOX)",
          "Data Analytics & Python",
        ],
        industryTrends: [
          "Fintech Innovation",
          "Blockchain & Cryptocurrency",
          "ESG Investing",
          "Algorithmic Trading",
          "Digital Banking",
        ],
        salaryRange: { min: 100000, max: 300000 },
      },
      Healthcare: {
        skillGaps: ["Healthcare IT Systems", "HIPAA Compliance", "Clinical Data Analysis", "Telemedicine Platforms"],
        industryTrends: [
          "AI in Diagnostics",
          "Personalized Medicine",
          "Mental Health Tech",
          "Wearable Health Devices",
          "Healthcare Cybersecurity",
        ],
        salaryRange: { min: 80000, max: 200000 },
      },
      Marketing: {
        skillGaps: [
          "Marketing Automation",
          "Data Analytics & Attribution",
          "AI-Powered Personalization",
          "Video Content Strategy",
        ],
        industryTrends: [
          "AI-Generated Content",
          "Privacy-First Marketing",
          "Influencer Partnerships",
          "Metaverse Marketing",
          "Voice Search Optimization",
        ],
        salaryRange: { min: 70000, max: 180000 },
      },
      Sales: {
        skillGaps: ["Enterprise Sales Strategies", "CRM Mastery", "Consultative Selling", "Negotiation Tactics"],
        industryTrends: [
          "AI-Powered Sales Tools",
          "Account-Based Marketing",
          "Virtual Sales Engagement",
          "Predictive Analytics",
          "Customer Success Integration",
        ],
        salaryRange: { min: 60000, max: 250000 },
      },
    }

    const defaultInsights = insightsByIndustry[industry] || insightsByIndustry.Technology

    return {
      ...defaultInsights,
      recommendations: [
        `Complete a certification relevant to ${industry}`,
        `Lead a cross-functional project in your domain`,
        `Contribute to industry-specific open-source projects`,
        `Mentor junior professionals in your field`,
        `Stay updated with ${industry} industry publications`,
      ],
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
          <Card className="border-2 border-purple-200">
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

  if (showOccupationForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
                Industry Insights
              </CardTitle>
              <CardDescription>
                Enter your industry or profession to get personalized career insights, salary data, and growth
                recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What is your industry or profession?
                </label>
                <Input
                  placeholder="e.g., Software Engineering, Product Management, Data Science, Marketing..."
                  value={selectedOccupation}
                  onChange={(e) => setSelectedOccupation(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleOccupationSubmit()}
                  className="text-base"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be specific for more relevant insights (e.g., "Frontend Developer" instead of just "Developer")
                </p>
              </div>
              <Button
                onClick={handleOccupationSubmit}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={generatingInsights || !selectedOccupation.trim()}
              >
                {generatingInsights ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Insights...
                  </>
                ) : (
                  "Generate My Insights"
                )}
              </Button>
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
          Back to Career Coach
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
                Career Insights for {userIndustry}
              </h1>
              <p className="text-gray-600">Personalized analysis of your career trajectory and growth opportunities</p>
            </div>
            <Button
              variant="outline"
              onClick={handleChangeOccupation}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              Change Industry
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Salary Range
              </CardTitle>
              <CardDescription>Based on your experience and skills in {userIndustry}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${insights.salaryRange.min.toLocaleString()} - ${insights.salaryRange.max.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 mt-2">Annual salary range for your target role</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Skill Gaps
              </CardTitle>
              <CardDescription>Areas to focus on for growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.skillGaps.slice(0, 3).map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span className="text-sm text-gray-700">{skill}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Industry Trends in {userIndustry}
            </CardTitle>
            <CardDescription>What's hot in your industry right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.industryTrends.map((trend, idx) => (
                <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-gray-900">{trend}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Steps to accelerate your career growth in {userIndustry}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
