"use client"

import { AgentActivityCard, AgentActivity } from "@/components/business/agent-activity-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAgentStats } from "@/hooks/queries/use-dashboard"
import { Loader2 } from "lucide-react"

export function ActivityLog() {
  const { data: agentStats, isLoading } = useAgentStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading activity…
      </div>
    )
  }

  const activities: AgentActivity[] = []

  // Map recent forecasts to activity entries
  if (agentStats?.recentForecasts) {
    for (const f of agentStats.recentForecasts) {
      const product = typeof f.product === "object" ? f.product : null
      const warehouse = typeof f.warehouse === "object" ? f.warehouse : null
      activities.push({
        timestamp: new Date(f.forecastedAt).toLocaleTimeString(),
        agent: "Forecast Agent",
        action: `Generated 7-day forecast for ${product?.name ?? f.product} @ ${warehouse?.code ?? f.warehouse} — reorder qty: ${f.recommendedReorderQty ?? "N/A"}`,
        status: "success",
        duration: "—",
      })
    }
  }

  // Add latest optimization as an entry
  if (agentStats?.latestOptimization) {
    const opt = agentStats.latestOptimization
    activities.push({
      timestamp: new Date(opt.generatedAt).toLocaleTimeString(),
      agent: "Warehouse Optimization Agent",
      action: `Generated ${opt.transferRecommendations?.length ?? 0} transfer recommendations — ${opt.reallocationSummary?.slice(0, 80)}…`,
      status: opt.status === "rejected" ? "error" : "success",
      duration: `${opt.generationDurationSeconds?.toFixed(1) ?? "—"}s`,
    })
  }

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        No agent activity yet. Run the Forecast or Warehouse Optimization agent to see results.
      </div>
    )
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <AgentActivityCard
            key={index}
            activity={activity}
            onClick={() => console.log("View details", activity)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
