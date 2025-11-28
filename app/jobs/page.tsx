"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
  ExternalLink,
  Globe,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Building,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JobApplicationModal } from "@/components/job-application-modal"
import { checkUsageLimit } from "@/lib/access-control"
import { useAuth } from "@/contexts/auth-context"
import { Label } from "@/components/ui/label"

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary_min?: number
  salary_max?: number
  salary?: string
  job_type: string
  type?: string
  experience_level: string
  description: string
  requirements: string[]
  benefits: string[]
  posted_date: string
  application_url?: string
  company_logo?: string
  is_remote: boolean
  category: string
  skills?: string[]
}

const JOBS_PER_PAGE = 10

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [experienceFilter, setExperienceFilter] = useState("all")
  const [salaryRangeFilter, setSalaryRangeFilter] = useState("all")
  const [skillsFilter, setSkillsFilter] = useState("")

  const [usageData, setUsageData] = useState<any>(null)
  const router = useRouter()
  const { user } = useAuth()

  const getLocations = () => {
    const locations = new Set<string>()
    jobs.forEach((job) => locations.add(job.location))
    return Array.from(locations).sort()
  }

  const getJobCategories = () => {
    const categories = new Set<string>()
    jobs.forEach((job) => categories.add(job.category))
    return Array.from(categories).sort()
  }

  const getJobTypes = () => {
    const types = new Set<string>()
    jobs.forEach((job) => types.add(job.job_type))
    return Array.from(types).sort()
  }

  const getExperienceLevels = () => {
    const levels = new Set<string>()
    jobs.forEach((job) => levels.add(job.experience_level))
    return Array.from(levels).sort()
  }

  const resetFilters = () => {
    setSearchTerm("")
    setLocationFilter("")
    setCategoryFilter("all")
    setTypeFilter("all")
    setExperienceFilter("all")
    setSalaryRangeFilter("all")
    setSkillsFilter("")
  }

  const openJobDetails = (job: Job) => {
    console.log("[v0] Opening job details for:", job.title)
    setSelectedJob(job)
    setIsModalOpen(true)
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadJobs()
    const fetchUsage = async () => {
      if (user?.id) {
        const data = await checkUsageLimit(user.id, "ats_checks")
        setUsageData(data)
      }
    }
    fetchUsage()
  }, [user?.id])

  const loadJobs = async () => {
    try {
      console.log("[v0] Fetching jobs from API...")
      const response = await fetch("/api/jobs")
      if (!response.ok) {
        throw new Error("Failed to fetch jobs")
      }
      const jobsData = await response.json()
      console.log("[v0] Jobs received:", jobsData.length)

      // Normalize data structure
      const normalizedJobs = jobsData.map((job: any) => ({
        ...job,
        job_type: job.job_type || job.type || "Full-time",
        salary: job.salary || (job.salary_min ? `$${job.salary_min} - $${job.salary_max}` : "Competitive"),
        skills: job.skills || job.skills_required || [],
      }))
      setJobs(normalizedJobs)
    } catch (error) {
      console.error("[v0] Error loading jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter Logic
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLocation =
      !locationFilter || locationFilter === "all" || job.location.toLowerCase().includes(locationFilter.toLowerCase())
    const matchesCategory = categoryFilter === "all" || job.category.toLowerCase() === categoryFilter.toLowerCase()
    const matchesType = typeFilter === "all" || job.job_type.toLowerCase() === typeFilter.toLowerCase()
    const matchesExperience =
      experienceFilter === "all" || job.experience_level.toLowerCase() === experienceFilter.toLowerCase()

    const matchesSkills =
      !skillsFilter ||
      (job.skills && job.skills.some((skill) => skill.toLowerCase().includes(skillsFilter.toLowerCase())))

    let matchesSalaryRange = true
    if (salaryRangeFilter !== "all") {
      const [min, max] = salaryRangeFilter.split("-").map((s) => s.replace("k", "000").replace("+", "999999"))
      const jobSalaryNumeric = job.salary_min || (job.salary ? Number.parseInt(job.salary.replace(/[^0-9-]/g, ''), 10) : 0)
      
      if (jobSalaryNumeric) {
        matchesSalaryRange = jobSalaryNumeric >= Number.parseInt(min) && jobSalaryNumeric <= Number.parseInt(max)
      } else {
        matchesSalaryRange = false
      }
    }

    return (
      matchesSearch &&
      matchesLocation &&
      matchesCategory &&
      matchesType &&
      matchesExperience &&
      matchesSkills &&
      matchesSalaryRange
    )
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE
  const endIndex = startIndex + JOBS_PER_PAGE
  const currentJobs = filteredJobs.slice(startIndex, endIndex)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, locationFilter, categoryFilter, typeFilter, experienceFilter, salaryRangeFilter, skillsFilter])

  const formatSalary = (job: Job) => {
    if (job.salary) return job.salary
    if (job.salary_min && job.salary_max)
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
    return "Competitive salary"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Recently"
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  function renderHtmlContent(content: string, truncate = false) {
    const hasHtml = /<[^>]+>/g.test(content)

    if (hasHtml) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading African opportunities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-6 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">African Job Board</h1>
              <p className="text-sm text-gray-600 mt-0.5">
                Discover {jobs.length}+ curated opportunities across Africa
              </p>
            </div>
          </div>

          {usageData && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow-sm max-w-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-3.5 w-3.5 text-blue-700" />
                  <span className="text-xs font-medium text-blue-900">
                    Applications Tracked:{" "}
                    <span className="font-bold text-blue-700">
                      {usageData.current}/{usageData.limit === -1 ? "Unlimited" : usageData.limit}
                    </span>
                  </span>
                </div>
                {usageData.limit !== -1 && usageData.current >= usageData.limit && !usageData.isPro && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                    Limit Reached
                  </Badge>
                )}
              </div>
              {usageData.limit !== -1 && (
                <Progress value={(usageData.current / usageData.limit) * 100} className="h-1.5" />
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <Card className="sticky top-4 shadow-md border border-gray-200">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center font-bold text-gray-900">
                    <Filter className="h-4 w-4 mr-1.5 text-blue-600" />
                    Filters
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-7 px-2 text-xs font-medium hover:bg-white"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-3 pb-3 px-4">
                {/* Search */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="Job title, company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-sm border focus:border-blue-500"
                    />
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Location */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location
                  </Label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="h-8 text-sm border focus:border-blue-500">
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
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-8 text-sm border focus:border-blue-500">
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
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Job Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-8 text-sm border focus:border-blue-500">
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
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Experience</Label>
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger className="h-8 text-sm border focus:border-blue-500">
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
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Salary Range
                  </Label>
                  <Select value={salaryRangeFilter} onValueChange={setSalaryRangeFilter}>
                    <SelectTrigger className="h-8 text-sm border focus:border-blue-500">
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

                <Separator className="my-2" />

                {/* Skills */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Skills</Label>
                  <Input
                    placeholder="e.g., React, Python..."
                    value={skillsFilter}
                    onChange={(e) => setSkillsFilter(e.target.value)}
                    className="h-8 text-sm border focus:border-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                <TabsList className="bg-white border border-gray-200 shadow-sm h-9">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm px-3"
                  >
                    All Jobs ({filteredJobs.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="recent"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm px-3"
                  >
                    Recent
                  </TabsTrigger>
                  <TabsTrigger
                    value="featured"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm px-3"
                  >
                    Featured
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length}
                  </span>
                </div>
              </div>

              <TabsContent value="all" className="space-y-3">
                {currentJobs.length === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300 shadow-lg">
                    <CardContent className="pt-12 pb-12 text-center">
                      <div className="mx-auto h-12 w-12 text-gray-300 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">No jobs found</h3>
                      <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                        We couldn't find any jobs matching your criteria. Try adjusting your filters or search terms.
                      </p>
                      <Button
                        onClick={resetFilters}
                        variant="outline"
                        size="sm"
                        className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
                      >
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        Clear All Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {currentJobs.map((job) => (
                      <Card
                        key={job.id}
                        className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 bg-white"
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h3
                                    className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer mb-0.5"
                                    onClick={() => openJobDetails(job)}
                                  >
                                    {job.title}
                                  </h3>
                                  <div className="flex items-center text-sm text-gray-700 font-medium">
                                    <Building className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                                    <span>{job.company}</span>
                                  </div>
                                </div>
                                {job.company_logo && (
                                  <img
                                    src={job.company_logo || "/placeholder.svg"}
                                    alt={job.company}
                                    className="w-11 h-11 rounded-lg object-contain bg-gray-50 p-1.5 border border-gray-200 hidden md:block"
                                  />
                                )}
                              </div>

                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600 mt-3 mb-2.5">
                                <div className="flex items-center font-medium">
                                  <MapPin className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                                  {job.location}
                                </div>
                                <div className="flex items-center font-medium">
                                  <Briefcase className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                                  {job.job_type}
                                </div>
                                <div className="flex items-center font-medium text-green-700">
                                  <DollarSign className="h-3.5 w-3.5 mr-0.5" />
                                  {formatSalary(job)}
                                </div>
                                <div className="flex items-center font-medium">
                                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
                                  {formatDate(job.posted_date)}
                                </div>
                              </div>

                              <div className="mt-2.5">
                                <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                                  {renderHtmlContent(job.description, true)}
                                </p>
                              </div>

                              {job.skills && job.skills.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {job.skills.slice(0, 5).map((skill, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-[10px] px-2 py-0.5 font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                  {job.skills.length > 5 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-2 py-0.5 font-medium bg-gray-100 text-gray-600 border border-gray-200"
                                    >
                                      +{job.skills.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold px-2 py-0.5 border border-purple-200 text-purple-700 bg-purple-50"
                            >
                              {job.experience_level}
                            </Badge>
                            <div className="flex items-center gap-2">
                              {job.application_url && (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-xs border border-gray-300 hover:bg-gray-50 bg-transparent"
                                >
                                  <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Apply
                                  </a>
                                </Button>
                              )}
                              <Button
                                onClick={() => openJobDetails(job)}
                                size="sm"
                                className="h-8 px-4 text-xs bg-blue-600 hover:bg-blue-700 shadow-sm"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {totalPages > 1 && (
                      <Card className="mt-6 border border-gray-200 shadow-md">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs text-gray-600 font-medium">
                              Page <span className="font-bold text-gray-900">{currentPage}</span> of{" "}
                              <span className="font-bold text-gray-900">{totalPages}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="gap-1 border h-8 px-2.5 text-xs disabled:opacity-50"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
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
                                      className={`w-8 h-8 p-0 border text-xs font-bold ${
                                        pageNum === currentPage
                                          ? "bg-blue-600 hover:bg-blue-700 border-blue-600 shadow-sm"
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
                                className="gap-1 border h-8 px-2.5 text-xs disabled:opacity-50"
                              >
                                Next
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            <div className="text-xs text-gray-600 font-medium">
                              Showing <span className="font-bold text-gray-900">{currentJobs.length}</span> jobs
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-3">
                {filteredJobs
                  .sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime())
                  .slice(0, 10)
                  .map((job) => (
                    <Card
                      key={job.id}
                      className="overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-200"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3
                              className="text-base font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                              onClick={() => openJobDetails(job)}
                            >
                              {job.title}
                            </h3>
                            <div className="flex items-center text-gray-600 mt-1 text-sm">
                              <Building className="h-4 w-4 mr-1.5" />
                              {job.company}
                              <span className="mx-2">•</span>
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </div>
                          </div>
                          <Badge variant="outline">{job.job_type}</Badge>
                        </div>

                        <div className="mt-3 flex justify-between items-center">
                          <div className="text-sm text-gray-500">Posted {formatDate(job.posted_date)}</div>
                          <Button onClick={() => openJobDetails(job)} size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="featured" className="space-y-3">
                {filteredJobs
                  .filter(
                    (job) =>
                      job.category === "Technology" || job.category === "Engineering" || job.category === "Freelance",
                  )
                  .slice(0, 5)
                  .map((job) => (
                    <Card
                      key={job.id}
                      className="overflow-hidden border-blue-200 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="bg-blue-50/50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                          Featured Opportunity
                        </span>
                        <Badge className="bg-blue-600 hover:bg-blue-700 border-0 text-xs">Hot</Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3
                              className="text-lg font-bold text-gray-900 mb-1 cursor-pointer hover:text-blue-600"
                              onClick={() => openJobDetails(job)}
                            >
                              {job.title}
                            </h3>
                            <p className="text-gray-600 font-medium">{job.company}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-bold text-green-700">{formatSalary(job)}</div>
                            <div className="text-xs text-gray-500">{job.job_type}</div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {renderHtmlContent(job.description, true)}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex gap-1.5">
                            {job.skills?.slice(0, 3).map((skill, i) => (
                              <Badge key={i} variant="secondary" className="bg-gray-100 text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <Button onClick={() => openJobDetails(job)} size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {selectedJob && (
          <JobApplicationModal
            job={selectedJob as any}
            usageData={usageData || undefined}
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
          />
        )}
      </div>
    </div>
  )
}
