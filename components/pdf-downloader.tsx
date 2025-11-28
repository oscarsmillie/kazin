"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
// CRITICAL: Import the utility that handles the Save-Then-Generate flow
import { handleGenerateAndPreview } from "@/lib/pdf-flow-utils" 

interface PDFDownloaderProps {
    templateId: string
    resumeData: any // The current unsaved data object
    resumeTitle: string
    // CRITICAL: Ensure 'id' is available as the resumeId for the server
    id: string 
}

export default function PDFDownloader({ templateId, resumeData, resumeTitle, id: resumeId }: PDFDownloaderProps) {
    const [downloading, setDownloading] = useState(false)

    const downloadResumePDF = async () => {
        // Renamed 'id' to 'resumeId' in the props destructuring for clarity.
        if (!resumeId) { 
            toast.error("Resume ID is missing. Cannot save or download.")
            return
        }
        if (!templateId || !resumeData) {
            toast.error("Missing template or resume data.")
            return
        }

        setDownloading(true)
        try {
            // STEP 1: Call the unified client utility. 
            // This function handles the async flow: Save (to /api/save-resume) -> Generate (in /api/save-resume)
            const result = await handleGenerateAndPreview(
                resumeData,
                templateId,
                resumeTitle,
                resumeId // Pass the required resumeId
            )

            // The server returns pdfBase64Data and pdfFileName
            const { pdfBase64Data, pdfFileName } = result
            
            // STEP 2: Client-side decoding and download
            
            // Decode base64 PDF to blob
            const binaryString = atob(pdfBase64Data)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }
            const pdfBlob = new Blob([bytes], { type: "application/pdf" })

            const url = window.URL.createObjectURL(pdfBlob)
            const link = document.createElement("a")
            link.href = url
            // Use the file name provided by the server
            link.download = pdfFileName 
            
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success("Resume downloaded as PDF successfully!")
        } catch (error) {
            console.error("Error downloading PDF:", error)
            toast.error(error instanceof Error ? error.message : "Failed to download resume as PDF. Please try again.")
        } finally {
            setDownloading(false)
        }
    }

    return (
        <Button id={resumeId} onClick={downloadResumePDF} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
        </Button>
    )
}
