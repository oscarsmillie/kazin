"use client"

import { useState, useEffect } from "react"
import { Bug, X, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase, debugSupabaseConfig } from "@/lib/supabase"

interface ConfigStatus {
  supabaseUrl: string | undefined
  supabaseKey: string | undefined
  supabaseConnection: boolean
  storageAccess: boolean
  templatesCount: number
  thumbnailsCount: number
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<ConfigStatus>({
    supabaseUrl: undefined,
    supabaseKey: undefined,
    supabaseConnection: false,
    storageAccess: false,
    templatesCount: 0,
    thumbnailsCount: 0,
  })
  const [loading, setLoading] = useState(false)

  const checkConfiguration = async () => {
    setLoading(true)
    try {
      console.log("🔍 Starting configuration check...")

      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      console.log("Environment Variables:")
      console.log("- NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
      console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey ? "✅ Set" : "❌ Missing")

      let supabaseConnection = false
      let storageAccess = false
      let templatesCount = 0
      let thumbnailsCount = 0

      if (supabaseUrl && supabaseKey) {
        try {
          // Test database connection
          const { data, error } = await supabase.from("users").select("id").limit(1)
          supabaseConnection = !error
          console.log("Database connection:", supabaseConnection ? "✅ Success" : "❌ Failed", error?.message)

          // Test storage access
          const { data: storageData, error: storageError } = await supabase.storage.from("templates").list("", {
            limit: 1,
          })
          storageAccess = !storageError
          console.log("Storage access:", storageAccess ? "✅ Success" : "❌ Failed", storageError?.message)

          if (storageAccess) {
            // Count templates
            const { data: templates, error: templatesError } = await supabase.storage.from("templates").list("", {
              limit: 100,
            })
            if (!templatesError && templates) {
              templatesCount = templates.filter(
                (file) => file.name.endsWith(".htm") || file.name.endsWith(".html"),
              ).length
              console.log(`��� Found ${templatesCount} HTML templates`)
            }

            // Count thumbnails
            const { data: thumbnails, error: thumbnailsError } = await supabase.storage
              .from("templates")
              .list("thumbnails", {
                limit: 100,
              })
            if (!thumbnailsError && thumbnails) {
              thumbnailsCount = thumbnails.filter((file) => file.name.includes("thumb")).length
              console.log(`🖼️ Found ${thumbnailsCount} thumbnail images`)
            }
          }
        } catch (error) {
          console.error("Configuration check error:", error)
        }
      }

      setConfig({
        supabaseUrl,
        supabaseKey,
        supabaseConnection,
        storageAccess,
        templatesCount,
        thumbnailsCount,
      })

      // Call debug function
      debugSupabaseConfig()
    } catch (error) {
      console.error("Debug panel error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkConfiguration()
  }, [])

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {label}
      </Badge>
    )
  }

  return (
    <>
      {/* Debug Toggle Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-50 bg-white shadow-lg"
      >
        <Bug className="h-4 w-4" />
        Debug
      </Button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Configuration Debug Panel
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Checking configuration...</p>
                </div>
              ) : (
                <>
                  {/* Environment Variables */}
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Environment Variables
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
                        {getStatusBadge(!!config.supabaseUrl, config.supabaseUrl ? "Set" : "Missing")}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                        {getStatusBadge(!!config.supabaseKey, config.supabaseKey ? "Set" : "Missing")}
                      </div>
                      {config.supabaseUrl && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          URL: {config.supabaseUrl.substring(0, 50)}...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connection Status */}
                  <div>
                    <h3 className="font-semibold mb-2">Connection Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database Connection</span>
                        {getStatusBadge(config.supabaseConnection, config.supabaseConnection ? "Connected" : "Failed")}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Storage Access</span>
                        {getStatusBadge(config.storageAccess, config.storageAccess ? "Accessible" : "Failed")}
                      </div>
                    </div>
                  </div>

                  {/* Templates Status */}
                  <div>
                    <h3 className="font-semibold mb-2">Templates Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">HTML Templates</span>
                        <Badge variant="outline">{config.templatesCount} found</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Thumbnail Images</span>
                        <Badge variant="outline">{config.thumbnailsCount} found</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  {(!config.supabaseUrl || !config.supabaseKey) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">Setup Instructions</h4>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <p>1. Go to your Vercel Dashboard</p>
                        <p>2. Select your project → Settings → Environment Variables</p>
                        <p>3. Add these variables:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>NEXT_PUBLIC_SUPABASE_URL</li>
                          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                        </ul>
                        <p>4. Redeploy your project</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button onClick={checkConfiguration} size="sm" disabled={loading}>
                      Refresh Check
                    </Button>
                    <Button
                      onClick={() => {
                        console.clear()
                        checkConfiguration()
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Clear Console & Recheck
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
