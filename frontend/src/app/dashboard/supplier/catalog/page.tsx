"use client"

import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Loader2, ShoppingCart, Clock, DollarSign, Building2 } from "lucide-react"
import { usePurchaseOrders } from "@/hooks/queries/use-purchase-orders"
import { useAuthStore } from "@/stores/auth-store"
import Link from "next/link"

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending_approval: "secondary",
  approved: "secondary",
  sent_to_supplier: "secondary",
  acknowledged: "default",
  partially_received: "default",
  fully_received: "default",
  cancelled: "destructive",
}

export default function SupplierOrdersPage() {
  const { user } = useAuthStore()
  const { data: posData, isLoading } = usePurchaseOrders()
  const allPOs = posData?.data || []

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

  const formatDate = (date: string | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-IN")
  }

  // For supplier users, show only POs sent to them
  // For now, show all POs in sent_to_supplier status
  const supplierPOs = allPOs.filter(
    (po: any) => po.status === "sent_to_supplier" || po.status === "acknowledged"
  )

  const pendingAcknowledgment = supplierPOs.filter((po: any) => po.status === "sent_to_supplier")
  const acknowledged = supplierPOs.filter((po: any) => po.status === "acknowledged")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage purchase orders sent to you"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : supplierPOs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Purchase Orders</h3>
            <p className="text-sm text-muted-foreground">
              No purchase orders have been sent to you yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Acknowledgment Section */}
          {pendingAcknowledgment.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Pending Acknowledgment</h2>
                <Badge variant="secondary">{pendingAcknowledgment.length}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingAcknowledgment.map((po: any) => (
                  <Link key={po._id} href={`/dashboard/procurement/orders/${po._id}`}>
                    <Card className="h-full hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{po.poNumber}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {typeof po.supplier === "object"
                                ? po.supplier.companyName
                                : "Supplier"}
                            </p>
                          </div>
                          <Badge variant={statusColors[po.status] || "outline"}>
                            {po.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">{formatCurrency(po.totalAmount)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          {po.lineItems?.length || 0} items
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatDate(po.createdAt)}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {po.notes || "No notes"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Acknowledged Section */}
          {acknowledged.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold">Acknowledged Orders</h2>
                <Badge variant="default">{acknowledged.length}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {acknowledged.map((po: any) => (
                  <Link key={po._id} href={`/dashboard/procurement/orders/${po._id}`}>
                    <Card className="h-full hover:shadow-lg hover:border-green-400 transition-all cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{po.poNumber}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {typeof po.supplier === "object"
                                ? po.supplier.companyName
                                : "Supplier"}
                            </p>
                          </div>
                          <Badge variant="default">✓ Acknowledged</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">{formatCurrency(po.totalAmount)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4" />
                          {po.lineItems?.length || 0} items
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatDate(po.createdAt)}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {po.notes || "No notes"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
