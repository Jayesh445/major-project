"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { useAuthStore } from "@/stores/auth-store"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuthStore()
  
  return (
    <ProtectedRoute>
      <AppLayout role={user?.role || "admin"}>
        {children}
      </AppLayout>
    </ProtectedRoute>
  )
}
