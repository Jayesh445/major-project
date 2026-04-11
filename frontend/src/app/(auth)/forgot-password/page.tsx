"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, CheckCircle } from "lucide-react"
import apiClient from "@/lib/api/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setIsLoading(true)
    try {
      await apiClient.post("/users/forgot-password", { email })
      setIsSent(true)
      toast.success("Password reset link sent to your email")
    } catch (err: any) {
      // Even if the endpoint doesn't exist yet, show a friendly message
      if (err.response?.status === 404) {
        toast.info("Password reset is not yet configured. Please contact your administrator.")
      } else {
        toast.error(err.response?.data?.message || "Failed to send reset link")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-1">Check your email</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            If an account exists with <strong>{email}</strong>, we&apos;ve sent a password reset link.
          </p>
          <Link href="/login">
            <Button variant="outline">Back to Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>
          Enter your email address and we will send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </CardContent>
      </form>
      <CardFooter>
        <div className="text-sm text-muted-foreground text-center w-full">
          Remember your password?{" "}
          <Link
            href="/login"
            className="hover:text-primary underline underline-offset-4 font-medium"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
