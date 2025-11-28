import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/contexts/auth-context"
import Navigation from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KaziNest - AI-Powered Career Platform",
  description: "Build professional resumes, generate cover letters, and find your dream job with AI assistance",
  keywords: "resume builder, cover letter generator, job search, AI career tools, professional templates",
  authors: [{ name: "KaziNest Team" }],
  creator: "KaziNest",
  publisher: "KaziNest",
  robots: "index, follow",
  openGraph: {
    title: "KaziNest - AI-Powered Career Platform",
    description: "Build professional resumes, generate cover letters, and find your dream job with AI assistance",
    type: "website",
    locale: "en_US",
    siteName: "KaziNest",
  },
  twitter: {
    card: "summary_large_image",
    title: "KaziNest - AI-Powered Career Platform",
    description: "Build professional resumes, generate cover letters, and find your dream job with AI assistance",
    creator: "@kazinest",
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* Hide V0 branding */
            [data-v0-t],
            .v0-watermark,
            .v0-badge,
            [class*="v0-"],
            [id*="v0-"] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
            }
            
            /* Hide any persistent branding elements */
            div[style*="position: fixed"][style*="bottom"][style*="right"] {
              display: none !important;
            }
            
            /* Ensure KaziNest branding is visible */
            .kazinest-brand {
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
          `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <Navigation />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
