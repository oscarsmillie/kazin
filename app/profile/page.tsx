"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, MapPin, Briefcase, Calendar, Save, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ProfileData {
  full_name: string
  email: string
  phone: string
  location: string
  bio: string
  job_title: string
  company: string
  years_experience: string
  skills: string
  linkedin_url: string
  github_url: string
  portfolio_url: string
  avatar_url: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    job_title: "",
    company: "",
    years_experience: "",
    skills: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    avatar_url: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }
    loadProfile()
  }, [user, router])

  const loadProfile = async () => {
    try {
      setLoading(true)

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError
      }

      // Set profile data, using user metadata as fallback
      setProfile({
        full_name: profileData?.full_name || user?.user_metadata?.full_name || "",
        email: profileData?.email || user?.email || "",
        phone: profileData?.phone || "",
        location: profileData?.location || "",
        bio: profileData?.bio || "",
        job_title: profileData?.job_title || "",
        company: profileData?.company || "",
        years_experience: profileData?.years_experience?.toString() || "",
        skills: profileData?.skills || "",
        linkedin_url: profileData?.linkedin_url || "",
        github_url: profileData?.github_url || "",
        portfolio_url: profileData?.portfolio_url || "",
        avatar_url: profileData?.avatar_url || user?.user_metadata?.avatar_url || "",
      })
    } catch (error) {
      console.error("Error loading profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const saveProfile = async () => {
    try {
      setSaving(true)

      const profileData = {
        id: user?.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        job_title: profile.job_title,
        company: profile.company,
        years_experience: profile.years_experience ? Number.parseInt(profile.years_experience) : null,
        skills: profile.skills,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
        portfolio_url: profile.portfolio_url,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString(),
      }

      // Upsert profile data
      const { error: profileError } = await supabase.from("profiles").upsert(profileData)

      if (profileError) throw profileError

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      })

      if (authError) {
        console.warn("Failed to update auth metadata:", authError)
      }

      // Log activity
      await supabase.from("user_activity").insert({
        user_id: user?.id,
        activity_type: "profile_updated",
        description: "Updated profile information",
        metadata: { fields_updated: Object.keys(profileData) },
        created_at: new Date().toISOString(),
      })

      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your personal information and professional details</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name || "Profile"} />
                <AvatarFallback className="text-lg">
                  {profile.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") ||
                    user?.email?.slice(0, 2).toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.full_name || "Your Name"}</h2>
                <p className="text-gray-600">{profile.job_title || "Your Job Title"}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  {profile.company && (
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {profile.company}
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Member since {new Date(user?.created_at || "").toLocaleDateString()}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="avatar_url">Profile Picture URL</Label>
              <Input
                id="avatar_url"
                value={profile.avatar_url}
                onChange={(e) => handleInputChange("avatar_url", e.target.value)}
                placeholder="Enter image URL"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional Information
            </CardTitle>
            <CardDescription>Your career details and professional background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job_title">Current Job Title</Label>
                <Input
                  id="job_title"
                  value={profile.job_title}
                  onChange={(e) => handleInputChange("job_title", e.target.value)}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="company">Current Company</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="e.g., Tech Corp"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                value={profile.years_experience}
                onChange={(e) => handleInputChange("years_experience", e.target.value)}
                placeholder="e.g., 5"
                min="0"
                max="50"
              />
            </div>

            <div>
              <Label htmlFor="skills">Skills</Label>
              <Textarea
                id="skills"
                value={profile.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                placeholder="List your key skills, separated by commas"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Connect your professional social media profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={profile.linkedin_url}
                onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div>
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                value={profile.github_url}
                onChange={(e) => handleInputChange("github_url", e.target.value)}
                placeholder="https://github.com/yourusername"
              />
            </div>

            <div>
              <Label htmlFor="portfolio_url">Portfolio Website</Label>
              <Input
                id="portfolio_url"
                value={profile.portfolio_url}
                onChange={(e) => handleInputChange("portfolio_url", e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end">
              <Button onClick={saveProfile} disabled={saving} className="bg-blue-600 hover:bg-blue-700" size="lg">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
