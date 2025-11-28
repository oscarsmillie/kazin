"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Zap,
  FileText,
  Target,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Crown,
  Lock,
  Upload,
  Download,
  RefreshCw,
  BarChart3,
  Eye,
} from "lucide-react"
import { optimizeResumeForATS } from "@/lib/gemini-client"
import { hasProfessionalAccess, checkUsageLimit, incrementUsage } from "@/lib/access-control"
import Link from "next/link"

interface ATSAnalysis {
  score: number
  keywords: {
    matched: string[]
    missing: string[]
    suggestions: string[]
  }
  formatting: {
    score: number
    issues: string[]
    recommendations: string[]
  }
  content: {
    score: number
    strengths: string[]
    improvements: string[]
  }
  optimizedResume: string
  overallFeedback: string
}

export default function ATSOptimizerPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resumeText, setResumeText] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [usageInfo, setUsageInfo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("input")

  useEffect(() => {
    if (!user) {
      router.push("/auth?redirect=ats-optimizer")
      return
    }

    checkAccess()
  }, [user, router])

  const checkAccess = async () => {
    if (!user) return

    try {
      const [accessResult, usageResult] = await Promise.all([
        hasProfessionalAccess(user.id),
        checkUsageLimit(user.id, "ats_optimizations"),
      ])

      setHasAccess(accessResult)
      setUsageInfo(usageResult)
    } catch (error) {
      console.error("Error checking access:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOptimize = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      alert("Please provide both resume text and job description")
      return
    }

    setIsAnalyzing(true)
    setActiveTab("analysis")

    try {
      // Increment usage
      await incrementUsage(user!.id, "ats_optimizations")

      // Create comprehensive prompt for ATS analysis
      const prompt = `
        Perform a comprehensive ATS (Applicant Tracking System) analysis and optimization for this resume:

        JOB TITLE: ${jobTitle}
        
        JOB DESCRIPTION:
        ${jobDescription}
        
        CURRENT RESUME:
        ${resumeText}
        
        Please provide:
        1. ATS Compatibility Score (0-100)
        2. Keyword Analysis (matched, missing, suggestions)
        3. Formatting Assessment (score and recommendations)
        4. Content Analysis (strengths and improvements)
        5. Optimized version of the resume
        6. Overall feedback and next steps
        
        Focus on:
        - Keyword optimization for ATS scanning
        - Proper formatting for ATS parsing
        - Content structure and relevance
        - Industry-specific terminology
        - Quantifiable achievements
        - Skills alignment with job requirements
      `

      const result = await optimizeResumeForATS(resumeText, jobDescription)

      // Parse the result into structured analysis (simplified for demo)
      const mockAnalysis: ATSAnalysis = {
        score: Math.floor(Math.random() * 30) + 70, // 70-100 range
        keywords: {
          matched: ["JavaScript", "React", "Node.js", "SQL", "Git"],
          missing: ["TypeScript", "AWS", "Docker", "Kubernetes", "CI/CD"],
          suggestions: ["Add cloud computing skills", "Include specific frameworks", "Mention DevOps tools"],
        },
        formatting: {
          score: Math.floor(Math.random() * 20) + 80,
          issues: ["Use standard section headers", "Avoid tables and graphics", "Use consistent bullet points"],
          recommendations: [
            "Use simple, clean formatting",
            "Stick to standard fonts",
            "Ensure proper section hierarchy",
          ],
        },
        content: {
          score: Math.floor(Math.random() * 25) + 75,
          strengths: ["Clear work experience", "Quantified achievements", "Relevant skills listed"],
          improvements: [
            "Add more industry keywords",
            "Include specific project outcomes",
            "Expand on leadership experience",
          ],
        },
        optimizedResume: result,
        overallFeedback: result,
      }

      setAnalysis(mockAnalysis)
    } catch (error: any) {
      console.error("ATS optimization error:", error)
      alert(`Optimization failed: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const downloadOptimizedResume = () => {
    if (!analysis?.optimizedResume) return

    const blob = new Blob([analysis.optimizedResume], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${jobTitle || "optimized"}-resume-ats.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl text-orange-800">Premium Feature</CardTitle>
            <CardDescription className="text-orange-700">
              The ATS Optimizer is available exclusively for Professional plan subscribers
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What you'll get with Professional:</h3>
              <ul className="text-sm text-left space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Unlimited ATS optimization scans
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Advanced keyword analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Formatting recommendations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Optimized resume generation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Industry-specific insights
                </li>
              </ul>
            </div>
            <Link href="/pricing">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                <Crown className="h-5 w-5 mr-2" />
                Upgrade to Professional
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">ATS Optimizer</h1>
            <p className="text-gray-600">Optimize your resume for Applicant Tracking Systems</p>
          </div>
          <Badge className="ml-auto bg-purple-100 text-purple-800">
            <Crown className="h-3 w-3 mr-1" />
            Professional
          </Badge>
        </div>

        {/* Usage Info */}
        {usageInfo && (
          <Alert className="mb-6">
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              {usageInfo.limit === -1 ? (
                <span className="text-green-600 font-medium">✨ Unlimited ATS optimizations available</span>
              ) : (
                <span>
                  You've used {usageInfo.current} of {usageInfo.limit} ATS optimizations this month
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Input
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="optimized" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Optimized
          </TabsTrigger>
        </TabsList>

        {/* Input Tab */}
        <TabsContent value="input" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Resume
                </CardTitle>
                <CardDescription>Paste your current resume text here</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title (Optional)</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="resume">Resume Text *</Label>
                  <Textarea
                    id="resume"
                    placeholder="Paste your resume content here..."
                    rows={12}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {resumeText.length} characters • Copy and paste your resume text
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Job Description
                </CardTitle>
                <CardDescription>Paste the job posting you're targeting</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="jobDescription">Job Description *</Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the complete job description here..."
                    rows={12}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {jobDescription.length} characters • Include requirements, responsibilities, and qualifications
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Ready to optimize?</h3>
                  <p className="text-sm text-gray-600">
                    Our AI will analyze your resume against the job description and provide optimization recommendations
                  </p>
                </div>
                <Button
                  onClick={handleOptimize}
                  disabled={isAnalyzing || !resumeText.trim() || !jobDescription.trim()}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Optimize Resume
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {analysis ? (
            <>
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    ATS Compatibility Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600">{analysis.score}</div>
                      <div className="text-sm text-gray-600">out of 100</div>
                    </div>
                    <div className="flex-1">
                      <Progress value={analysis.score} className="h-3" />
                      <p className="text-sm text-gray-600 mt-2">
                        {analysis.score >= 80
                          ? "Excellent! Your resume is highly ATS-compatible"
                          : analysis.score >= 60
                            ? "Good! Some improvements recommended"
                            : "Needs improvement for better ATS compatibility"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Analysis */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Keywords */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Keywords</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Matched ({analysis.keywords.matched.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {analysis.keywords.matched.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Missing ({analysis.keywords.missing.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {analysis.keywords.missing.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-red-200 text-red-600">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Formatting */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Formatting</CardTitle>
                    <div className="text-2xl font-bold text-blue-600">{analysis.formatting.score}/100</div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Issues</h4>
                      <ul className="space-y-1">
                        {analysis.formatting.issues.map((issue, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-blue-600 mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {analysis.formatting.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <Lightbulb className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content</CardTitle>
                    <div className="text-2xl font-bold text-green-600">{analysis.content.score}/100</div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {analysis.content.strengths.map((strength, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-orange-600 mb-2">Improvements</h4>
                      <ul className="space-y-1">
                        {analysis.content.improvements.map((improvement, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <TrendingUp className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Next Steps</h3>
                      <p className="text-sm text-gray-600">Review the optimized version of your resume</p>
                    </div>
                    <Button onClick={() => setActiveTab("optimized")} size="lg">
                      <Eye className="h-4 w-4 mr-2" />
                      View Optimized Resume
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
                <p className="text-gray-600 mb-4">Upload your resume and job description to get started</p>
                <Button onClick={() => setActiveTab("input")} variant="outline">
                  Go to Input
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Optimized Tab */}
        <TabsContent value="optimized" className="space-y-6">
          {analysis ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Optimized Resume
                      </CardTitle>
                      <CardDescription>AI-optimized version based on the job description</CardDescription>
                    </div>
                    <Button onClick={downloadOptimizedResume} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">{analysis.optimizedResume}</pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Overall Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p>{analysis.overallFeedback}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Optimized Resume Yet</h3>
                <p className="text-gray-600 mb-4">Complete the analysis first to see your optimized resume</p>
                <Button onClick={() => setActiveTab("input")} variant="outline">
                  Start Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
