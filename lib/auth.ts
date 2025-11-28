import { createClient } from "@supabase/supabase-js"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

// Initialize Supabase client
const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const supabase = getSupabase()

        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error || !data.user) {
          return null
        }

        // Get user profile data
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

        return {
          id: data.user.id,
          email: data.user.email,
          name: profileData?.full_name || data.user.email,
          image: profileData?.avatar_url || null,
          role: profileData?.role || "user",
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // Store the user id in the token
        token.sub = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.role = user.role

        // If using Google, link the account to Supabase
        if (account.provider === "google") {
          const supabase = getSupabase()

          // Check if user exists
          const { data: existingUser } = await supabase.from("users").select("*").eq("email", user.email).single()

          if (!existingUser) {
            // Create user if doesn't exist
            await supabase.from("users").insert({
              id: user.id,
              email: user.email,
              name: user.name,
              avatar_url: user.image,
            })
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Helper function to get current session
export const getSession = async () => {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

// Helper function to check if user is admin
export const isAdmin = async (email: string) => {
  if (email !== "odimaoscar@gmail.com") {
    return false
  }

  const supabase = createServerComponentClient({ cookies })
  const { data } = await supabase.from("users").select("role").eq("email", email).single()

  return data?.role === "admin"
}
