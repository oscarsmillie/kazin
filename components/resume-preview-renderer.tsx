"use client"

import { useEffect, useState } from "react"

interface ResumePreviewRendererProps {
  previewHtml: string
  zoom: number
}

export default function ResumePreviewRenderer({ previewHtml, zoom }: ResumePreviewRendererProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !previewHtml) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p>Loading preview...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        transform: `scale(${zoom / 100})`,
        transformOrigin: "top left",
        display: "inline-block",
        width: "210mm",
        /* Added CSS isolation to prevent resume template styles from affecting parent UI */
        isolation: "isolate",
      }}
    >
      <div
        dangerouslySetInnerHTML={{ __html: previewHtml }}
        style={{
          width: "210mm",
          height: "297mm",
          /* Isolate styles within this container */
          isolation: "isolate",
        }}
      />
    </div>
  )
}
