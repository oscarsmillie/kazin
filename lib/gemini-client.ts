import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""

if (!apiKey) {
  console.error("Warning: Gemini API key is missing. AI features will not work.")
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 512,
  }
})

/**
 * Generate text using Gemini AI
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error("Gemini API key is not configured")
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return text.trim()
  } catch (error) {
    console.error("Error generating text with Gemini:", error)
    throw error
  }
}

/**
 * Generate a professional summary based on resume data
 */
export async function generateProfessionalSummary(resumeData: any): Promise<string> {
  const professionalTagline = resumeData.personalInfo?.tagline || resumeData.personalInfo?.professionalTagline || ""

  if (!professionalTagline || professionalTagline.trim().length < 5) {
    return "A strategic and accomplished professional with a strong track record of driving impact and delivering results in dynamic environments."
  }

  const prompt = `You are an expert executive resume writer crafting LinkedIn-level, recruiter-approved professional summaries.

Professional Tagline to expand: "${professionalTagline.trim()}"

Write a powerful, third-person professional summary of EXACTLY 100–150 words.

Critical Rules:
- Third person only. Never use I/me/my/mine.
- ZERO gendered pronouns (no he/she/him/her/his). Rephrase to avoid all personal pronouns when possible.
- Begin with a strong, identity-defining opening line derived directly from the tagline.
- Emphasize expertise, strategic approach, leadership philosophy, and unique professional value.
- Use sophisticated, confident, and inclusive language.
- ATS-optimized: use standard industry phrasing naturally.
- Do NOT mention specific jobs, companies, years, degrees, certifications, or technical skills.
- Focus exclusively on professional identity, impact mindset, and forward-looking value proposition.
- End with a statement of continued influence, vision, or commitment to excellence.

Return ONLY the clean paragraph (no quotes, no labels, no word count). Count words precisely.`

  return await generateText(prompt)
}

/**
 * Generate work descriptions based on job title and company
 */
export async function generateWorkDescriptions(jobTitle: string, employer: string): Promise<string[]> {
  const prompt = `As a senior career strategist, generate exactly 5 high-impact, achievement-oriented bullet points for this role:

Position: ${jobTitle}
Company: ${employer}

Requirements per bullet:
- Start with strong past-tense action verb (e.g., Drove, Led, Orchestrated, Accelerated, Pioneered, Transformed)
- Quantify results aggressively (use %, $, numbers, time saved, revenue, growth, scale)
- Highlight strategic impact, leadership, and business outcomes
- Incorporate executive-level language and ATS-friendly keywords naturally
- Keep concise: 1–2 lines max per bullet
- Reflect increasing scope, influence, and complexity

Return exactly 5 lines, one bullet per line, no numbering or symbols.

Example caliber:
"Directed global product strategy for $500M portfolio, achieving 180% YoY revenue growth and securing 3 market-leading positions"
"Engineered cloud migration for 50,000-user platform, reducing infrastructure costs 62% while improving latency 40%"`

  const text = await generateText(prompt)

  const descriptions = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 10) // filter out garbage/short lines

  while (descriptions.length < 5) {
    descriptions.push("")
  }

  return descriptions.slice(0, 5)
}

export const generateWorkDescription = generateWorkDescriptions

/**
 * Suggest skills based on resume data
 */
export async function suggestSkills(resumeData: any): Promise<string[]> {
  const experiences = resumeData.workExperience?.map((exp: any) => `${exp.jobTitle} at ${exp.employer}`).join("; ") || "None provided"
  const currentSkills = resumeData.skills?.join(", ") || "None listed"

  const prompt = `Analyze this career background and suggest 8–12 high-value, in-demand skills that strengthen marketability.

Experience: ${experiences}
Current Skills: ${currentSkills}

Prioritize:
- Transferable leadership & strategic skills
- Modern technical/professional competencies
- Skills trending in 2025+ job markets
- Complement existing background without duplication

Return only skill names, one per line, title-case, no explanations or bullets.`

  const text = await generateText(prompt)
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 2 && !line.match(/^\d+\./))
    .slice(0, 15)
}

