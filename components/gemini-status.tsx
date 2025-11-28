"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function GeminiStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/gemini")
        const data = await response.json()

        if (data.success) {
          setStatus("connected")
        } else {
          setStatus("error")
          setError(data.error || "Connection failed")
        }
      } catch (err: any) {
        setStatus("error")
        setError(err.message || "Connection failed")
      }
    }

    checkStatus()
  }, [])

  if (status === "checking") {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking Gemini...
      </Badge>
    )
  }

  if (status === "connected") {
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle className="h-3 w-3" />
        Gemini Connected
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="flex items-center gap-1" title={error}>
      <AlertCircle className="h-3 w-3" />
      Gemini Error
    </Badge>
  )
}
