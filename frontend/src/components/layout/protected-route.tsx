"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  useEffect(() => {
    // Wait for Zustand's persist middleware to finish reading localStorage
    // before making auth decisions. Without this, a full page refresh briefly
    // sees isAuthenticated=false and redirects to /login.
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized')
    }
  }, [hasHydrated, isAuthenticated, user, allowedRoles, router])

  // Show spinner until hydration completes OR while redirecting unauth users
  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
