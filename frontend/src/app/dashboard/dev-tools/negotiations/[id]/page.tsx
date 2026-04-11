"use client"

import { use } from "react"
import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  User,
  ArrowDown,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingDown,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { useNegotiationSession } from "@/hooks/queries/use-agents"

export default function NegotiationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: session, isLoading } = useNegotiationSession(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Negotiation session not found.
      </div>
    )
  }

  const statusIcon =
    session.status === "accepted" ? <CheckCircle className="h-5 w-5 text-green-500" /> :
    session.status === "rejected" ? <XCircle className="h-5 w-5 text-red-500" /> :
    <Clock className="h-5 w-5 text-yellow-500" />

  // Parse agent reasoning which contains buyer + supplier messages
  const parseReasoning = (reasoning: string) => {
    const parts: { role: string; text: string }[] = []
    const segments = reasoning.split(" | ")
    for (const seg of segments) {
      if (seg.startsWith("Buyer: ")) {
        parts.push({ role: "buyer_message", text: seg.replace("Buyer: ", "") })
      } else if (seg.startsWith("Buyer reasoning: ")) {
        parts.push({ role: "buyer_reasoning", text: seg.replace("Buyer reasoning: ", "") })
      } else if (seg.startsWith("Supplier: ")) {
        parts.push({ role: "supplier_message", text: seg.replace("Supplier: ", "") })
      } else if (seg.trim()) {
        parts.push({ role: "info", text: seg })
      }
    }
    return parts
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Negotiation: ${session.supplier?.companyName || "Unknown"}`}
        description={`${session.product?.name} (${session.product?.sku}) | ${session.rounds?.length || 0} rounds`}
        backLink="/dashboard/dev-tools/negotiations"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              {statusIcon}
              <span className="text-sm font-medium capitalize">{session.status}</span>
            </div>
            <p className="text-xs text-muted-foreground">Status</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{session.rounds?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Negotiation Rounds</p>
          </CardContent>
        </Card>
        {session.finalTerms && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">₹{session.finalTerms.unitPrice}</span>
                  <span className="text-sm text-muted-foreground">/unit</span>
                </div>
                <p className="text-xs text-muted-foreground">Final Price</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-green-600">{session.finalTerms.savingsPercent}%</span>
                </div>
                <p className="text-xs text-muted-foreground">Savings from List Price</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Constraints (hidden from supplier) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Agent Constraints (Private)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div>
              <span className="text-muted-foreground">Max Price (pmax):</span>
              <span className="ml-2 font-medium">₹{session.agentConstraints.maxUnitPrice}/unit</span>
            </div>
            <div>
              <span className="text-muted-foreground">Target Price:</span>
              <span className="ml-2 font-medium">₹{session.agentConstraints.targetUnitPrice}/unit</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Lead Time:</span>
              <span className="ml-2 font-medium">{session.agentConstraints.maxLeadTimeDays} days</span>
            </div>
            <div>
              <span className="text-muted-foreground">Required Qty:</span>
              <span className="ml-2 font-medium">{session.agentConstraints.requiredQty} units</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Negotiation Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(!session.rounds || session.rounds.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No negotiation rounds recorded.
              </p>
            ) : (
              session.rounds.map((round, idx) => {
                const parts = parseReasoning(round.agentReasoning || "")
                const buyerMsg = parts.find((p) => p.role === "buyer_message")?.text
                const buyerReasoning = parts.find((p) => p.role === "buyer_reasoning")?.text
                const supplierMsg = parts.find((p) => p.role === "supplier_message")?.text

                return (
                  <div key={idx} className="space-y-3">
                    {/* Round Header */}
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-medium text-muted-foreground px-2">
                        Round {round.roundNumber}
                      </span>
                      <Badge
                        variant={
                          round.status === "accepted" ? "default" :
                          round.status === "rejected" ? "destructive" : "secondary"
                        }
                        className="text-xs"
                      >
                        {round.status}
                      </Badge>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* Buyer Agent Message */}
                    {round.agentOffer && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-blue-500">Buyer Agent</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(round.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                            {buyerMsg && (
                              <p className="text-sm mb-2">{buyerMsg}</p>
                            )}
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              {round.agentOffer.unitPrice != null && (
                                <span>Offer: <strong className="text-foreground">₹{round.agentOffer.unitPrice}/unit</strong></span>
                              )}
                              {round.agentOffer.leadTimeDays != null && (
                                <span>Lead: <strong className="text-foreground">{round.agentOffer.leadTimeDays}d</strong></span>
                              )}
                              {round.agentOffer.quantity != null && (
                                <span>Qty: <strong className="text-foreground">{round.agentOffer.quantity}</strong></span>
                              )}
                              {round.agentOffer.paymentTermsDays != null && (
                                <span>Payment: <strong className="text-foreground">Net {round.agentOffer.paymentTermsDays}d</strong></span>
                              )}
                            </div>
                          </div>
                          {buyerReasoning && (
                            <details className="text-xs">
                              <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                                View agent reasoning
                              </summary>
                              <p className="mt-1 p-2 bg-muted rounded text-muted-foreground italic">
                                {buyerReasoning}
                              </p>
                            </details>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Arrow */}
                    {round.agentOffer && round.supplierCounterOffer && (
                      <div className="flex justify-center">
                        <ArrowDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}

                    {/* Supplier Response */}
                    {round.supplierCounterOffer && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-orange-500">Supplier ({session.supplier?.companyName})</span>
                          </div>
                          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                            {supplierMsg && (
                              <p className="text-sm mb-2">{supplierMsg}</p>
                            )}
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              {round.supplierCounterOffer.unitPrice != null && (
                                <span>Counter: <strong className="text-foreground">₹{round.supplierCounterOffer.unitPrice}/unit</strong></span>
                              )}
                              {round.supplierCounterOffer.leadTimeDays != null && (
                                <span>Lead: <strong className="text-foreground">{round.supplierCounterOffer.leadTimeDays}d</strong></span>
                              )}
                              {round.supplierCounterOffer.quantity != null && (
                                <span>Qty: <strong className="text-foreground">{round.supplierCounterOffer.quantity}</strong></span>
                              )}
                              {round.supplierCounterOffer.paymentTermsDays != null && (
                                <span>Payment: <strong className="text-foreground">Net {round.supplierCounterOffer.paymentTermsDays}d</strong></span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}

            {/* Final Terms */}
            {session.finalTerms && session.status === "accepted" && (
              <div className="mt-6 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-green-700">Deal Accepted</span>
                </div>
                <div className="grid gap-3 md:grid-cols-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Final Price:</span>
                    <span className="ml-1 font-bold">₹{session.finalTerms.unitPrice}/unit</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lead Time:</span>
                    <span className="ml-1 font-bold">{session.finalTerms.leadTimeDays} days</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment:</span>
                    <span className="ml-1 font-bold">Net {session.finalTerms.paymentTermsDays} days</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Savings:</span>
                    <span className="ml-1 font-bold text-green-600">{session.finalTerms.savingsPercent}%</span>
                  </div>
                </div>
              </div>
            )}

            {session.status === "rejected" && (
              <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-red-700">Negotiation Rejected</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Supplier could not meet the buyer agent&apos;s constraints.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
