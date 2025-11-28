"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Send, ArrowLeft, Bot, Trash2, Download } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  message_count: number
}

export default function CareerCoachSessionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [chatId, setChatId] = useState<string>("")
  const [savingDocument, setSavingDocument] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }
    checkAccessAndLoadChat()
  }, [user, router])

  const checkAccessAndLoadChat = async () => {
    try {
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single()

      const isProfessional = subData?.plan_type === "professional"
      setHasAccess(isProfessional)

      if (isProfessional) {
        const newChatId = `chat_${Date.now()}`
        setChatId(newChatId)

        const { data: chats, error } = await supabase
          .from("career_coach_chats")
          .select("id, title, created_at")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) {
          console.error("[v0] Error loading chat history:", error)
        } else if (chats && chats.length > 0) {
          setChatHistory(
            chats.map((chat: any) => ({
              id: chat.id,
              title: chat.title || "Career Coaching Session",
              created_at: chat.created_at,
              message_count: 0,
            })),
          )
        }

        // Initialize with welcome message
        const welcomeMessage: Message = {
          id: "1",
          role: "assistant",
          content: `Hello! I'm your AI Career Coach. I'm here to provide personalized guidance tailored to your professional journey.

Whether you're looking to advance in your current role, transition to a new industry, or develop specific skills, I'm here to help you create a strategic plan.

What aspect of your career would you like to focus on today?`,
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
      }
    } catch (error) {
      console.error("[v0] Error checking access:", error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setSending(true)

    try {
      await supabase.from("career_coach_messages").insert({
        chat_id: chatId,
        user_id: user?.id,
        role: "user",
        content: input,
      })

      // Get AI response
      const response = await fetch("/api/career-coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userId: user?.id,
          conversationHistory: messages,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      await supabase.from("career_coach_messages").insert({
        chat_id: chatId,
        user_id: user?.id,
        role: "assistant",
        content: data.response,
      })

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  const handleSaveAsDocument = async () => {
    if (messages.length === 0) {
      alert("No messages to save")
      return
    }

    setSavingDocument(true)
    try {
      const chatContent = messages
        .map((msg) => {
          const role = msg.role === "user" ? "You" : "Career Coach"
          return `${role}:\n${msg.content}\n`
        })
        .join("\n---\n\n")

      const { data: chatSession, error: chatError } = await supabase
        .from("career_coach_chats")
        .insert({
          user_id: user?.id,
          title: `Career Coaching Session - ${new Date().toLocaleDateString()}`,
          content: chatContent,
        })
        .select()
        .single()

      if (chatError) {
        console.error("[v0] Chat save error:", chatError)
        throw chatError
      }

      if (chatSession) {
        const { data: chats } = await supabase
          .from("career_coach_chats")
          .select("id, title, created_at")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (chats) {
          setChatHistory(
            chats.map((chat: any) => ({
              id: chat.id,
              title: chat.title || "Career Coaching Session",
              created_at: chat.created_at,
              message_count: 0,
            })),
          )
        }

        alert("Chat saved successfully! You can view it in your chat history.")
      }
    } catch (error) {
      console.error("[v0] Error saving document:", error)
      alert("Failed to save document. Please try again.")
    } finally {
      setSavingDocument(false)
    }
  }

  useEffect(() => {
    if (!chatId || !user) {
      return
    }
    if (chatId.startsWith("chat_")) {
      // This is a new session, skip loading existing messages
      return
    }
    loadChatMessages()
  }, [chatId, user])

  const loadChatMessages = async () => {
    if (!chatId) return
    try {
      const { data: messages, error } = await supabase
        .from("career_coach_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("[v0] Error loading messages:", error)
        return
      }

      if (messages && messages.length > 0) {
        const loadedMessages: Message[] = messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }))
        setMessages(loadedMessages)
      }
    } catch (error) {
      console.error("[v0] Error loading chat messages:", error)
    }
  }

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear your chat history? This cannot be undone.")) {
      try {
        await supabase.from("career_coach_messages").delete().eq("chat_id", chatId)
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: `Hello! I'm your AI Career Coach. Ready to help you advance your career.`,
            timestamp: new Date(),
          },
        ])
      } catch (error) {
        console.error("Error clearing history:", error)
      }
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
              <CardDescription>This feature is only available for Professional subscribers</CardDescription>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Career Coach
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAsDocument}
              disabled={savingDocument || messages.length === 0}
              className="text-green-600 hover:text-green-700 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              {savingDocument ? "Saving..." : "Save as Word"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="text-red-600 hover:text-red-700 bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">Chat History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {chatHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">No previous chats</p>
                ) : (
                  chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      className="w-full text-left p-2 rounded hover:bg-purple-50 text-sm text-gray-700 hover:text-purple-700 transition-colors"
                    >
                      <p className="font-medium truncate">{chat.title}</p>
                      <p className="text-xs text-gray-500">{new Date(chat.created_at).toLocaleDateString()}</p>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Chat */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  <div>
                    <CardTitle>AI Career Coaching Session</CardTitle>
                    <CardDescription>Get personalized career guidance</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-900 whitespace-pre-wrap"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <span className="text-xs opacity-70 mt-2 block">{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="border-t p-4 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask your career coach..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !input.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
