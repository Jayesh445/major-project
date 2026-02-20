"use client"

import { WarehouseTable } from "@/components/features/warehouses/warehouse-table"
import { useWarehouses } from "@/hooks/queries/use-warehouses"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function WarehousesPage() {
  const { data, isLoading } = useWarehouses()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses"
        description="Manage warehouse locations and capacity"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Warehouse
          </Button>
        }
      />
      
      <WarehouseTable data={data?.data || []} isLoading={isLoading} />
    </div>
  )
}
