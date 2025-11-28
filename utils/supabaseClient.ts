import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClientComponentClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    })
  }
  return supabaseInstance
}

// Export the client
export const supabase = getSupabaseClient()

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Auth check error:", error)
      return false
    }

    return !!session?.user
  } catch (error) {
    console.error("Auth check exception:", error)
    return false
  }
}

// Helper function to get current user with error handling
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Get user error:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Get user exception:", error)
    return null
  }
}

// Helper function to ensure user is authenticated before operations
export const withAuth = async (operation: () => Promise<any>): Promise<any | null> => {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    console.error("Operation requires authentication")
    return null
  }

  try {
    return await operation()
  } catch (error) {
    console.error("Authenticated operation failed:", error)
    return null
  }
}
