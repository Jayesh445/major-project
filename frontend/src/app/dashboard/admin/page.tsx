"use client"

import { StatCard } from "@/components/business/stat-card"
import { Users, Package, Warehouse, Truck, Handshake, TrendingUp, ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/business/page-header"
import { Badge } from "@/components/ui/badge"
import { useAdminStats } from "@/hooks/queries/use-dashboard"

const activityIcons: Record<string, string> = {
  purchase_order: "bg-blue-500",
  negotiation: "bg-green-500",
  forecast: "bg-purple-500",
}

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats()

  const statCards = [
    {
      title: "Total Users",
      value: stats ? String(stats.totalUsers) : "...",
      icon: Users,
      description: "Active users across all roles",
    },
    {
      title: "Total Products",
      value: stats ? String(stats.totalProducts) : "...",
      icon: Package,
      description: "Active products in catalog",
    },
    {
      title: "Warehouses",
      value: stats ? String(stats.totalWarehouses) : "...",
      icon: Warehouse,
      description: `Operating at ${stats?.avgWarehouseUtilisation ?? "..."}% capacity`,
    },
    {
      title: "Active Suppliers",
      value: stats ? String(stats.activeSuppliers) : "...",
      icon: Truck,
      description: "Approved suppliers",
    },
  ]

  const aiCards = [
    {
      title: "Forecasts Run",
      value: stats ? String(stats.totalForecasts) : "...",
      icon: TrendingUp,
      description: "AI demand predictions generated",
    },
    {
      title: "Negotiations",
      value: stats ? String(stats.totalNegotiations) : "...",
      icon: Handshake,
      description: "Supplier negotiation sessions",
    },
    {
      title: "Blockchain Logs",
      value: stats ? String(stats.totalBlockchainLogs) : "...",
      icon: ShieldCheck,
      description: "Immutable audit entries",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="System overview and key performance indicators."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {aiCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-4">Platform Utilization</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Warehouse Capacity</span>
                <span className="font-medium">{stats?.avgWarehouseUtilisation ?? 0}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${stats?.avgWarehouseUtilisation ?? 0}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{stats?.totalProducts ?? 0}</div>
                <div className="text-xs text-muted-foreground">Products</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{stats?.totalWarehouses ?? 0}</div>
                <div className="text-xs text-muted-foreground">Warehouses</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{stats?.activeSuppliers ?? 0}</div>
                <div className="text-xs text-muted-foreground">Suppliers</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-3 p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-3/4 bg-muted rounded" />
                    <div className="h-2 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              ))
            ) : !stats?.recentActivity?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity. Run an agent from the Agent Hub to see activity here.
              </p>
            ) : (
              stats.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${activityIcons[activity.type] || "bg-gray-500"}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {timeAgo(activity.timestamp)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
