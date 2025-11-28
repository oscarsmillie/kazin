import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY

if (!apiKey) {
  console.warn("Gemini API key not found. AI features will be disabled.")
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini API is not configured. Please add GEMINI_API_KEY to your environment variables.")
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      },
    })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from Gemini API")
    }

    return text
  } catch (error) {
    console.error("Error generating with Gemini:", error)
    throw error
  }
}

export const generateContent = generateWithGemini

export async function generateResumeContent(data: {
  jobTitle: string
  company?: string
  experience?: string
  skills?: string[]
}): Promise<string> {
  const prompt = `You are a senior technical recruiter and resume expert. Generate tailored resume content for a candidate applying to the role of ${data.jobTitle}${
    data.company ? ` at ${data.company}` : ""
  }.

Candidate details:
- Experience level: ${data.experience || "Not specified"}
- Skills: ${data.skills?.join(", ") || "None provided"}

Output exactly this structure with clear section headers:

### Professional Summary
(2–3 sentences, first-person implied, no "I". Highlight fit for the role and key strengths.)

### Key Achievements & Responsibilities
- 5 bullet points
- Format: "Action verb + what + result/impact"
- Use strong, quantifiable language where possible
- Tailor to the target role

### Technical Skills
- Grouped format (e.g., Languages: X, Y | Frameworks: A, B | Tools: C)

Rules:
- NEVER invent companies, job titles, or dates
- Keep language ATS-friendly and professional
- Do not add extra text outside the sections`

  return generateWithGemini(prompt)
}

export async function generateCoverLetter(data: {
  jobTitle: string
  company: string
  name: string
  experience?: string
}): Promise<string> {
  const prompt = `You are a professional career coach. Write a compelling, ATS-optimized cover letter for ${data.name} applying to ${data.jobTitle} at ${data.company}.

Background: ${data.experience || "Experienced professional with strong relevant background"}

Requirements:
- 3–4 paragraphs only
- Professional, enthusiastic tone
- First-person ("I")
- Strong opening and call-to-action closing
- Highlight fit, passion, and key qualifications
- No generic fluff

Output ONLY the letter body (no addresses, date, subject, or salutation like "Dear Hiring Manager"). Start directly with the first paragraph.`

  return generateWithGemini(prompt)
}

export async function generateProfessionalEmail(data: {
  purpose: string
  recipient?: string
  context?: string
  tone?: "formal" | "casual" | "neutral"
}): Promise<string> {
  const tone = data.tone || "neutral"
  const prompt = `You are an expert business communicator. Write a professional email.

Purpose: ${data.purpose}
Recipient: ${data.recipient || "Hiring Manager"}
Context: ${data.context || "None provided"}
Tone: ${tone}

Output format:
Subject: [Clear, concise subject line]

[Email body with proper greeting and sign-off]

Rules:
- Greeting: Dear [Recipient], or Hi [Name], based on tone
- Sign-off: Best regards, or Regards, or Thanks,
- Keep under 150 words
- Be direct, polite, and action-oriented
- Never use placeholders like [Your Name] — use a professional placeholder: Alex Rivera`

  return generateWithGemini(prompt)
}

export const generateEmail = generateProfessionalEmail

export async function generateProfessionalSummary(resumeData: {
  tagline?: string
  experienceLevel?: string
  yearsOfExperience?: number
}): Promise<string> {
  const tagline = resumeData.tagline?.trim() || "Dedicated professional"
  const experience = resumeData.experienceLevel
    ? resumeData.experienceLevel.trim()
    : resumeData.yearsOfExperience
      ? `${resumeData.yearsOfExperience}+ years of experience`
      : "proven experience"

  const prompt = `You are an expert resume writer. Write a compelling professional summary (exactly 2–3 sentences, 50–80 words) using ONLY this information:

Tagline: "${tagline}"
Experience: ${experience}

STRICT RULES — follow exactly:
- Highlight core professional identity and value from the tagline
- Emphasize expertise and impact based on experience level
- NEVER mention previous jobs, employers, companies, roles, education, or locations
- NEVER mention gender, pronouns, age, nationality, or any personal identifiers
- Write in third-person (no "I", "he/she" "my", or first-person)
- Use confident, modern, ATS-friendly language
- Position the person as a top performer

Example style (do NOT copy):
"Results-driven product leader with 10+ years of experience scaling SaaS platforms..."
"Creative UX designer with mid-level expertise delivering inclusive digital experiences..."

Now write the professional summary. No extra text.`

  return generateWithGemini(prompt)
}

export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (!genAI) {
      return {
        success: false,
        message: "Gemini API is not configured",
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const result = await model.generateContent("Say 'Hello' in one word.")
    const response = await result.response
    const text = response.text()

    return {
      success: true,
      message: `Connection successful. Response: ${text}`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export { genAI }
