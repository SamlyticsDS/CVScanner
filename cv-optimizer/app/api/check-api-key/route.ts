import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.GROQ_API_KEY

    return NextResponse.json({
      hasApiKey: !!apiKey,
      message: apiKey ? "API key is configured" : "API key is not configured",
    })
  } catch (error) {
    console.error("Error checking API key:", error)
    return NextResponse.json({ hasApiKey: false, error: "Failed to check API key" }, { status: 500 })
  }
}
