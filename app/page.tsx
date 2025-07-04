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

// Client-side Groq API integration
const makeGroqRequest = async (apiKey: string, prompt: string, maxTokens = 1500) => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "API request failed")
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ""
}

// Text truncation helper
const truncate = (txt: string, max: number) => (txt ?? "").replace(/\s+/g, " ").trim().slice(0, max)

// JSON extraction helper
const safeJsonParse = (raw: string) => {
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim()
  const firstBrace = cleaned.indexOf("{")
  const lastBrace = cleaned.lastIndexOf("}")
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found")
  }
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
}

// File reading helper
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}

export default function HomePage() {
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [experienceSummary, setExperienceSummary] = useState("")
  const [jobUrl, setJobUrl] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [showApiKeySetup, setShowApiKeySetup] = useState(true)
  const [isValidatingKey, setIsValidatingKey] = useState(false)
  const [apiKeyValid, setApiKeyValid] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedKey = localStorage.getItem("groq_api_key")
    if (storedKey) {
      setApiKey(storedKey)
      setApiKeyValid(true)
      setShowApiKeySetup(false)
    }
  }, [])

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) {
      alert("Please enter your Groq API key")
      return
    }

    setIsValidatingKey(true)
    try {
      // Test the API key with a simple request
      await makeGroqRequest(apiKey, "Hello", 5)

      setApiKeyValid(true)
      setShowApiKeySetup(false)
      localStorage.setItem("groq_api_key", apiKey)
    } catch (error) {
      console.error("API key validation failed:", error)
      alert("Invalid API key. Please check your Groq API key and try again.")
    } finally {
      setIsValidatingKey(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === "application/pdf" || file.type.includes("document") || file.type === "text/plain")) {
      setCvFile(file)
    }
  }

  const fetchJobDescription = async (url: string): Promise<string> => {
    try {
      // For GitHub Pages, we can't fetch external URLs due to CORS
      // Users will need to paste the job description manually
      throw new Error("URL fetching not available in static deployment. Please copy and paste the job description.")
    } catch (error) {
      throw error
    }
  }

  const handleAnalyze = async () => {
    if (!cvFile || (!jobUrl && !jobDescription) || !experienceSummary) {
      alert("Please fill in all required fields")
      return
    }

    if (!apiKey) {
      alert("Please configure your API key first")
      return
    }

    setIsLoading(true)

    try {
      // Read CV file
      const cvText = truncate(await readFileAsText(cvFile), 6000)
      const expText = truncate(experienceSummary, 1000)

      let jdText = jobDescription
      if (!jdText && jobUrl) {
        try {
          jdText = await fetchJobDescription(jobUrl)
        } catch (error) {
          alert(error.message)
          setIsLoading(false)
          return
        }
      }
      jdText = truncate(jdText || "", 3000)

      // Create prompt for analysis
      const prompt = `
You are an expert resume writer.

Analyse the candidate's CV vs the Job Description and then produce an optimised, ATS-friendly CV.

Return STRICT JSON matching exactly this shape (no markdown, no extras):

{
  "atsScore": <0-100>,
  "matchScore": <0-100>,
  "missingKeywords": [string],
  "suggestions": [string],
  "keywordDensity": { "keyword": percentNumber },
  "optimizedCV": "<the full rewritten CV>"
}

--- INPUTS (some truncated) ---

CV:
${cvText}

Experience Summary:
${expText}

Job Description:
${jdText}
`

      // Make API request
      const response = await makeGroqRequest(apiKey, prompt, 1500)

      // Parse response
      const result = safeJsonParse(response)

      // Store result and navigate
      sessionStorage.setItem("analysisResult", JSON.stringify(result))
      router.push("/optimize")
    } catch (error) {
      console.error("Error:", error)
      alert(`Analysis failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (showApiKeySetup || !apiKeyValid) {
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
                />
              </div>

              <Button onClick={handleApiKeySubmit} className="w-full" disabled={isValidatingKey || !apiKey.trim()}>
                {isValidatingKey ? "Validating..." : "Validate & Continue"}
              </Button>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Privacy Note:</strong> Your API key is stored locally in your browser and is used solely to make
                requests to Groq's API. It is not sent to any other servers.
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
              <CardDescription>Upload your current resume (TXT, PDF, DOC)</CardDescription>
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
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {cvFile && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {cvFile.name} uploaded successfully
                </p>
              )}
              <p className="text-xs text-gray-500">
                Note: For best results with GitHub Pages deployment, please use plain text (.txt) files
              </p>
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

            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" disabled>
                  Job URL (Not Available)
                </TabsTrigger>
                <TabsTrigger value="description">Job Description</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    URL fetching is not available in the static GitHub Pages deployment due to CORS restrictions. Please
                    copy and paste the job description instead.
                  </AlertDescription>
                </Alert>
              </TabsContent>
              <TabsContent value="description" className="space-y-2">
                <Label htmlFor="job-desc">Job Description *</Label>
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
              disabled={isLoading || !cvFile || !experienceSummary || !jobDescription}
            >
              {isLoading ? "Analyzing..." : "Analyze & Optimize CV"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
