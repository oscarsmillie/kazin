"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, FileText, FolderOpen, Target, User, LogOut, Crown, Shield, CreditCard, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Navigation items
const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Target,
  },
  {
    name: "Resume Builder",
    href: "/resume-builder/templates",
    icon: FileText,
  },
  {
    name: "File Manager",
    href: "/files",
    icon: FolderOpen,
  },
]

export default function Navigation() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 👇 PLACE THIS NEAR THE TOP OF THE COMPONENT ── *before* the first useEffect
  async function checkSubscription(userId: string | undefined) {
    if (!userId) return

    try {
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (subData && subData.plan_type === "professional") {
        setSubscription(subData)
      } else {
        setSubscription(null)
      }
    } catch (error) {
      console.error("Error checking subscription:", error)
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      checkSubscription(user.id) // pass user id to the helper
    }
  }, [user])

  // Don't show navigation on auth pages or homepage
  if (!user || pathname === "/" || pathname === "/auth" || pathname.startsWith("/auth/")) {
    return null
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(" ")
        .map((name: string) => name[0])
        .join("")
        .toUpperCase()
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
  }

  // Check if user is admin
  const isAdmin = user?.email === "odimaoscar@gmail.com"

  // Check if user is professional
  const isProfessional = subscription?.plan_type === "professional"

  return (
    <nav className="bg-white border-b-2 border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">KN</span>
              </div>
              <span className="text-xl font-bold text-gray-900">KaziNest</span>
            </Link>
          </div>

          {/* Centered Desktop Navigation */}
          <div className="hidden md:flex justify-center flex-1">
            <div className="flex space-x-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white text-blue-700 shadow-sm border border-blue-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right Side - User Menu */}
          <div className="flex items-center space-x-3">
            {/* Upgrade Button - only show for non-professional users */}
            {!isProfessional && !loading && (
              <Button
                asChild
                size="sm"
                className="hidden md:inline-flex bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 shadow-sm"
              >
                <Link href="/pricing">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade
                </Link>
              </Button>
            )}

            {/* Professional Badge - show for professional users */}
            {isProfessional && (
              <div className="hidden md:flex items-center px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full border border-purple-200">
                <Crown className="h-4 w-4 mr-1 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Pro</span>
              </div>
            )}

            {/* Admin Button - only show for admin users */}
            {isAdmin && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="hidden md:inline-flex border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 bg-transparent"
              >
                <Link href="/admin/dashboard">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full border border-gray-200 hover:border-gray-300"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.user_metadata?.avatar_url || "/placeholder.svg"}
                      alt={getUserDisplayName()}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-gray-200 shadow-lg" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-3 border-b border-gray-100">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-gray-900">{getUserDisplayName()}</p>
                    <p className="w-[200px] truncate text-sm text-gray-500">{user?.email}</p>
                    {isProfessional && (
                      <div className="flex items-center gap-1 mt-1">
                        <Crown className="h-3 w-3 text-purple-600" />
                        <span className="text-xs text-purple-600 font-medium">Professional</span>
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/applications" className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    Applications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/career-coach" className="cursor-pointer">
                    <Crown className="mr-2 h-4 w-4 text-purple-600" />
                    <span className="text-purple-600">AI Career Coach</span>
                  </Link>
                </DropdownMenuItem>
                {/* Only show upgrade option for non-professional users */}
                {!isProfessional && (
                  <DropdownMenuItem asChild>
                    <Link href="/pricing" className="cursor-pointer">
                      <Crown className="mr-2 h-4 w-4 text-blue-600" />
                      <span className="text-blue-600">Upgrade Plan</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4 text-red-600" />
                        <span className="text-red-600">Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 border border-gray-200 rounded-md"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block pl-4 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              )
            })}
            {!isProfessional && !loading && (
              <Link
                href="/pricing"
                className="block pl-4 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Crown className="h-5 w-5 mr-3" />
                  Upgrade to Pro
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
