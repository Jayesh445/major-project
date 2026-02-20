"use client"

import { RecommendationCard } from "./recommendation-card"
import { useToast } from "@/hooks/use-toast"
import { useLatestOptimization } from "@/hooks/queries/use-optimization"
import { useUpdateOptimizationStatus } from "@/hooks/queries/use-optimization"
import { Loader2 } from "lucide-react"

export function RecommendationList() {
  const { toast } = useToast()
  const { data: optimization, isLoading } = useLatestOptimization()
  const { mutate: updateStatus } = useUpdateOptimizationStatus()

  const handleApprove = (id: string) => {
    if (optimization) {
      updateStatus({ id: optimization._id, status: "accepted" })
    }
    toast({ title: "Recommendation Approved", description: "Purchase Order has been drafted." })
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
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading recommendations…
      </div>
    )
  }

  if (!optimization || optimization.transferRecommendations.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        No recommendations available. Run the warehouse optimization agent to generate suggestions.
      </div>
    )
  }

  const recommendations = optimization.transferRecommendations.map((rec, i) => {
    const product = typeof rec.product === "object" ? rec.product : null
    const fromWh = typeof rec.fromWarehouse === "object" ? rec.fromWarehouse : null
    const toWh = typeof rec.toWarehouse === "object" ? rec.toWarehouse : null

    return {
      id: `${optimization._id}-${i}`,
      productName: product?.name ?? "Unknown Product",
      sku: product?.sku ?? "—",
      currentStock: 0,
      recommendedQty: rec.quantity,
      reason: rec.reason,
      supplierName: fromWh ? `${fromWh.name} → ${toWh?.name ?? ""}` : "Warehouse Transfer",
      estimatedCost: rec.estimatedCostSaving ?? 0,
      confidence: Math.round((optimization.predictedLogisticsCostReductionPercent ?? 80)),
    }
  })

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ))}
    </div>
  )
}
