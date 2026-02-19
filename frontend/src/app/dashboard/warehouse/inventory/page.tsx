"use client"

import { InventoryTable } from "@/components/features/inventory/inventory-table"
import { useInventory } from "@/hooks/queries/use-inventory"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight } from "lucide-react"

export default function InventoryPage() {
  const { data, isLoading } = useInventory()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Monitor stock levels across warehouses"
        actions={
          <Button variant="outline">
            <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfer Stock
          </Button>
        }
      />
      
      <InventoryTable data={data?.data || []} isLoading={isLoading} />
    </div>
  )
}
