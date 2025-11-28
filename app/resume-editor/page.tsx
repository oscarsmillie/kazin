"use client"

import { useState } from "react"
import ResumeEditor from "@/components/resume-editor"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import type { ResumeData } from "@/lib/template-types"

export default function ResumeEditorPage() {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (data: ResumeData) => {
    setIsSaving(true)

    try {
      // In a real implementation, you would save to your database here
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Resume Saved",
        description: "Your resume has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving resume:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save your resume. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <ResumeEditor onSave={handleSave} />
      <Toaster />
    </>
  )
}
