"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Sparkles, CheckCircle, AlertCircle } from "lucide-react"
import {
  testGeminiConnection,
  generateEmail,
  generateProfessionalSummary,
  generateCoverLetter,
} from "@/lib/gemini-client"

export default function TestGemini2Page() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [testType, setTestType] = useState<string>("")

  const [emailData, setEmailData] = useState({
    type: "follow_up",
    recipientName: "John Smith",
    companyName: "Tech Corp",
    context: "Following up on my job application",
    senderName: "Jane Doe",
  })

  const [userInfo] = useState({
    name: "John Doe",
    experience: "5 years in software development",
    skills: ["JavaScript", "React", "Node.js", "Python"],
    education: "Bachelor's in Computer Science",
  })

  const runTest = async (type: string) => {
    setLoading(true)
    setError("")
    setResult("")
    setTestType(type)

    try {
      let response = ""

      switch (type) {
        case "connection":
          response = await testGeminiConnection()
          break

        case "email":
          response = await generateEmail(emailData)
          break

        case "summary":
          response = await generateProfessionalSummary(userInfo)
          break

        case "cover-letter":
          response = await generateCoverLetter(
            userInfo,
            "Software Developer",
            "Tech Corp",
            "We are looking for a skilled software developer with React experience",
          )
          break

        default:
          throw new Error("Unknown test type")
      }

      setResult(response)
    } catch (err: any) {
      console.error("Test failed:", err)
      setError(err.message || "Test failed")
    } finally {
      setLoading(false)
    }
  }

  const testDirectAPI = async () => {
    setLoading(true)
    setError("")
    setResult("")
    setTestType("direct-api")

    try {
      console.log("🧪 Testing direct API call...")
      const response = await fetch("/api/gemini")
      const data = await response.json()

      if (data.success) {
        setResult(data.result)
      } else {
        setError(data.error || "API test failed")
      }
    } catch (err: any) {
      console.error("Direct API test failed:", err)
      setError(err.message || "Direct API test failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Gemini 2.0 Flash Lite Test</h1>
        <p className="text-gray-600">Test the new Gemini AI integration via API routes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Test Controls
            </CardTitle>
            <CardDescription>Run different tests to verify Gemini 2.0 Flash Lite integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => runTest("connection")}
                disabled={loading}
                variant={testType === "connection" && loading ? "default" : "outline"}
              >
                {loading && testType === "connection" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Test Connection
              </Button>

              <Button
                onClick={testDirectAPI}
                disabled={loading}
                variant={testType === "direct-api" && loading ? "default" : "outline"}
              >
                {loading && testType === "direct-api" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Direct API Test
              </Button>

              <Button
                onClick={() => runTest("summary")}
                disabled={loading}
                variant={testType === "summary" && loading ? "default" : "outline"}
              >
                {loading && testType === "summary" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Summary
              </Button>

              <Button
                onClick={() => runTest("email")}
                disabled={loading}
                variant={testType === "email" && loading ? "default" : "outline"}
              >
                {loading && testType === "email" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Email
              </Button>

              <Button
                onClick={() => runTest("cover-letter")}
                disabled={loading}
                variant={testType === "cover-letter" && loading ? "default" : "outline"}
                className="col-span-2"
              >
                {loading && testType === "cover-letter" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Cover Letter
              </Button>
            </div>

            {/* Email Configuration */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">Email Test Configuration</h4>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Recipient Name"
                  value={emailData.recipientName}
                  onChange={(e) => setEmailData({ ...emailData, recipientName: e.target.value })}
                />
                <Input
                  placeholder="Company Name"
                  value={emailData.companyName}
                  onChange={(e) => setEmailData({ ...emailData, companyName: e.target.value })}
                />
              </div>
              <Input
                placeholder="Context"
                value={emailData.context}
                onChange={(e) => setEmailData({ ...emailData, context: e.target.value })}
              />
              <select
                value={emailData.type}
                onChange={(e) => setEmailData({ ...emailData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="follow_up">Follow Up</option>
                <option value="thank_you">Thank You</option>
                <option value="networking">Networking</option>
                <option value="inquiry">Inquiry</option>
                <option value="application">Application</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {error ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : result ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              Results
            </CardTitle>
            <CardDescription>
              {loading ? "Generating response..." : "AI-generated content will appear here"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Generating with Gemini 2.0 Flash Lite...</span>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Generated Content:</h4>
                  <Textarea value={result} readOnly className="min-h-[200px] bg-white" />
                </div>
                <div className="text-sm text-gray-500">✅ Generated successfully with Gemini 2.0 Flash Lite</div>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click a test button to generate AI content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Current Gemini AI setup information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Model:</strong> gemini-2.0-flash-lite
            </div>
            <div>
              <strong>Package:</strong> @google/genai
            </div>
            <div>
              <strong>Integration:</strong> Server-side API
            </div>
            <div>
              <strong>Status:</strong> {loading ? "Testing..." : "Ready"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
