"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function SupplierDashboardPage() {
  useEffect(() => {
    redirect("/dashboard/supplier/catalog")
  }, [])

  return null
}
