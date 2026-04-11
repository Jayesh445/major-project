"use client"

import { PageHeader } from "@/components/business/page-header"
import { StatCard } from "@/components/business/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Package, Warehouse, Handshake, ShieldCheck, BarChart } from "lucide-react"
import { useAdminStats } from "@/hooks/queries/use-dashboard"
import { useAgentStatus } from "@/hooks/queries/use-agents"

export default function AnalyticsPage() {
  const { data: adminStats } = useAdminStats()
  const { data: agentData } = useAgentStatus()

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Platform-wide analytics and insights." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Products" value={String(adminStats?.totalProducts ?? 0)} icon={Package} description="Active in catalog" />
        <StatCard title="Warehouses" value={String(adminStats?.totalWarehouses ?? 0)} icon={Warehouse} description={`${adminStats?.avgWarehouseUtilisation ?? 0}% avg capacity`} />
        <StatCard title="Negotiations" value={String(agentData?.stats?.totalNegotiations ?? 0)} icon={Handshake} description="AI negotiations run" />
        <StatCard title="Blockchain Logs" value={String(agentData?.stats?.totalBlockchainLogs ?? 0)} icon={ShieldCheck} description="Immutable audit entries" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Agent Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agentData?.agents?.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between text-sm">
                  <span>{agent.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{agent.totalRuns} runs</span>
                    <span className={`h-2 w-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                </div>
              )) ?? <p className="text-sm text-muted-foreground">Loading agent data...</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Warehouse Utilization</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-5xl font-bold">{adminStats?.avgWarehouseUtilisation ?? 0}%</div>
              <p className="text-sm text-muted-foreground mt-2">Average across {adminStats?.totalWarehouses ?? 0} warehouses</p>
              <div className="w-full mt-4 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${adminStats?.avgWarehouseUtilisation ?? 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
