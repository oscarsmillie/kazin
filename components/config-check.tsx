"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react"
import { isSupabaseConfigured, debugSupabaseConfig, client } from "@/lib/supabase"

interface ConfigStatus {
  supabaseUrl: boolean
  supabaseAnonKey: boolean
  supabaseServiceKey: boolean
  databaseConnection: boolean
  storageConnection: boolean
  templatesCount: number
  thumbnailsCount: number
}

export default function ConfigCheck() {
  const [status, setStatus] = useState<ConfigStatus>({
    supabaseUrl: false,
    supabaseAnonKey: false,
    supabaseServiceKey: false,
    databaseConnection: false,
    storageConnection: false,
    templatesCount: 0,
    thumbnailsCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkConfiguration = async () => {
    setIsLoading(true)

    // Check environment variables
    const supabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    let databaseConnection = false
    let storageConnection = false
    let templatesCount = 0
    let thumbnailsCount = 0

    // Test database connection
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await client.from("users").select("count", { count: "exact", head: true })
        databaseConnection = !error
        console.log("Database connection test:", databaseConnection ? "✅" : "❌", error?.message)
      } catch (error) {
        console.error("Database connection error:", error)
      }

      // Test storage connection and count templates
      try {
        const { data: templates, error: templatesError } = await client.storage
          .from("templates")
          .list("", { limit: 100 })

        if (!templatesError && templates) {
          storageConnection = true
          templatesCount = templates.filter((file) => file.name.endsWith(".html")).length
          console.log("Storage connection test: ✅")
          console.log("HTML templates found:", templatesCount)
        }

        const { data: thumbnails, error: thumbnailsError } = await client.storage
          .from("templates")
          .list("thumbnails", { limit: 100 })

        if (!thumbnailsError && thumbnails) {
          thumbnailsCount = thumbnails.filter((file) => file.name.includes("thumb")).length
          console.log("Thumbnails found:", thumbnailsCount)
        }
      } catch (error) {
        console.error("Storage connection error:", error)
      }
    }

    setStatus({
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceKey,
      databaseConnection,
      storageConnection,
      templatesCount,
      thumbnailsCount,
    })

    setLastChecked(new Date())
    setIsLoading(false)
  }

  useEffect(() => {
    checkConfiguration()
    debugSupabaseConfig()
  }, [])

  const getStatusIcon = (isOk: boolean) => {
    return isOk ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (isOk: boolean) => {
    return <Badge variant={isOk ? "default" : "destructive"}>{isOk ? "OK" : "FAIL"}</Badge>
  }

  const allConfigured = Object.values(status).every(Boolean)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuration Check</h1>
        <p className="text-gray-600">Verify your Supabase setup and environment configuration</p>
        {lastChecked && <p className="text-sm text-gray-500 mt-2">Last checked: {lastChecked.toLocaleString()}</p>}
      </div>

      <div className="grid gap-6">
        {/* Overall Status */}
        <Alert className={allConfigured ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {allConfigured ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            <strong>{allConfigured ? "✅ All systems operational!" : "❌ Configuration issues detected"}</strong>
            <br />
            {allConfigured
              ? "Your application is properly configured and ready to use."
              : "Please fix the issues below to enable full functionality."}
          </AlertDescription>
        </Alert>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Environment Variables
              {getStatusIcon(status.supabaseUrl && status.supabaseAnonKey)}
            </CardTitle>
            <CardDescription>Required environment variables for Supabase integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_SUPABASE_URL</span>
              {getStatusBadge(status.supabaseUrl)}
            </div>
            <div className="flex items-center justify-between">
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              {getStatusBadge(status.supabaseAnonKey)}
            </div>
            <div className="flex items-center justify-between">
              <span>SUPABASE_SERVICE_ROLE_KEY</span>
              {getStatusBadge(status.supabaseServiceKey)}
            </div>
          </CardContent>
        </Card>

        {/* Connection Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Connection Tests
              {getStatusIcon(status.databaseConnection && status.storageConnection)}
            </CardTitle>
            <CardDescription>Live connection tests to Supabase services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Database Connection</span>
              {getStatusBadge(status.databaseConnection)}
            </div>
            <div className="flex items-center justify-between">
              <span>Storage Connection</span>
              {getStatusBadge(status.storageConnection)}
            </div>
          </CardContent>
        </Card>

        {/* Template Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Template Resources
              {getStatusIcon(status.templatesCount > 0 && status.thumbnailsCount > 0)}
            </CardTitle>
            <CardDescription>HTML templates and thumbnail images in storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>HTML Templates</span>
              <Badge variant={status.templatesCount > 0 ? "default" : "secondary"}>{status.templatesCount} found</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Thumbnail Images</span>
              <Badge variant={status.thumbnailsCount > 0 ? "default" : "secondary"}>
                {status.thumbnailsCount} found
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        {!allConfigured && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Setup Instructions
              </CardTitle>
              <CardDescription>Follow these steps to configure your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">1. Set Environment Variables in Vercel</h4>
                <p className="text-sm text-gray-600">
                  Go to your Vercel dashboard → Project Settings → Environment Variables
                </p>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                  <div>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</div>
                  <div>SUPABASE_SERVICE_ROLE_KEY=your_service_role_key</div>
                </div>

                <h4 className="font-semibold mt-4">2. Upload Templates to Supabase Storage</h4>
                <p className="text-sm text-gray-600">
                  Create a 'templates' bucket and upload HTML templates and thumbnails
                </p>

                <h4 className="font-semibold mt-4">3. Redeploy Your Application</h4>
                <p className="text-sm text-gray-600">After setting environment variables, trigger a new deployment</p>
              </div>

              <Button asChild className="w-full">
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Open Vercel Dashboard
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={checkConfiguration} disabled={isLoading} className="flex items-center gap-2">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recheck Configuration
          </Button>
        </div>
      </div>
    </div>
  )
}
