"use client"

import { use } from "react"
import { PageHeader } from "@/components/business/page-header"
import { SupplierForm } from "@/components/features/suppliers/supplier-form"
import { useSupplier } from "@/hooks/queries/use-suppliers"
import { Loader2 } from "lucide-react"

export default function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: supplier, isLoading } = useSupplier(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!supplier) {
    return <div className="text-center py-20 text-muted-foreground">Supplier not found.</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit: ${supplier.companyName}`}
        description="Update supplier details"
        backLink="/dashboard/admin/suppliers"
      />
      <div className="max-w-2xl">
        <SupplierForm initialData={supplier} />
      </div>
    </div>
  )
}
