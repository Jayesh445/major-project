"use client"

import { use } from "react"
import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bot,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Zap,
  TrendingUp,
  Wrench,
  ArrowRight,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react"
import { useAgentDetails, useAgentRuns } from "@/hooks/queries/use-agents"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"

function formatDuration(ms: number | null | undefined) {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms}ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const remS = s % 60
  return `${m}m ${remS}s`
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString()
}

function formatRelative(iso: string | null | undefined) {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  success: { color: "text-green-600 bg-green-500/10", icon: CheckCircle2, label: "Success" },
  failed: { color: "text-red-600 bg-red-500/10", icon: XCircle, label: "Failed" },
  running: { color: "text-blue-600 bg-blue-500/10", icon: Loader2, label: "Running" },
  timeout: { color: "text-orange-600 bg-orange-500/10", icon: AlertTriangle, label: "Timeout" },
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = use(params)
  const { data, isLoading, error } = useAgentDetails(agentId)
  const { data: allRuns } = useAgentRuns(agentId, { limit: 50 })
  const queryClient = useQueryClient()

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["agents", "detail", agentId] })
    queryClient.invalidateQueries({ queryKey: ["agents", "runs", agentId] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Agent not found.
      </div>
    )
  }

  const { metadata, stats, recentRuns } = data
  const runsToShow = allRuns || recentRuns

  return (
    <div className="space-y-6">
      <PageHeader
        title={metadata.name}
        description={metadata.description}
        backLink="/dashboard/dev-tools/agent-hub"
        actions={
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        }
      />

      {/* Performance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Runs</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalRuns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.successRate != null ? `${stats.successRate}% success rate` : "No runs yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Successful</span>
            </div>
            <div className="text-2xl font-bold">{stats.successfulRuns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.failedRuns} failed, {stats.timeoutRuns} timeout
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avg Duration</span>
            </div>
            <div className="text-2xl font-bold">{stats.avgDurationHuman || "—"}</div>
            <p className="text-xs text-muted-foreground">
              Min: {stats.minDurationHuman || "—"}, Max: {stats.maxDurationHuman || "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Runtime</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalDurationHuman}</div>
            <p className="text-xs text-muted-foreground">Cumulative</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Play className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Last Run</span>
            </div>
            <div className="text-2xl font-bold">{formatRelative(stats.lastRunAt)}</div>
            <p className="text-xs text-muted-foreground">
              First: {formatRelative(stats.firstRunAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: About this agent */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4" /> About this agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">{metadata.longDescription}</p>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Framework:</span>
                <span className="ml-2 font-medium">{metadata.framework}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Model:</span>
                <span className="ml-2 font-medium">{metadata.model}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>
                <span className="ml-2 font-medium capitalize">{metadata.category}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Stateful:</span>
                <span className="ml-2 font-medium">{metadata.stateful ? "Yes (LibSQL memory)" : "No"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Workflow ID:</span>
                <code className="ml-2 px-2 py-0.5 bg-muted rounded text-xs">{metadata.workflowId}</code>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Triggered by:</span>
                <span className="ml-2">{metadata.triggeredBy}</span>
              </div>
            </div>

            {/* Workflow Steps */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Workflow Steps</h4>
              <div className="flex items-center flex-wrap gap-2">
                {metadata.steps.map((step, idx) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-muted/30 text-xs">
                      <span className="text-muted-foreground">{idx + 1}.</span>
                      <span className="font-medium">{step}</span>
                    </div>
                    {idx < metadata.steps.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tools */}
            {metadata.tools.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <Wrench className="h-3 w-3" /> Tools
                </h4>
                <div className="flex flex-wrap gap-2">
                  {metadata.tools.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Inputs */}
            {metadata.inputs.length > 0 && metadata.inputs[0].name !== "N/A" && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Inputs</h4>
                <div className="space-y-2">
                  {metadata.inputs.map((i) => (
                    <div key={i.name} className="flex items-start gap-2 text-xs">
                      <code className="px-2 py-0.5 bg-muted rounded shrink-0">{i.name}</code>
                      <Badge variant={i.required ? "default" : "secondary"} className="text-xs shrink-0">
                        {i.type}
                      </Badge>
                      <span className="text-muted-foreground">{i.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outputs */}
            {metadata.outputs.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Outputs</h4>
                <div className="space-y-2">
                  {metadata.outputs.map((o) => (
                    <div key={o.name} className="flex items-start gap-2 text-xs">
                      <code className="px-2 py-0.5 bg-muted rounded shrink-0">{o.name}</code>
                      <Badge variant="secondary" className="text-xs shrink-0">{o.type}</Badge>
                      <span className="text-muted-foreground">{o.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.statusBreakdown).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No runs yet. Trigger a run to see stats.
              </p>
            ) : (
              Object.entries(stats.statusBreakdown).map(([status, count]) => {
                const config = statusConfig[status] || { color: "text-gray-600 bg-gray-500/10", icon: Bot, label: status }
                const Icon = config.icon
                const percent = stats.totalRuns > 0 ? Math.round((count / stats.totalRuns) * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${config.color}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="font-medium">{config.label}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          status === "success" ? "bg-green-500" :
                          status === "failed" ? "bg-red-500" :
                          status === "timeout" ? "bg-orange-500" :
                          "bg-blue-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Run History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Run History</CardTitle>
        </CardHeader>
        <CardContent>
          {!runsToShow || runsToShow.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No run history yet. Trigger this agent to see its execution log here.
            </p>
          ) : (
            <div className="space-y-2">
              {runsToShow.map((run) => {
                const config = statusConfig[run.status] || {
                  color: "text-gray-600 bg-gray-500/10",
                  icon: Bot,
                  label: run.status,
                }
                const Icon = config.icon

                return (
                  <div
                    key={run._id}
                    className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-md shrink-0 ${config.color}`}>
                        <Icon className={`h-4 w-4 ${run.status === "running" ? "animate-spin" : ""}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs capitalize">
                            {config.label}
                          </Badge>
                          <code className="text-xs text-muted-foreground">{run.workflowId}</code>
                          {run.triggeredBy && typeof run.triggeredBy === "object" && (
                            <span className="text-xs text-muted-foreground">
                              by {run.triggeredBy.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Started: {formatDateTime(run.startedAt)}</span>
                          {run.durationMs != null && (
                            <span className="font-medium text-foreground">
                              Duration: {formatDuration(run.durationMs)}
                            </span>
                          )}
                        </div>
                        {run.input && Object.keys(run.input).length > 0 && (
                          <details className="mt-2 text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View input
                            </summary>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(run.input, null, 2)}
                            </pre>
                          </details>
                        )}
                        {run.error && (
                          <details className="mt-2 text-xs">
                            <summary className="cursor-pointer text-red-600 hover:text-red-700">
                              View error
                            </summary>
                            <pre className="mt-1 p-2 bg-red-500/5 border border-red-500/20 rounded text-xs overflow-x-auto text-red-700">
                              {run.error}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
