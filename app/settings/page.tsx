"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { Bell, Shield, Palette, Download, Trash2, AlertTriangle } from "lucide-react"

interface UserSettings {
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  job_alerts: boolean
  resume_tips: boolean
  theme: string
  language: string
  timezone: string
  auto_save: boolean
  data_sharing: boolean
  analytics_tracking: boolean
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [settings, setSettings] = useState<UserSettings>({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    job_alerts: true,
    resume_tips: true,
    theme: "light",
    language: "en",
    timezone: "UTC",
    auto_save: true,
    data_sharing: false,
    analytics_tracking: true,
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }

    loadUserSettings()
  }, [user, router])

  const loadUserSettings = async () => {
    try {
      setLoading(true)

      const { data: userSettings, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user?.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading settings:", error)
      }

      if (userSettings) {
        setSettings({
          email_notifications: userSettings.email_notifications ?? true,
          push_notifications: userSettings.push_notifications ?? true,
          marketing_emails: userSettings.marketing_emails ?? false,
          job_alerts: userSettings.job_alerts ?? true,
          resume_tips: userSettings.resume_tips ?? true,
          theme: userSettings.theme ?? "light",
          language: userSettings.language ?? "en",
          timezone: userSettings.timezone ?? "UTC",
          auto_save: userSettings.auto_save ?? true,
          data_sharing: userSettings.data_sharing ?? false,
          analytics_tracking: userSettings.analytics_tracking ?? true,
        })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchChange = (name: keyof UserSettings, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (name: keyof UserSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)

      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user?.id,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (error) {
        console.error("Settings save error:", error)
        throw error
      }

      setMessage({ type: "success", text: "Settings saved successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error("Error saving settings:", error)
      setMessage({ type: "error", text: error.message || "Failed to save settings" })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      // Export user data
      const { data: userData } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

      const { data: resumeData } = await supabase.from("resumes").select("*").eq("user_id", user?.id)

      const { data: coverLetterData } = await supabase.from("cover_letters").select("*").eq("user_id", user?.id)

      const { data: emailData } = await supabase.from("emails").select("*").eq("user_id", user?.id)

      const exportData = {
        profile: userData,
        resumes: resumeData,
        cover_letters: coverLetterData,
        emails: emailData,
        exported_at: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cvchap-data-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage({ type: "success", text: "Data exported successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to export data" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:')
    if (confirmation !== "DELETE") return

    try {
      // Delete user data
      await supabase.from("resumes").delete().eq("user_id", user?.id)
      await supabase.from("cover_letters").delete().eq("user_id", user?.id)
      await supabase.from("emails").delete().eq("user_id", user?.id)
      await supabase.from("profiles").delete().eq("id", user?.id)
      await supabase.from("user_settings").delete().eq("user_id", user?.id)

      // Sign out and redirect
      await signOut()
      router.push("/")

      setMessage({ type: "success", text: "Account deleted successfully" })
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to delete account" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and privacy settings</p>
      </div>

      {message && (
        <Alert
          className={`mb-6 ${message.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications" className="text-base font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-gray-500">Receive important updates via email</p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => handleSwitchChange("email_notifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push_notifications" className="text-base font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-gray-500">Get notified about important activities</p>
                </div>
                <Switch
                  id="push_notifications"
                  checked={settings.push_notifications}
                  onCheckedChange={(checked) => handleSwitchChange("push_notifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="job_alerts" className="text-base font-medium">
                    Job Alerts
                  </Label>
                  <p className="text-sm text-gray-500">Get notified about new job opportunities</p>
                </div>
                <Switch
                  id="job_alerts"
                  checked={settings.job_alerts}
                  onCheckedChange={(checked) => handleSwitchChange("job_alerts", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="resume_tips" className="text-base font-medium">
                    Resume Tips
                  </Label>
                  <p className="text-sm text-gray-500">Receive tips to improve your resume</p>
                </div>
                <Switch
                  id="resume_tips"
                  checked={settings.resume_tips}
                  onCheckedChange={(checked) => handleSwitchChange("resume_tips", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing_emails" className="text-base font-medium">
                    Marketing Emails
                  </Label>
                  <p className="text-sm text-gray-500">Receive promotional content and offers</p>
                </div>
                <Switch
                  id="marketing_emails"
                  checked={settings.marketing_emails}
                  onCheckedChange={(checked) => handleSwitchChange("marketing_emails", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>Customize how the application looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(value) => handleSelectChange("theme", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={settings.language} onValueChange={(value) => handleSelectChange("language", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => handleSelectChange("timezone", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Africa/Nairobi">East Africa Time</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="Europe/London">GMT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_save" className="text-base font-medium">
                    Auto-save
                  </Label>
                  <p className="text-sm text-gray-500">Automatically save your work</p>
                </div>
                <Switch
                  id="auto_save"
                  checked={settings.auto_save}
                  onCheckedChange={(checked) => handleSwitchChange("auto_save", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Data
              </CardTitle>
              <CardDescription>Control how your data is used and shared</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="data_sharing" className="text-base font-medium">
                    Data Sharing
                  </Label>
                  <p className="text-sm text-gray-500">Allow sharing anonymized data for improvements</p>
                </div>
                <Switch
                  id="data_sharing"
                  checked={settings.data_sharing}
                  onCheckedChange={(checked) => handleSwitchChange("data_sharing", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics_tracking" className="text-base font-medium">
                    Analytics Tracking
                  </Label>
                  <p className="text-sm text-gray-500">Help us improve by tracking usage patterns</p>
                </div>
                <Switch
                  id="analytics_tracking"
                  checked={settings.analytics_tracking}
                  onCheckedChange={(checked) => handleSwitchChange("analytics_tracking", checked)}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Data Management</h3>
                <div className="space-y-4">
                  <Button variant="outline" onClick={handleExportData} className="w-full justify-start bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                  <p className="text-sm text-gray-500">
                    Download a copy of all your data including profile, resumes, and settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details and subscription status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input value={user?.email || ""} disabled className="bg-gray-50" />
                </div>

                <div>
                  <Label>Account Created</Label>
                  <Input
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions that affect your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-600">Delete Account</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
