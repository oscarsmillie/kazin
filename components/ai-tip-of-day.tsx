"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lightbulb, RefreshCw, Sparkles } from "lucide-react"

const careerTips = [
  {
    category: "Resume",
    tip: "Did you know? 75% of resumes never get seen because they lack keywords. Try adding 3 skills from your target job post.",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    category: "Applications",
    tip: "Applying to 10-15 jobs per week increases your chances of landing interviews by 60%. Stay consistent!",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    category: "Cover Letter",
    tip: "Personalized cover letters get 40% more responses. Always mention the company name and specific role details.",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    category: "Interview",
    tip: "Practice the STAR method (Situation, Task, Action, Result) for behavioral questions. It structures your answers perfectly.",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    category: "Networking",
    tip: "80% of jobs are filled through networking. Reach out to 2-3 people in your target industry each week.",
    color: "bg-pink-100 text-pink-800 border-pink-200",
  },
  {
    category: "Job Search",
    tip: "Apply within the first 24 hours of a job posting. Early applicants are 3x more likely to get interviews.",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  {
    category: "Skills",
    tip: "List 8-12 relevant skills on your resume. Too few looks inexperienced, too many looks unfocused.",
    color: "bg-teal-100 text-teal-800 border-teal-200",
  },
  {
    category: "LinkedIn",
    tip: "Profiles with professional photos get 14x more views. Update your LinkedIn profile picture today!",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  {
    category: "Follow-up",
    tip: "Send a thank-you email within 24 hours after an interview. It shows professionalism and keeps you top of mind.",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  {
    category: "Career Growth",
    tip: "Set SMART goals for your job search: Specific, Measurable, Achievable, Relevant, and Time-bound.",
    color: "bg-red-100 text-red-800 border-red-200",
  },
]

export default function AiTipOfDay() {
  const [currentTip, setCurrentTip] = useState(careerTips[0])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Get tip based on current hour to ensure it changes throughout the day
    const hour = new Date().getHours()
    const tipIndex = hour % careerTips.length
    setCurrentTip(careerTips[tipIndex])
  }, [])

  const refreshTip = () => {
    setIsRefreshing(true)

    // Get a random tip different from the current one
    let newTip = currentTip
    while (newTip === currentTip) {
      const randomIndex = Math.floor(Math.random() * careerTips.length)
      newTip = careerTips[randomIndex]
    }

    setTimeout(() => {
      setCurrentTip(newTip)
      setIsRefreshing(false)
    }, 500)
  }

  return (
    <Card className="h-full border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-purple-600" />
              Career Gem
            </CardTitle>
            <CardDescription>Daily career wisdom to boost your success</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshTip} disabled={isRefreshing} className="h-8 w-8 p-0">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge className={currentTip.color}>
          <Sparkles className="h-3 w-3 mr-1" />
          {currentTip.category}
        </Badge>

        <div className="relative">
          <div className="absolute -left-2 top-0 text-4xl text-purple-200 font-serif">"</div>
          <p className="text-gray-700 leading-relaxed pl-6 pr-2">{currentTip.tip}</p>
          <div className="absolute -right-2 bottom-0 text-4xl text-purple-200 font-serif">"</div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 text-center italic">
            Tip refreshes hourly • Click refresh for more insights
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
