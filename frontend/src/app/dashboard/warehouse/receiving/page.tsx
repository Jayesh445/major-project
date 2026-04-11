"use client"

import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, Loader2, PackageCheck, ShieldCheck, ExternalLink } from "lucide-react"
import { usePurchaseOrders } from "@/hooks/queries/use-purchase-orders"
import { useVerifyGoodsReceipt } from "@/hooks/queries/use-agents"
import Link from "next/link"

export default function ReceivingPage() {
  const { data: posData, isLoading } = usePurchaseOrders({ status: "sent_to_supplier" } as any)
  const orders = posData?.data || []
  const verifyReceipt = useVerifyGoodsReceipt()

  // Filter only receivable POs
  const receivable = orders.filter((po: any) =>
    ["sent_to_supplier", "acknowledged", "partially_received"].includes(po.status)
  )

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

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
        <div className="space-y-3">
          {receivable.map((po: any) => (
            <Card key={po._id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{po.poNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {po.supplier?.companyName || "Supplier"} | {po.warehouse?.name || "Warehouse"}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {po.lineItems?.map((li: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {li.sku}: {li.orderedQty - li.receivedQty} pending
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(po.totalAmount || 0)}</span>
                    {po.blockchainTxHash && (
                      <Link
                        href={`/verify/${po._id}?type=po_created`}
                        target="_blank"
                        className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                      >
                        <ShieldCheck className="h-3 w-3" /> On-chain
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleReceive(po)}
                      disabled={verifyReceipt.isPending}
                    >
                      <PackageCheck className="mr-2 h-4 w-4" />
                      {verifyReceipt.isPending ? "Verifying..." : "Receive All"}
                    </Button>
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
