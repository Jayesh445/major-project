"use client"

import { PageHeader } from "@/components/business/page-header"
import { SupplierForm } from "@/components/features/suppliers/supplier-form"

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Supplier"
        description="Register a new supplier in the system"
        backLink="/dashboard/admin/suppliers"
      />
      <div className="max-w-2xl">
        <SupplierForm />
      </div>
    </div>
  )
}
