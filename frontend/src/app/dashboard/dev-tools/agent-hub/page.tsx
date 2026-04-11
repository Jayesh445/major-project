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
} from "lucide-react"
import { useAgentStatus, useRunAnomalyScan, useRunSmartReorder, useRunSupplierEvaluation } from "@/hooks/queries/use-agents"
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

const agentDescriptions: Record<string, string> = {
  "forecast-agent": "Predicts 7-day demand using historical data analysis and deep learning patterns",
  "warehouse-optimization-agent": "Rebalances inventory across warehouses to optimize capacity utilization",
  "negotiation-agent": "Autonomously negotiates with suppliers using BATNA strategy to get the best price",
  "supplier-simulator-agent": "Simulates supplier behavior for realistic multi-round negotiation testing",
  "procurement-orchestrator-agent": "Monitors stock levels, calculates EOQ, and triggers procurement workflows",
  "supplier-evaluation-agent": "Scores and ranks suppliers using the Supplier Reliability Index (SRI)",
  "anomaly-detection-agent": "Detects fraud, demand spikes, stockouts, and capacity anomalies in real-time",
  "smart-reorder-agent": "Generates intelligent reorder plans with EOQ optimization and order consolidation",
  "quality-control-agent": "Verifies goods receipt against POs and logs events to blockchain",
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

export default function AgentHubPage() {
  const { data, isLoading } = useAgentStatus()
  const queryClient = useQueryClient()
  const anomalyScan = useRunAnomalyScan()
  const smartReorder = useRunSmartReorder()
  const supplierEval = useRunSupplierEvaluation()

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["agents"] })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Hub"
        description="Central dashboard for all autonomous AI agents. Monitor status, trigger workflows, and view results."
        actions={
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        }
      />

      {/* Stats Overview */}
      {data?.stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data.stats.totalForecasts}</div>
              <p className="text-xs text-muted-foreground">Total Forecasts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data.stats.totalOptimizations}</div>
              <p className="text-xs text-muted-foreground">Optimization Runs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data.stats.totalNegotiations}</div>
              <p className="text-xs text-muted-foreground">Negotiations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data.stats.totalBlockchainLogs}</div>
              <p className="text-xs text-muted-foreground">Blockchain Logs</p>
            </CardContent>
          </Card>
        </div>
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
                <Card key={agent.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
                        </div>
                      </div>
                      <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                        {agent.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs mb-3">
                      {agentDescriptions[agent.id] || "AI agent"}
                    </CardDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {agent.totalRuns} runs
                      </span>
                      <div className="flex gap-2">
                        {agent.id === "negotiation-agent" && (
                          <Link href="/dashboard/dev-tools/negotiations">
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              View Sessions
                            </Button>
                          </Link>
                        )}
                        {agent.id === "anomaly-detection-agent" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => anomalyScan.mutate()}
                            disabled={anomalyScan.isPending}
                          >
                            {anomalyScan.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Run Scan"}
                          </Button>
                        )}
                        {agent.id === "smart-reorder-agent" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => smartReorder.mutate()}
                            disabled={smartReorder.isPending}
                          >
                            {smartReorder.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Run Analysis"}
                          </Button>
                        )}
                        {agent.id === "supplier-evaluation-agent" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => supplierEval.mutate()}
                            disabled={supplierEval.isPending}
                          >
                            {supplierEval.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Evaluate"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                        {neg.supplier?.companyName || "Unknown"} — {neg.product?.sku || "N/A"}
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
