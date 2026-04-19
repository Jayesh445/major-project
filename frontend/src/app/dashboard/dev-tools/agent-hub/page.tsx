"use client"

import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw,
  Bot,
  TrendingUp,
  Warehouse,
  Handshake,
  ShoppingCart,
  Star,
  AlertTriangle,
  PackageCheck,
  RotateCcw,
  Loader2,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react"
import {
  useAgentStatus,
  useAllAgentRuns,
  useRunAnomalyScan,
  useRunSmartReorder,
  useRunSupplierEvaluation,
} from "@/hooks/queries/use-agents"
import { AGENT_NAME_MAP } from "@/lib/constants/agent-names"
import { Radio } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"

const agentIcons: Record<string, any> = {
  "forecast-agent": TrendingUp,
  "warehouse-optimization-agent": Warehouse,
  "negotiation-agent": Handshake,
  "supplier-simulator-agent": Bot,
  "procurement-orchestrator-agent": ShoppingCart,
  "supplier-evaluation-agent": Star,
  "anomaly-detection-agent": AlertTriangle,
  "smart-reorder-agent": RotateCcw,
  "quality-control-agent": PackageCheck,
}

const agentColors: Record<string, string> = {
  "forecast-agent": "bg-blue-500/10 text-blue-500",
  "warehouse-optimization-agent": "bg-purple-500/10 text-purple-500",
  "negotiation-agent": "bg-green-500/10 text-green-500",
  "supplier-simulator-agent": "bg-orange-500/10 text-orange-500",
  "procurement-orchestrator-agent": "bg-cyan-500/10 text-cyan-500",
  "supplier-evaluation-agent": "bg-yellow-500/10 text-yellow-500",
  "anomaly-detection-agent": "bg-red-500/10 text-red-500",
  "smart-reorder-agent": "bg-indigo-500/10 text-indigo-500",
  "quality-control-agent": "bg-emerald-500/10 text-emerald-500",
}

