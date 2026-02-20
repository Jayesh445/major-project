"use client"

import { POTable } from "@/components/features/purchase-orders/po-table"
import { usePurchaseOrders } from "@/hooks/queries/use-purchase-orders"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function PurchaseOrdersPage() {
  const { data, isLoading } = usePurchaseOrders()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage procurement and supplier orders"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create PO
          </Button>
        }
      />
      
      <POTable data={data?.data || []} isLoading={isLoading} />
    </div>
  )
}
