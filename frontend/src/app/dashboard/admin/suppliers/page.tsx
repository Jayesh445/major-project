"use client"

import { SupplierTable } from "@/components/features/suppliers/supplier-table"
import { useSuppliers } from "@/hooks/queries/use-suppliers"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function SuppliersPage() {
  const { data, isLoading } = useSuppliers()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage supplier relationships and contracts"
        actions={
          <Link href="/dashboard/admin/suppliers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Supplier
            </Button>
          </Link>
        }
      />

      <SupplierTable data={data?.data || []} isLoading={isLoading} />
    </div>
  )
}
