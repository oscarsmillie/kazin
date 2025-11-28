"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Edit, Trash2, Target, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface CareerGoal {
  id: string
  title: string
  description?: string
  target_date?: string
  priority: "low" | "medium" | "high"
  progress: number
  status: "not_started" | "in_progress" | "completed" | "on_hold"
  category: string
  created_at: string
  updated_at: string
}

const priorityColors = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-red-100 text-red-800 border-red-200",
}

const statusColors = {
  not_started: "bg-gray-100 text-gray-800 border-gray-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  on_hold: "bg-orange-100 text-orange-800 border-orange-200",
}

const statusIcons = {
  not_started: Clock,
  in_progress: Target,
  completed: CheckCircle,
  on_hold: AlertCircle,
}

export default function CareerGoals() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [goals, setGoals] = useState<CareerGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<CareerGoal | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_date: undefined as Date | undefined,
    priority: "medium" as "low" | "medium" | "high",
    progress: 0,
    status: "not_started" as "not_started" | "in_progress" | "completed" | "on_hold",
    category: "general",
  })

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  const fetchGoals = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("career_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching goals:", error)
        toast({
          title: "Error",
          description: "Failed to load career goals",
          variant: "destructive",
        })
        return
      }

      setGoals(data || [])
    } catch (error) {
      console.error("Error fetching goals:", error)
      toast({
        title: "Error",
        description: "Failed to load career goals",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addGoal = async () => {
    if (!user || !formData.title.trim()) return

    try {
      const goalData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        target_date: formData.target_date ? format(formData.target_date, "yyyy-MM-dd") : null,
        priority: formData.priority,
        progress: formData.progress,
        status: formData.status,
        category: formData.category,
      }

      const { data, error } = await supabase.from("career_goals").insert([goalData]).select().single()

      if (error) {
        console.error("Error adding goal:", error)
        toast({
          title: "Error",
          description: `Failed to add career goal: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      setGoals([data, ...goals])
      resetForm()
      setIsDialogOpen(false)
      toast({
        title: "Success",
        description: "Career goal added successfully",
      })
    } catch (error) {
      console.error("error adding career goal:", error)
      toast({
        title: "Error",
        description: "Failed to add career goal",
        variant: "destructive",
      })
    }
  }

  const updateGoal = async () => {
    if (!user || !editingGoal || !formData.title.trim()) return

    try {
      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        target_date: formData.target_date ? format(formData.target_date, "yyyy-MM-dd") : null,
        priority: formData.priority,
        progress: formData.progress,
        status: formData.status,
        category: formData.category,
      }

      const { data, error } = await supabase
        .from("career_goals")
        .update(goalData)
        .eq("id", editingGoal.id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating goal:", error)
        toast({
          title: "Error",
          description: `Failed to update career goal: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      setGoals(goals.map((goal) => (goal.id === editingGoal.id ? data : goal)))
      resetForm()
      setIsDialogOpen(false)
      setEditingGoal(null)
      toast({
        title: "Success",
        description: "Career goal updated successfully",
      })
    } catch (error) {
      console.error("error updating career goal:", error)
      toast({
        title: "Error",
        description: "Failed to update career goal",
        variant: "destructive",
      })
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("career_goals").delete().eq("id", goalId).eq("user_id", user.id)

      if (error) {
        console.error("Error deleting goal:", error)
        toast({
          title: "Error",
          description: "Failed to delete career goal",
          variant: "destructive",
        })
        return
      }

      setGoals(goals.filter((goal) => goal.id !== goalId))
      toast({
        title: "Success",
        description: "Career goal deleted successfully",
      })
    } catch (error) {
      console.error("error deleting career goal:", error)
      toast({
        title: "Error",
        description: "Failed to delete career goal",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      target_date: undefined,
      priority: "medium",
      progress: 0,
      status: "not_started",
      category: "general",
    })
  }

  const openEditDialog = (goal: CareerGoal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description || "",
      target_date: goal.target_date ? new Date(goal.target_date) : undefined,
      priority: goal.priority,
      progress: goal.progress,
      status: goal.status,
      category: goal.category,
    })
    setIsDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingGoal(null)
    resetForm()
    setIsDialogOpen(true)
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Please sign in to view your career goals.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Career Goals</h2>
          <p className="text-gray-600">Track and manage your professional objectives</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Edit Career Goal" : "Add New Career Goal"}</DialogTitle>
              <DialogDescription>
                {editingGoal ? "Update your career goal details." : "Create a new career goal to track your progress."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Get promoted to Senior Developer"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your goal in detail..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "low" | "medium" | "high") => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "not_started" | "in_progress" | "completed" | "on_hold") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Career, Skills, Education"
                  />
                </div>
                <div>
                  <Label>Target Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.target_date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.target_date ? format(formData.target_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.target_date}
                        onSelect={(date) => setFormData({ ...formData, target_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <Label htmlFor="progress">Progress: {formData.progress}%</Label>
                <input
                  type="range"
                  id="progress"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: Number.parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingGoal ? updateGoal : addGoal}>{editingGoal ? "Update Goal" : "Add Goal"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No career goals yet</h3>
              <p className="text-gray-600 mb-4">Start tracking your professional objectives and milestones.</p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => {
            const StatusIcon = statusIcons[goal.status]
            return (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      {goal.description && <CardDescription className="mt-1">{goal.description}</CardDescription>}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(goal)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <Badge className={priorityColors[goal.priority]}>
                          {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
                        </Badge>
                        <Badge className={statusColors[goal.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {goal.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                        {goal.category && (
                          <Badge variant="outline">
                            {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
                          </Badge>
                        )}
                      </div>
                      {goal.target_date && (
                        <div className="text-gray-500">
                          Target: {format(new Date(goal.target_date), "MMM dd, yyyy")}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
