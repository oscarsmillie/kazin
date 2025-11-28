"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Search,
  Filter,
  FileText,
  Mail,
  Briefcase,
  Download,
  CreditCard,
  User,
  Settings,
  Eye,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

interface Activity {
  id: string
  activity_type: string
  description: string
  metadata: any
  created_at: string
}

const activityIcons = {
  resume_created: FileText,
  resume_downloaded: Download,
  cover_letter_generated: Mail,
  email_generated: Mail,
  job_application_created: Briefcase,
  payment_completed: CreditCard,
  profile_updated: User,
  settings_changed: Settings,
  document_viewed: Eye,
  default: FileText,
}

const activityColors = {
  resume_created: "bg-blue-100 text-blue-600",
  resume_downloaded: "bg-green-100 text-green-600",
  cover_letter_generated: "bg-purple-100 text-purple-600",
  email_generated: "bg-indigo-100 text-indigo-600",
  job_application_created: "bg-orange-100 text-orange-600",
  payment_completed: "bg-emerald-100 text-emerald-600",
  profile_updated: "bg-yellow-100 text-yellow-600",
  settings_changed: "bg-gray-100 text-gray-600",
  document_viewed: "bg-pink-100 text-pink-600",
  default: "bg-gray-100 text-gray-600",
}

export default function ActivityPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    if (user) {
      fetchActivities()
    }
  }, [user])

  const fetchActivities = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date()
        const startDate = new Date()

        switch (dateFilter) {
          case "today":
            startDate.setHours(0, 0, 0, 0)
            break
          case "week":
            startDate.setDate(now.getDate() - 7)
            break
          case "month":
            startDate.setMonth(now.getMonth() - 1)
            break
        }

        query = query.gte("created_at", startDate.toISOString())
      }

      // Apply type filter
      if (filterType !== "all") {
        query = query.eq("activity_type", filterType)
      }

      const { data, error } = await query.limit(100)

      if (error) {
        console.error("Error fetching activities:", error)
        return
      }

      let filteredData = data || []

      // Apply search filter
      if (searchTerm) {
        filteredData = filteredData.filter(
          (activity) =>
            activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.activity_type.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      }

      setActivities(filteredData)
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchActivities()
    }
  }, [searchTerm, filterType, dateFilter, user])

  const getActivityIcon = (type: string) => {
    const IconComponent = activityIcons[type as keyof typeof activityIcons] || activityIcons.default
    return IconComponent
  }

  const getActivityColor = (type: string) => {
    return activityColors[type as keyof typeof activityColors] || activityColors.default
  }

  const formatActivityType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getActivityStats = () => {
    const stats = {
      total: activities.length,
      today: activities.filter((a) => {
        const today = new Date()
        const activityDate = new Date(a.created_at)
        return activityDate.toDateString() === today.toDateString()
      }).length,
      thisWeek: activities.filter((a) => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(a.created_at) >= weekAgo
      }).length,
      byType: activities.reduce(
        (acc, activity) => {
          acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    }
    return stats
  }

  const stats = getActivityStats()

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Please sign in to view your activity history.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity History</h1>
          <p className="text-gray-600 mt-1">Track your progress and recent actions on KaziNest</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Most Active</p>
                <p className="text-lg font-bold text-gray-900">
                  {Object.keys(stats.byType).length > 0
                    ? formatActivityType(Object.entries(stats.byType).sort(([, a], [, b]) => b - a)[0]?.[0] || "")
                    : "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="resume_created">Resume Created</SelectItem>
                <SelectItem value="resume_downloaded">Resume Downloaded</SelectItem>
                <SelectItem value="cover_letter_generated">Cover Letter</SelectItem>
                <SelectItem value="email_generated">Email Generated</SelectItem>
                <SelectItem value="job_application_created">Job Application</SelectItem>
                <SelectItem value="payment_completed">Payment</SelectItem>
                <SelectItem value="profile_updated">Profile Updated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters to see more activities."
                  : "Start using KaziNest to see your activity history here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const IconComponent = getActivityIcon(activity.activity_type)
                const colorClass = getActivityColor(activity.activity_type)

                return (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatActivityType(activity.activity_type)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(activity.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                          {activity.metadata.template_name && (
                            <span className="inline-block mr-3">Template: {activity.metadata.template_name}</span>
                          )}
                          {activity.metadata.amount && (
                            <span className="inline-block mr-3">Amount: KSh {activity.metadata.amount}</span>
                          )}
                          {activity.metadata.job_title && (
                            <span className="inline-block mr-3">Job: {activity.metadata.job_title}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
