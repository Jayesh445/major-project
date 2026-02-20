"use client"

import { ActivityLog } from "@/components/features/agent-monitor/activity-log"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useAgentStats } from "@/hooks/queries/use-dashboard"
import { useQueryClient } from "@tanstack/react-query"

export default function AgentMonitorPage() {
  const { data: agentStats } = useAgentStats()
  const queryClient = useQueryClient()

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["dashboard", "agent-stats"] })

  const forecastCount = agentStats?.totalForecasts ?? "—"
  const optimizationCount = agentStats?.totalOptimizations ?? "—"
  const latestOpt = agentStats?.latestOptimization

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
              <div className="flex justify-between text-sm">
                <span>Forecast Agent</span>
                <span className="text-green-500">Active</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Warehouse Agent</span>
                <span className="text-green-500">Active</span>
              </div>
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
