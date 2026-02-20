import { StatCard } from "@/components/business/stat-card"
import { Users, Package, Warehouse, Truck } from "lucide-react"
import { PageHeader } from "@/components/business/page-header"

export const metadata = {
  title: "Admin Dashboard - StationeryChain",
  description: "Overview of system status and key metrics",
}

export default function AdminDashboardPage() {
  // TODO: Fetch real data using React Query
  const stats = [
    {
      title: "Total Users",
      value: "128",
      icon: Users,
      trend: { value: 12, isPositive: true },
      description: "Active users across all roles",
    },
    {
      title: "Total Products",
      value: "1,234",
      icon: Package,
      trend: { value: 2.5, isPositive: true },
      description: "Active products in catalog",
    },
    {
      title: "Warehouses",
      value: "8",
      icon: Warehouse,
      description: "Operating at 78% capacity",
    },
    {
      title: "Active Suppliers",
      value: "45",
      icon: Truck,
      trend: { value: 4, isPositive: false },
      description: "3 pending approval",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description="System overview and key performance indicators."
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
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
