"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function PricingSection() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const router = useRouter()
  const { user } = useAuth()

  const handleSubscribe = (planType: string) => {
    if (!user) {
      router.push("/auth?redirect=pricing")
      return
    }

    // For free plan, just redirect to dashboard
    if (planType === "free") {
      router.push("/dashboard")
      return
    }

    // For paid plans, redirect to payment with proper plan data
    const plan = plans.find((p) => p.key === planType)
    if (plan) {
      const amount = billingInterval === "monthly" ? plan.monthlyPrice : getYearlyPrice(plan.monthlyPrice)

      // Use the PayButton component or redirect to payment page
      router.push(`/payment/checkout?plan=${planType}&billing=${billingInterval}&amount=${amount}`)
    }
  }

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.85) // 15% discount
  }

  const plans = [
    {
      key: "free",
      name: "Free Plan",
      monthlyPrice: 0,
      color: "green",
      features: [
        "10 cover letters / month",
        "10 emails / month",
        "10 job applications tracking",
        "Ksh 199 per resume download",
        "Access to Public Job Board",
        "Save and Track Career Goals",
      ],
      limitations: ["Limited AI generations", "No premium templates", "No interview prep", "No priority support"],
      description: "Get started with essential tools for job applications.",
      ideal: "Ideal for beginners and casual job seekers testing the platform.",
    },
    {
      key: "professional",
      name: "Professional Plan",
      monthlyPrice: 499, // Updated to Ksh 499
      color: "blue",
      popular: true,
      features: [
        "Unlimited cover letters",
        "Unlimited emails",
        "Unlimited job applications tracking",
        "3 free resume downloads per month",
        "All premium templates",
        "Premium job board access",
        "Unlimited interview prep sessions",
        "Unlimited AI career coaching",
        "Priority support",
        "ATS optimization tools",
        "Advanced analytics",
      ],
      limitations: [],
      description: "Most Popular: Everything you need for serious job hunting.",
      ideal: "Perfect for active job seekers and career professionals.",
      usdEquivalent: "$4.19",
    },
  ]

  return (
    <section className="py-16 bg-gray-50" id="pricing">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Simple, Transparent Pricing</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Choose the plan that works best for your career goals
            </p>
          </div>
          <div className="w-full max-w-sm">
            <Tabs
              defaultValue="monthly"
              className="w-full"
              onValueChange={(value) => setBillingInterval(value as "monthly" | "yearly")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly (Save 15%)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="grid max-w-4xl mx-auto grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 mt-8">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={`flex flex-col ${plan.popular ? "border-blue-500 shadow-lg bg-blue-50/50" : ""}`}
            >
              {plan.popular && (
                <div className="px-3 py-1 text-xs bg-blue-500 text-white w-fit rounded-full mx-auto mb-2 mt-4">
                  Most Popular
                </div>
              )}
              <CardHeader className="flex flex-col space-y-1.5">
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {plan.color === "green" && "🟢"}
                    {plan.color === "blue" && "🔵"}
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">{plan.name}</CardTitle>
                <CardDescription className="text-center">{plan.description}</CardDescription>
                <div className="mt-4 text-center">
                  <div className="text-3xl font-bold">
                    Ksh
                    {billingInterval === "monthly"
                      ? plan.monthlyPrice.toLocaleString()
                      : getYearlyPrice(plan.monthlyPrice).toLocaleString()}
                    {plan.monthlyPrice > 0 && (
                      <span className="text-sm font-normal text-gray-500">
                        /{billingInterval === "monthly" ? "month" : "year"}
                      </span>
                    )}
                  </div>
                  {plan.usdEquivalent && <p className="text-sm text-muted-foreground">({plan.usdEquivalent})</p>}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 flex-1">
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg mt-auto">
                  <p className="text-xs text-muted-foreground">
                    <strong>💡 {plan.ideal}</strong>
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                {plan.key === "free" ? (
                  <Badge variant="secondary" className="w-full py-2 justify-center">
                    Current Plan
                  </Badge>
                ) : (
                  <Button
                    className={`w-full ${plan.popular ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                    onClick={() => handleSubscribe(plan.key)}
                  >
                    {user ? `Upgrade to ${plan.name}` : "Sign up to Subscribe"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Built with KaziNest footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">Built with ❤️ by KaziNest</p>
        </div>
      </div>
    </section>
  )
}
