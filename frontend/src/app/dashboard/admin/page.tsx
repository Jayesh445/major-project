"use client"

import { StatCard } from "@/components/business/stat-card"
import { Users, Package, Warehouse, Truck } from "lucide-react"
import { PageHeader } from "@/components/business/page-header"
import { useAdminStats } from "@/hooks/queries/use-dashboard"

export default function AdminDashboardPage() {
  const { data: stats } = useAdminStats()

  const statCards = [
    {
      title: "Total Users",
      value: stats ? String(stats.totalUsers) : "—",
      icon: Users,
      description: "Active users across all roles",
    },
    {
      title: "Total Products",
      value: stats ? String(stats.totalProducts) : "—",
      icon: Package,
      description: "Active products in catalog",
    },
    {
      title: "Warehouses",
      value: stats ? String(stats.totalWarehouses) : "—",
      icon: Warehouse,
      description: `Operating at ${stats?.avgWarehouseUtilisation ?? "—"}% capacity`,
    },
    {
      title: "Active Suppliers",
      value: stats ? String(stats.activeSuppliers) : "—",
      icon: Truck,
      description: "Suppliers with active status",
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-4">Inventory Trends</h3>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/10 rounded">
            Chart Placeholder (Recharts)
          </div>
        </div>
        <div className="col-span-3 p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    New user registered
                  </p>
                  <p className="text-xs text-muted-foreground">
                    2 minutes ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
