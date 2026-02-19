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
  const { isAuthenticated, user } = useAuthStore()
  
  // This could be improved with proper loading state from store if implemented
  // For now assuming persisted state is available immediately on mount
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized') // Create this page later
    }
  }, [isAuthenticated, user, allowedRoles, router])
  
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null // Will redirect
  }
  
  return <>{children}</>
}
