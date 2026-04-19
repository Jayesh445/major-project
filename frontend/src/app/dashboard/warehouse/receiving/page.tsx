"use client"

import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, Loader2, PackageCheck, ShieldCheck, ExternalLink, Clock } from "lucide-react"
import { usePurchaseOrders } from "@/hooks/queries/use-purchase-orders"
import { useVerifyGoodsReceipt } from "@/hooks/queries/use-agents"
import Link from "next/link"

export default function ReceivingPage() {
  const { data: posData, isLoading } = usePurchaseOrders()
  const allOrders = posData?.data || []
  const verifyReceipt = useVerifyGoodsReceipt()

  // Filter only receivable POs
  const receivable = allOrders.filter((po: any) =>
    ["sent_to_supplier", "acknowledged", "partially_received"].includes(po.status)
  )

  // Separate into pending and partially received
  const pending = receivable.filter((po: any) =>
    ["sent_to_supplier", "acknowledged"].includes(po.status)
  )
  const partiallyReceived = receivable.filter((po: any) => po.status === "partially_received")

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  const formatDate = (date: string | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-IN")
  }

  const handleReceive = (po: any) => {
    const receivedItems = po.lineItems?.map((li: any) => ({
      sku: li.sku,
      receivedQty: li.orderedQty - li.receivedQty,
      qualityStatus: "accepted" as const,
    })) || []

    verifyReceipt.mutate({
      purchaseOrderId: po._id,
      receivedItems,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goods Receiving"
        description="Receive incoming shipments against purchase orders. Verified via blockchain."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : receivable.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Pending Shipments</h3>
            <p className="text-sm text-muted-foreground">All purchase orders have been received.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Awaiting Receipt Section */}
          {pending.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Awaiting Receipt</h2>
                <Badge variant="secondary">{pending.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pending.map((po: any) => (
                  <Link key={po._id} href={`/dashboard/procurement/orders/${po._id}`}>
                    <Card className="h-full hover:shadow-lg hover:border-orange-400 transition-all cursor-pointer">
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
                          <Badge variant="secondary" className="text-xs">
                            {po.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {formatCurrency(po.totalAmount || 0)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          {po.lineItems?.length || 0} items
                        </div>
                        {po.lineItems && po.lineItems.length > 0 && (
                          <div className="space-y-1">
                            {po.lineItems.slice(0, 2).map((li: any, idx: number) => {
                              const pending = li.orderedQty - (li.receivedQty || 0)
                              return pending > 0 ? (
                                <Badge key={idx} variant="outline" className="text-xs block">
                                  {li.sku || `Item ${idx + 1}`}: {pending} pending
                                </Badge>
                              ) : null
                            })}
                            {po.lineItems.length > 2 && (
                              <Badge variant="outline" className="text-xs block">
                                +{po.lineItems.length - 2} more items
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="pt-3 border-t">
                          <Button
                            className="w-full"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              handleReceive(po)
                            }}
                            disabled={verifyReceipt.isPending}
                          >
                            <PackageCheck className="mr-2 h-4 w-4" />
                            {verifyReceipt.isPending ? "Verifying..." : "Receive All"}
                          </Button>
                        </div>
                        {po.blockchainTxHash && (
                          <Link
                            href={`/verify/${po._id}?type=po_created`}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-green-600 hover:underline justify-center"
                          >
                            <ShieldCheck className="h-3 w-3" /> On-chain verified
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Partially Received Section */}
          {partiallyReceived.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Partially Received</h2>
                <Badge variant="default">{partiallyReceived.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {partiallyReceived.map((po: any) => (
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
                          <Badge variant="default" className="text-xs">
                            Partial
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {formatCurrency(po.totalAmount || 0)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          {po.lineItems?.length || 0} items
                        </div>
                        {po.lineItems && po.lineItems.length > 0 && (
                          <div className="space-y-1">
                            {po.lineItems.slice(0, 2).map((li: any, idx: number) => {
                              const pending = li.orderedQty - (li.receivedQty || 0)
                              const received = li.receivedQty || 0
                              return (
                                <Badge key={idx} variant="outline" className="text-xs block">
                                  {li.sku || `Item ${idx + 1}`}: {received}/{li.orderedQty}
                                </Badge>
                              )
                            })}
                            {po.lineItems.length > 2 && (
                              <Badge variant="outline" className="text-xs block">
                                +{po.lineItems.length - 2} more items
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="pt-3 border-t">
                          <Button
                            className="w-full"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              handleReceive(po)
                            }}
                            disabled={verifyReceipt.isPending}
                          >
                            <PackageCheck className="mr-2 h-4 w-4" />
                            Complete Receive
                          </Button>
                        </div>
                        {po.blockchainTxHash && (
                          <Link
                            href={`/verify/${po._id}?type=po_created`}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-green-600 hover:underline justify-center"
                          >
                            <ShieldCheck className="h-3 w-3" /> On-chain verified
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
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
