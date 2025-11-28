export interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    domain: string
    status: string
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: {
      custom_fields: Array<{
        display_name: string
        variable_name: "user_id" | "plan" | "payment_type" | "resume_id" | "description"
        value: string
      }>
    }
    log: {
      start_time: number
      time_spent: number
      attempts: number
      errors: number
      success: boolean
      mobile: boolean
      input: any[]
      history: Array<{
        type: string
        message: string
        time: number
      }>
    }
    fees: number
    fees_split: any
    authorization: {
      authorization_code: string
      bin: string
      last4: string
      exp_month: string
      exp_year: string
      channel: string
      card_type: string
      bank: string
      country_code: string
      brand: string
      reusable: boolean
      signature: string
      account_name: string | null
    }
    customer: {
      id: number
      first_name: string | null
      last_name: string | null
      email: string
      customer_code: string
      phone: string | null
      metadata: any
      risk_action: string
      international_format_phone: string | null
    }
    plan: any
    split: any
    order_id: any
    paidAt: string
    createdAt: string
    requested_amount: number
    pos_transaction_data: any
    source: any
    fees_breakdown: any
    transaction_date: string
    plan_object: any
    subaccount: any
  }
}

export class PaystackService {
  private secretKey: string
  private baseUrl = "https://api.paystack.co"

  constructor() {
    const secretKey = process.env.PAYSTACK_LIVE_KEY || process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      throw new Error("PAYSTACK_LIVE_KEY or PAYSTACK_SECRET_KEY environment variable is required")
    }
    this.secretKey = secretKey
  }

  async initializeTransaction(params: {
    email: string
    amount: number
    currency: string
    plan?: string
    userId?: string
    description?: string
    callback_url?: string
    type?: "resume_download" | "professional_upgrade"
    resumeId?: string
    metadata?: {
      user_id: string
      plan: string
      payment_type: string
      resume_id?: string | null
      description?: string
      custom_fields: Array<{
        display_name: string
        variable_name: string
        value: string
      }>
    }
  }): Promise<PaystackInitializeResponse> {
    try {
      const amountInSmallestUnit = Math.round(params.amount * 100)

      const metadata = params.metadata || {
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: params.userId || "unknown_user",
          },
          {
            display_name: "Plan",
            variable_name: "plan",
            value: params.plan || "monthly",
          },
          {
            display_name: "Payment Type",
            variable_name: "payment_type",
            value: params.type || "general",
          },
          ...(params.resumeId
            ? [
                {
                  display_name: "Resume ID",
                  variable_name: "resume_id",
                  value: params.resumeId,
                },
              ]
            : []),
          ...(params.description
            ? [
                {
                  display_name: "Description",
                  variable_name: "description",
                  value: params.description,
                },
              ]
            : []),
        ],
      }

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: params.email,
          amount: amountInSmallestUnit,
          currency: params.currency.toUpperCase(),
          metadata,
          callback_url: params.callback_url,
        }),
      })

      // ✅ This should be OUTSIDE the fetch() call
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to initialize transaction")
      }

      return data
    } catch (error) {
      console.error("Paystack initialization error:", error)
      throw error
    }
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify transaction")
      }

      return data
    } catch (error) {
      console.error("Paystack verification error:", error)
      throw error
    }
  }

  async listTransactions(params?: {
    perPage?: number
    page?: number
    customer?: string
    status?: "failed" | "success" | "abandoned"
    from?: string
    to?: string
    amount?: number
  }) {
    try {
      const queryParams = new URLSearchParams()
      if (params?.perPage) queryParams.append("perPage", params.perPage.toString())
      if (params?.page) queryParams.append("page", params.page.toString())
      if (params?.customer) queryParams.append("customer", params.customer)
      if (params?.status) queryParams.append("status", params.status)
      if (params?.from) queryParams.append("from", params.from)
      if (params?.to) queryParams.append("to", params.to)
      if (params?.amount) queryParams.append("amount", (params.amount * 100).toString())

      const url = `${this.baseUrl}/transaction?${queryParams.toString()}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to list transactions")
      }

      return data
    } catch (error) {
      console.error("Paystack list transactions error:", error)
      throw error
    }
  }

  formatAmount(amountInSmallestUnit: number, currency: string): string {
    const amount = amountInSmallestUnit / 100
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount)
  }
}

const paystackInstance = new PaystackService()

export const paystack = paystackInstance
