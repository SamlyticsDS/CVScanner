import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { cvContent } = await request.json()

    // In a real application, you would use a PDF generation library like puppeteer or jsPDF
    // For this example, we'll create a simple text file
    const blob = new Blob([cvContent], { type: "text/plain" })

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="optimized-cv.txt"',
      },
    })
  } catch (error) {
    console.error("Error creating download:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
