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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Negotiation Sessions"
        description="View all autonomous supplier negotiations. Click any session to see the full buyer vs supplier conversation."
        backLink="/dashboard/dev-tools/agent-hub"
        actions={
          <Link href="/dashboard/dev-tools/negotiations/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Negotiation
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !sessions || sessions.length === 0 ? (
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
          {sessions.map((session) => (
            <Link
              key={session._id}
              href={`/dashboard/dev-tools/negotiations/${session._id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Handshake className="h-5 w-5 text-green-500" />
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
                          </span>
                          <span>Qty: {session.agentConstraints?.requiredQty}</span>
                          {session.finalTerms && (
                            <span className="flex items-center gap-1 text-green-600">
                              <DollarSign className="h-3 w-3" />
                              ₹{session.finalTerms.unitPrice}/unit ({session.finalTerms.savingsPercent}% saved)
                            </span>
                          )}
                          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={statusColors[session.status] || "outline"}>
                      {session.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
