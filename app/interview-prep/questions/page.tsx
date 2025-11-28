"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Target, ChevronDown, ChevronUp } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface Question {
  id: string
  question: string
  answer: string
  category: string
  difficulty: "easy" | "medium" | "hard"
}

export default function QuestionBankPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const questions: Question[] = [
    {
      id: "1",
      question: "Tell me about yourself",
      answer:
        "Provide a concise summary of your professional background, key achievements, and why you're interested in the role.",
      category: "Behavioral",
      difficulty: "easy",
    },
    {
      id: "2",
      question: "What are your strengths?",
      answer: "Highlight 2-3 relevant strengths backed by specific examples from your experience.",
      category: "Behavioral",
      difficulty: "easy",
    },
    {
      id: "3",
      question: "Describe a conflict you resolved",
      answer: "Use the STAR method: Situation, Task, Action, Result. Focus on your role in resolving it.",
      category: "Behavioral",
      difficulty: "medium",
    },
    {
      id: "4",
      question: "How do you handle pressure?",
      answer: "Provide a specific example of a high-pressure situation and how you managed it effectively.",
      category: "Behavioral",
      difficulty: "medium",
    },
    {
      id: "5",
      question: "What is your biggest weakness?",
      answer: "Choose a real weakness, explain how you're working to improve it, and show self-awareness.",
      category: "Behavioral",
      difficulty: "medium",
    },
    {
      id: "6",
      question: "Why do you want this job?",
      answer: "Research the company and role. Explain how your skills align with their needs and your career goals.",
      category: "Career Goals",
      difficulty: "easy",
    },
    {
      id: "7",
      question: "Where do you see yourself in 5 years?",
      answer: "Show ambition and growth mindset while aligning with the company's direction.",
      category: "Career Goals",
      difficulty: "easy",
    },
    {
      id: "8",
      question: "What do you know about our company?",
      answer:
        "Research the company thoroughly. Mention recent news, products, culture, and why you want to work there.",
      category: "Company Knowledge",
      difficulty: "medium",
    },
  ]

  const categories = ["all", ...new Set(questions.map((q) => q.category))]

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }
    checkAccess()
  }, [user, router])

  const checkAccess = async () => {
    try {
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single()

      setHasAccess(subData?.plan_type === "professional")
    } catch (error) {
      console.error("Error checking access:", error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions =
    selectedCategory === "all" ? questions : questions.filter((q) => q.category === selectedCategory)

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
            <Target className="h-8 w-8 text-green-600" />
            Interview Question Bank
          </h1>
          <p className="text-gray-600">Browse and practice common interview questions</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card
              key={question.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setExpandedId(expandedId === question.id ? null : question.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{question.question}</CardTitle>
                    <CardDescription className="mt-2">
                      {question.category} •{" "}
                      <span
                        className={`font-semibold ${
                          question.difficulty === "easy"
                            ? "text-green-600"
                            : question.difficulty === "medium"
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                      </span>
                    </CardDescription>
                  </div>
                  {expandedId === question.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              {expandedId === question.id && (
                <CardContent className="border-t pt-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Suggested Answer:</h4>
                    <p className="text-gray-700">{question.answer}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
