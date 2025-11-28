"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestStoragePage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testStorage = async () => {
    setLoading(true)
    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    }

    try {
      // Test 1: List buckets
      console.log("Testing bucket listing...")
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      testResults.tests.push({
        name: "List Buckets",
        success: !bucketsError,
        data: buckets,
        error: bucketsError?.message,
      })

      // Test 2: List files in templates bucket
      console.log("Testing templates bucket...")
      const { data: files, error: filesError } = await supabase.storage.from("templates").list("", { limit: 100 })

      testResults.tests.push({
        name: "List Templates Files",
        success: !filesError,
        data: files,
        error: filesError?.message,
      })

      // Test 3: Try to get public URL for a file (if any exist)
      if (files && files.length > 0) {
        const firstFile = files[0]
        const { data: urlData } = await supabase.storage.from("templates").getPublicUrl(firstFile.name)

        testResults.tests.push({
          name: "Get Public URL",
          success: !!urlData.publicUrl,
          data: urlData,
          error: null,
        })
      }

      // Test 4: Check auth status
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      testResults.tests.push({
        name: "Auth Status",
        success: !authError,
        data: { user: user?.email || "Anonymous", id: user?.id },
        error: authError?.message,
      })
    } catch (error) {
      testResults.tests.push({
        name: "General Error",
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    setResults(testResults)
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Storage Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={testStorage} disabled={loading}>
              {loading ? "Testing..." : "Test Storage Connection"}
            </Button>

            {results && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Test completed at:</strong> {results.timestamp}
                  </AlertDescription>
                </Alert>

                {results.tests.map((test: any, index: number) => (
                  <Alert key={index} variant={test.success ? "default" : "destructive"}>
                    <AlertDescription>
                      <div>
                        <strong>{test.name}:</strong> {test.success ? "✅ Success" : "❌ Failed"}
                        {test.error && <div className="text-red-600 mt-1">Error: {test.error}</div>}
                        {test.data && (
                          <details className="mt-2">
                            <summary className="cursor-pointer">View Data</summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                              {JSON.stringify(test.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
