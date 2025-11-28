import { supabaseAdmin } from "@/lib/supabase"

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const THEIRSTACK_API_KEY = process.env.THEIRSTACK_API_KEY

interface JobData {
  external_id: string
  title: string
  company: string
  description: string
  location: string
  job_type: string
  salary: string
  experience_level: string
  skills: string[]
  requirements: string[]
  posted_date: string
  application_url: string
  company_logo: string
  source: string
  category: string
  raw_data: any
}

// Forbidden regions
const BLOCKED_LOCATIONS = [
  "united states",
  "usa",
  "u.s.",
  "us ",
  "america",
  "houston",
  "texas",
  "new york",
  "california",
  "florida",
  "canada",
  "toronto",
  "vancouver",
]

// Ensure job has URL + not US/Canada + African/Remote friendly
function mapJob(job: any, source: string, category: string): JobData | null {
  const applicationUrl = job.url || job.job_apply_link || job.apply_url || job.application_url || ""

  // ❌ Remove jobs without apply URL
  if (!applicationUrl) return null

  const location = job.location || job.job_location || job.city || job.country || "Remote"

  const locationLower = location.toLowerCase()

  // ❌ Remove US/Canada jobs
  if (BLOCKED_LOCATIONS.some((b) => locationLower.includes(b))) {
    return null
  }

  return {
    external_id: job.id || job.job_id || job.internship_id || `${source}-${Math.random()}`,
    title: job.title || job.job_title || job.position_title || "Untitled",
    company: job.company_name || job.company || job.employer_name || "Unknown Company",
    description: job.description || job.job_description || "No description provided",
    location,
    job_type: job.job_type || job.job_employment_type || job.employment_type || "full-time",
    salary: job.salary || job.stipend || job.job_salary_range || "",
    experience_level: job.experience_level || job.job_experience_required || job.seniority || "mid",
    skills: Array.isArray(job.skills) ? job.skills : Array.isArray(job.required_skills) ? job.required_skills : [],
    requirements: Array.isArray(job.requirements) ? job.requirements : [],
    posted_date: job.posted_date || job.job_posted_at_datetime_utc || job.posted_at || new Date().toISOString(),
    application_url: applicationUrl,
    company_logo: job.company_logo || job.employer_logo || "",
    source,
    category,
    raw_data: job,
  }
}

async function shouldFetchJobs(source: string, category: string): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabaseAdmin
    .from("fetch_logs")
    .select("id")
    .eq("source", source)
    .eq("category", category)
    .gte("created_at", `${today}T00:00:00`)
    .single()

  return !data
}

async function logFetchOperation(
  source: string,
  category: string,
  jobsFetched: number,
  jobsInserted: number,
  jobsFiltered: number,
  status = "success",
  errorMessage?: string,
) {
  await supabaseAdmin.from("fetch_logs").insert({
    source,
    category,
    jobs_fetched: jobsFetched,
    jobs_inserted: jobsInserted,
    jobs_filtered: jobsFiltered,
    status,
    error_message: errorMessage,
  })
}

