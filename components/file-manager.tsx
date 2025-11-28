"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Mail,
  FileCheck,
  Clock,
  Briefcase,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  Plus,
  MoreVertical,
  ExternalLink,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { generateWordDocument, downloadWordDocument } from "@/lib/document-generator"

interface FileItem {
  id: string
  title: string
  type: "resume" | "email" | "cover_letter" | "application"
  created_at: string
  updated_at: string
  status?: string
  content?: string
  metadata?: any
}

export function FileManager() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [files, setFiles] = useState<FileItem[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; file: FileItem | null }>({
    open: false,
    file: null,
  })
  const [viewDialog, setViewDialog] = useState<{ open: boolean; file: FileItem | null }>({
    open: false,
    file: null,
  })

  useEffect(() => {
    if (user) {
      fetchAllFiles()
    }
  }, [user])

  useEffect(() => {
    filterFiles()
  }, [files, searchTerm, activeTab])

  const fetchAllFiles = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_type")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()

      const isProfessional = subscription?.plan_type === "professional"

      const allFiles: FileItem[] = []

      // Fetch resumes - only if professional user
      if (isProfessional) {
        try {
          const { data: resumes, error: resumeError } = await supabase
            .from("resumes")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })

          if (resumeError) {
            console.error("Error fetching resumes:", resumeError)
          } else if (resumes) {
            allFiles.push(
              ...resumes.map((resume) => ({
                id: resume.id,
                title: resume.title || "Untitled Resume",
                type: "resume" as const,
                created_at: resume.created_at,
                updated_at: resume.updated_at,
                content: resume.content,
                metadata: {
                  template_name: resume.template_name,
                  template_id: resume.template_id,
                },
              })),
            )
          }
        } catch (error) {
          console.error("Resume fetch error:", error)
        }
      }

      // Fetch emails
      try {
        const { data: emails, error: emailError } = await supabase
          .from("emails")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })

        if (emailError) {
          console.error("Error fetching emails:", emailError)
        } else if (emails) {
          allFiles.push(
            ...emails.map((email) => ({
              id: email.id,
              title: email.title || email.subject || "Untitled Email",
              type: "email" as const,
              created_at: email.created_at,
              updated_at: email.updated_at,
              content: email.content,
              metadata: {
                subject: email.subject,
                recipient: email.recipient,
                purpose: email.purpose,
              },
            })),
          )
        }
      } catch (error) {
        console.error("Email fetch error:", error)
      }

      // Fetch cover letters
      try {
        const { data: coverLetters, error: coverLetterError } = await supabase
          .from("cover_letters")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })

        if (coverLetterError) {
          console.error("Error fetching cover letters:", coverLetterError)
        } else if (coverLetters) {
          allFiles.push(
            ...coverLetters.map((letter) => ({
              id: letter.id,
              title: letter.title || "Untitled Cover Letter",
              type: "cover_letter" as const,
              created_at: letter.created_at,
              updated_at: letter.updated_at,
              content: letter.content,
              metadata: {
                company: letter.company,
                position: letter.position,
              },
            })),
          )
        }
      } catch (error) {
        console.error("Cover letter fetch error:", error)
      }

      // Fetch job applications
      try {
        const { data: applications, error: applicationError } = await supabase
          .from("job_applications")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })

        if (applicationError) {
          console.error("Error fetching applications:", applicationError)
        } else if (applications) {
          allFiles.push(
            ...applications.map((app) => ({
              id: app.id,
              title: `${app.job_title || "Job Application"} at ${app.company_name || "Unknown Company"}`,
              type: "application" as const,
              created_at: app.created_at,
              updated_at: app.updated_at,
              status: app.status,
              content: app.notes,
              metadata: {
                company: app.company_name,
                position: app.job_title,
                status: app.status,
                application_date: app.application_date,
              },
            })),
          )
        }
      } catch (error) {
        console.error("Application fetch error:", error)
      }

      // Sort all files by updated_at
      allFiles.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

      setFiles(allFiles)
    } catch (error) {
      console.error("Error fetching files:", error)
      toast.error("Failed to load files")
    } finally {
      setLoading(false)
    }
  }

  const filterFiles = () => {
    let filtered = files

    // Filter by type
    if (activeTab !== "all") {
      filtered = filtered.filter((file) => file.type === activeTab)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (file) =>
          file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (file.metadata?.company && file.metadata.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (file.metadata?.position && file.metadata.position.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    setFilteredFiles(filtered)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "resume":
        return <FileText className="h-5 w-5 text-blue-600" />
      case "email":
        return <Mail className="h-5 w-5 text-purple-600" />
      case "cover_letter":
        return <FileCheck className="h-5 w-5 text-green-600" />
      case "application":
        return <Briefcase className="h-5 w-5 text-orange-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case "resume":
        return "Resume"
      case "email":
        return "Email"
      case "cover_letter":
        return "Cover Letter"
      case "application":
        return "Application"
      default:
        return "File"
    }
  }

  const handleFileAction = (action: string, file: FileItem) => {
    switch (action) {
      case "view":
        setViewDialog({ open: true, file })
        break
      case "edit":
        navigateToEdit(file)
        break
      case "download":
        handleDownload(file)
        break
      case "delete":
        setDeleteDialog({ open: true, file })
        break
    }
  }

  const navigateToEdit = (file: FileItem) => {
    try {
      switch (file.type) {
        case "resume":
          if (!file.metadata?.template_id) {
            toast.error("Resume must have a template. Please select a template first.")
            router.push("/resume-builder/templates")
            return
          }
          router.push(`/resume-builder/create?id=${file.id}`)
          break
        case "email":
          router.push(`/email-generator?id=${file.id}`)
          break
        case "cover_letter":
          router.push(`/cover-letter?id=${file.id}`)
          break
        case "application":
          router.push(`/applications/edit/${file.id}`)
          break
        default:
          toast.error("Unknown file type")
      }
    } catch (error) {
      console.error("Navigation error:", error)
      toast.error("Failed to open file for editing")
    }
  }

  const handleDownload = async (file: FileItem) => {
    try {
      if (file.type === "resume") {
        // Resumes download as PDF
        router.push(`/resume-builder/download/${file.id}`)
      } else if (file.content) {
        // Cover letters, emails, and applications download as Word documents
        const filename = `${file.title}` // Use file title as base filename
        const docTitle = `${getFileTypeLabel(file.type)} - ${file.title}`

        const blob = await generateWordDocument(file.content, docTitle)
        downloadWordDocument(blob, filename)

        toast.success(`${getFileTypeLabel(file.type)} downloaded as Word document!`)
      } else {
        toast.error("No content available for download")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download file")
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.file) return

    try {
      const { file } = deleteDialog
      let tableName = ""

      switch (file.type) {
        case "resume":
          tableName = "resumes"
          break
        case "email":
          tableName = "emails"
          break
        case "cover_letter":
          tableName = "cover_letters"
          break
        case "application":
          tableName = "job_applications"
          break
      }

      const { error } = await supabase.from(tableName).delete().eq("id", file.id).eq("user_id", user?.id)

      if (error) throw error

      // Remove from local state
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      setDeleteDialog({ open: false, file: null })

      // Log activity
      await supabase.from("user_activity").insert({
        user_id: user?.id,
        activity_type: "file_deleted",
        description: `Deleted ${getFileTypeLabel(file.type).toLowerCase()}: ${file.title}`,
        metadata: { file_type: file.type, file_id: file.id },
        created_at: new Date().toISOString(),
      })

      toast.success(`${getFileTypeLabel(file.type)} deleted successfully`)
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error("Failed to delete file. Please try again.")
    }
  }

  const createNewFile = (type: string) => {
    switch (type) {
      case "resume":
        router.push("/resume-builder/templates")
        break
      case "email":
        router.push("/email-generator")
        break
      case "cover_letter":
        router.push("/cover-letter")
        break
      case "application":
        router.push("/job-board")
        break
    }
  }

  const getTabCount = (type: string) => {
    if (type === "all") return files.length
    return files.filter((file) => file.type === type).length
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>File Manager</CardTitle>
            <CardDescription>Manage all your resumes, emails, cover letters, and applications</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <span>All</span>
              <Badge variant="secondary" className="text-xs">
                {getTabCount("all")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="resume" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Resumes</span>
              <Badge variant="secondary" className="text-xs">
                {getTabCount("resume")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Emails</span>
              <Badge variant="secondary" className="text-xs">
                {getTabCount("email")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="cover_letter" className="flex items-center space-x-2">
              <FileCheck className="h-4 w-4" />
              <span>Letters</span>
              <Badge variant="secondary" className="text-xs">
                {getTabCount("cover_letter")}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="application" className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4" />
              <span>Applications</span>
              <Badge variant="secondary" className="text-xs">
                {getTabCount("application")}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading files...</div>
            ) : filteredFiles.length > 0 ? (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 truncate">{file.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {getFileTypeLabel(file.type)}
                          </Badge>
                          {file.status && (
                            <Badge variant="secondary" className="text-xs">
                              {file.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Modified {formatDate(file.updated_at)}</span>
                          {file.metadata?.company && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{file.metadata.company}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleFileAction("view", file)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleFileAction("edit", file)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleFileAction("download", file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleFileAction("view", file)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFileAction("edit", file)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFileAction("download", file)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFileAction("delete", file)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <div className="mb-4">
                  {activeTab === "all" ? (
                    <FileText className="h-12 w-12 mx-auto text-gray-400" />
                  ) : (
                    <div className="flex justify-center">{getFileIcon(activeTab)}</div>
                  )}
                </div>
                <p className="text-lg font-medium mb-2">
                  {searchTerm
                    ? `No files found matching "${searchTerm}"`
                    : `No ${activeTab === "all" ? "files" : getFileTypeLabel(activeTab).toLowerCase() + "s"} yet`}
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : `Create your first ${activeTab === "all" ? "file" : getFileTypeLabel(activeTab).toLowerCase()}`}
                </p>
                {!searchTerm && (
                  <div className="flex justify-center space-x-2">
                    {activeTab === "all" ? (
                      <>
                        <Button variant="outline" onClick={() => createNewFile("resume")}>
                          <Plus className="h-4 w-4 mr-2" />
                          New Resume
                        </Button>
                        <Button variant="outline" onClick={() => createNewFile("email")}>
                          <Plus className="h-4 w-4 mr-2" />
                          New Email
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" onClick={() => createNewFile(activeTab)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create {getFileTypeLabel(activeTab)}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* View File Dialog */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, file: null })}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewDialog.file && getFileIcon(viewDialog.file.type)}
              {viewDialog.file?.title}
            </DialogTitle>
            <DialogDescription>
              {viewDialog.file && getFileTypeLabel(viewDialog.file.type)} • Created{" "}
              {viewDialog.file && formatDate(viewDialog.file.created_at)}
            </DialogDescription>
          </DialogHeader>

          {viewDialog.file && (
            <div className="space-y-4">
              {/* Metadata */}
              {viewDialog.file.metadata && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {viewDialog.file.metadata.company && (
                      <div>
                        <strong>Company:</strong> {viewDialog.file.metadata.company}
                      </div>
                    )}
                    {viewDialog.file.metadata.position && (
                      <div>
                        <strong>Position:</strong> {viewDialog.file.metadata.position}
                      </div>
                    )}
                    {viewDialog.file.metadata.subject && (
                      <div>
                        <strong>Subject:</strong> {viewDialog.file.metadata.subject}
                      </div>
                    )}
                    {viewDialog.file.metadata.recipient && (
                      <div>
                        <strong>Recipient:</strong> {viewDialog.file.metadata.recipient}
                      </div>
                    )}
                    {viewDialog.file.status && (
                      <div>
                        <strong>Status:</strong> {viewDialog.file.status}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              {viewDialog.file.content && (
                <div>
                  <h4 className="font-medium mb-2">Content</h4>
                  <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-sans">{viewDialog.file.content}</pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => navigateToEdit(viewDialog.file!)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => handleDownload(viewDialog.file!)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {viewDialog.file.type === "resume" && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/resume-builder/preview/${viewDialog.file!.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, file: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialog.file ? getFileTypeLabel(deleteDialog.file.type) : "File"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.file?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
