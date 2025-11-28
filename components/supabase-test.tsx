"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface TestResult {
  name: string
  status: "success" | "error" | "pending"
  message: string
}

export default function SupabaseTest() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const runTests = async () => {
    setTesting(true)
    const testResults: TestResult[] = []

    // Test 1: Environment Variables
    testResults.push({
      name: "Environment Variables",
      status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "success" : "error",
      message:
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? "Supabase URL and Anon Key are set"
          : "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    })

    // Test 2: Basic Connection
    try {
      const { data, error } = await supabase.from("profiles").select("count").limit(1)
      testResults.push({
        name: "Database Connection",
        status: error ? "error" : "success",
        message: error ? `Connection failed: ${error.message}` : "Successfully connected to database",
      })
    } catch (err) {
      testResults.push({
        name: "Database Connection",
        status: "error",
        message: `Connection error: ${err instanceof Error ? err.message : "Unknown error"}`,
      })
    }

    // Test 3: Storage Access
    try {
      const { data, error } = await supabase.storage.from("templates").list("", { limit: 1 })
      testResults.push({
        name: "Storage Access",
        status: error ? "error" : "success",
        message: error ? `Storage error: ${error.message}` : "Successfully accessed storage",
      })
    } catch (err) {
      testResults.push({
        name: "Storage Access",
        status: "error",
        message: `Storage error: ${err instanceof Error ? err.message : "Unknown error"}`,
      })
    }

    // Test 4: Auth Status
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      testResults.push({
        name: "Authentication",
        status: error ? "error" : "success",
        message: error ? `Auth error: ${error.message}` : user ? `Logged in as: ${user.email}` : "Not logged in",
      })
    } catch (err) {
      testResults.push({
        name: "Authentication",
        status: "error",
        message: `Auth error: ${err instanceof Error ? err.message : "Unknown error"}`,
      })
    }

    setResults(testResults)
    setTesting(false)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={runTests} disabled={testing} className="w-full">
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              "Run Connection Tests"
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <Alert key={index} variant={result.status === "error" ? "destructive" : "default"}>
                  <div className="flex items-center gap-2">
                    {result.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <strong>{result.name}:</strong> {result.message}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p>
              <strong>Environment Check:</strong>
            </p>
            <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
