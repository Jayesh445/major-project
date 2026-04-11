"use client"

import { RecommendationCard } from "./recommendation-card"
import { useToast } from "@/hooks/use-toast"
import { useLatestOptimization, useUpdateOptimizationStatus } from "@/hooks/queries/use-optimization"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function RecommendationList() {
  const { toast } = useToast()
  const { data: optimization, isLoading } = useLatestOptimization()
  const { mutate: updateStatus } = useUpdateOptimizationStatus()

  const handleApprove = (id: string) => {
    if (optimization) {
      updateStatus({ id: optimization._id, status: "accepted" })
    }
    toast({ title: "Recommendation Approved", description: "Transfer recommendations accepted." })
  }

  const handleReject = (id: string) => {
    if (optimization) {
      updateStatus({ id: optimization._id, status: "rejected" })
    }
    toast({ title: "Recommendation Rejected", description: "AI model feedback recorded." })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading recommendations...
      </div>
    )
  }

  if (!optimization || optimization.transferRecommendations.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        No recommendations available. Run the Warehouse Optimization or Smart Reorder agent to generate suggestions.
      </div>
    )
  }

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  const recommendations = optimization.transferRecommendations.map((rec, i) => {
    const product = typeof rec.product === "object" ? rec.product : null
    const fromWh = typeof rec.fromWarehouse === "object" ? rec.fromWarehouse : null
    const toWh = typeof rec.toWarehouse === "object" ? rec.toWarehouse : null

    return {
      id: `${optimization._id}-${i}`,
      productName: product?.name ?? "Product",
      sku: product?.sku ?? "N/A",
      recommendedQty: rec.quantity,
      reason: rec.reason,
      fromWarehouse: fromWh ? `${fromWh.name} (${fromWh.code})` : "Source",
      toWarehouse: toWh ? `${toWh.name} (${toWh.code})` : "Destination",
      estimatedSaving: rec.estimatedCostSaving ?? 0,
    }
  })

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="outline">
          {optimization.transferRecommendations.length} transfers
        </Badge>
        {optimization.predictedLogisticsCostReductionPercent && (
          <Badge variant="outline" className="text-green-600">
            {optimization.predictedLogisticsCostReductionPercent}% cost reduction
          </Badge>
        )}
        {optimization.predictedCapacityUtilizationImprovement && (
          <Badge variant="outline" className="text-blue-600">
            {optimization.predictedCapacityUtilizationImprovement}% capacity improvement
          </Badge>
        )}
        <Badge variant={optimization.status === "accepted" ? "default" : optimization.status === "rejected" ? "destructive" : "secondary"}>
          {optimization.status}
        </Badge>
      </div>

      {optimization.reallocationSummary && (
        <p className="text-sm text-muted-foreground">{optimization.reallocationSummary}</p>
      )}

      {/* Recommendation Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  )
}
