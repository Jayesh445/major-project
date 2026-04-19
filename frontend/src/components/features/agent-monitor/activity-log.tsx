"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAllAgentRuns } from "@/hooks/queries/use-agents"
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Bot } from "lucide-react"
import { AGENT_NAME_MAP } from "@/lib/constants/agent-names"

function formatDuration(ms: number | null | undefined) {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms}ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString()
}

const statusIcons: Record<string, { icon: any; color: string }> = {
  success: { icon: CheckCircle2, color: "text-green-600 bg-green-500/10" },
  failed: { icon: XCircle, color: "text-red-600 bg-red-500/10" },
  running: { icon: Loader2, color: "text-blue-600 bg-blue-500/10" },
  timeout: { icon: AlertTriangle, color: "text-orange-600 bg-orange-500/10" },
}

export function ActivityLog() {
  const { data: runs, isLoading } = useAllAgentRuns(50)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading activity…
      </div>
    )
  }

  if (!runs || runs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground text-sm text-center px-4">
        No agent activity yet.
        <br />
        Run any agent from the Agent Hub to see its execution here.
      </div>
    )
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-2">
        {runs.map((run) => {
          const cfg = statusIcons[run.status] || { icon: Bot, color: "text-gray-600 bg-gray-500/10" }
          const Icon = cfg.icon
          const agentName = AGENT_NAME_MAP[run.agentId] || run.agentId

          return (
            <div
              key={run._id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className={`p-2 rounded-md shrink-0 ${cfg.color}`}>
                <Icon className={`h-4 w-4 ${run.status === "running" ? "animate-spin" : ""}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{agentName}</span>
                  <Badge variant="outline" className="text-xs capitalize">{run.status}</Badge>
                  {run.durationMs != null && (
                    <span className="text-xs text-muted-foreground">{formatDuration(run.durationMs)}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatTime(run.startedAt)}
                  {run.triggeredBy && typeof run.triggeredBy === "object" && ` — by ${run.triggeredBy.name}`}
                </p>
                {run.error && (
                  <p className="text-xs text-red-600 mt-1 line-clamp-1">{run.error}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
