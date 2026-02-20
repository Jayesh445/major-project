"use client"

import { StatCard } from "@/components/business/stat-card"
import { Package, Truck, AlertTriangle, ArrowLeftRight } from "lucide-react"
import { PageHeader } from "@/components/business/page-header"
import { useWarehouseStats } from "@/hooks/queries/use-dashboard"

export default function WarehouseDashboardPage() {
  const { data: stats } = useWarehouseStats()

  const statCards = [
    {
      title: "Total Inventory",
      value: stats ? stats.totalInventory.toLocaleString() : "—",
      icon: Package,
      description: "Units across all warehouses",
    },
    {
      title: "Pending Receiving",
      value: stats ? String(stats.pendingReceiving) : "—",
      icon: Truck,
      description: "POs waiting for GRN",
    },
    {
      title: "Low Stock Alerts",
      value: stats ? String(stats.lowStockAlerts) : "—",
      icon: AlertTriangle,
      description: "Items at or below reorder point",
    },
    {
      title: "Active Transfers",
      value: "—",
      icon: ArrowLeftRight,
      description: "Stock movement in progress",
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
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Add more widgets like Tasks, Recent Activity */}
    </div>
  )
}
