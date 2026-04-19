"use client"

import { StatCard } from "@/components/business/stat-card"
import { Package, Truck, AlertTriangle, ArrowLeftRight } from "lucide-react"
import { PageHeader } from "@/components/business/page-header"
import { Badge } from "@/components/ui/badge"
import { useWarehouseStats } from "@/hooks/queries/use-dashboard"

export default function WarehouseDashboardPage() {
  const { data: stats, isLoading } = useWarehouseStats()

  const statCards = [
    {
      title: "Total Inventory",
      value: stats ? stats.totalInventory.toLocaleString() : "...",
      icon: Package,
      description: "Units across all warehouses",
      link: "/dashboard/warehouse/inventory",
    },
    {
      title: "Pending Receiving",
      value: stats ? String(stats.pendingReceiving) : "...",
      icon: Truck,
      description: "POs waiting for GRN",
      link: "/dashboard/warehouse/receiving",
    },
    {
      title: "Low Stock Alerts",
      value: stats ? String(stats.lowStockAlerts) : "...",
      icon: AlertTriangle,
      description: "Items at or below reorder point",
      link: "/dashboard/warehouse/inventory",
    },
    {
      title: "Active Transfers",
      value: stats ? String(stats.activeTransfers) : "...",
      icon: ArrowLeftRight,
      description: "Accepted optimization transfers",
      link: "/dashboard/warehouse/transfers",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Dashboard"
        description="Overview of inventory and operations."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            onClick={() => window.location.href = stat.link}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Recent Optimization Recommendations */}
      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-4">Recent Optimization Recommendations</h3>
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-4 w-1/2 bg-muted rounded mb-2" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>
            ))
          ) : !stats?.recentOptimizations?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No optimization runs yet. Trigger the Warehouse Optimization Agent from the Agent Hub.
            </p>
          ) : (
            stats.recentOptimizations.map((opt: any) => (
              <div key={opt._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">
                    {opt.transferRecommendations?.length || 0} transfer recommendations
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {opt.reallocationSummary?.slice(0, 100) || "Optimization analysis"}
                    {opt.predictedLogisticsCostReductionPercent
                      ? ` | ${opt.predictedLogisticsCostReductionPercent}% cost reduction`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(opt.generatedAt).toLocaleDateString()} {new Date(opt.generatedAt).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant={opt.status === "accepted" ? "default" : opt.status === "rejected" ? "destructive" : "secondary"}>
                  {opt.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
