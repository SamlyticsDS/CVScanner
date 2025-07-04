import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json({ valid: false, error: "API key is required" }, { status: 400 })
    }

    // Test the API key by making a simple request
    const groq = createGroq({ apiKey })

    try {
      await generateText({
        model: groq("llama3-8b-8192"),
        prompt: "ping",
        maxTokens: 5,
      })

      return NextResponse.json({ valid: true, message: "API key is valid" })
    } catch (error) {
      console.error("API key validation failed:", error)
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid API key or API request failed",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("Error validating API key:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Validation failed",
      },
      { status: 500 },
    )
  }
}
