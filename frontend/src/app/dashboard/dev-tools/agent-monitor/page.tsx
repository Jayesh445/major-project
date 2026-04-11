"use client"

import { ActivityLog } from "@/components/features/agent-monitor/activity-log"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useAgentStats } from "@/hooks/queries/use-dashboard"
import { useAgentStatus } from "@/hooks/queries/use-agents"
import { useQueryClient } from "@tanstack/react-query"

export default function AgentMonitorPage() {
  const { data: agentStats } = useAgentStats()
  const { data: agentStatusData } = useAgentStatus()
  const queryClient = useQueryClient()

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard", "agent-stats"] })
    queryClient.invalidateQueries({ queryKey: ["agents", "status"] })
  }

  const forecastCount = agentStats?.totalForecasts ?? 0
  const optimizationCount = agentStats?.totalOptimizations ?? 0
  const latestOpt = agentStats?.latestOptimization

  const agents = agentStatusData?.agents || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Activity Monitor"
        description="Live view of autonomous agent operations and decisions."
        actions={
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Log
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <ActivityLog />
        </div>
        <div className="space-y-6">
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2">Agent Status</h3>
            <div className="space-y-2">
              {agents.length > 0 ? (
                agents.map((agent) => (
                  <div key={agent.id} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{agent.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{agent.totalRuns}</span>
                      <span className={`h-2 w-2 rounded-full ${agent.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Forecast Agent</span>
                    <span className="text-green-500">Active</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Warehouse Agent</span>
                    <span className="text-green-500">Active</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2">Performance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Forecasts</span>
                <span className="font-medium">{forecastCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Optimization Runs</span>
                <span className="font-medium">{optimizationCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Negotiations</span>
                <span className="font-medium">{agentStatusData?.stats?.totalNegotiations ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blockchain Logs</span>
                <span className="font-medium">{agentStatusData?.stats?.totalBlockchainLogs ?? 0}</span>
              </div>
              {latestOpt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Optimization</span>
                  <span className="font-medium">
                    {new Date(latestOpt.generatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
