const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY
const CONVERTKIT_API_URL = "https://api.kit.com/v4"

const CONVERTKIT_CONFIG = {
  lists: {
    free: process.env.CONVERTKIT_FREE_LIST_ID || "1", // Default to list 1, update with actual ID
    professional: process.env.CONVERTKIT_PROFESSIONAL_LIST_ID || "2", // Default to list 2, update with actual ID
  },
  tags: {
    free: process.env.CONVERTKIT_FREE_TAG_ID || "free-plan",
    professional: process.env.CONVERTKIT_PROFESSIONAL_TAG_ID || "professional-plan",
    monthly: process.env.CONVERTKIT_MONTHLY_TAG_ID || "monthly-billing",
    yearly: process.env.CONVERTKIT_YEARLY_TAG_ID || "yearly-billing",
  },
}

export async function subscribeToConvertKit(email: string, firstName: string) {
  if (!CONVERTKIT_API_KEY) {
    console.warn("[v0] ConvertKit API key not configured")
    return { success: false, error: "ConvertKit not configured" }
  }

  try {
    const response = await fetch(`${CONVERTKIT_API_URL}/subscribers`, {
      method: "POST",
      headers: {
        "X-Kit-Api-Key": CONVERTKIT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        first_name: firstName,
        state: "active",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] ConvertKit API error response:", errorText)
      throw new Error(`ConvertKit API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] Successfully subscribed to ConvertKit:", email)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] ConvertKit subscription error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function subscribeToConvertKitWithPlan(
  email: string,
  firstName: string,
  planType: "free" | "professional",
  billingCycle?: "monthly" | "yearly",
) {
  if (!CONVERTKIT_API_KEY) {
    console.warn("[v0] ConvertKit API key not configured")
    return { success: false, error: "ConvertKit not configured" }
  }

  try {
    // Step 1: Subscribe to main ConvertKit
    const subscriber = await subscribeToConvertKit(email, firstName)
    if (!subscriber.success) {
      return subscriber
    }

    const subscriberId = subscriber.data?.subscriber?.id

    if (!subscriberId) {
      console.warn("[v0] Could not get subscriber ID from ConvertKit response")
      return { success: true, message: "Subscribed but could not add to list" }
    }

    // Step 2: Add to specific list based on plan
    const listId = CONVERTKIT_CONFIG.lists[planType]
    if (listId && listId !== "1" && listId !== "2") {
      await addSubscriberToList(subscriberId, listId)
    }

    // Step 3: Add tags for plan type
    const planTag = CONVERTKIT_CONFIG.tags[planType]
    if (planTag) {
      await addTagToSubscriber(subscriberId, planTag)
    }

    // Step 4: Add billing cycle tag if yearly
    if (billingCycle === "yearly") {
      const yearlyTag = CONVERTKIT_CONFIG.tags.yearly
      if (yearlyTag) {
        await addTagToSubscriber(subscriberId, yearlyTag)
      }
    } else if (billingCycle === "monthly") {
      const monthlyTag = CONVERTKIT_CONFIG.tags.monthly
      if (monthlyTag) {
        await addTagToSubscriber(subscriberId, monthlyTag)
      }
    }

    console.log("[v0] Successfully subscribed to ConvertKit with plan tags:", email, planType)
    return { success: true, subscriberId }
  } catch (error) {
    console.error("[v0] ConvertKit plan subscription error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function addSubscriberToList(subscriberId: string | number, listId: string | number) {
  try {
    const response = await fetch(`${CONVERTKIT_API_URL}/subscribers/${subscriberId}/lists/${listId}`, {
      method: "POST",
      headers: {
        "X-Kit-Api-Key": CONVERTKIT_API_KEY,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn("[v0] Failed to add subscriber to list:", errorText)
      return { success: false }
    }

    console.log("[v0] Added subscriber to list:", listId)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error adding subscriber to list:", error)
    return { success: false }
  }
}

async function addTagToSubscriber(subscriberId: string | number, tag: string) {
  try {
    const response = await fetch(`${CONVERTKIT_API_URL}/subscribers/${subscriberId}/tags`, {
      method: "POST",
      headers: {
        "X-Kit-Api-Key": CONVERTKIT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tag,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn("[v0] Failed to add tag to subscriber:", errorText)
      return { success: false }
    }

    console.log("[v0] Added tag to subscriber:", tag)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error adding tag to subscriber:", error)
    return { success: false }
  }
}
