"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, ArrowLeft, CheckCircle, AlertTriangle, TrendingUp, FileText, Target, Lightbulb } from "lucide-react"
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

interface AnalysisResult {
  atsScore: number
  matchScore: number
  missingKeywords: string[]
  suggestions: string[]
  optimizedCV: string
  keywordDensity: { [key: string]: number }
}

export default function OptimizePage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [optimizedCV, setOptimizedCV] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedResult = sessionStorage.getItem("analysisResult")
    if (storedResult) {
      const result = JSON.parse(storedResult)
      setAnalysisResult(result)
      setOptimizedCV(result.optimizedCV || "")
    } else {
      router.push("/")
    }
  }, [router])

  const handleRegenerateCV = async () => {
    const apiKey = localStorage.getItem("groq_api_key")
    if (!apiKey) {
      alert("API key not found. Please go back and configure your API key.")
      return
    }

    setIsGenerating(true)
    try {
      const regenerationPrompt = `
Please improve and refine this CV to make it even more ATS-friendly and professional:

Current CV:
${optimizedCV}

Improvements to make:
1. Better keyword optimization
2. Improved formatting for ATS systems
3. Stronger action verbs and quantified achievements
4. Better section organization
5. More compelling professional summary

Return the improved CV maintaining all the original information but with better presentation and optimization.
`

      const response = await makeGroqRequest(apiKey, regenerationPrompt, 1800)
      setOptimizedCV(response)
    } catch (error) {
      console.error("Error regenerating CV:", error)
      alert("Error regenerating CV. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadCV = () => {
    const blob = new Blob([optimizedCV], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "optimized-cv.txt"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading analysis results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">CV Optimization Results</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ATS Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysisResult.atsScore}%</div>
              <Progress value={analysisResult.atsScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {analysisResult.atsScore >= 80
                  ? "Excellent"
                  : analysisResult.atsScore >= 60
                    ? "Good"
                    : "Needs Improvement"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Match</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysisResult.matchScore}%</div>
              <Progress value={analysisResult.matchScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {analysisResult.matchScore >= 80
                  ? "Strong Match"
                  : analysisResult.matchScore >= 60
                    ? "Good Match"
                    : "Weak Match"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing Keywords</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysisResult.missingKeywords.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Keywords to add</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="optimized" className="space-y-6">
          <TabsList>
            <TabsTrigger value="optimized">Optimized CV</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="optimized">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Your Optimized CV
                </CardTitle>
                <CardDescription>Edit the content below and regenerate as needed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={optimizedCV}
                  onChange={(e) => setOptimizedCV(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={handleRegenerateCV} disabled={isGenerating}>
                    {isGenerating ? "Regenerating..." : "Regenerate CV"}
                  </Button>
                  <Button onClick={handleDownloadCV} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download TXT
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Missing Keywords</CardTitle>
                  <CardDescription>
                    Important keywords from the job description that should be added to your CV
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.missingKeywords.map((keyword, index) => (
                      <Badge key={index} variant="destructive">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Keyword Density</CardTitle>
                  <CardDescription>How often important keywords appear in your CV</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analysisResult.keywordDensity).map(([keyword, density]) => (
                      <div key={keyword} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{keyword}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={density * 10} className="w-20" />
                          <span className="text-sm text-muted-foreground">{density}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="suggestions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Optimization Suggestions
                </CardTitle>
                <CardDescription>AI-powered recommendations to improve your CV</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
