"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Search, Eye, Download, AlertCircle, X } from "lucide-react"
import { getResumeTemplates } from "@/lib/templates"
import Link from "next/link"
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

export default function GuestTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ResumeTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

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
  }, [])

  const fetchTemplates = async () => {
    try {
      setError(null)
      const templatesData = await getResumeTemplates(true) // Include all templates
      setTemplates(templatesData)
      console.log(`✅ Loaded ${templatesData.length} templates`)
    } catch (error) {
      console.error("Error fetching templates:", error)
      setError(error instanceof Error ? error.message : "Failed to load templates")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || template.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [templates, searchTerm, categoryFilter])

  const handleSelectTemplate = (templateId: string) => {
    sessionStorage.setItem("guestTemplateId", templateId)
    router.push(`/guest-resume-builder/create?template=${templateId}`)
  }

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
        <div className="flex items-center gap-4 mb-4">
          <Link href="/guest-resume-builder">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Resume Templates</h1>
        </div>
        <p className="text-gray-600">Choose from our collection of {templates.length} professional resume templates</p>
        <div className="mt-4">
          <Alert>
            <AlertDescription>
              As a guest, you can build your resume for free. You'll only pay Ksh 199 when you download.{" "}
              <Link href="/auth/signup" className="underline font-medium">
                Sign up
              </Link>{" "}
              for Ksh 499/month to get 3 free downloads and save your resumes.
            </AlertDescription>
          </Alert>
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
            <Card key={template.id} className="hover:shadow-lg transition-shadow relative">
              {template.is_premium && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">Premium</Badge>
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
                  <Button size="sm" className="flex-1" onClick={() => handleSelectTemplate(template.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
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
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">Premium</Badge>
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
            <Button onClick={() => handleSelectTemplate(previewTemplate?.id || "")}>
              <Download className="h-4 w-4 mr-2" />
              Use This Template
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
