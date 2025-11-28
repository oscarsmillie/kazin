"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, MessageCircle, Volume2, SkipForward } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { logInterviewSession } from "@/lib/activity-logger"

interface Question {
  id: string
  question: string
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  tips?: string
}

export default function MockInterviewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [profession, setProfession] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [qualifications, setQualifications] = useState("")
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate")
  const [showProfessionForm, setShowProfessionForm] = useState(true)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [feedback, setFeedback] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState<string>("")
  const [sessionScore, setSessionScore] = useState(0)

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

  const handleStartInterview = async () => {
    if (!profession.trim()) {
      alert("Please enter your profession")
      return
    }

    setGeneratingQuestions(true)
    try {
      // Create interview session
      const newSessionId = `session_${Date.now()}`
      setSessionId(newSessionId)

      const { data: session } = await supabase.from("mock_interview_sessions").insert({
        user_id: user?.id,
        profession,
        job_title: jobTitle || null,
        difficulty_level: difficulty,
        total_questions: 5,
      })

      const response = await fetch("/api/interview-prep/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession,
          jobTitle: jobTitle || null,
          jobDescription: jobDescription || null,
          qualifications: qualifications || null,
          difficultyLevel: difficulty,
          questionCount: 5,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate questions")

      const data = await response.json()
      const generatedQuestions = data.questions.map((q: any, idx: number) => ({
        id: `q_${idx}`,
        question: q.question,
        category: q.category,
        difficulty: difficulty,
        tips: q.tips,
      }))

      setQuestions(generatedQuestions)
      setCurrentQuestion(generatedQuestions[0])
      setShowProfessionForm(false)
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to generate questions. Please try again.")
    } finally {
      setGeneratingQuestions(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return

    setSubmitting(true)
    try {
      // Call API to get AI feedback
      const response = await fetch("/api/interview-prep/save-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion?.id,
          question: currentQuestion?.question,
          userResponse: userAnswer,
          profession,
        }),
      })

      if (!response.ok) throw new Error("Failed to get feedback")

      const data = await response.json()
      setFeedback(data.feedback)
      setSessionScore((prev) => prev + (data.score || 0))
      setShowFeedback(true)
    } catch (error) {
      console.error("Error:", error)
      setFeedback("Unable to generate feedback. Please try again.")
      setShowFeedback(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNextQuestion = async () => {
    if (questionIndex < questions.length - 1) {
      const nextIndex = questionIndex + 1
      setQuestionIndex(nextIndex)
      setCurrentQuestion(questions[nextIndex])
      setUserAnswer("")
      setFeedback("")
      setShowFeedback(false)
    } else {
      const averageScore = Math.round(sessionScore / questions.length)

      await logInterviewSession(user!.id, profession, averageScore)

      await supabase
        .from("mock_interview_sessions")
        .update({
          status: "completed",
          questions_answered: questions.length,
          average_score: averageScore,
        })
        .eq("id", sessionId)

      router.push("/interview-prep/analytics")
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

  if (showProfessionForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interview Prep
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Start Mock Interview</CardTitle>
              <CardDescription>Customize your interview experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Profession *</label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Job Title (Optional)</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description (Optional)</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description to get more relevant questions"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Qualifications (Optional)</label>
                <textarea
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="Describe your skills and experience to get personalized questions"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                <div className="flex gap-3">
                  {(["beginner", "intermediate", "advanced"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        difficulty === level ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStartInterview}
                disabled={generatingQuestions || !profession.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {generatingQuestions ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  "Start Interview"
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
          Back to Interview Prep
        </Button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Mock Interview - {profession}</h1>
            <div className="text-sm text-gray-600">
              Question {questionIndex + 1} of {questions.length}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {currentQuestion && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                      {currentQuestion.question}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Category: {currentQuestion.category} • Difficulty: {currentQuestion.difficulty}
                    </CardDescription>
                    {currentQuestion.tips && (
                      <p className="text-sm text-blue-600 mt-2">💡 Tip: {currentQuestion.tips}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Answer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here... (Aim for 2-3 minutes of speaking)"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[150px]"
                  disabled={showFeedback}
                />
                {!showFeedback ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={submitting || !userAnswer.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Getting Feedback...
                        </>
                      ) : (
                        "Submit Answer"
                      )}
                    </Button>
                    <Button variant="outline">
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleNextQuestion} className="bg-blue-600 hover:bg-blue-700 w-full">
                    {questionIndex === questions.length - 1 ? "View Analytics" : "Next Question"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {showFeedback && (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle>AI Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{feedback}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
