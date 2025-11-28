"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function TestGeminiPage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const testGemini = async () => {
    setTesting(true)
    setResults(null)

    try {
      const response = await fetch("/api/test-gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({
        success: false,
        error: "Failed to test Gemini API",
        details: error.message,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gemini AI Test</h1>
        <p className="text-gray-600 mt-2">Test the Gemini AI integration and verify it's working correctly</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gemini AI Integration Test</CardTitle>
          <CardDescription>
            This will test the Gemini API connection and verify that AI features are working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={testGemini} disabled={testing} className="w-full">
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Gemini AI...
              </>
            ) : (
              "Test Gemini AI Integration"
            )}
          </Button>

          {results && (
            <div className="space-y-4">
              <Alert className={results.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-center">
                  {results.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  )}
                  <AlertDescription className={results.success ? "text-green-800" : "text-red-800"}>
                    {results.success ? "✅ Gemini AI is working correctly!" : "❌ Gemini AI test failed"}
                  </AlertDescription>
                </div>
              </Alert>

              {results.tests && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Test Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>API Key:</span>
                        <span>{results.tests.apiKey}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email Generation:</span>
                        <span>{results.tests.emailGeneration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Summary Generation:</span>
                        <span>{results.tests.summaryGeneration}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.samples && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sample Outputs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Email Sample:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{results.samples.email}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Summary Sample:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{results.samples.summary}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.error && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Error Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-600 mb-2">{results.error}</p>
                    {results.details && (
                      <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-auto">
                        {results.details}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
