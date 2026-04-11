"use client"

import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Loader2, ArrowLeftRight } from "lucide-react"
import { useAllOptimizations, useUpdateOptimizationStatus } from "@/hooks/queries/use-optimization"
import { Button } from "@/components/ui/button"

export default function TransfersPage() {
  const { data: optimizations, isLoading } = useAllOptimizations()
  const updateStatus = useUpdateOptimizationStatus()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Transfers"
        description="AI-recommended inter-warehouse stock transfers to optimize capacity."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !optimizations || optimizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Transfer Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Run the Warehouse Optimization Agent from the Agent Hub to generate recommendations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {optimizations.map((opt: any) => (
            <Card key={opt._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {new Date(opt.generatedAt).toLocaleDateString()} — {opt.transferRecommendations?.length || 0} transfers
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={opt.status === "accepted" ? "default" : opt.status === "rejected" ? "destructive" : "secondary"}>
                      {opt.status}
                    </Badge>
                    {opt.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => updateStatus.mutate({ id: opt._id, status: "accepted" })}
                          disabled={updateStatus.isPending}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 text-red-600"
                          onClick={() => updateStatus.mutate({ id: opt._id, status: "rejected" })}
                          disabled={updateStatus.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {opt.reallocationSummary && (
                  <p className="text-xs text-muted-foreground">{opt.reallocationSummary}</p>
                )}
                {(opt.predictedLogisticsCostReductionPercent || opt.predictedCapacityUtilizationImprovement) && (
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {opt.predictedLogisticsCostReductionPercent && (
                      <span>Cost reduction: {opt.predictedLogisticsCostReductionPercent}%</span>
                    )}
                    {opt.predictedCapacityUtilizationImprovement && (
                      <span>Capacity improvement: {opt.predictedCapacityUtilizationImprovement}%</span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {opt.transferRecommendations?.map((rec: any, idx: number) => {
                    const fromName = typeof rec.fromWarehouse === "object" ? `${rec.fromWarehouse.name} (${rec.fromWarehouse.code})` : rec.fromWarehouse
                    const toName = typeof rec.toWarehouse === "object" ? `${rec.toWarehouse.name} (${rec.toWarehouse.code})` : rec.toWarehouse
                    const productName = typeof rec.product === "object" ? `${rec.product.name} (${rec.product.sku})` : rec.product

                    return (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded border text-sm">
                        <Badge variant="outline" className="text-xs shrink-0">{productName}</Badge>
                        <span className="font-medium">{fromName}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{toName}</span>
                        <span className="ml-auto text-muted-foreground">{rec.quantity} units</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
