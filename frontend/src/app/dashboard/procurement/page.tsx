"use client"

import { StatCard } from "@/components/business/stat-card"
import { ShoppingCart, Clock, CheckCircle, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/business/page-header"
import { useProcurementStats } from "@/hooks/queries/use-dashboard"

export default function ProcurementDashboardPage() {
  const { data: stats } = useProcurementStats()

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  const statCards = [
    {
      title: "Total Spend (MTD)",
      value: stats ? formatCurrency(stats.totalSpendMTD) : "—",
      icon: TrendingUp,
      description: "Month-to-date spend on POs",
    },
    {
      title: "Pending Approvals",
      value: stats ? String(stats.pendingApprovals) : "—",
      icon: Clock,
      description: "POs awaiting authorization",
    },
    {
      title: "Open Orders",
      value: stats ? String(stats.openOrders) : "—",
      icon: ShoppingCart,
      description: "Orders not yet received",
    },
    {
      title: "Fulfilled Orders",
      value: stats ? String(stats.fulfilledThisMonth) : "—",
      icon: CheckCircle,
      description: "Fully received this month",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement Dashboard"
        description="Overview of purchasing activities and costs."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  )
}
