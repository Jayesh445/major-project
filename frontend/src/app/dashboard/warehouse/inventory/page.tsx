"use client"

import { InventoryTable } from "@/components/features/inventory/inventory-table"
import { useInventory } from "@/hooks/queries/use-inventory"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function InventoryPage() {
  const router = useRouter()
  const { data, isLoading } = useInventory()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Monitor stock levels across warehouses"
        actions={
          <Button variant="outline" onClick={() => router.push('/dashboard/warehouse/transfers')}>
            <ArrowLeftRight className="mr-2 h-4 w-4" /> View Transfers
          </Button>
        }
      />
      
      <InventoryTable data={data?.data || []} isLoading={isLoading} />
    </div>
  )
}
