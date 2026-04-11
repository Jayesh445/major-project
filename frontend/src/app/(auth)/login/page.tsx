import Link from "next/link"
import { LoginForm } from "@/components/features/auth/login-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Login - AutoStock AI",
  description: "Login to your account",
}

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground text-center">
          <Link 
            href="/forgot-password" 
            className="hover:text-primary underline underline-offset-4"
          >
            Forgot your password?
          </Link>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{" "}
          <Link 
            href="/signup" 
            className="hover:text-primary underline underline-offset-4 font-medium"
          >
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
