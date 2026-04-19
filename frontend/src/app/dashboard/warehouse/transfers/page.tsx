"use client"

import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Loader2, ArrowLeftRight, TrendingDown, Zap } from "lucide-react"
import { useAllOptimizations, useUpdateOptimizationStatus } from "@/hooks/queries/use-optimization"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TransfersPage() {
  const { data: optimizationsData, isLoading } = useAllOptimizations()
  const updateStatus = useUpdateOptimizationStatus()

  // Handle different data structures - might be array or object with data property
  const optimizations = Array.isArray(optimizationsData) ? optimizationsData : (optimizationsData?.data || [])

  // Separate optimizations by status
  const pendingOptimizations = optimizations.filter((opt: any) => opt.status === "pending")
  const acceptedOptimizations = optimizations.filter((opt: any) => opt.status === "accepted" || opt.status === "partially_accepted")
  const rejectedOptimizations = optimizations.filter((opt: any) => opt.status === "rejected")

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
      ) : !optimizations || !Array.isArray(optimizations) || optimizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Transfer Recommendations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Run the Warehouse Optimization Agent from the Agent Hub to generate recommendations.
            </p>
            <Link href="/dashboard/dev-tools/agent-hub">
              <Button variant="outline" size="sm">
                Go to Agent Hub
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Recommendations */}
          {pendingOptimizations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Pending Review</h2>
                <Badge variant="secondary">{pendingOptimizations.length}</Badge>
              </div>
              <div className="space-y-4">
                {pendingOptimizations.map((opt: any) => (
                  <Card key={opt._id} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <span>{new Date(opt.generatedAt).toLocaleDateString()}</span>
                            <Badge variant="secondary" className="ml-2">
                              {opt.transferRecommendations?.length || 0} transfers
                            </Badge>
                          </CardTitle>
                          {opt.reallocationSummary && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {opt.reallocationSummary}
                            </p>
                          )}
                          {(opt.predictedLogisticsCostReductionPercent || opt.predictedCapacityUtilizationImprovement) && (
                            <div className="flex gap-4 text-sm mt-3">
                              {opt.predictedLogisticsCostReductionPercent && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <TrendingDown className="h-4 w-4" />
                                  {opt.predictedLogisticsCostReductionPercent}% cost reduction
                                </div>
                              )}
                              {opt.predictedCapacityUtilizationImprovement && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Zap className="h-4 w-4" />
                                  {opt.predictedCapacityUtilizationImprovement}% capacity
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => updateStatus.mutate({ id: opt._id, status: "accepted" })}
                            disabled={updateStatus.isPending}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus.mutate({ id: opt._id, status: "rejected" })}
                            disabled={updateStatus.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {opt.transferRecommendations?.map((rec: any, idx: number) => {
                          const fromName = typeof rec.fromWarehouse === "object"
                            ? `${rec.fromWarehouse.name} (${rec.fromWarehouse.code})`
                            : rec.fromWarehouse
                          const toName = typeof rec.toWarehouse === "object"
                            ? `${rec.toWarehouse.name} (${rec.toWarehouse.code})`
                            : rec.toWarehouse
                          const productName = typeof rec.product === "object"
                            ? `${rec.product.name} (${rec.product.sku})`
                            : rec.product

                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 rounded border bg-muted/30 text-sm"
                            >
                              <Badge variant="outline" className="text-xs shrink-0">
                                {productName}
                              </Badge>
                              <span className="font-medium text-xs text-muted-foreground">{fromName}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-medium text-xs text-muted-foreground">{toName}</span>
                              <span className="ml-auto font-semibold whitespace-nowrap">
                                {rec.quantity} units
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Recommendations */}
          {acceptedOptimizations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold">Accepted</h2>
                <Badge variant="default">{acceptedOptimizations.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {acceptedOptimizations.map((opt: any) => (
                  <Card key={opt._id} className="border-green-200">
                    <CardHeader className="pb-3">
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          {new Date(opt.generatedAt).toLocaleDateString()}
                          <Badge variant="default" className="text-xs">
                            ✓ {opt.transferRecommendations?.length || 0} transfers
                          </Badge>
                        </CardTitle>
                        {opt.reallocationSummary && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {opt.reallocationSummary}
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {opt.transferRecommendations?.slice(0, 5).map((rec: any, idx: number) => {
                          const fromName = typeof rec.fromWarehouse === "object"
                            ? rec.fromWarehouse.code
                            : rec.fromWarehouse
                          const toName = typeof rec.toWarehouse === "object"
                            ? rec.toWarehouse.code
                            : rec.toWarehouse

                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-medium">{fromName}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="font-medium">{toName}</span>
                              <span className="ml-auto">{rec.quantity}u</span>
                            </div>
                          )
                        })}
                        {opt.transferRecommendations?.length > 5 && (
                          <p className="text-xs text-muted-foreground italic">
                            +{opt.transferRecommendations.length - 5} more
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Recommendations */}
          {rejectedOptimizations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-red-500 opacity-50" />
                <h2 className="text-lg font-semibold text-muted-foreground">Rejected</h2>
                <Badge variant="outline">{rejectedOptimizations.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {rejectedOptimizations.map((opt: any) => (
                  <Card key={opt._id} className="border-red-200 opacity-60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {new Date(opt.generatedAt).toLocaleDateString()}
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Rejected
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
