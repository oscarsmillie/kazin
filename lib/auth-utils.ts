import { supabase } from "./supabase"

export const checkAndRefreshAuth = async () => {
  try {
    console.log("🔄 Checking auth status...")

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("❌ Auth check failed:", error)

      // If refresh token is invalid, clear auth state
      if (error.message?.includes("refresh_token_not_found") || error.message?.includes("Invalid Refresh Token")) {
        console.log("🧹 Clearing invalid auth state...")

        // Clear localStorage
        if (typeof window !== "undefined") {
          const keys = Object.keys(localStorage)
          keys.forEach((key) => {
            if (key.startsWith("supabase.auth.token")) {
              localStorage.removeItem(key)
            }
          })
        }

        // Sign out to clear server state
        await supabase.auth.signOut()
        return null
      }

      return null
    }

    if (!session) {
      console.log("ℹ️ No active session")
      return null
    }

    // Check if token is close to expiry (within 5 minutes)
    const expiresAt = session.expires_at
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiresAt - now

    if (timeUntilExpiry < 300) {
      // Less than 5 minutes
      console.log("🔄 Token expiring soon, refreshing...")

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        console.error("❌ Token refresh failed:", refreshError)
        return null
      }

      console.log("✅ Token refreshed successfully")
      return refreshData.session
    }

    return session
  } catch (error) {
    console.error("💥 Auth check error:", error)
    return null
  }
}

export const ensureAuthenticated = async () => {
  const session = await checkAndRefreshAuth()

  if (!session) {
    // Redirect to auth page
    if (typeof window !== "undefined") {
      window.location.href = "/auth?error=session_expired&message=Please sign in again"
    }
    return false
  }

  return true
}