async function fetchJobsForCategory(
  searchTerm: string,
  category: string,
  source: string,
  resultsPerPage = 50,
  totalPages = 2,
): Promise<JobData[]> {
  if (!RAPIDAPI_KEY) return []

  const allJobs: JobData[] = []

  for (let page = 0; page < totalPages; page++) {
    const payload = {
      search_term: searchTerm,
      location: "africa", // 🔒 Africa only
      results_wanted: resultsPerPage,
      site_name: ["indeed", "linkedin", "glassdoor"],
      distance: 100,
      is_remote: true, // 🔒 Remote only
      hours_old: 168,
      page,
    }

    try {
      const res = await fetch("https://jobs-search-api.p.rapidapi.com/getjobs", {
        method: "POST",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "jobs-search-api.p.rapidapi.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        console.warn(`[CRON] API returned ${res.status} for ${category} page ${page}`)
        continue
      }

      const data = await res.json()
      const jobs = Array.isArray(data) ? data : data.jobs || data.data || []

      const mappedJobs = jobs.map((job) => mapJob(job, source, category)).filter((job): job is JobData => job !== null)

      allJobs.push(...mappedJobs)
    } catch (err) {
      console.error(`[CRON] Fetch error for ${category} page ${page}:`, err)
    }
  }

  return allJobs
}

export async function GET(req: Request) {
  console.log("[CRON] Starting job fetch at", new Date().toISOString())

  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const categories = [
      {
        name: "Technology",
        terms: [
          "software developer",
          "frontend developer",
          "backend developer",
          "full stack developer",
          "devops engineer",
          "data scientist",
        ],
      },
      { name: "Product Management", terms: ["product manager", "senior product manager", "product owner"] },
      { name: "Design", terms: ["ui/ux designer", "graphic designer", "product designer", "web designer"] },
      {
        name: "Marketing",
        terms: ["digital marketer", "marketing manager", "content marketer", "growth marketer", "social media manager"],
      },
      {
        name: "Sales",
        terms: ["sales executive", "sales representative", "account executive", "business development"],
      },
      { name: "Operations", terms: ["operations manager", "business analyst", "project manager", "supply chain"] },
      { name: "Finance", terms: ["financial analyst", "accountant", "finance manager", "investment analyst"] },
      {
        name: "Human Resources",
        terms: ["hr manager", "recruiter", "talent acquisition", "people operations", "hr coordinator"],
      },
      {
        name: "Education",
        terms: ["teacher", "instructor", "training specialist", "curriculum developer", "educational consultant"],
      },
      { name: "Healthcare", terms: ["nurse", "healthcare professional", "medical assistant", "health coordinator"] },
      {
        name: "Hospitality & Tourism",
        terms: ["hotel manager", "restaurant manager", "travel coordinator", "customer service"],
      },
      {
        name: "Customer Support",
        terms: ["customer support specialist", "customer service representative", "support engineer", "client success"],
      },
      {
        name: "Writing & Content",
        terms: ["content writer", "technical writer", "copywriter", "journalist", "editor"],
      },
      {
        name: "Business & Administration",
        terms: ["administrative assistant", "office manager", "executive assistant", "data entry"],
      },
      {
        name: "Logistics & Transportation",
        terms: ["logistics manager", "supply chain coordinator", "warehouse manager", "delivery coordinator"],
      },
      { name: "Real Estate", terms: ["real estate agent", "property manager", "real estate broker"] },
      { name: "Retail & E-commerce", terms: ["e-commerce manager", "retail manager", "merchandiser", "store manager"] },
      {
        name: "Manufacturing & Engineering",
        terms: ["mechanical engineer", "production manager", "quality engineer", "maintenance technician"],
      },
      { name: "Trades & Skills", terms: ["electrician", "plumber", "carpenter", "mechanic", "welding technician"] },
      {
        name: "Legal & Compliance",
        terms: ["paralegal", "legal assistant", "compliance officer", "contract specialist"],
      },
    ]

    let totalInserted = 0
    let totalFiltered = 0

    for (const category of categories) {
      for (const term of category.terms) {
        const shouldFetch = await shouldFetchJobs("jobs-search-api", category.name)
        if (!shouldFetch) {
          console.log(`[CRON] Skipping ${category.name} - already fetched today`)
          continue
        }

        console.log(`[CRON] Fetching ${category.name} - ${term}`)

        try {
          const jobs = await fetchJobsForCategory(term, category.name, "jobs-search-api")
          const jobsCount = jobs.length

          let insertedCount = 0

          if (jobsCount > 0) {
            const { error } = await supabaseAdmin.from("external_jobs").upsert(jobs, {
              onConflict: "external_id,source",
            })

            if (error) {
              console.error(`[CRON] Upsert error for ${category.name}:`, error)
              await logFetchOperation(
                "jobs-search-api",
                category.name,
                jobsCount,
                0,
                jobsCount,
                "failed",
                error.message,
              )
            } else {
              insertedCount = jobs.length
              totalInserted += insertedCount
              totalFiltered += jobsCount - insertedCount
              await logFetchOperation(
                "jobs-search-api",
                category.name,
                jobsCount,
                insertedCount,
                jobsCount - insertedCount,
              )
            }
          } else {
            await logFetchOperation("jobs-search-api", category.name, 0, 0, 0)
          }
        } catch (err) {
          console.error(`[CRON] Error fetching ${category.name}:`, err)
          await logFetchOperation(
            "jobs-search-api",
            category.name,
            0,
            0,
            0,
            "failed",
            err instanceof Error ? err.message : "Unknown error",
          )
        }
      }
    }

    // Cleanup old jobs
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabaseAdmin.from("external_jobs").delete().lt("posted_date", thirtyDaysAgo)

    console.log(`[CRON] Completed. Inserted: ${totalInserted}, Filtered: ${totalFiltered}`)

    return Response.json({
      success: true,
      inserted: totalInserted,
      filtered: totalFiltered,
      message: "Jobs fetched successfully",
    })
  } catch (err) {
    console.error("[CRON] Fatal error:", err)
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
}
