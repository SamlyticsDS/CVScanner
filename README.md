# CV Optimizer

A static web application that helps optimize CVs for ATS (Applicant Tracking Systems) using AI analysis.

## Features

- Upload CV files (TXT, PDF, DOC)
- AI-powered CV analysis using Groq's free LLM models
- ATS compatibility scoring
- Job matching analysis
- Missing keyword identification
- CV optimization suggestions
- Download optimized CV

## GitHub Pages Deployment

This application is configured for static deployment on GitHub Pages.

### Setup Instructions

1. Fork this repository
2. Go to your repository settings
3. Navigate to "Pages" section
4. Set source to "GitHub Actions"
5. Push changes to the main branch
6. The app will be automatically deployed to `https://yourusername.github.io/cv-optimizer`

### Local Development

\`\`\`bash
npm install
npm run dev
\`\`\`

### Build for Production

\`\`\`bash
npm run build
\`\`\`

## Usage

1. Get a free API key from [Groq Console](https://console.groq.com)
2. Enter your API key when prompted
3. Upload your CV (plain text files work best for GitHub Pages)
4. Paste the job description
5. Click "Analyze & Optimize CV"
6. Review results and download optimized CV

## Technical Notes

- This is a client-side only application suitable for GitHub Pages
- API calls are made directly to Groq from the browser
- No server-side functionality required
- API keys are stored locally in browser storage
- File processing happens entirely in the browser

## Privacy

- Your API key is stored only in your browser's local storage
- CV content is sent only to Groq's API for processing
- No data is stored on any servers
- All processing happens client-side or via Groq's API
\`\`\`

```typescriptreact file="app/api/analyze-cv/route.ts" isDeleted="true"
...deleted...
