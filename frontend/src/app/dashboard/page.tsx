"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user) {
      switch (user.role) {
        case "admin":
          router.push("/dashboard/admin")
          break
        case "warehouse_manager":
          router.push("/dashboard/warehouse")
          break
        case "procurement_officer":
          router.push("/dashboard/procurement")
          break
        case "supplier":
          router.push("/dashboard/supplier")
          break
        default:
          // Fallback if no specific role dashboard
          router.push("/dashboard/admin") 
      }
    }
  }, [user, isAuthenticated, router])

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}
