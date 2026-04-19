"use client"

import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Handshake,
  Plus,
  ArrowRight,
  Clock,
  DollarSign,
  Loader2,
  Radio,
} from "lucide-react"
import { useNegotiationSessions } from "@/hooks/queries/use-agents"
import Link from "next/link"

const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  accepted: "default",
  rejected: "destructive",
  in_progress: "secondary",
  escalated: "outline",
  timed_out: "outline",
}

export default function NegotiationsPage() {
  const { data: sessions, isLoading } = useNegotiationSessions()

  // Sort: in_progress first (most urgent), then by createdAt descending
  const sortedSessions = sessions
    ? [...sessions].sort((a, b) => {
        if (a.status === "in_progress" && b.status !== "in_progress") return -1
        if (a.status !== "in_progress" && b.status === "in_progress") return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    : []

  const inProgressCount = sortedSessions.filter((s) => s.status === "in_progress").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Negotiation Sessions"
        description="View all autonomous supplier negotiations. Click any session to see the full buyer vs supplier conversation."
        backLink="/dashboard/dev-tools/agent-hub"
        actions={
          <Link href="/dashboard/dev-tools/agent-hub">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Trigger from Agent Hub
            </Button>
          </Link>
        }
      />

      {/* Live indicator */}
      {inProgressCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Radio className="h-4 w-4 text-blue-600 animate-pulse" />
          <span className="text-sm font-medium text-blue-700">
            {inProgressCount} negotiation{inProgressCount !== 1 ? "s" : ""} in progress
          </span>
          <span className="text-xs text-blue-600/80 ml-2">Auto-refreshing every 8s</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !sortedSessions || sortedSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Handshake className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Negotiations Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Trigger a negotiation from the Agent Hub or Procurement dashboard.
            </p>
            <Link href="/dashboard/dev-tools/agent-hub">
              <Button variant="outline">Go to Agent Hub</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session) => {
            const isLive = session.status === "in_progress"
            return (
              <Link
                key={session._id}
                href={`/dashboard/dev-tools/negotiations/${session._id}`}
              >
                <Card
                  className={`hover:shadow-md transition-shadow cursor-pointer mb-3 ${
                    isLive ? "border-blue-500/50 bg-blue-500/5" : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            isLive ? "bg-blue-500/10" : "bg-green-500/10"
                          }`}
                        >
                          {isLive ? (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          ) : (
                            <Handshake className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {session.supplier?.companyName || "Unknown Supplier"}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {session.product?.name || "Unknown Product"} ({session.product?.sku})
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.rounds?.length || 0} rounds
                              {isLive && " (live)"}
                            </span>
                            <span>Qty: {session.agentConstraints?.requiredQty}</span>
                            {session.finalTerms && (
                              <span className="flex items-center gap-1 text-green-600">
                                <DollarSign className="h-3 w-3" />
                                ₹{session.finalTerms.unitPrice}/unit ({session.finalTerms.savingsPercent}% saved)
                              </span>
                            )}
                            <span>{new Date(session.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLive && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                        )}
                        <Badge variant={statusColors[session.status] || "outline"}>
                          {session.status === "in_progress" ? "LIVE" : session.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
