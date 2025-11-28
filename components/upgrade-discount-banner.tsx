"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Crown, Sparkles, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface UpgradeDiscountBannerProps {
  userId: string
  initialCurrency?: "KES" | "USD"
}

export default function UpgradeDiscountBanner({ userId, initialCurrency = "KES" }: UpgradeDiscountBannerProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [currency, setCurrency] = useState<"KES" | "USD">(initialCurrency)

  const discountedPrice = currency === "KES" ? 300 : 2.5
  const originalPrice = currency === "KES" ? 599 : 5
  const savings = currency === "KES" ? 299 : 2.5
  const displayPrice = currency === "KES" ? `Ksh ${discountedPrice}` : `$${discountedPrice.toFixed(2)}`
  const displayOriginal = currency === "KES" ? `Ksh ${originalPrice}` : `$${originalPrice.toFixed(2)}`
  const displaySavings = currency === "KES" ? `Ksh ${savings}` : `$${savings.toFixed(2)}`

  const handleUpgrade = async () => {
    setIsProcessing(true)
    try {
      console.log("[v0] Initiating discount upgrade:", { userId, currency, amount: discountedPrice })

      const response = await fetch("/api/initiate-upgrade-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currency,
          amount: discountedPrice,
          paymentType: "discounted_upgrade",
        }),
      })

      const data = await response.json()
      console.log("[v0] Upgrade payment response:", data)

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        toast.error(data.error || "Failed to initiate payment")
      }
    } catch (error) {
      console.error("[v0] Upgrade payment error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle className="text-xl">Limited Time Offer!</CardTitle>
              <CardDescription className="text-sm mt-1">Upgrade to Professional at a Special Price</CardDescription>
            </div>
          </div>
          <Badge className="bg-purple-600 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            Save {displaySavings}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-3 p-2 bg-white rounded-lg border border-purple-200">
          <span className={`text-sm font-medium ${currency === "KES" ? "text-purple-700" : "text-gray-500"}`}>
            KES (Ksh)
          </span>
          <Switch checked={currency === "USD"} onCheckedChange={(checked) => setCurrency(checked ? "USD" : "KES")} />
          <span className={`text-sm font-medium ${currency === "USD" ? "text-purple-700" : "text-gray-500"}`}>
            USD ($)
          </span>
        </div>

        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-purple-600">{displayPrice}</span>
            <span className="text-lg text-gray-400 line-through">{displayOriginal}</span>
            <span className="text-sm text-green-600 font-semibold">50% OFF</span>
          </div>
          <p className="text-sm text-gray-600">One-time offer for new customers</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">Unlock Professional Features:</p>
          <ul className="space-y-1.5">
            {[
              "Unlimited cover letters & emails",
              "3 free resume downloads/month",
              "Unlimited job applications",
              "Priority support",
              "Advanced AI features",
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 text-lg"
          size="lg"
        >
          {isProcessing ? "Processing..." : `Upgrade Now for ${displayPrice}`}
        </Button>

        <p className="text-xs text-center text-gray-500">
          This special offer is only available once. Regular price: {displayOriginal}/month
        </p>
      </CardContent>
    </Card>
  )
}
