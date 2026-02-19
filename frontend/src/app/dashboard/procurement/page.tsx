import { StatCard } from "@/components/business/stat-card"
import { ShoppingCart, Clock, CheckCircle, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/business/page-header"

export const metadata = {
  title: "Procurement Dashboard - StationeryChain",
  description: "Procurement overview and spending analysis",
}

export default function ProcurementDashboardPage() {
  const stats = [
    {
      title: "Total Spend (MTD)",
      value: "₹2,45,000",
      icon: TrendingUp,
      trend: { value: 12, isPositive: false }, // Spending up is "negative" usually, depends on context
      description: "Vs previous month",
    },
    {
      title: "Pending Approvals",
      value: "5",
      icon: Clock,
      description: "POs awaiting authorization",
    },
    {
      title: "Open Orders",
      value: "18",
      icon: ShoppingCart,
      description: "Orders not yet received",
    },
    {
      title: "Fulfilled Orders",
      value: "142",
      icon: CheckCircle,
      trend: { value: 8, isPositive: true },
      description: "This month",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Procurement Dashboard" 
        description="Overview of purchasing activities and costs."
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  )
}
