"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, FileText } from "lucide-react"

interface Template {
  id: string
  name: string
  filename: string
  description?: string
}

const AVAILABLE_TEMPLATES: Template[] = [
  {
    id: "green-minimalist",
    name: "Green Minimalist",
    filename: "green-minimalist.htm",
    description: "Clean and modern design with green accents",
  },
  {
    id: "professional-blue",
    name: "Professional Blue",
    filename: "professional-blue.htm",
    description: "Corporate-style template with blue accents",
  },
  {
    id: "creative-orange",
    name: "Creative Orange",
    filename: "creative-orange.htm",
    description: "Creative design with orange highlights",
  },
]

export default function TemplateSwitcher() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [templateHTML, setTemplateHTML] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([])

  useEffect(() => {
    checkAvailableTemplates()
  }, [])

  const checkAvailableTemplates = async () => {
    try {
      const { data: files, error: listError } = await supabase.storage.from("templates").list()

      if (listError) {
        setError("Unable to load templates")
        return
      }

      const fileNames = files?.map((file) => file.name) || []
      const available = AVAILABLE_TEMPLATES.filter((t) => fileNames.includes(t.filename))
      setAvailableTemplates(available)

      // Auto-select first available template
      if (available.length > 0) {
        setSelectedTemplate(available[0].id)
        fetchTemplate(available[0].filename)
      }
    } catch (err) {
      setError("Failed to check templates")
    }
  }

  const fetchTemplate = async (filename: string) => {
    setLoading(true)
    setError("")

    try {
      const { data, error: downloadError } = await supabase.storage.from("templates").download(filename)

      if (downloadError) {
        throw new Error(`Failed to download template: ${downloadError.message}`)
      }

      if (!data) {
        throw new Error("No data received from storage")
      }

      const htmlContent = await data.text()

      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error("Template file is empty")
      }

      setTemplateHTML(htmlContent)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      setTemplateHTML("")
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = AVAILABLE_TEMPLATES.find((t) => t.id === templateId)

    if (template) {
      fetchTemplate(template.filename)
    }
  }

  const selectedTemplateInfo = AVAILABLE_TEMPLATES.find((t) => t.id === selectedTemplate)

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Template Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume Template Selector
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableTemplates.length > 0 ? (
              <div>
                <label className="block text-sm font-medium mb-2">Select a template:</label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Choose a resume template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          {template.description && (
                            <span className="text-xs text-gray-500">{template.description}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No templates available. Please contact support if this issue persists.
                </AlertDescription>
              </Alert>
            )}

            {selectedTemplateInfo && (
              <div className="text-sm text-gray-600">
                <strong>Selected:</strong> {selectedTemplateInfo.name}
                {selectedTemplateInfo.description && <span className="ml-2">- {selectedTemplateInfo.description}</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Template Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-gray-600">Loading template...</span>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error loading template:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && templateHTML && (
            <div className="w-full">
              {/* A4-like container */}
              <div
                className="mx-auto bg-white shadow-lg"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  maxWidth: "100%",
                  transform: "scale(0.8)",
                  transformOrigin: "top center",
                }}
              >
                <div
                  className="w-full h-full overflow-auto"
                  style={{ maxHeight: "80vh" }}
                  dangerouslySetInnerHTML={{ __html: templateHTML }}
                />
              </div>

              {/* Template info */}
              <div className="mt-4 text-center text-sm text-gray-500">
                Template: {selectedTemplateInfo?.name} | Size: {(templateHTML.length / 1024).toFixed(1)}KB
              </div>
            </div>
          )}

          {!loading && !error && !templateHTML && availableTemplates.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No templates available</p>
                <p className="text-sm">Please contact support</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
