"use client"

import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Loader2,
  Package,
  AlertTriangle,
  ShoppingCart,
  XCircle,
  CheckCircle2,
  ExternalLink,
  Clock,
  TrendingDown,
} from "lucide-react"
import {
  useRunSmartReorder,
  useReorderRecommendations,
  useOrderReorderRecommendation,
  useRejectReorderRecommendation,
} from "@/hooks/queries/use-agents"
import Link from "next/link"
import { useState } from "react"

const urgencyStyles: Record<string, { color: string; label: string; rank: number }> = {
  critical: { color: "bg-red-500 text-white", label: "CRITICAL", rank: 0 },
  high: { color: "bg-orange-500 text-white", label: "HIGH", rank: 1 },
  medium: { color: "bg-yellow-500 text-black", label: "MEDIUM", rank: 2 },
  low: { color: "bg-blue-500 text-white", label: "LOW", rank: 3 },
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  in_negotiation: "bg-blue-100 text-blue-800",
  ordered: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-500",
}

function formatINR(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

export default function ReplenishmentPage() {
  const [filter, setFilter] = useState<"pending" | "all">("pending")
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null)

  const smartReorder = useRunSmartReorder()
  const { data: recommendations, isLoading } = useReorderRecommendations(
    filter === "pending" ? { status: "pending" } : { status: "all" }
  )
  const orderMutation = useOrderReorderRecommendation()
  const rejectMutation = useRejectReorderRecommendation()

  const handleOrder = (id: string) => {
    setActiveOrderId(id)
    orderMutation.mutate(id, {
      onSettled: () => setActiveOrderId(null),
    })
  }

  const handleReject = (id: string) => {
    setActiveRejectId(id)
    rejectMutation.mutate(
      { id },
      { onSettled: () => setActiveRejectId(null) }
    )
  }

  const recs = recommendations || []
  const criticalCount = recs.filter((r) => r.urgency === "critical").length
  const totalValue = recs.reduce((sum, r) => sum + r.estimatedTotalCost, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Autonomous Replenishment"
        description="AI-recommended products to reorder. Click Order to trigger the Negotiation Agent."
        actions={
          <Button
            onClick={() => smartReorder.mutate()}
            disabled={smartReorder.isPending}
          >
            {smartReorder.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {smartReorder.isPending ? "Running Analysis..." : "Run Analysis"}
          </Button>
        }
      />

      {/* Summary stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Recommendations</span>
            </div>
            <div className="text-2xl font-bold">{recs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Critical</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">Less than 3 days of stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Est. Total Spend</span>
            </div>
            <div className="text-2xl font-bold">{formatINR(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">View</span>
            </div>
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                variant={filter === "pending" ? "default" : "outline"}
                className="text-xs h-7"
                onClick={() => setFilter("pending")}
              >
                Pending
              </Button>
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "outline"}
                className="text-xs h-7"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading recommendations...
        </div>
      ) : recs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Recommendations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Run the Smart Reorder Agent to generate product reorder recommendations.
            </p>
            <Button onClick={() => smartReorder.mutate()} disabled={smartReorder.isPending}>
              {smartReorder.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Run Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recs.map((rec) => {
            const urgency = urgencyStyles[rec.urgency] || urgencyStyles.low
            const canOrder = rec.status === "pending" && rec.supplierCount > 0

            return (
              <Card key={rec._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={urgency.color}>{urgency.label}</Badge>
                        <Badge variant="outline" className={statusColors[rec.status]}>
                          {rec.status.replace(/_/g, " ")}
                        </Badge>
                        <h3 className="font-semibold text-base">
                          {rec.product?.name || "Unknown Product"}
                        </h3>
                        <code className="text-xs px-2 py-0.5 bg-muted rounded">
                          {rec.product?.sku}
                        </code>
                        <span className="text-xs text-muted-foreground">
                          @ {rec.warehouse?.name} ({rec.warehouse?.code})
                        </span>
                      </div>

                      {/* Inventory metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">Current Stock</div>
                          <div className="font-semibold">{rec.availableStock}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Reorder Point</div>
                          <div className="font-semibold">{rec.reorderPoint}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Days Left</div>
                          <div
                            className={`font-semibold ${
                              rec.daysUntilStockout <= 3
                                ? "text-red-600"
                                : rec.daysUntilStockout <= 7
                                ? "text-orange-600"
                                : ""
                            }`}
                          >
                            {rec.daysUntilStockout} days
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Recommended Qty</div>
                          <div className="font-semibold text-primary">{rec.recommendedQty}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Est. Cost</div>
                          <div className="font-semibold">{formatINR(rec.estimatedTotalCost)}</div>
                        </div>
                      </div>

                      {/* Supplier info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <span>
                          <strong>{rec.supplierCount}</strong>{" "}
                          supplier{rec.supplierCount !== 1 ? "s" : ""} available
                        </span>
                        {rec.minSupplierPrice > 0 && (
                          <span>
                            Lowest price: <strong>{formatINR(rec.minSupplierPrice)}/unit</strong>
                          </span>
                        )}
                        <span>
                          Avg lead time: <strong>{rec.avgSupplierLeadTime} days</strong>
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground italic mb-3">{rec.reason}</p>

                      {/* Linked records */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {rec.negotiationSessionId && (
                          <Link
                            href={`/dashboard/dev-tools/negotiations/${rec.negotiationSessionId}`}
                            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            View negotiation <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        {rec.purchaseOrderId && (
                          <Link
                            href={`/dashboard/procurement/orders/${rec.purchaseOrderId}`}
                            className="text-xs text-green-600 hover:underline inline-flex items-center gap-1"
                          >
                            View PO + QR Code <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {rec.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleOrder(rec._id)}
                            disabled={!canOrder || activeOrderId === rec._id}
                          >
                            {activeOrderId === rec._id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="mr-2 h-4 w-4" />
                            )}
                            {activeOrderId === rec._id ? "Negotiating..." : "Order"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(rec._id)}
                            disabled={activeRejectId === rec._id}
                          >
                            {activeRejectId === rec._id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Reject
                          </Button>
                        </>
                      )}
                      {rec.status === "in_negotiation" && (
                        <Badge variant="secondary" className="gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Negotiating
                        </Badge>
                      )}
                      {rec.status === "ordered" && (
                        <Badge variant="default" className="gap-1 bg-green-500">
                          <CheckCircle2 className="h-3 w-3" /> Ordered
                        </Badge>
                      )}
                      {rec.status === "rejected" && (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" /> Rejected
                        </Badge>
                      )}
                    </div>
                  </div>

                  {!canOrder && rec.status === "pending" && rec.supplierCount === 0 && (
                    <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-700">
                      No approved suppliers for this product. Add a supplier before ordering.
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
