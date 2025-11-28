"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Download, Edit, Trash2, Sparkles } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Resume } from "@/lib/types"

export default function ResumesPage() {
  const { user } = useAuth()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchResumes()
    }
  }, [user])

  const fetchResumes = async () => {
    try {
      setLoading(true)

      // Fetch resumes with file data from storage
      const { data: resumeData, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (resumeError) {
        console.error("Error fetching resumes:", resumeError)
        throw resumeError
      }

      // For each resume, try to get the file from storage if it has a file_path
      const resumesWithFiles = await Promise.all(
        (resumeData || []).map(async (resume) => {
          if (resume.file_path) {
            try {
              const { data: fileData, error: fileError } = await supabase.storage
                .from("resumes")
                .download(resume.file_path)

              if (!fileError && fileData) {
                // Convert blob to text if it's HTML/text content
                const fileContent = await fileData.text()
                return {
                  ...resume,
                  file_content: fileContent,
                  file_size: fileData.size,
                }
              }
            } catch (error) {
              console.warn(`Could not fetch file for resume ${resume.id}:`, error)
            }
          }
          return resume
        }),
      )

      setResumes(resumesWithFiles)
    } catch (error) {
      console.error("Error fetching resumes:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteResume = async (id: string) => {
    try {
      // Get the resume to find its file path
      const resume = resumes.find((r) => r.id === id)

      // Delete from storage if file exists
      if (resume?.file_path) {
        const { error: storageError } = await supabase.storage.from("resumes").remove([resume.file_path])

        if (storageError) {
          console.warn("Error deleting file from storage:", storageError)
        }
      }

      // Delete from database
      const { error } = await supabase.from("resumes").delete().eq("id", id)

      if (error) throw error

      setResumes(resumes.filter((resume) => resume.id !== id))
    } catch (error) {
      console.error("Error deleting resume:", error)
    }
  }

  const setActiveResume = async (id: string) => {
    try {
      // First, set all resumes to inactive
      await supabase.from("resumes").update({ is_active: false }).eq("user_id", user?.id)

      // Then set the selected resume as active
      const { error } = await supabase.from("resumes").update({ is_active: true }).eq("id", id)

      if (error) throw error

      // Update local state
      setResumes(
        resumes.map((resume) => ({
          ...resume,
          is_active: resume.id === id,
        })),
      )
    } catch (error) {
      console.error("Error setting active resume:", error)
    }
  }

  const downloadResume = async (resume: Resume) => {
    try {
      if (resume.file_path) {
        // Download from storage
        const { data, error } = await supabase.storage.from("resumes").download(resume.file_path)

        if (error) throw error

        // Create download link
        const url = URL.createObjectURL(data)
        const a = document.createElement("a")
        a.href = url
        a.download = `${resume.title}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (resume.content) {
        // Fallback to content field
        const blob = new Blob([resume.content], { type: "text/html" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${resume.title}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error downloading resume:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
          <p className="text-gray-600 mt-2">Create and manage your AI-optimized resumes</p>
        </div>
        <Link href="/resumes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Resume
          </Button>
        </Link>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Create your first AI-powered resume to get started with your job search
            </p>
            <Link href="/resumes/new">
              <Button>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Your First Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <Card key={resume.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{resume.title}</CardTitle>
                  {resume.is_active && <Badge variant="default">Active</Badge>}
                </div>
                <CardDescription>
                  Created {new Date(resume.created_at).toLocaleDateString()}
                  {resume.file_size && (
                    <span className="ml-2 text-xs text-gray-500">({Math.round(resume.file_size / 1024)}KB)</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Link href={`/resumes/${resume.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => downloadResume(resume)}>
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </div>

                  <div className="flex space-x-2">
                    {!resume.is_active && (
                      <Button variant="outline" size="sm" onClick={() => setActiveResume(resume.id)}>
                        Set as Active
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteResume(resume.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Enhancement Card */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Sparkles className="mr-2 h-5 w-5" />
            AI-Powered Resume Enhancement
          </CardTitle>
          <CardDescription className="text-blue-700">
            Let our AI analyze and improve your resume for better job matching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-blue-800">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
              ATS optimization
            </div>
            <div className="flex items-center text-blue-800">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
              Keyword enhancement
            </div>
            <div className="flex items-center text-blue-800">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
              Industry-specific formatting
            </div>
          </div>
          <Link href="/resumes/ai-enhance">
            <Button className="mt-4">
              <Sparkles className="mr-2 h-4 w-4" />
              Enhance with AI
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