function formatDurationShort(ms: number | null) {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms}ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function formatRelativeTime(iso: string | null) {
  if (!iso) return "Never"
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function AgentHubPage() {
  const { data, isLoading } = useAgentStatus()
  const { data: allRuns } = useAllAgentRuns(50)
  const queryClient = useQueryClient()
  const anomalyScan = useRunAnomalyScan()
  const smartReorder = useRunSmartReorder()
  const supplierEval = useRunSupplierEvaluation()

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["agents"] })

  const activeRuns = (allRuns || []).filter((r) => r.status === "running")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Hub"
        description="Central dashboard for all autonomous AI agents. Click any card for full run history."
        actions={
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        }
      />

      {/* System-wide Stats */}
      {data?.stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Runs</span>
              </div>
              <div className="text-2xl font-bold">{data.stats.totalAgentRuns}</div>
              <p className="text-xs text-muted-foreground">
                {data.stats.totalSuccessfulRuns} successful
                {data.stats.overallSuccessRate != null && ` (${data.stats.overallSuccessRate}%)`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Execution Time</span>
              </div>
              <div className="text-2xl font-bold">{data.stats.totalExecutionHuman}</div>
              <p className="text-xs text-muted-foreground">Across all workflows</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Forecasts Generated</span>
              </div>
              <div className="text-2xl font-bold">{data.stats.totalForecasts}</div>
              <p className="text-xs text-muted-foreground">{data.stats.totalOptimizations} optimizations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Handshake className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Negotiations</span>
              </div>
              <div className="text-2xl font-bold">{data.stats.totalNegotiations}</div>
              <p className="text-xs text-muted-foreground">{data.stats.totalBlockchainLogs} blockchain logs</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Active Workflows */}
      {activeRuns.length > 0 && (
        <Card className="border-blue-500/40 bg-blue-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Radio className="h-4 w-4 text-blue-600 animate-pulse" />
                Active Workflows
                <Badge variant="secondary" className="ml-1">{activeRuns.length}</Badge>
              </CardTitle>
              <span className="text-xs text-blue-600">Live · refreshing every 15s</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeRuns.map((run) => {
                const agentName = AGENT_NAME_MAP[run.agentId] || run.agentId
                const elapsedSec = Math.floor((Date.now() - new Date(run.startedAt).getTime()) / 1000)
                return (
                  <Link
                    key={run._id}
                    href={`/dashboard/dev-tools/agent-hub/${run.agentId}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-blue-500/30 bg-white/50 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{agentName}</p>
                        <p className="text-xs text-muted-foreground">
                          Running for {elapsedSec}s · started {new Date(run.startedAt).toLocaleTimeString()}
                          {run.triggeredBy && typeof run.triggeredBy === "object" && ` · by ${run.triggeredBy.name}`}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500">LIVE</Badge>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-5 w-40 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-muted rounded mb-2" />
                  <div className="h-4 w-2/3 bg-muted rounded" />
                </CardContent>
              </Card>
            ))
          : data?.agents.map((agent) => {
              const Icon = agentIcons[agent.id] || Bot
              const colorClass = agentColors[agent.id] || "bg-gray-500/10 text-gray-500"

              return (
                <Link key={agent.id} href={`/dashboard/dev-tools/agent-hub/${agent.id}`}>
                  <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
                            <p className="text-xs text-muted-foreground capitalize">{agent.category}</p>
                          </div>
                        </div>
                        <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                          {agent.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs mb-3 line-clamp-2">
                        {agent.description}
                      </CardDescription>

                      {/* Real runtime stats */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div>
                          <div className="text-muted-foreground">Runs</div>
                          <div className="font-semibold">{agent.totalRuns}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Success rate</div>
                          <div className="font-semibold">
                            {agent.successRate != null ? `${agent.successRate}%` : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg duration</div>
                          <div className="font-semibold">{formatDurationShort(agent.avgDurationMs)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Last run</div>
                          <div className="font-semibold">{formatRelativeTime(agent.lastRunAt)}</div>
                        </div>
                      </div>

                      {/* Success/fail breakdown */}
                      {agent.totalRuns > 0 && (
                        <div className="flex gap-2 mb-3">
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            {agent.successfulRuns}
                          </div>
                          {agent.failedRuns > 0 && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <XCircle className="h-3 w-3" />
                              {agent.failedRuns}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                          {agent.id === "anomaly-detection-agent" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={(e) => {
                                e.preventDefault()
                                anomalyScan.mutate()
                              }}
                              disabled={anomalyScan.isPending}
                            >
                              {anomalyScan.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Run"}
                            </Button>
                          )}
                          {agent.id === "smart-reorder-agent" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={(e) => {
                                e.preventDefault()
                                smartReorder.mutate()
                              }}
                              disabled={smartReorder.isPending}
                            >
                              {smartReorder.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Run"}
                            </Button>
                          )}
                          {agent.id === "supplier-evaluation-agent" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={(e) => {
                                e.preventDefault()
                                supplierEval.mutate()
                              }}
                              disabled={supplierEval.isPending}
                            >
                              {supplierEval.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Run"}
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          View details <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
      </div>

      {/* Recent Negotiations */}
      {data?.recentNegotiations && data.recentNegotiations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Negotiations</CardTitle>
              <Link href="/dashboard/dev-tools/negotiations">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentNegotiations.map((neg: any) => (
                <Link
                  key={neg._id}
                  href={`/dashboard/dev-tools/negotiations/${neg._id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Handshake className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {neg.supplier?.companyName || "Supplier"} — {neg.product?.sku || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {neg.rounds?.length || 0} rounds | {new Date(neg.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      neg.status === "accepted" ? "default" :
                      neg.status === "rejected" ? "destructive" :
                      neg.status === "in_progress" ? "secondary" : "outline"
                    }
                  >
                    {neg.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
