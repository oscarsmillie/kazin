"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, Users, Crown } from "lucide-react"
import Link from "next/link"

interface AiCareerCoachBlockProps {
  isPremium: boolean
}

export default function AiCareerCoachBlock({ isPremium }: AiCareerCoachBlockProps) {
  if (!isPremium) {
    return null
  }

  return (
    <Card className="border-2 border-purple-200 hover:border-purple-300 transition-all duration-200 hover:shadow-lg">
      <CardHeader className="bg-purple-50 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">AI Career Coach</CardTitle>
            </div>
          </div>
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
        <CardDescription>Get personalized career guidance and strategic advice from our AI coach</CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Start Coaching Session */}
          <Link href="/career-coach">
            <div className="flex items-start p-3 rounded-lg border border-purple-100 hover:bg-purple-50 transition-colors cursor-pointer">
              <Brain className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">Start Coaching Session</p>
                <p className="text-xs text-gray-600">Begin a personalized coaching conversation</p>
              </div>
            </div>
          </Link>

          {/* Career Roadmap */}
          <Link href="/career-coach">
            <div className="flex items-start p-3 rounded-lg border border-purple-100 hover:bg-purple-50 transition-colors cursor-pointer">
              <TrendingUp className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">Create Roadmap</p>
                <p className="text-xs text-gray-600">Build your personalized career development plan</p>
              </div>
            </div>
          </Link>

          {/* Industry Insights */}
          <Link href="/career-coach">
            <div className="flex items-start p-3 rounded-lg border border-purple-100 hover:bg-purple-50 transition-colors cursor-pointer">
              <Users className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">View Insights</p>
                <p className="text-xs text-gray-600">Get insights about your target industry and role</p>
              </div>
            </div>
          </Link>
        </div>

        <Link href="/career-coach">
          <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">Open AI Career Coach</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
