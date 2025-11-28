"use client"

import { Switch } from "@/components/ui/switch"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Star, Zap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import PayButton from "@/components/pay-button"
import Link from "next/link"

export default function PricingPage() {
  const { user } = useAuth()
  const [isYearly, setIsYearly] = useState(false)
  const [currency, setCurrency] = useState<"KES" | "USD">("KES")

  const plans = [
    {
      name: "Free",
      description: "Perfect for getting started",
      priceKES: 0,
      priceUSD: 0,
      yearlyPriceKES: 0,
      yearlyPriceUSD: 0,
      features: [
        "10 cover letters per month",
        "10 emails per month",
        "10 job applications tracking",
        "Ksh 299 per resume download", // Updated pricing to Ksh 299/$2.5 for CV downloads
        "Access to Public Job Board",
        "Save and Track Career Goals",
      ],
      limitations: [
        "Limited AI generations",
        "Pay-per-download resumes",
        "No premium templates",
        "No priority support",
      ],
      buttonText: "Current Plan",
      isPopular: false,
      isCurrentPlan: true,
    },
    {
      name: "Professional",
      description: "Everything you need to land your dream job",
      priceKES: 599, // Updated pricing to Ksh 599/$4.5 for Professional plan
      priceUSD: 4.5,
      yearlyPriceKES: 5999,
      yearlyPriceUSD: 45,
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
        "Export to multiple formats",
      ],
      limitations: [],
      buttonText: "Upgrade Now",
      isPopular: true,
      isCurrentPlan: false,
    },
  ]

  const handlePaymentSuccess = (response: any) => {
    console.log("Payment successful:", response)
    // Redirect to success page or refresh user data
    window.location.href = "/dashboard?upgraded=true"
  }

  const getPrice = (plan: (typeof plans)[0]) => {
    if (currency === "KES") {
      return isYearly ? plan.yearlyPriceKES : plan.priceKES
    }
    return isYearly ? plan.yearlyPriceUSD : plan.priceUSD
  }

  const getSavings = (plan: (typeof plans)[0]) => {
    if (plan.priceKES === 0) return 0
    if (currency === "KES") {
      return plan.priceKES * 12 - plan.yearlyPriceKES
    }
    return plan.priceUSD * 12 - plan.yearlyPriceUSD
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 mb-8">Unlock your career potential with our professional tools</p>

          <div className="flex items-center justify-center space-x-6 mb-4">
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${currency === "KES" ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                Ksh (KES)
              </span>
              <Switch
                checked={currency === "USD"}
                onCheckedChange={(checked) => setCurrency(checked ? "USD" : "KES")}
              />
              <span className={`text-sm ${currency === "USD" ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                USD ($)
              </span>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${!isYearly ? "text-gray-900 font-medium" : "text-gray-500"}`}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm ${isYearly ? "text-gray-900 font-medium" : "text-gray-500"}`}>
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-800">Save 17%</Badge>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.isPopular ? "border-2 border-blue-500 shadow-xl scale-105" : "border border-gray-200 shadow-lg"
              } transition-all duration-200 hover:shadow-xl`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold flex items-center justify-center">
                  {plan.name}
                  {plan.name === "Professional" && <Crown className="h-6 w-6 ml-2 text-yellow-500" />}
                </CardTitle>
                <CardDescription className="text-gray-600">{plan.description}</CardDescription>

                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {currency === "KES" ? "Ksh" : "$"} {getPrice(plan).toLocaleString()}
                    </span>
                    {plan.priceKES > 0 && <span className="text-gray-500 ml-2">/{isYearly ? "year" : "month"}</span>}
                  </div>
                  {isYearly && plan.priceKES > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      Save {currency === "KES" ? "Ksh" : "$"} {getSavings(plan).toLocaleString()} per year
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {plan.isCurrentPlan ? (
                    <Button disabled className="w-full bg-transparent" variant="outline">
                      {plan.buttonText}
                    </Button>
                  ) : user ? (
                    <PayButton
                      amount={getPrice(plan)}
                      currency={currency}
                      type="professional_upgrade"
                      description={`${plan.name} Plan - ${isYearly ? "Yearly" : "Monthly"}`}
                      onSuccess={handlePaymentSuccess}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {plan.buttonText}
                    </PayButton>
                  ) : (
                    <Link href="/auth">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">Sign Up to Get Started</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-gray-600">
                  Yes, you can cancel your subscription at any time. You'll continue to have access to premium features
                  until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">
                  We accept all major credit cards, debit cards, and mobile money payments through Paystack. All
                  payments are processed securely.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">How much does a resume download cost?</h3>
                <p className="text-gray-600">
                  For free plan users, each resume download costs Ksh 299. Professional plan users get 3 free resume
                  downloads per month.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
                <p className="text-gray-600">
                  We offer a 7-day money-back guarantee for new subscribers. If you're not satisfied with our service,
                  contact our support team for a full refund.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
