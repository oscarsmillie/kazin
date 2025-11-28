import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // NOTE: Middleware runs on the edge, so it should ideally use SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY
  // Here we stick to your provided setup using SUPABASE_ANON_KEY
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY 

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase is not configured, just return the response without auth
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // This call refreshes the user session cookies for authenticated users
  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT for the ones starting with:
     * 1. Static assets/Next internals: _next/static, _next/image, favicon.ico
     * 2. API Endpoints: api (Allows webhooks and payment processing to run without session)
     * 3. Authentication & Public: auth, guest-resume-builder (ALL ROUTES), payment (ALL ROUTES), pricing, root ($, for home page), jobs
     *
     * This ensures the middleware only runs on protected routes like /dashboard or /resumes.
     */
    "/((?!_next/static|_next/image|favicon.ico|api|auth|guest-resume-builder|payment|pricing|jobs|$).*)",
  ],
}
