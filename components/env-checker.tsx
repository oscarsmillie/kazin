"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EnvVar {
  name: string
  value: string | undefined
  required: boolean
}

export function EnvironmentChecker() {
  const [envStatus, setEnvStatus] = useState<{
    missing: EnvVar[]
    present: EnvVar[]
    checked: boolean
  }>({
    missing: [],
    present: [],
    checked: false,
  })

  useEffect(() => {
    // Define required environment variables
    const requiredEnvVars: EnvVar[] = [
      { name: "NEXT_PUBLIC_SUPABASE_URL", value: process.env.NEXT_PUBLIC_SUPABASE_URL, required: true },
      { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, required: true },
      { name: "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY", value: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, required: false },
    ]

    // Check which ones are missing
    const missing = requiredEnvVars.filter((envVar) => !envVar.value && envVar.required)
    const present = requiredEnvVars.filter((envVar) => !!envVar.value)

    setEnvStatus({
      missing,
      present,
      checked: true,
    })
  }, [])

  if (!envStatus.checked) {
    return null
  }

  if (envStatus.missing.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50 mb-4">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Environment Ready</AlertTitle>
        <AlertDescription className="text-green-700">
          All required environment variables are configured.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 mb-4">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Missing Environment Variables</AlertTitle>
      <AlertDescription className="text-orange-700">
        <p className="mb-2">The following required environment variables are missing:</p>
        <ul className="list-disc pl-5">
          {envStatus.missing.map((envVar) => (
            <li key={envVar.name}>{envVar.name}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
