import { StatCard } from "@/components/business/stat-card"
import { Package, Truck, AlertTriangle, ArrowLeftRight } from "lucide-react"
import { PageHeader } from "@/components/business/page-header"

export const metadata = {
  title: "Warehouse Dashboard - StationeryChain",
  description: "Warehouse operations overview",
}

export default function WarehouseDashboardPage() {
  const stats = [
    {
      title: "Total Inventory",
      value: "15,420",
      icon: Package,
      trend: { value: 5.2, isPositive: true },
      description: "Items across all zones",
    },
    {
      title: "Pending Receiving",
      value: "12",
      icon: Truck,
      description: "POs waiting for GRN",
    },
    {
      title: "Low Stock Alerts",
      value: "8",
      icon: AlertTriangle,
      trend: { value: 2, isPositive: false },
      description: "Items below reorder point",
    },
    {
      title: "Active Transfers",
      value: "5",
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
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Add more widgets like Tasks, Recent Activity */}
    </div>
  )
}
