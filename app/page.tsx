"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Target, Zap, CheckCircle, Key, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

async function parseApiResponse(res: Response) {
  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) return res.json()
  return { error: await res.text() }
}

export default function HomePage() {
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [experienceSummary, setExperienceSummary] = useState("")
  const [jobUrl, setJobUrl] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "valid" | "invalid" | "missing">("checking")
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [isValidatingKey, setIsValidatingKey] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkApiKeyStatus()
  }, [])

  const checkApiKeyStatus = async () => {
    try {
      const response = await fetch("/api/check-api-key")
      const result = await response.json()

      if (result.hasApiKey) {
        setApiKeyStatus("valid")
      } else {
        setApiKeyStatus("missing")
        setShowApiKeySetup(true)
      }
    } catch (error) {
      console.error("Error checking API key:", error)
      setApiKeyStatus("missing")
      setShowApiKeySetup(true)
    }
  }

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) {
      alert("Please enter your Groq API key")
      return
    }

    setIsValidatingKey(true)
    try {
      const response = await fetch("/api/validate-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })

      const result = await response.json()

      if (result.valid) {
        setApiKeyStatus("valid")
        setShowApiKeySetup(false)
        // Store API key in session for this session
        sessionStorage.setItem("groq_api_key", apiKey)
      } else {
        setApiKeyStatus("invalid")
        alert("Invalid API key. Please check your Groq API key and try again.")
      }
    } catch (error) {
      console.error("Error validating API key:", error)
      alert("Error validating API key. Please try again.")
    } finally {
      setIsValidatingKey(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === "application/pdf" || file.type.includes("document"))) {
      setCvFile(file)
    }
  }

  const handleAnalyze = async () => {
    if (!cvFile || (!jobUrl && !jobDescription) || !experienceSummary) {
      alert("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("cv", cvFile)
      formData.append("experienceSummary", experienceSummary)
      formData.append("jobUrl", jobUrl)
      formData.append("jobDescription", jobDescription)

      // Include API key from session if available
      const sessionApiKey = sessionStorage.getItem("groq_api_key")
      if (sessionApiKey) {
        formData.append("apiKey", sessionApiKey)
      }

      const response = await fetch("/api/analyze-cv", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await parseApiResponse(response)
        sessionStorage.setItem("analysisResult", JSON.stringify(result))
        router.push("/optimize")
      } else {
        const err = await parseApiResponse(response)
        throw new Error(err.error ?? err.message ?? "Analysis failed")
      }
    } catch (error) {
      console.error("Error:", error)
      alert(`Analysis failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (apiKeyStatus === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Checking API configuration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showApiKeySetup || apiKeyStatus === "missing" || apiKeyStatus === "invalid") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Key className="w-6 h-6" />
              API Key Setup Required
            </CardTitle>
            <CardDescription>
              To use the CV Optimizer, you need to provide your Groq API key for AI processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This application uses Groq's free AI models to analyze and optimize your CV. You'll need a free Groq API
                key to continue.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">How to get your Groq API key:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>
                    Visit{" "}
                    <a
                      href="https://console.groq.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      console.groq.com
                    </a>
                  </li>
                  <li>Sign up for a free account or log in</li>
                  <li>Navigate to the API Keys section</li>
                  <li>Create a new API key</li>
                  <li>Copy the API key and paste it below</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">Groq API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="gsk_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={apiKeyStatus === "invalid" ? "border-red-500" : ""}
                />
                {apiKeyStatus === "invalid" && (
                  <p className="text-sm text-red-600">Invalid API key. Please check and try again.</p>
                )}
              </div>

              <Button onClick={handleApiKeySubmit} className="w-full" disabled={isValidatingKey || !apiKey.trim()}>
                {isValidatingKey ? "Validating..." : "Validate & Continue"}
              </Button>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Privacy Note:</strong> Your API key is only stored temporarily in your browser session and is
                used solely to make requests to Groq's API. It is not stored on our servers.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">CV Optimizer</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your CV and job description to get an ATS-optimized resume that matches your target role
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600">API Connected</span>
            <Button variant="outline" size="sm" onClick={() => setShowApiKeySetup(true)} className="ml-4">
              Change API Key
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Upload className="w-12 h-12 mx-auto text-blue-600 mb-2" />
              <CardTitle>Upload CV</CardTitle>
              <CardDescription>Upload your current resume</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <Target className="w-12 h-12 mx-auto text-green-600 mb-2" />
              <CardTitle>Job Analysis</CardTitle>
              <CardDescription>AI analyzes job requirements</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <Zap className="w-12 h-12 mx-auto text-purple-600 mb-2" />
              <CardTitle>ATS Optimization</CardTitle>
              <CardDescription>Generate optimized CV</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6" />
              CV Optimization Tool
            </CardTitle>
            <CardDescription>Fill in the details below to optimize your CV for your target job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cv-upload">Upload Your CV *</Label>
              <Input
                id="cv-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {cvFile && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {cvFile.name} uploaded successfully
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Experience Summary *</Label>
              <Textarea
                id="experience"
                placeholder="Briefly describe your professional background, key skills, and career highlights..."
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                rows={4}
              />
            </div>

            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">Job URL</TabsTrigger>
                <TabsTrigger value="description">Job Description</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2">
                <Label htmlFor="job-url">Job Posting URL</Label>
                <Input
                  id="job-url"
                  type="url"
                  placeholder="https://example.com/job-posting"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                />
                <p className="text-sm text-gray-500">Paste the URL of the job posting you want to apply for</p>
              </TabsContent>
              <TabsContent value="description" className="space-y-2">
                <Label htmlFor="job-desc">Job Description</Label>
                <Textarea
                  id="job-desc"
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                />
                <p className="text-sm text-gray-500">Copy and paste the complete job description</p>
              </TabsContent>
            </Tabs>

            <Button
              onClick={handleAnalyze}
              className="w-full"
              size="lg"
              disabled={isLoading || !cvFile || !experienceSummary || (!jobUrl && !jobDescription)}
            >
              {isLoading ? "Analyzing..." : "Analyze & Optimize CV"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
