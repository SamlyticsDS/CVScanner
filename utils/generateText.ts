import type { Groq } from "groq-js"

interface GenerateTextParams {
  model: Groq
  prompt: string
  maxTokens: number
}

interface GenerateTextResult {
  text: string
}

export async function generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
  try {
    const result = await params.model
      .query({
        query: params.prompt,
        maxTokens: params.maxTokens,
      })
      .fetch()

    if (typeof result === "string") {
      return { text: result }
    } else if (result && typeof result[0] === "string") {
      return { text: result[0] }
    } else {
      return { text: JSON.stringify(result) }
    }
  } catch (error) {
    console.error("Error generating text:", error)
    throw error
  }
}
