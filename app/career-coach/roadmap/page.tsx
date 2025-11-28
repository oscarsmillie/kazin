"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, TrendingUp, Plus, Edit2, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"

interface Milestone {
  id: string
  title: string
  description: string
  timeline: string
  completed: boolean
}

export default function CareerRoadmapPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    targetPosition: "",
    targetCompany: "",
    deadline: "",
  })
  const [editingRoadmap, setEditingRoadmap] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: "",
    targetPosition: "",
    targetCompany: "",
    deadline: "",
  })
  const [expandedRoadmap, setExpandedRoadmap] = useState<string | null>(null)
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    timeline: "",
  })
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }
    checkAccessAndLoadRoadmaps()
  }, [user, router])

  const checkAccessAndLoadRoadmaps = async () => {
    try {
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single()

      setHasAccess(subData?.plan_type === "professional")

      if (subData?.plan_type === "professional") {
        const { data: goals } = await supabase
          .from("career_goals")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })

        setRoadmaps(goals || [])
      }
    } catch (error) {
      console.error("Error:", error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoadmap = async () => {
    if (!formData.title || !formData.targetPosition) return

    try {
      const { data, error } = await supabase
        .from("career_goals")
        .insert([
          {
            user_id: user?.id,
            title: formData.title,
            target_position: formData.targetPosition,
            target_company: formData.targetCompany,
            deadline: formData.deadline || null,
            status: "in_progress",
            progress_percentage: 0,
            milestones: [],
          },
        ])
        .select()

      if (!error && data) {
        setRoadmaps((prev) => [data[0], ...prev])
        setFormData({ title: "", targetPosition: "", targetCompany: "", deadline: "" })
        setShowForm(false)
      }
    } catch (error) {
      console.error("Error creating roadmap:", error)
    }
  }

  const handleEditRoadmap = (roadmap: any) => {
    setEditingRoadmap(roadmap.id)
    setEditFormData({
      title: roadmap.title,
      targetPosition: roadmap.target_position,
      targetCompany: roadmap.target_company || "",
      deadline: roadmap.deadline ? roadmap.deadline.split("T")[0] : "",
    })
  }

  const handleSaveEdit = async (roadmapId: string) => {
    if (!editFormData.title || !editFormData.targetPosition) return

    try {
      const { error } = await supabase
        .from("career_goals")
        .update({
          title: editFormData.title,
          target_position: editFormData.targetPosition,
          target_company: editFormData.targetCompany || null,
          deadline: editFormData.deadline || null,
        })
        .eq("id", roadmapId)

      if (!error) {
        setRoadmaps((prev) =>
          prev.map((r) =>
            r.id === roadmapId
              ? {
                  ...r,
                  title: editFormData.title,
                  target_position: editFormData.targetPosition,
                  target_company: editFormData.targetCompany,
                  deadline: editFormData.deadline,
                }
              : r,
          ),
        )
        setEditingRoadmap(null)
      }
    } catch (error) {
      console.error("Error updating roadmap:", error)
    }
  }

  const handleDeleteRoadmap = async (roadmapId: string) => {
    if (!confirm("Are you sure you want to delete this roadmap?")) return

    try {
      const { error } = await supabase.from("career_goals").delete().eq("id", roadmapId)

      if (!error) {
        setRoadmaps((prev) => prev.filter((r) => r.id !== roadmapId))
      }
    } catch (error) {
      console.error("Error deleting roadmap:", error)
    }
  }

  const handleAddMilestone = async (roadmapId: string) => {
    if (!milestoneForm.title) return

    const roadmap = roadmaps.find((r) => r.id === roadmapId)
    const currentMilestones = roadmap?.milestones || []
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      title: milestoneForm.title,
      description: milestoneForm.description,
      timeline: milestoneForm.timeline,
      completed: false,
    }

    const updatedMilestones = [...currentMilestones, newMilestone]

    try {
      const { error } = await supabase
        .from("career_goals")
        .update({ milestones: updatedMilestones })
        .eq("id", roadmapId)

      if (!error) {
        setRoadmaps((prev) => prev.map((r) => (r.id === roadmapId ? { ...r, milestones: updatedMilestones } : r)))
        setMilestoneForm({ title: "", description: "", timeline: "" })
      }
    } catch (error) {
      console.error("Error adding milestone:", error)
    }
  }

  const handleToggleMilestone = async (roadmapId: string, milestoneId: string) => {
    const roadmap = roadmaps.find((r) => r.id === roadmapId)
    const updatedMilestones = (roadmap?.milestones || []).map((m: Milestone) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m,
    )

    const completedCount = updatedMilestones.filter((m: Milestone) => m.completed).length
    const progressPercentage =
      updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : 0

    try {
      const { error } = await supabase
        .from("career_goals")
        .update({
          milestones: updatedMilestones,
          progress_percentage: progressPercentage,
        })
        .eq("id", roadmapId)

      if (!error) {
        setRoadmaps((prev) =>
          prev.map((r) =>
            r.id === roadmapId ? { ...r, milestones: updatedMilestones, progress_percentage: progressPercentage } : r,
          ),
        )
      }
    } catch (error) {
      console.error("Error toggling milestone:", error)
    }
  }

  const handleDeleteMilestone = async (roadmapId: string, milestoneId: string) => {
    const roadmap = roadmaps.find((r) => r.id === roadmapId)
    const updatedMilestones = (roadmap?.milestones || []).filter((m: Milestone) => m.id !== milestoneId)

    const completedCount = updatedMilestones.filter((m: Milestone) => m.completed).length
    const progressPercentage =
      updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : 0

    try {
      const { error } = await supabase
        .from("career_goals")
        .update({
          milestones: updatedMilestones,
          progress_percentage: progressPercentage,
        })
        .eq("id", roadmapId)

      if (!error) {
        setRoadmaps((prev) =>
          prev.map((r) =>
            r.id === roadmapId ? { ...r, milestones: updatedMilestones, progress_percentage: progressPercentage } : r,
          ),
        )
      }
    } catch (error) {
      console.error("Error deleting milestone:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/pricing")}>Upgrade to Professional</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Career Coach
        </Button>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
                Career Roadmaps
              </h1>
              <p className="text-gray-600 mt-2">Create and track your career development plans</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              New Roadmap
            </Button>
          </div>

          {showForm && (
            <Card className="mb-6 border-purple-200">
              <CardHeader>
                <CardTitle>Create New Career Roadmap</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roadmap Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior Engineer Path"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Position</label>
                  <input
                    type="text"
                    value={formData.targetPosition}
                    onChange={(e) => setFormData({ ...formData, targetPosition: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Company (Optional)</label>
                  <input
                    type="text"
                    value={formData.targetCompany}
                    onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                    placeholder="e.g., Google, Microsoft"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateRoadmap} className="bg-purple-600 hover:bg-purple-700">
                    Create Roadmap
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-6">
          {roadmaps.length === 0 ? (
            <Card>
              <CardContent className="pt-12 text-center">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No career roadmaps yet</p>
                <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
                  Create Your First Roadmap
                </Button>
              </CardContent>
            </Card>
          ) : (
            roadmaps.map((roadmap) => (
              <Card key={roadmap.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  {editingRoadmap === roadmap.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        placeholder="Roadmap Title"
                      />
                      <Input
                        value={editFormData.targetPosition}
                        onChange={(e) => setEditFormData({ ...editFormData, targetPosition: e.target.value })}
                        placeholder="Target Position"
                      />
                      <Input
                        value={editFormData.targetCompany}
                        onChange={(e) => setEditFormData({ ...editFormData, targetCompany: e.target.value })}
                        placeholder="Target Company (Optional)"
                      />
                      <Input
                        type="date"
                        value={editFormData.deadline}
                        onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(roadmap.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingRoadmap(null)}>
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{roadmap.title}</CardTitle>
                        <CardDescription>
                          Target: {roadmap.target_position}
                          {roadmap.target_company && ` at ${roadmap.target_company}`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <div className="text-2xl font-bold text-purple-600">{roadmap.progress_percentage}%</div>
                          <p className="text-xs text-gray-500">Progress</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => handleEditRoadmap(roadmap)}>
                          <Edit2 className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteRoadmap(roadmap.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${roadmap.progress_percentage}%` }}
                      />
                    </div>
                    {roadmap.deadline && (
                      <p className="text-sm text-gray-600">
                        Target Deadline: {new Date(roadmap.deadline).toLocaleDateString()}
                      </p>
                    )}

                    <div className="pt-3 border-t">
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-between"
                        onClick={() => setExpandedRoadmap(expandedRoadmap === roadmap.id ? null : roadmap.id)}
                      >
                        <span className="font-medium">Milestones ({(roadmap.milestones || []).length})</span>
                        {expandedRoadmap === roadmap.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>

                      {expandedRoadmap === roadmap.id && (
                        <div className="mt-4 space-y-3">
                          {/* Existing milestones */}
                          {(roadmap.milestones || []).map((milestone: Milestone) => (
                            <div
                              key={milestone.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border ${
                                milestone.completed ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <button
                                onClick={() => handleToggleMilestone(roadmap.id, milestone.id)}
                                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  milestone.completed
                                    ? "bg-green-600 border-green-600"
                                    : "border-gray-300 hover:border-purple-600"
                                }`}
                              >
                                {milestone.completed && <Check className="h-3 w-3 text-white" />}
                              </button>
                              <div className="flex-1">
                                <p
                                  className={`font-medium ${
                                    milestone.completed ? "line-through text-gray-500" : "text-gray-900"
                                  }`}
                                >
                                  {milestone.title}
                                </p>
                                {milestone.description && (
                                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                                )}
                                {milestone.timeline && (
                                  <p className="text-xs text-gray-500 mt-1">Timeline: {milestone.timeline}</p>
                                )}
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteMilestone(roadmap.id, milestone.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}

                          {/* Add new milestone form */}
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
                            <p className="text-sm font-medium text-purple-900">Add New Milestone</p>
                            <Input
                              placeholder="Milestone title"
                              value={milestoneForm.title}
                              onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                            />
                            <Input
                              placeholder="Description (optional)"
                              value={milestoneForm.description}
                              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                            />
                            <Input
                              placeholder="Timeline (e.g., 2 weeks, Q1 2025)"
                              value={milestoneForm.timeline}
                              onChange={(e) => setMilestoneForm({ ...milestoneForm, timeline: e.target.value })}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddMilestone(roadmap.id)}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Milestone
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
