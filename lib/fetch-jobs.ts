// jobs.ts
import { supabase, supabaseAdmin } from "./supabase"

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  description: string
  requirements: string[]
  posted_date: string
  deadline: string
  category: string
  experience_level: string
  skills: string[]
  company_logo: string
  application_url: string
  is_premium?: boolean
  is_featured?: boolean
}

export async function fetchExternalJobs(): Promise<Job[]> {
  return []
}

// ----- Main fetchJobs -----
export async function fetchJobs(
  options: {
    limit?: number
    offset?: number
    search?: string
    category?: string
    type?: string
    level?: string
  } = {},
): Promise<Job[]> {
  const { limit = 100, offset = 0, search = "", category = "", type = "", level = "" } = options

  console.log("[v0] fetchJobs called with options:", { limit, offset, search, category, type, level })
  const allJobs: Job[] = []

  const dbClient = supabaseAdmin || supabase

  try {
    const [internalResult, externalDbResult] = await Promise.allSettled([
      // Internal Jobs
      (async () => {
        console.log("[v0] Attempting to fetch from internal database (job_postings)...")
        let query = dbClient
          .from("job_postings")
          .select("*")
          .eq("is_active", true)
          .order("posted_date", { ascending: false })

        if (search)
          query = query.or(`job_title.ilike.%${search}%,description.ilike.%${search}%,company_name.ilike.%${search}%`)
        if (category) query = query.eq("industry", category)
        if (type) query = query.eq("job_type", type)
        if (level) query = query.eq("experience_level", level)

        const { data, error } = await query
        if (error) {
          console.error("[v0] Error fetching internal jobs:", error)
          throw error
        }
        console.log(`[v0] Internal jobs query returned ${data?.length || 0} rows`)
        return data || []
      })(),

      // External DB jobs
      (async () => {
        console.log("[v0] Attempting to fetch from external database (external_jobs)...")
        let query = dbClient.from("external_jobs").select("*").order("posted_date", { ascending: false })

        if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,company.ilike.%${search}%`)
        if (category) query = query.ilike("category", `%${category}%`)
        if (type) query = query.ilike("job_type", `%${type}%`)
        if (level) query = query.ilike("experience_level", `%${level}%`)

        const { data, error } = await query
        if (error) {
          console.error("[v0] Error fetching external jobs:", error)
          return []
        }
        console.log(`[v0] External jobs query returned ${data?.length || 0} rows`)
        return data || []
      })(),
    ])

    // Process Internal Jobs (job_postings)
    if (internalResult.status === "fulfilled" && internalResult.value) {
      const internalJobs = internalResult.value
      allJobs.push(
        ...internalJobs.map((job: any) => ({
          id: job.id,
          title: job.job_title || "Position Available",
          company: job.company_name || "Company Name Not Provided",
          location: job.location || "Location Not Specified",
          type: job.job_type || "Full-time",

          // FIXED SALARY BLOCK (NO MORE CRASHES)
          salary: (() => {
            const min = job.salary_min
            const max = job.salary_max

            if (job.salary_range) return job.salary_range

            if (typeof min === "number" && typeof max === "number") {
              return `$${min.toLocaleString()} - $${max.toLocaleString()}`
            }

            if (typeof min === "number") {
              return `$${min.toLocaleString()}`
            }

            if (typeof max === "number") {
              return `$${max.toLocaleString()}`
            }

            return "Competitive Salary"
          })(),

          description:
            job.description ||
            "Full job description available on application. Click 'View Details' to learn more about this opportunity.",
          requirements: Array.isArray(job.requirements) ? job.requirements : [],
          posted_date: job.posted_date || new Date().toISOString(),
          deadline: job.application_deadline || "",
          category: job.industry || "Technology",
          experience_level: job.experience_level || "Mid-Level",
          skills: Array.isArray(job.skills_required) ? job.skills_required : [],
          company_logo: job.company_logo_url || "",
          application_url: job.external_url || job.application_email || "",
          is_premium: job.is_featured || false,
          is_featured: job.is_featured || false,
        })),
      )
    }

    // Process External DB Jobs (external_jobs)
    if (externalDbResult.status === "fulfilled" && externalDbResult.value) {
      const externalDbJobs = externalDbResult.value
      allJobs.push(
        ...externalDbJobs.map((job: any) => ({
          id: job.id || job.external_id,
          title: job.title || "Position Available",
          company: job.company || "Company Name Not Provided",
          location: job.location || "Location Not Specified",
          type: job.job_type || "Full-time",
          salary: job.salary || "Competitive Salary",
          description: job.description || "Full job description available on application.",
          requirements: Array.isArray(job.requirements) ? job.requirements : [],
          posted_date: job.posted_date || new Date().toISOString(),
          deadline: "",
          category: job.category || "General",
          experience_level: job.experience_level || "Mid-Level",
          skills: Array.isArray(job.skills) ? job.skills : [],
          company_logo: job.company_logo || "",
          application_url: job.application_url || "",
          is_premium: false,
          is_featured: false,
        })),
      )
    }
  } catch (err) {
    console.error("[v0] Unexpected error in fetchJobs:", err)
  }

  // Apply filters again for safety and deduplication
  let filteredJobs = allJobs

  if (search) {
    const searchLower = search.toLowerCase()
    filteredJobs = filteredJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.skills.some((skill) => skill.toLowerCase().includes(searchLower)),
    )
  }

  // Deduplicate by ID
  const uniqueJobs = Array.from(new Map(filteredJobs.map((job) => [job.id, job])).values())

  // Sort by date (newest first)
  uniqueJobs.sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime())

  console.log("[v0] Final jobs count after filtering:", uniqueJobs.length)

  return uniqueJobs.slice(offset, offset + limit)
}
