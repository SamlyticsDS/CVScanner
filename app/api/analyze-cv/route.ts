import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

// ------------ token-safe limits -------------
const MAX_CV_CHARS = 6_000 // ≈ 1 500 tokens
const MAX_JD_CHARS = 3_000 // ≈   750 tokens
const MAX_EXP_CHARS = 1_000 // ≈   250 tokens
//---------------------------------------------

const truncate = (txt: string, max: number) => (txt ?? "").replace(/\s+/g, " ").trim().slice(0, max)

const safeJsonParse = (raw: string) => {
  // remove markdown code-block fences
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim()
  const firstBrace = cleaned.indexOf("{")
  const lastBrace = cleaned.lastIndexOf("}")
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found")
  }
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
}

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()
    const cvFile = fd.get("cv") as File
    const experienceSummary = truncate(fd.get("experienceSummary") as string, MAX_EXP_CHARS)
    const jobUrl = fd.get("jobUrl") as string
    const jobDescriptionRaw = fd.get("jobDescription") as string
    const apiKey = (fd.get("apiKey") as string) || process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 401 })
    }
    const groq = createGroq({ apiKey })

    // -------- read & truncate inputs ----------
    const cvText = truncate(await cvFile.text(), MAX_CV_CHARS)

    let jdText = jobDescriptionRaw
    if (!jdText && jobUrl) {
      try {
        const html = await fetch(jobUrl).then((r) => r.text())
        jdText = html.replace(/<[^>]*>/g, " ")
      } catch {
        return NextResponse.json({ error: "Failed to fetch job description from URL" }, { status: 400 })
      }
    }
    jdText = truncate(jdText || "", MAX_JD_CHARS)

    // ------------- single LLM call -------------
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
${experienceSummary}

Job Description:
${jdText}
`

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      maxTokens: 1500, // keeps total < 6 000-token TPM limit
    })

    let parsed
    try {
      parsed = safeJsonParse(text)
    } catch (err) {
      console.error("JSON parse error:", err, "\nLLM output:\n", text)
      return NextResponse.json({ error: "AI response parsing failed. Please retry." }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (e) {
    console.error("Internal error in analyze-cv:", e)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
