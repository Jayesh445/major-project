"use client"

import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Loader2 } from "lucide-react"
import { usePurchaseOrders } from "@/hooks/queries/use-purchase-orders"

export default function SupplierOrdersPage() {
  const { data: posData, isLoading } = usePurchaseOrders()
  const orders = posData?.data || []

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
    fully_received: "default",
    cancelled: "destructive",
    draft: "outline",
    pending_approval: "secondary",
    approved: "secondary",
    sent_to_supplier: "secondary",
    acknowledged: "secondary",
    partially_received: "secondary",
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Purchase orders from buyers." />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Orders</h3>
            <p className="text-sm text-muted-foreground">No purchase orders found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((po: any) => (
            <Card key={po._id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{po.poNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {po.warehouse?.name || "Warehouse"} | {po.lineItems?.length || 0} items | {po.triggeredBy?.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(po.createdAt).toLocaleDateString()}
                      {po.expectedDeliveryDate && ` | Expected: ${new Date(po.expectedDeliveryDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(po.totalAmount || 0)}</span>
                    <Badge variant={statusColors[po.status] || "outline"}>
                      {po.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
