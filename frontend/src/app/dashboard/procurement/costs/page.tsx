"use client"

import { PageHeader } from "@/components/business/page-header"
import { StatCard } from "@/components/business/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingDown, ShoppingCart, Clock } from "lucide-react"
import { useProcurementStats } from "@/hooks/queries/use-dashboard"
import { usePurchaseOrders } from "@/hooks/queries/use-purchase-orders"
import { useRouter } from "next/navigation"
export default function CostAnalysisPage() {
  const router = useRouter()
  const { data: stats } = useProcurementStats()
  const { data: posData } = usePurchaseOrders()
  const orders = posData?.data || []

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  const totalSpend = orders.reduce((sum: number, po: any) => sum + (po.totalAmount || 0), 0)
  const avgOrderValue = orders.length > 0 ? totalSpend / orders.length : 0

  return (
    <div className="space-y-6">
      <PageHeader title="Cost Analysis" description="Procurement spend tracking and analysis." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Spend (MTD)" value={stats ? formatCurrency(stats.totalSpendMTD) : "..."} icon={DollarSign} description="Month-to-date" />
        <StatCard title="Open Orders" value={String(stats?.openOrders ?? 0)} icon={ShoppingCart} description="Not yet received" />
        <StatCard title="Avg Order Value" value={formatCurrency(Math.round(avgOrderValue))} icon={TrendingDown} description={`Across ${orders.length} orders`} />
        <StatCard title="Pending Approvals" value={String(stats?.pendingApprovals ?? 0)} icon={Clock} description="Awaiting authorization" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Purchase Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No purchase orders found.</p>
            ) : (
              orders.slice(0, 10).map((po: any) => (
                <div
                  key={po._id}
                  onClick={() => router.push(`/dashboard/procurement/orders/${po._id}`)}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{po.poNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {po.supplier?.companyName || "Supplier"} | {po.warehouse?.name || "Warehouse"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatCurrency(po.totalAmount || 0)}</span>
                    <Badge variant={po.status === "fully_received" ? "default" : po.status === "cancelled" ? "destructive" : "secondary"}>
                      {po.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}