export const generateSkillsSuggestions = suggestSkills

/**
 * Generate a cover letter
 */
export async function generateCoverLetter(data: {
  jobTitle: string
  companyName: string
  resumeData: any
}): Promise<string> {
  const { jobTitle, companyName, resumeData } = data

  const prompt = `Write a compelling, modern cover letter for the position of ${jobTitle} at ${companyName}.

Applicant: ${resumeData.personalInfo?.fullName || "Candidate"}
Professional Summary: ${resumeData.professionalSummary || "Accomplished professional with strong strategic impact."}
Key Roles: ${resumeData.workExperience?.map((exp: any) => `${exp.jobTitle} at ${exp.employer}`).join(" | ") || "Relevant leadership experience"}
Top Skills: ${resumeData.skills?.slice(0, 8).join(", ") || ""}

Requirements:
- 3–4 concise paragraphs (max 350 words)
- Strong, specific opening referencing the role and company
- Connect past achievements to company needs (without copying resume)
- Show genuine enthusiasm and cultural fit
- Confident, professional close with clear call-to-action
- Modern tone — warm but executive

Return only the full cover letter, properly formatted with date, greeting, and sign-off.`

  return await generateText(prompt)
}

/**
 * Generate a professional email
 */
export async function generateEmail(data: {
  purpose: string
  context: string
  tone?: "formal" | "professional" | "friendly"
}): Promise<string> {
  const { purpose, context, tone = "professional" } = data

  const toneDesc = tone === "formal" ? "highly formal and polished" :
                   tone === "friendly" ? "warm and approachable" : "professional and confident"

  const prompt = `Write a ${toneDesc} email.

Purpose: ${purpose}
Context: ${context}

Include:
- Clear, benefit-oriented subject line
- Appropriate greeting (e.g., Dear [Name], Hi [Name], Greetings)
- Concise purpose statement in first line
- Supporting context and value
- Polite, proactive closing

Format exactly as a real email:

Subject: [Your Subject Here]

[Body with proper spacing and professional sign-off]`

  return await generateText(prompt)
}

/**
 * Optimize resume for ATS
 */
export async function optimizeForATS(
  resumeData: any,
  jobDescription: string,
): Promise<{
  score: number
  suggestions: string[]
  keywords: string[]
}> {
  const prompt = `Act as a senior ATS and recruiting expert. Evaluate this resume against the target job description.

Job Description:
${jobDescription}

Resume Content:
Professional Summary: ${resumeData.professionalSummary || "None"}
Roles: ${resumeData.workExperience?.map((e: any) => e.jobTitle).join(", ") || "None"}
Skills: ${resumeData.skills?.join(", ") || "None"}

Return ONLY valid JSON in this exact structure:
{
  "score": <number 0-100>,
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "keywords": ["keyword1", "keyword2", ...]
}

Provide:
- Accurate ATS score
- 6–8 actionable, specific improvements
- 12–18 exact keywords/phrases from the JD to include`

  const text = await generateText(prompt)

  try {
    return JSON.parse(text)
  } catch {
    return {
      score: 68,
      suggestions: [
        "Incorporate more exact keywords from the job description",
        "Use standard section headings (e.g., Professional Experience, Skills)",
        "Quantify achievements with numbers, percentages, and dollar amounts",
        "Avoid headers, footers, tables, and columns",
        "List skills in a simple comma-separated or bulleted format",
        "Match job titles closely to industry standards",
        "Spell out acronyms on first use"
      ],
      keywords: ["Agile", "Stakeholder Management", "Strategic Planning", "Data-Driven", "Cross-Functional Leadership", "Process Optimization"]
    }
  }
}

export const optimizeResumeForATS = optimizeForATS

export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (!apiKey) {
      return { success: false, message: "Gemini API key is not configured" }
    }

    const result = await model.generateContent("Respond with exactly: 'Gemini connected'")
    const text = (await result.response).text().trim()

    return {
      success: text.includes("Gemini connected"),
      message: `Test ${text.includes("Gemini connected") ? "passed" : "failed"}: ${text}`
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}

export { genAI, model }
