"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { CreditCard, Plus, Trash2, Calendar } from "lucide-react"

interface PaymentMethod {
  id: string
  type: "card" | "mobile_money"
  last_four?: string
  brand?: string
  phone_number?: string
  is_default: boolean
  created_at: string
}

interface BillingHistory {
  id: string
  amount: number
  currency: string
  status: string
  description: string
  created_at: string
  payment_method?: string
}

export default function BillingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([])
  const [showAddCard, setShowAddCard] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [cardForm, setCardForm] = useState({
    type: "card",
    card_number: "",
    expiry_month: "",
    expiry_year: "",
    cvv: "",
    cardholder_name: "",
    phone_number: "",
    provider: "mpesa",
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }

    loadBillingData()
  }, [user, router])

  const loadBillingData = async () => {
    try {
      setLoading(true)

      // Load payment methods
      const { data: methods } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      setPaymentMethods(methods || [])

      // Load billing history
      const { data: history } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(20)

      setBillingHistory(history || [])
    } catch (error) {
      console.error("Error loading billing data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setCardForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const methodData = {
        user_id: user?.id,
        type: cardForm.type,
        last_four: cardForm.type === "card" ? cardForm.card_number.slice(-4) : null,
        brand: cardForm.type === "card" ? "visa" : null, // You'd detect this from card number
        phone_number: cardForm.type === "mobile_money" ? cardForm.phone_number : null,
        provider: cardForm.type === "mobile_money" ? cardForm.provider : null,
        is_default: paymentMethods.length === 0, // First method is default
        // Note: In production, you'd tokenize the card details securely
        encrypted_data: JSON.stringify({
          cardholder_name: cardForm.cardholder_name,
          expiry_month: cardForm.expiry_month,
          expiry_year: cardForm.expiry_year,
        }),
      }

      const { error } = await supabase.from("payment_methods").insert([methodData])

      if (error) throw error

      setMessage({ type: "success", text: "Payment method added successfully!" })
      setShowAddCard(false)
      setCardForm({
        type: "card",
        card_number: "",
        expiry_month: "",
        expiry_year: "",
        cvv: "",
        cardholder_name: "",
        phone_number: "",
        provider: "mpesa",
      })
      loadBillingData()

      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to add payment method" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleSetDefault = async (methodId: string) => {
    try {
      // Remove default from all methods
      await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user?.id)

      // Set new default
      const { error } = await supabase.from("payment_methods").update({ is_default: true }).eq("id", methodId)

      if (error) throw error

      setMessage({ type: "success", text: "Default payment method updated!" })
      loadBillingData()
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update default method" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteMethod = async (methodId: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return

    try {
      const { error } = await supabase.from("payment_methods").delete().eq("id", methodId)

      if (error) throw error

      setMessage({ type: "success", text: "Payment method deleted successfully!" })
      loadBillingData()
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to delete payment method" })
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
        <h1 className="text-3xl font-bold mb-2">Billing & Payment Methods</h1>
        <p className="text-gray-600">Manage your payment methods and view billing history</p>
      </div>

      {message && (
        <Alert
          className={`mb-6 ${message.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="methods" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="methods">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Payment Methods</h2>
              <Button onClick={() => setShowAddCard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>

            {showAddCard && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Payment Method</CardTitle>
                  <CardDescription>Add a new card or mobile money account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                    <div>
                      <Label htmlFor="type">Payment Type</Label>
                      <Select value={cardForm.type} onValueChange={(value) => handleSelectChange("type", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">Credit/Debit Card</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {cardForm.type === "card" ? (
                      <>
                        <div>
                          <Label htmlFor="cardholder_name">Cardholder Name</Label>
                          <Input
                            id="cardholder_name"
                            name="cardholder_name"
                            value={cardForm.cardholder_name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="card_number">Card Number</Label>
                          <Input
                            id="card_number"
                            name="card_number"
                            value={cardForm.card_number}
                            onChange={handleInputChange}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="expiry_month">Month</Label>
                            <Select
                              value={cardForm.expiry_month}
                              onValueChange={(value) => handleSelectChange("expiry_month", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="MM" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                  <SelectItem key={i + 1} value={String(i + 1).padStart(2, "0")}>
                                    {String(i + 1).padStart(2, "0")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="expiry_year">Year</Label>
                            <Select
                              value={cardForm.expiry_year}
                              onValueChange={(value) => handleSelectChange("expiry_year", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="YYYY" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 10 }, (_, i) => (
                                  <SelectItem key={i} value={String(new Date().getFullYear() + i)}>
                                    {new Date().getFullYear() + i}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              name="cvv"
                              value={cardForm.cvv}
                              onChange={handleInputChange}
                              placeholder="123"
                              maxLength={4}
                              required
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="provider">Provider</Label>
                          <Select
                            value={cardForm.provider}
                            onValueChange={(value) => handleSelectChange("provider", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mpesa">M-Pesa</SelectItem>
                              <SelectItem value="airtel">Airtel Money</SelectItem>
                              <SelectItem value="tkash">T-Kash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="phone_number">Phone Number</Label>
                          <Input
                            id="phone_number"
                            name="phone_number"
                            value={cardForm.phone_number}
                            onChange={handleInputChange}
                            placeholder="+254712345678"
                            required
                          />
                        </div>
                      </>
                    )}

                    <div className="flex gap-4">
                      <Button type="submit">Add Payment Method</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddCard(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Payment Methods List */}
            <div className="space-y-4">
              {paymentMethods.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No payment methods added yet</p>
                    <Button className="mt-4" onClick={() => setShowAddCard(true)}>
                      Add Your First Payment Method
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                paymentMethods.map((method) => (
                  <Card key={method.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <CreditCard className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {method.type === "card"
                                  ? `•••• •••• •••• ${method.last_four}`
                                  : `${method.phone_number}`}
                              </h3>
                              {method.is_default && <Badge variant="default">Default</Badge>}
                            </div>
                            <p className="text-sm text-gray-600">
                              {method.type === "card" ? `${method.brand?.toUpperCase()} Card` : `Mobile Money`}
                            </p>
                            <p className="text-xs text-gray-500">
                              Added {new Date(method.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!method.is_default && (
                            <Button size="sm" variant="outline" onClick={() => handleSetDefault(method.id)}>
                              Set Default
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleDeleteMethod(method.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View your past transactions and payments</CardDescription>
            </CardHeader>
            <CardContent>
              {billingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No billing history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingHistory.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{transaction.description}</h4>
                        <p className="text-sm text-gray-600">{new Date(transaction.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {transaction.currency} {transaction.amount.toLocaleString()}
                        </p>
                        <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
