"use client"

import { Progress } from "@/components/ui/progress"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Briefcase,
  MapPin,
  Calendar,
  Search,
  Building,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Filter,
  X,
  Globe,
  Flame,
} from "lucide-react"
import { JobApplicationModal } from "@/components/job-application-modal"
import { checkUsageLimit } from "@/lib/access-control"
import { useAuth } from "@/contexts/auth-context"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

function renderHtmlContent(content: string, truncate = false) {
  const hasHtml = /<[^>]+>/g.test(content)

  if (hasHtml) {
    // Strip HTML tags for display in cards
    const strippedContent = content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    if (truncate) {
      return strippedContent.length > 150 ? strippedContent.substring(0, 150) + "..." : strippedContent
    }
    return strippedContent
  }

  if (truncate) {
    return content.length > 150 ? content.substring(0, 150) + "..." : content
  }
  return content
}

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  description: string
  requirements: string[]
  posted_date: string
  deadline: string
  category: string
  experience_level: string
  skills: string[]
  company_logo?: string
  application_url?: string
}

interface UserProfile {
  job_title?: string
  skills?: string[]
  location?: string
  bio?: string
}

const JOBS_PER_PAGE = 10

export default function JobBoardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [experienceFilter, setExperienceFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [salaryRangeFilter, setSalaryRangeFilter] = useState<string>("all")
  const [skillsFilter, setSkillsFilter] = useState<string>("")

  const [currentPage, setCurrentPage] = useState(1)
  const [usageData, setUsageData] = useState<{ current: number; limit: number; isPro: boolean } | null>(null)

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [aiRecommendedJobs, setAiRecommendedJobs] = useState<Job[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  const fetchUserProfile = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("job_title, skills, location, bio")
        .eq("id", user.id)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (err) {
      console.error("Error fetching user profile:", err)
    }
  }, [user])

  const generateAiRecommendations = useCallback(() => {
    if (!userProfile || jobs.length === 0) {
      setAiRecommendedJobs([])
      return
    }

    setLoadingRecommendations(true)

    const profileSkills = userProfile.skills || []
    const profileTitle = userProfile.job_title?.toLowerCase() || ""
    const profileLocation = userProfile.location?.toLowerCase() || ""
    const profileBio = userProfile.bio?.toLowerCase() || ""

    // Score each job based on profile match
    const scoredJobs = jobs.map((job) => {
      let score = 0

      // Match skills (highest weight)
      if (job.skills && profileSkills.length > 0) {
        const jobSkillsLower = job.skills.map((s) => s.toLowerCase())
        const matchedSkills = profileSkills.filter((skill) =>
          jobSkillsLower.some((js) => js.includes(skill.toLowerCase()) || skill.toLowerCase().includes(js)),
        )
        score += matchedSkills.length * 10
      }

      // Match job title
      if (profileTitle && job.title) {
        const titleWords = profileTitle.split(/\s+/)
        titleWords.forEach((word) => {
          if (word.length > 2 && job.title.toLowerCase().includes(word)) {
            score += 8
          }
        })
      }

      // Match location
      if (profileLocation && job.location) {
        if (job.location.toLowerCase().includes(profileLocation) || job.location.toLowerCase() === "remote") {
          score += 5
        }
      }

      // Match category/industry from bio
      if (profileBio && job.category) {
        if (profileBio.includes(job.category.toLowerCase())) {
          score += 3
        }
      }

      // Match description keywords
      if (profileTitle && job.description) {
        const titleWords = profileTitle.split(/\s+/)
        titleWords.forEach((word) => {
          if (word.length > 3 && job.description.toLowerCase().includes(word)) {
            score += 2
          }
        })
      }

      return { job, score }
    })

    // Sort by score and take top matches
    const recommended = scoredJobs
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((item) => item.job)

    setAiRecommendedJobs(recommended)
    setLoadingRecommendations(false)
  }, [userProfile, jobs])

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/jobs")
        if (!response.ok) {
          throw new Error("Failed to fetch jobs")
        }
        const jobsData = await response.json()
        setJobs(jobsData)
        setFilteredJobs(jobsData)
        setCurrentPage(1)

        if (user) {
          const usageCheck = await checkUsageLimit(user.id, "ats_checks")
          setUsageData({
            current: usageCheck.current,
            limit: usageCheck.limit,
            isPro: usageCheck.planType === "professional",
          })
        }
      } catch (err) {
        console.error("Error fetching jobs:", err)
        setError("Failed to load jobs. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [user])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  useEffect(() => {
    generateAiRecommendations()
  }, [generateAiRecommendations])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, categoryFilter, typeFilter, experienceFilter, locationFilter, salaryRangeFilter, skillsFilter, jobs])

  const applyFilters = () => {
    let result = [...jobs]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term) ||
          job.skills.some((skill) => skill.toLowerCase().includes(term)),
      )
    }

    if (categoryFilter !== "all") {
      result = result.filter((job) => job.category === categoryFilter)
    }

    if (typeFilter !== "all") {
      result = result.filter((job) => job.type.toLowerCase() === typeFilter.toLowerCase())
    }

    if (experienceFilter !== "all") {
      result = result.filter((job) => job.experience_level.toLowerCase() === experienceFilter.toLowerCase())
    }

    if (locationFilter !== "all") {
      result = result.filter(
        (job) =>
          job.location.toLowerCase().includes(locationFilter.toLowerCase()) || job.location.toLowerCase() === "remote",
      )
    }

    if (salaryRangeFilter !== "all") {
      result = result.filter((job) => {
        if (!job.salary) return false
        const salaryLower = job.salary.toLowerCase()
        switch (salaryRangeFilter) {
          case "0-50k":
            return (
              salaryLower.includes("0") ||
              salaryLower.includes("1") ||
              salaryLower.includes("2") ||
              salaryLower.includes("3") ||
              salaryLower.includes("4")
            )
          case "50k-100k":
            return (
              salaryLower.includes("50") ||
              salaryLower.includes("60") ||
              salaryLower.includes("70") ||
              salaryLower.includes("80") ||
              salaryLower.includes("90")
            )
          case "100k-150k":
            return (
              salaryLower.includes("100") ||
              salaryLower.includes("110") ||
              salaryLower.includes("120") ||
              salaryLower.includes("130") ||
              salaryLower.includes("140")
            )
          case "150k+":
            return (
              salaryLower.includes("150") ||
              salaryLower.includes("160") ||
              salaryLower.includes("200") ||
              salaryLower.includes("250")
            )
          default:
            return true
        }
      })
    }

    if (skillsFilter) {
      const skillTerm = skillsFilter.toLowerCase()
      result = result.filter((job) => job.skills.some((skill) => skill.toLowerCase().includes(skillTerm)))
    }

    setFilteredJobs(result)
    setCurrentPage(1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  const resetFilters = () => {
    setSearchTerm("")
    setCategoryFilter("all")
    setTypeFilter("all")
    setExperienceFilter("all")
    setLocationFilter("all")
    setSalaryRangeFilter("all")
    setSkillsFilter("")
    setCurrentPage(1)
  }

  const openJobDetails = (job: Job) => {
    setSelectedJob(job)
    setIsModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getJobCategories = () => {
    const categories = new Set(jobs.map((job) => job.category).filter(Boolean))
    return Array.from(categories).sort()
  }

  const getJobTypes = () => {
    const types = new Set(jobs.map((job) => job.type).filter(Boolean))
    return Array.from(types).sort()
  }

  const getExperienceLevels = () => {
    const levels = new Set(jobs.map((job) => job.experience_level).filter(Boolean))
    return Array.from(levels).sort()
  }

  const getLocations = () => {
    const locations = new Set(jobs.map((job) => job.location).filter((loc) => loc && loc !== "Remote"))
    const locArray = Array.from(locations).sort()
    return locArray.length > 0 ? ["Remote", ...locArray] : ["Remote"]
  }

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE
  const endIndex = startIndex + JOBS_PER_PAGE
  const currentJobs = filteredJobs.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading opportunities...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-4">
          <Card className="max-w-md mx-auto mt-20 border-red-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-red-500 mb-4">
                  <X className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Jobs</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const JobCard = ({ job, featured = false }: { job: Job; featured?: boolean }) => (
    <Card
      className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-2 ${
        featured
          ? "border-orange-200 bg-gradient-to-r from-orange-50 to-white"
          : "border-gray-100 hover:border-blue-300 bg-white"
      }`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {featured && (
                  <div className="flex items-center gap-1 mb-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-semibold text-orange-600 uppercase">AI Recommended</span>
                  </div>
                )}
                <h3
                  className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer mb-1"
                  onClick={() => openJobDetails(job)}
                >
                  {job.title}
                </h3>
                <div className="flex items-center text-gray-700 font-medium">
                  <Building className="h-4 w-4 mr-2 text-blue-600" />
                  <span>{job.company}</span>
                </div>
              </div>
              {job.company_logo && (
                <img
                  src={job.company_logo || "/placeholder.svg"}
                  alt={job.company}
                  className="w-14 h-14 rounded-lg object-contain bg-gray-50 p-2 border-2 border-gray-200 hidden md:block"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 mt-4 mb-4">
              <div className="flex items-center font-medium">
                <MapPin className="h-4 w-4 mr-1.5 text-blue-500" />
                {job.location}
              </div>
              <div className="flex items-center font-medium">
                <Briefcase className="h-4 w-4 mr-1.5 text-green-500" />
                {job.type}
              </div>
              <div className="flex items-center font-medium text-green-700">
                <DollarSign className="h-4 w-4 mr-1.5" />
                {job.salary}
              </div>
              <div className="flex items-center font-medium">
                <Calendar className="h-4 w-4 mr-1.5 text-purple-500" />
                {formatDate(job.posted_date)}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-gray-700 text-sm line-clamp-2 leading-relaxed">
                {renderHtmlContent(job.description, true)}
              </p>
            </div>

            {job.skills && job.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.slice(0, 5).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                  >
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 5 && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                  >
                    +{job.skills.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t-2 border-gray-100 flex items-center justify-between">
          <Badge
            variant="outline"
            className="text-xs font-semibold px-3 py-1 border-2 border-purple-200 text-purple-700 bg-purple-50"
          >
            {job.experience_level}
          </Badge>
          <Button
            onClick={() => openJobDetails(job)}
            size="sm"
            className="px-6 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-8 pt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">African Job Board</h1>
              <p className="text-gray-600 mt-1">Discover {jobs.length}+ curated opportunities across Africa</p>
            </div>
          </div>

          {usageData && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl shadow-sm max-w-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-blue-700" />
                  <span className="text-sm font-medium text-blue-900">
                    Applications Tracked:{" "}
                    <span className="font-bold text-blue-700">
                      {usageData.current}/{usageData.limit === -1 ? "Unlimited" : usageData.limit}
                    </span>
                  </span>
                </div>
                {usageData.limit !== -1 && usageData.current >= usageData.limit && !usageData.isPro && (
                  <Badge variant="destructive" className="text-xs">
                    Limit Reached
                  </Badge>
                )}
              </div>
              {usageData.limit !== -1 && (
                <Progress value={(usageData.current / usageData.limit) * 100} className="h-2" />
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-4 shadow-lg border-2 border-gray-100">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center font-bold text-gray-900">
                    <Filter className="h-5 w-5 mr-2 text-blue-600" />
                    Filters
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-8 px-3 text-xs font-medium hover:bg-white"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                {/* Search */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Job title, company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 border-2 focus:border-blue-500"
                    />
                  </div>
                </div>

                <Separator />

                {/* Location */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location
                  </Label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="border-2 focus:border-blue-500">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {getLocations().map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="border-2 focus:border-blue-500">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {getJobCategories().map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Job Type */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Job Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="border-2 focus:border-blue-500">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {getJobTypes().map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Experience</Label>
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger className="border-2 focus:border-blue-500">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {getExperienceLevels().map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Salary */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Salary Range
                  </Label>
                  <Select value={salaryRangeFilter} onValueChange={setSalaryRangeFilter}>
                    <SelectTrigger className="border-2 focus:border-blue-500">
                      <SelectValue placeholder="Any Salary" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Salary</SelectItem>
                      <SelectItem value="0-50k">$0 - $50k</SelectItem>
                      <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                      <SelectItem value="100k-150k">$100k - $150k</SelectItem>
                      <SelectItem value="150k+">$150k+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Skills */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Skills</Label>
                  <Input
                    placeholder="e.g., React, Python..."
                    value={skillsFilter}
                    onChange={(e) => setSkillsFilter(e.target.value)}
                    className="border-2 focus:border-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <TabsList className="bg-white border-2 border-gray-200 shadow-sm">
                  <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    All Jobs ({filteredJobs.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai-recommended"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    <Flame className="h-4 w-4 mr-1" />
                    AI For You ({aiRecommendedJobs.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="recent"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Recent
                  </TabsTrigger>
                  <TabsTrigger
                    value="featured"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Featured
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border-2 border-gray-200 shadow-sm">
                  <Briefcase className="h-4 w-4" />
                  <span className="font-medium">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length}
                  </span>
                </div>
              </div>

              <TabsContent value="all" className="space-y-4">
                {currentJobs.length === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300 shadow-lg">
                    <CardContent className="pt-16 pb-16 text-center">
                      <div className="mx-auto h-16 w-16 text-gray-300 mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        We couldn't find any jobs matching your criteria. Try adjusting your filters or search terms.
                      </p>
                      <Button
                        onClick={resetFilters}
                        variant="outline"
                        className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {currentJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}

                    {totalPages > 1 && (
                      <Card className="mt-8 border-2 border-gray-200 shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600 font-medium">
                              Page <span className="font-bold text-gray-900">{currentPage}</span> of{" "}
                              <span className="font-bold text-gray-900">{totalPages}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="gap-1 border-2 disabled:opacity-50"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                              </Button>

                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let pageNum = i + 1
                                  if (totalPages > 5) {
                                    if (currentPage > 3) {
                                      pageNum = currentPage - 2 + i
                                    }
                                    if (pageNum > totalPages) {
                                      pageNum = totalPages - 4 + i
                                    }
                                  }

                                  if (pageNum > totalPages || pageNum < 1) return null

                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={pageNum === currentPage ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={`w-10 h-10 p-0 border-2 font-bold ${
                                        pageNum === currentPage
                                          ? "bg-blue-600 hover:bg-blue-700 border-blue-600 shadow-md"
                                          : "hover:bg-blue-50 hover:border-blue-300"
                                      }`}
                                    >
                                      {pageNum}
                                    </Button>
                                  )
                                })}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="gap-1 border-2 disabled:opacity-50"
                              >
                                Next
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="text-sm text-gray-600 font-medium">
                              Showing <span className="font-bold text-gray-900">{currentJobs.length}</span> jobs
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="ai-recommended" className="space-y-4">
                {!user ? (
                  <Card className="border-2 border-dashed border-orange-300 shadow-lg">
                    <CardContent className="pt-16 pb-16 text-center">
                      <div className="mx-auto h-16 w-16 text-orange-400 mb-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <Flame className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in to see AI recommendations</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Our AI analyzes your profile skills, job title, and preferences to find the perfect job matches
                        for you.
                      </p>
                      <Button onClick={() => router.push("/login")} className="bg-orange-500 hover:bg-orange-600">
                        Sign In
                      </Button>
                    </CardContent>
                  </Card>
                ) : loadingRecommendations ? (
                  <Card className="border-2 border-orange-200 shadow-lg">
                    <CardContent className="pt-16 pb-16 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">Analyzing your profile for best matches...</p>
                    </CardContent>
                  </Card>
                ) : aiRecommendedJobs.length === 0 ? (
                  <Card className="border-2 border-dashed border-orange-300 shadow-lg">
                    <CardContent className="pt-16 pb-16 text-center">
                      <div className="mx-auto h-16 w-16 text-orange-400 mb-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <Flame className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Complete your profile for recommendations
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Add your job title, skills, and location to your profile settings to get personalized job
                        recommendations.
                      </p>
                      <Button
                        onClick={() => router.push("/settings")}
                        variant="outline"
                        className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                      >
                        Update Profile
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-orange-800">
                        <Flame className="h-5 w-5" />
                        <span className="font-semibold">AI-Powered Recommendations</span>
                      </div>
                      <p className="text-sm text-orange-700 mt-1">
                        Based on your profile: {userProfile?.job_title || "Your role"}
                        {userProfile?.skills &&
                          userProfile.skills.length > 0 &&
                          ` | Skills: ${userProfile.skills.slice(0, 3).join(", ")}`}
                        {userProfile?.location && ` | ${userProfile.location}`}
                      </p>
                    </div>
                    {aiRecommendedJobs.map((job) => (
                      <JobCard key={job.id} job={job} featured />
                    ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                {filteredJobs
                  .sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime())
                  .slice(0, 10)
                  .map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
              </TabsContent>

              <TabsContent value="featured" className="space-y-4">
                {filteredJobs
                  .filter(
                    (job) =>
                      job.category === "Technology" || job.category === "Engineering" || job.category === "Freelance",
                  )
                  .slice(0, 5)
                  .map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {selectedJob && (
          <JobApplicationModal
            job={selectedJob}
            usageData={usageData || undefined}
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
          />
        )}
      </div>
    </div>
  )
}
