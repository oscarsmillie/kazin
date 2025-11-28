import { fetchJobs } from "@/lib/fetch-jobs"

export const dynamic = "force-dynamic" // Ensure this route is never cached

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "1000") // Increased default limit
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const type = searchParams.get("type") || ""
    const level = searchParams.get("level") || ""

    console.log("[v0] API Route: Starting job fetch with params:", { limit, offset, search, category, type, level })

    const jobs = await fetchJobs({ limit, offset, search, category, type, level })

    console.log("[v0] API Route: Successfully fetched", jobs.length, "jobs")
    return Response.json(jobs)
  } catch (error) {
    console.error("[v0] API Route: Error fetching jobs:", error)
    return Response.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}
