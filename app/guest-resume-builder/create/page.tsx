"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

const GuestResumeBuilderContent = dynamic(() => import("./guest-resume-builder-content"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
})

export default function GuestResumeBuilderPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <GuestResumeBuilderContent />
    </Suspense>
  )
}
