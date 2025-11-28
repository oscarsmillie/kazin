import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"
import { createBrowserClient, createServerClient } from "@supabase/ssr"

// Re-export createClient for compatibility
export { createSupabaseClient as createClient }

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Debug configuration
export const debugSupabaseConfig = () => {
  return {
    url: supabaseUrl ? "Set" : "Missing",
    anonKey: supabaseAnonKey ? "Set" : "Missing",
    serviceRoleKey: supabaseServiceRoleKey ? "Set" : "Missing",
    configured: isSupabaseConfigured(),
  }
}

// Mock client for when Supabase is not configured
const createMockClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signUp: async () => ({ data: { user: null }, error: new Error("Supabase not configured") }),
    signInWithPassword: async () => ({ data: { user: null }, error: new Error("Supabase not configured") }),
    signOut: async () => ({ error: null }),
    signInWithOAuth: async () => ({ error: new Error("Supabase not configured") }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: new Error("Supabase not configured") }),
        limit: () => ({ data: [], error: new Error("Supabase not configured") }),
      }),
      order: () => ({
        limit: async () => ({ data: [], error: new Error("Supabase not configured") }),
      }),
    }),
    insert: async () => ({ data: null, error: new Error("Supabase not configured") }),
    update: async () => ({ data: null, error: new Error("Supabase not configured") }),
    delete: async () => ({ data: null, error: new Error("Supabase not configured") }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: new Error("Supabase not configured") }),
      download: async () => ({ data: null, error: new Error("Supabase not configured") }),
      remove: async () => ({ data: null, error: new Error("Supabase not configured") }),
    }),
  },
  url: supabaseUrl,
  key: supabaseAnonKey,
})

// Client-side Supabase client (singleton)
let clientInstance: SupabaseClient | null = null

export const supabase = (() => {
  if (typeof window === "undefined") {
    // Server-side: create a new client each time
    if (!isSupabaseConfigured()) {
      return createMockClient() as any
    }
    return createSupabaseClient(supabaseUrl!, supabaseAnonKey!)
  }

  // Client-side: use singleton
  if (!clientInstance) {
    if (!isSupabaseConfigured()) {
      clientInstance = createMockClient() as any
    } else {
      clientInstance = createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
    }
  }
  return clientInstance
})()

// Export as client for backward compatibility
export const client = supabase

// Server-side client creation
export const createServerSupabaseClient = async () => {
  const { cookies } = await import("next/headers")
  if (!isSupabaseConfigured()) {
    return createMockClient() as any
  }
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Safe ignore if called in a Server Component
        }
      },
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
}

// ✅ Backend client with service role key (bypasses RLS)
export const supabaseAdmin = (() => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn("⚠️ supabaseAdmin: Missing URL or service role key — falling back to mock client")
    return createMockClient() as any
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
})()

// Legacy alias
export const createBackendSupabaseClient = () => supabaseAdmin

// Test connection
export const testSupabaseConnection = async () => {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Supabase not configured" }
    }
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, user: data.user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Auth utilities
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error signing out:", error)
    return { success: false, error }
  }
}

// Default export
export default supabase
