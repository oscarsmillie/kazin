"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Crown, Eye, Download, AlertCircle, X } from "lucide-react"
import { getResumeTemplates } from "@/lib/templates"
import { getTemplateAccess } from "@/lib/access-control"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ResumeTemplate {
  id: string
  name: string
  description: string
  category: string
  is_premium: boolean
  is_active: boolean
  preview_image_url?: string
  thumbnail_url?: string
  download_count: number
  rating: number
}

export default function ResumeTemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<ResumeTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [templateAccess, setTemplateAccess] = useState<"basic" | "premium">("basic")
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Memoized categories to prevent re-renders
  const categories = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      { value: "entry-level", label: "Entry Level" },
      { value: "mid-level", label: "Mid Level" },
      { value: "professional", label: "Professional" },
    ],
    [],
  )

  useEffect(() => {
    fetchTemplates()
    if (user) {
      checkTemplateAccess()
    }
  }, [user])

  const fetchTemplates = async () => {
    try {
      setError(null)
      const templatesData = await getResumeTemplates(true) // Include premium templates
      setTemplates(templatesData)
      console.log(`✅ Loaded ${templatesData.length} templates`)
    } catch (error) {
      console.error("Error fetching templates:", error)
      setError(error instanceof Error ? error.message : "Failed to load templates")
    } finally {
      setIsLoading(false)
    }
  }

  const checkTemplateAccess = async () => {
    if (!user) return
    try {
      const access = await getTemplateAccess(user.id)
      setTemplateAccess(access)
    } catch (error) {
      console.error("Error checking template access:", error)
    }
  }

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || template.category === categoryFilter
      const hasAccess = templateAccess === "premium" || !template.is_premium
      return matchesSearch && matchesCategory && hasAccess
    })
  }, [templates, searchTerm, categoryFilter, templateAccess])

  const openPreview = (template: ResumeTemplate) => {
    setPreviewTemplate(template)
    setPreviewOpen(true)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchTemplates} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Resume Templates</h1>
        <p className="text-gray-600 mt-2">
          Choose from our collection of {templates.length} professional resume templates
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/resume-builder/guide"
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 font-medium"
          >
            <Eye className="h-4 w-4 mr-2" />
            How to Build a Great Resume
          </Link>
          {templateAccess === "basic" && (
            <Alert className="flex-1">
              <Crown className="h-4 w-4" />
              <AlertDescription>
                You have access to basic templates.{" "}
                <Link href="/pricing" className="underline">
                  Upgrade to Professional
                </Link>{" "}
                to unlock all premium templates.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No templates available"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className={`hover:shadow-lg transition-shadow relative overflow-hidden`}>
              <div className="bg-white rounded-lg">
                {template.is_premium && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}

                <div className="relative">
                  <div className="aspect-[3/4] bg-gray-100 rounded-t-lg overflow-hidden">
                    {template.thumbnail_url || template.preview_image_url ? (
                      <img
                        src={template.thumbnail_url || template.preview_image_url}
                        alt={template.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openPreview(template)}
                        style={{ display: "block" }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 cursor-pointer"
                        onClick={() => openPreview(template)}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Eye className="h-8 w-8 text-blue-600" />
                          </div>
                          <p className="text-sm text-gray-600">{template.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline" className="text-xs capitalize">
                      {template.category.replace("-", " ")}
                    </Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{template.download_count} downloads</span>
                    {template.rating > 0 && <span>★ {template.rating.toFixed(1)}</span>}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => openPreview(template)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/resume-builder/create?template=${template.id}`}>
                        <Download className="h-4 w-4 mr-2" />
                        Use Template
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Template Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {previewTemplate?.name}
                  {previewTemplate?.is_premium && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>{previewTemplate?.description}</DialogDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-4">
            {previewTemplate?.thumbnail_url || previewTemplate?.preview_image_url ? (
              <div className="bg-white border rounded-lg p-4 flex justify-center">
                <img
                  src={previewTemplate.thumbnail_url || previewTemplate.preview_image_url}
                  alt={previewTemplate.name}
                  className="max-w-full max-h-[600px] object-contain shadow-lg rounded"
                />
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Preview not available for this template</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button asChild>
              <Link href={`/resume-builder/create?template=${previewTemplate?.id}`}>
                <Download className="h-4 w-4 mr-2" />
                Use This Template
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popular Categories */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Experience Level</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.slice(1).map((category) => {
            const count = templates.filter((t) => t.category === category.value).length
            return (
              <Card
                key={category.value}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setCategoryFilter(category.value)}
              >
                <CardContent className="pt-6 text-center">
                  <h3 className="font-medium text-gray-900">{category.label}</h3>
                  <p className="text-sm text-gray-500">{count} templates</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {category.value === "entry-level" && "Perfect for new graduates and career starters"}
                    {category.value === "mid-level" && "Ideal for professionals with 2-8 years experience"}
                    {category.value === "professional" && "Designed for senior professionals and executives"}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
