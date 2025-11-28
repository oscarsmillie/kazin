"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Check, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getUserSubscription } from "@/lib/subscription"
import PayButton from "./pay-button"

interface UpgradeButtonProps {
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export default function UpgradeButton({ className, variant = "default", size = "default" }: UpgradeButtonProps) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSubscription()
    }
  }, [user])

  const fetchSubscription = async () => {
    try {
      const sub = await getUserSubscription(user?.id || "")
      setSubscription(sub)
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (subscription?.plan_type === "premium") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-green-800 flex items-center">
              <Crown className="mr-2 h-5 w-5" />
              Premium Active
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-green-700">
              <Check className="mr-2 h-4 w-4" />3 free resume downloads per month
            </div>
            <div className="flex items-center text-sm text-green-700">
              <Check className="mr-2 h-4 w-4" />
              Access to all premium templates
            </div>
            <div className="flex items-center text-sm text-green-700">
              <Check className="mr-2 h-4 w-4" />
              Unlimited AI features
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <PayButton
      amount={14.99} // $14.99 per month
      currency="USD"
      plan="premium_monthly"
      email={user.email || ""}
      userId={user.id}
      description="Premium Monthly Subscription - $14.99"
      className={className}
      variant={variant}
      size={size}
    >
      <Crown className="mr-2 h-4 w-4" />
      Upgrade to Premium - $14.99/month
    </PayButton>
  )
}
