"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Target, Brain, Crown } from "lucide-react"
import Link from "next/link"

interface InterviewPrepBlockProps {
  isPremium: boolean
}

export default function InterviewPrepBlock({ isPremium }: InterviewPrepBlockProps) {
  if (!isPremium) {
    return null
  }

  return (
    <Card className="border-2 border-pink-200 hover:border-pink-300 transition-all duration-200 hover:shadow-lg">
      <CardHeader className="bg-pink-50 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white">
              <MessageCircle className="h-6 w-6 text-pink-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Interview Preparation</CardTitle>
            </div>
          </div>
          <Badge className="bg-pink-100 text-pink-800 border-pink-200">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
        <CardDescription>Practice with AI-powered mock interviews and get ready for your dream job</CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Mock Interview */}
          <Link href="/interview-prep">
            <div className="flex items-start p-3 rounded-lg border border-pink-100 hover:bg-pink-50 transition-colors cursor-pointer">
              <MessageCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">Start Mock Interview</p>
                <p className="text-xs text-gray-600">Practice with realistic interview scenarios</p>
              </div>
            </div>
          </Link>

          {/* Question Bank */}
          <Link href="/interview-prep">
            <div className="flex items-start p-3 rounded-lg border border-pink-100 hover:bg-pink-50 transition-colors cursor-pointer">
              <Target className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">Browse Questions</p>
                <p className="text-xs text-gray-600">Browse common interview questions by category</p>
              </div>
            </div>
          </Link>

          {/* Performance Analytics */}
          <Link href="/interview-prep">
            <div className="flex items-start p-3 rounded-lg border border-pink-100 hover:bg-pink-50 transition-colors cursor-pointer">
              <Brain className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">View Analytics</p>
                <p className="text-xs text-gray-600">Track your progress and improvement areas</p>
              </div>
            </div>
          </Link>
        </div>

        <Link href="/interview-prep">
          <Button className="w-full mt-4 bg-pink-600 hover:bg-pink-700">Open Interview Prep</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
