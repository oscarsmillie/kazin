"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Star,
  CheckCircle,
  ArrowRight,
  Target,
  Globe,
  Heart,
  Brain,
  Shield,
  Award,
  FileText,
  Mail,
  MessageSquare,
  BarChart3,
} from "lucide-react"

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/auth")
    }
  }

  const handleEmailSignup = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/auth?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-red-50">
      {/* Navigation */}
      <nav className="bg-card/50 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-semibold text-foreground">KaziNest</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" onClick={() => router.push("/pricing")} className="hover:bg-muted">
                Pricing
              </Button>
              <Button variant="ghost" onClick={() => router.push("/auth")} className="hover:bg-muted">
                Sign In
              </Button>
              <Button
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
              >
                Get Started Free
              </Button>
            </div>
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={handleGetStarted}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
              <Heart className="h-4 w-4 text-accent mr-2" />
              <span className="text-sm font-medium text-foreground">Built for Africa, Open to the World</span>
              <Globe className="h-4 w-4 text-primary ml-2" />
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground">
              Land Your Dream Job with{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                AI-Powered Tools
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Stop getting overlooked because of your location. KaziNest gives African professionals a fair advantage to
              compete globally and win jobs at top companies.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all h-12 px-8"
              >
                Start Winning Jobs Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/job-board")}
                className="border-border hover:bg-muted h-12 px-8"
              >
                Browse African Jobs
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">15hrs</div>
                <div className="text-sm text-muted-foreground">Time Saved Per Application</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">ATS Pass Rate</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-accent">23%</div>
                <div className="text-sm text-muted-foreground">Salary Increase</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">7 Days</div>
                <div className="text-sm text-muted-foreground">Time to Job Offer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need to Dominate Your Job Search</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Proudly African. Globally competitive. Our AI understands your professional journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI Resume Builder */}
            <Card className="border border-border hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className="bg-primary/20 text-primary text-xs font-medium">Gemini AI</Badge>
                </div>
                <CardTitle className="text-xl">AI Resume Builder</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Create ATS-optimized resumes that get past filters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    ATS-optimized templates
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    AI content suggestions
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Professional African templates
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Smart Cover Letters */}
            <Card className="border border-border hover:border-secondary/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="p-3 bg-secondary/10 rounded-lg group-hover:bg-secondary/15 transition-colors">
                    <Mail className="h-6 w-6 text-secondary" />
                  </div>
                  <Badge className="bg-secondary/20 text-secondary text-xs font-medium">Fast AI</Badge>
                </div>
                <CardTitle className="text-xl">Smart Cover Letters</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Generate personalized cover letters in seconds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                    Job-specific customization
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                    Follow-up templates
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                    Cultural awareness built-in
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* AI Career Coach */}
            <Card className="border border-border hover:border-accent/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/15 transition-colors">
                    <Brain className="h-6 w-6 text-accent" />
                  </div>
                  <Badge className="bg-accent/20 text-accent text-xs font-medium">Gemini 2.0</Badge>
                </div>
                <CardTitle className="text-xl">AI Career Coach</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Get personalized career advice from advanced AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    Deep career analysis
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    Salary negotiation tips
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    African market insights
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* African Job Board */}
            <Card className="border border-border hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className="bg-primary/20 text-primary text-xs font-medium">Pro Only</Badge>
                </div>
                <CardTitle className="text-xl">African Job Board</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your gateway to life-changing careers across Africa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Connect talent to opportunities
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Entry-level to executive roles
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Curated for Africa's market
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Job Application Tracker */}
            <Card className="border border-border hover:border-secondary/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="p-3 bg-secondary/10 rounded-lg group-hover:bg-secondary/15 transition-colors">
                    <BarChart3 className="h-6 w-6 text-secondary" />
                  </div>
                  <Badge className="bg-secondary/20 text-secondary text-xs font-medium">Analytics</Badge>
                </div>
                <CardTitle className="text-xl">Job Application Tracker</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Monitor your applications with analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                    Status tracking
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                    Success analytics
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                    Follow-up reminders
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Mock Interview Prep */}
            <Card className="border border-border hover:border-accent/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/15 transition-colors">
                    <MessageSquare className="h-6 w-6 text-accent" />
                  </div>
                  <Badge className="bg-accent/20 text-accent text-xs font-medium">AI Powered</Badge>
                </div>
                <CardTitle className="text-xl">Mock Interview Prep</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Practice with AI and get detailed feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    Role-specific questions
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    Performance analysis
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                    Improvement suggestions
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Trusted by African Professionals at Top Companies
            </h2>
            <p className="text-xl text-muted-foreground">Join thousands who've elevated their careers with KaziNest</p>
          </div>

          {/* Company Logos */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center opacity-60 mb-16">
            {["Safaricom", "Jumia", "Flutterwave", "MTN", "Standard Bank", "Equity Bank", "Google", "Microsoft"].map(
              (company) => (
                <div key={company} className="text-center">
                  <div className="h-12 bg-muted rounded flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">{company}</span>
                  </div>
                </div>
              ),
            )}
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "KaziNest helped me land a $180k remote role at a US tech company. The ATS optimization was
                  game-changing!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    A
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">Amara Okafor</p>
                    <p className="text-sm text-muted-foreground">Software Engineer, Lagos Nigeria</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-secondary/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "From 200+ applications with no response to 3 job offers in 2 weeks. KaziNest is magic!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    K
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">Kwame Opiyo</p>
                    <p className="text-sm text-muted-foreground">Data Analyst, Nairobi Kenya</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-accent/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The AI career coach understood my African background and helped me negotiate a $165k salary!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    F
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">Fatima Al-Rashid</p>
                    <p className="text-sm text-muted-foreground">Product Manager, Cairo Egypt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">Stop Getting Rejected. Start Getting Hired.</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-red-600 font-bold">✗</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Your Resume Gets Lost in ATS Systems</h3>
                    <p className="text-muted-foreground">
                      98% of resumes never reach human eyes because they fail ATS screening
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-red-600 font-bold">✗</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Generic Applications Don't Stand Out</h3>
                    <p className="text-muted-foreground">
                      Hiring managers can spot copy-paste applications from miles away
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-red-600 font-bold">✗</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Location Bias Hurts African Talent</h3>
                    <p className="text-muted-foreground">
                      Qualified professionals get overlooked due to unconscious location bias
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-foreground mb-6">KaziNest Gives You an Unfair Advantage</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">Beat ATS systems with optimized formatting</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">Create personalized applications in minutes</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">Compete globally from anywhere in Africa</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">Get AI coaching that understands your journey</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Priced for African Professionals</h2>
            <p className="text-xl text-muted-foreground">
              One global job offer pays for itself. Start free, upgrade when ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Free Forever</CardTitle>
                <div className="text-4xl font-bold text-foreground mt-4">$0</div>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>5 AI cover letters</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>5 professional emails</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>10 job applications tracking</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>Resume templates</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>Access to Public Job Board</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>Save and Track Career Goals</span>
                </div>
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground mb-4">Resume downloads: Ksh299 each</p>
                  <Button onClick={handleGetStarted} className="w-full">
                    Get Started Free
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-br from-primary to-accent text-white">Most Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Professional Plan</CardTitle>
                <div className="text-4xl font-bold text-foreground mt-4">Ksh 599</div>
                <CardDescription>Everything you need to win</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>Unlimited AI cover letters</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>Unlimited professional emails</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>3 free resume downloads per month</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>Access to Public and Private Job Boards</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>Mock interview sessions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>Unlimited job applications tracking</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>Premium Resume templates</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span>AI career coaching</span>
                </div>
                <div className="text-center pt-4">
                  <Button
                    onClick={() => router.push("/pricing")}
                    className="w-full bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    Start Today
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Email Signup CTA */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-12 text-primary-foreground">
            <h2 className="text-4xl font-bold mb-4">Your Dream Job is Waiting</h2>
            <p className="text-xl mb-8 opacity-90">
              Join 10,000+ African professionals who've transformed their careers with KaziNest
            </p>

            <form onSubmit={handleEmailSignup} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-background text-foreground"
                required
              />
              <Button type="submit" variant="secondary" className="bg-background text-primary hover:bg-muted">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="text-sm mt-4 opacity-75">No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="ml-2 text-xl font-bold">KaziNest</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Built for Africa, Open to the World. Empowering African professionals to compete globally and win their
                dream jobs.
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-gray-400">Proudly African. Globally competitive.</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="/resume-builder" className="hover:text-white transition-colors">
                    Resume Builder
                  </a>
                </li>
                <li>
                  <a href="/cover-letter" className="hover:text-white transition-colors">
                    Cover Letters
                  </a>
                </li>
                <li>
                  <a href="/career-coach" className="hover:text-white transition-colors">
                    AI Career Coach
                  </a>
                </li>
                <li>
                  <a href="/job-board" className="hover:text-white transition-colors">
                    Job Board
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/about" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 KaziNest. Built for Africa, Open to the World.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Badge variant="outline" className="text-gray-400 border-gray-600">
                <Shield className="h-3 w-3 mr-1" />
                SOC 2 Compliant
              </Badge>
              <Badge variant="outline" className="text-gray-400 border-gray-600">
                <Award className="h-3 w-3 mr-1" />
                GDPR Ready
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
