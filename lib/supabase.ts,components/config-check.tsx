"use client"

// lib/supabase.ts
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string)

// Internal flag
const _isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

/**
 * Returns **true** when both NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are present.
 */
export function isSupabaseConfigured(): boolean {
  return _isSupabaseConfigured
}

export async function debugSupabaseConfig() {
  console.log("Supabase URL:", supabaseUrl)
  console.log("Supabase Anon Key:", supabaseAnonKey)
  console.log("Is Supabase Configured:", isSupabaseConfigured())
}

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("test").select("*").limit(1)
    if (error) {
      console.error("Supabase connection test failed:", error)
      return false
    }
    console.log("Supabase connection test successful:", data)
    return true
  } catch (error) {
    console.error("Supabase connection test failed:", error)
    return false
  }
}

// components/config-check.tsx
import { testSupabaseConnection, isSupabaseConfigured } from "@/lib/supabase"
import { useEffect, useState } from "react"

interface Status {
  hasUrl: boolean
  hasAnonKey: boolean
  hasServiceKey: boolean
  connectionWorks: boolean
  isConfigured: boolean
}

export default function ConfigCheck() {
  const [status, setStatus] = useState<Status>({
    hasUrl: false,
    hasAnonKey: false,
    hasServiceKey: false,
    connectionWorks: false,
    isConfigured: false,
  })

  async function checkConfiguration() {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const connectionWorks = await testSupabaseConnection()
    const configured = isSupabaseConfigured()

    setStatus({
      hasUrl,
      hasAnonKey,
      hasServiceKey,
      connectionWorks,
      isConfigured: configured,
    })
  }

  useEffect(() => {
    checkConfiguration()
  }, [])

  return (
    <div className="rounded-md bg-yellow-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-.767 1.452-.767 2.125 0l6 6a2.25 2.25 0 011.591 3.218l-3 3a2.25 2.25 0 01-3.218 1.591L8.485 2.495zM6 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Configuration Check</h3>
          <div className="mt-2 text-sm text-yellow-700">
            {!status.isConfigured && (
              <p>
                It looks like you haven't configured Supabase yet. Make sure you have set the{" "}
                <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> environment
                variables.
              </p>
            )}
            {status.isConfigured && !status.connectionWorks && (
              <p>
                Supabase is configured, but the connection is not working. Check your{" "}
                <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> environment
                variables.
              </p>
            )}
            {status.isConfigured && status.connectionWorks && (
              <p>Supabase is configured and the connection is working! You're ready to start building.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
