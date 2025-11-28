"use client"

interface PayButtonProps {
  amount: number
  onSuccess: () => void
  onError: (error: Error) => void
}

const PayButton: React.FC<PayButtonProps> = ({ amount, onSuccess, onError }) => {
  const handlePayment = () => {
    // Simulate a payment process
    setTimeout(() => {
      const success = Math.random() > 0.2 // 80% chance of success
      if (success) {
        onSuccess()
      } else {
        onError(new Error("Payment failed."))
      }
    }, 1500)
  }

  return <button onClick={handlePayment}>Pay ${amount}</button>
}

export default PayButton

// components/auth-form.tsx
import type React from "react"
import { useState } from "react"

interface AuthFormProps {
  onSubmit: (username: string, password: string) => void
}

const AuthForm: React.FC<AuthFormProps> = ({ onSubmit }) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(username, password)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username:</label>
        <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit">Submit</button>
    </form>
  )
}

export { AuthForm }
