import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { currentCV, apiKey } = await request.json()

    // Use API key from request or environment
    const groqApiKey = apiKey || process.env.GROQ_API_KEY

    if (!groqApiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 401 })
    }

    const groq = createGroq({ apiKey: groqApiKey })

    const regenerationPrompt = `
    Please improve and refine this CV to make it even more ATS-friendly and professional:

    Current CV:
    ${currentCV}

    Improvements to make:
    1. Better keyword optimization
    2. Improved formatting for ATS systems
    3. Stronger action verbs and quantified achievements
    4. Better section organization
    5. More compelling professional summary

    Return the improved CV maintaining all the original information but with better presentation and optimization.
    `

    const { text: optimizedCV } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt: regenerationPrompt,
      maxTokens: 1800,
    })

    return NextResponse.json({ optimizedCV })
  } catch (error) {
    console.error("Error regenerating CV:", error)
    return NextResponse.json({ error: "Regeneration failed" }, { status: 500 })
  }
}
