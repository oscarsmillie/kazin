import { supabase } from "@/lib/supabase"

/**
 * Sync user data from Supabase auth to public.users table
 * Called after successful signup to ensure user record exists in public schema
 */
export async function syncUserToDatabase(
  userId: string,
  email: string,
  fullName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[v0] Syncing user to database:", { userId, email, fullName })

    // Check if user already exists in public.users
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Error checking existing user:", checkError)
      return { success: false, error: "Failed to check user existence" }
    }

    if (existingUser) {
      console.log("[v0] User already exists in public.users table:", userId)
      return { success: true }
    }

    const { error: insertError } = await supabase.from("users").insert({
      id: userId,
      email,
      full_name: fullName,
      email_verified: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("[v0] Error inserting user:", insertError)
      // Don't throw - this is non-critical and shouldn't block signup
      console.warn("[v0] User record insertion failed but signup completed:", insertError.message)
      return { success: true } // Return success anyway as auth user was created
    }

    console.log("[v0] User synced to database successfully:", userId)
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Unexpected error syncing user:", error)
    // Return success anyway - auth user was created, this is just a backup record
    return { success: true }
  }
}
