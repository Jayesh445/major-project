"use client"

import { InventoryTable } from "@/components/features/inventory/inventory-table"
import { useInventory } from "@/hooks/queries/use-inventory"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeftRight, Package, AlertTriangle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function InventoryPage() {
  const router = useRouter()
  const { data, isLoading } = useInventory()
  const inventoryItems = data?.data || []

  // Calculate stats
  const totalItems = inventoryItems.length
  const lowStockItems = inventoryItems.filter((item: any) =>
    item.currentStock <= item.reorderPoint
  ).length
  const totalStock = inventoryItems.reduce((sum: number, item: any) =>
    sum + (item.currentStock || 0), 0
  )

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

      {/* Inventory Stats */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Stock</p>
                  <p className="text-2xl font-bold">{totalStock.toLocaleString()}</p>
                </div>
                <Package className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                  <p className="text-2xl font-bold text-orange-600">{lowStockItems}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <InventoryTable data={inventoryItems} isLoading={isLoading} />
      )}
    </div>
  )
}
