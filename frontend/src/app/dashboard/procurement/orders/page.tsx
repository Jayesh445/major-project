"use client"

import { useState } from "react"
import { POTable } from "@/components/features/purchase-orders/po-table"
import { usePurchaseOrders } from "@/hooks/queries/use-purchase-orders"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PurchaseOrdersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePurchaseOrders({ page, limit: 10 })
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage procurement and supplier orders"
        actions={
          <Button onClick={() => router.push('/dashboard/procurement/orders/new')}>
            <Plus className="mr-2 h-4 w-4" /> Create PO
          </Button>
        }
      />

      <POTable
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
      />
    </div>
  )
}
