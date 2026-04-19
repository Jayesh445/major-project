"use client"

import { use, useEffect, useState } from "react"
import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { blockchainService } from "@/lib/api/services/blockchain.service"
import { Loader2, ShieldCheck, ArrowRight, Copy, CheckCircle2, ExternalLink, FileText, Clock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface BlockchainEvent {
  _id: string
  eventType: string
  txHash?: string
  transactionHash?: string
  blockNumber?: number
  timestamp?: string
  createdAt?: string
  confirmationStatus?: string
  status?: string
  contractAddress?: string
}

function formatDate(iso: string | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString()
}

function formatEventType(eventType: string): string {
  // Convert lowercase underscore format to uppercase underscore format
  return eventType.toUpperCase()
}

const eventIcons: Record<string, React.ReactNode> = {
  PO_CREATED: "📝",
  PO_SUBMITTED_FOR_APPROVAL: "✋",
  PO_APPROVED: "✅",
  PO_SENT: "📤",
  PO_SENT_TO_SUPPLIER: "📤",
  PO_RECEIVED: "📦",
  PO_ACKNOWLEDGED: "👍",
  GOODS_RECEIVED: "📦",
  PO_CANCELLED: "❌",
}

export default function BlockchainTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [events, setEvents] = useState<BlockchainEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const data = await blockchainService.getLogsByPO(id)
        setEvents(data || [])
      } catch (error) {
        console.error("Failed to fetch blockchain events:", error)
        toast.error("Failed to load blockchain events")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [id])

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopied(hash)
    toast.success("Hash copied to clipboard")
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blockchain Timeline"
        description="View all blockchain events and verification records for this purchase order"
        backLink={`/dashboard/procurement/orders/${id}`}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-1">No Blockchain Events Yet</h3>
            <p className="text-sm text-muted-foreground">
              Blockchain events will appear here as the PO progresses through its workflow.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Timeline Summary */}
          {(() => {
            const confirmedCount = events.filter((e) => e.confirmationStatus === "confirmed" || e.networkName === "local-only").length
            const pendingCount = events.filter((e) => e.confirmationStatus === "pending").length
            const isComplete = confirmedCount === events.length && events.length > 0

            return (
              <Card
                className={`bg-gradient-to-r border-2 ${
                  isComplete
                    ? "from-green-50 to-emerald-50 border-green-200"
                    : "from-blue-50 to-cyan-50 border-blue-200"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className={`text-sm font-medium ${isComplete ? "text-green-700" : "text-blue-700"}`}>
                        {isComplete ? "✓ Audit Complete" : "⏳ Audit In Progress"}
                      </p>
                      <p className="text-3xl font-bold mt-1" style={{ color: isComplete ? "#166534" : "#1e40af" }}>
                        {events.length} Events
                      </p>
                    </div>
                    <ShieldCheck
                      className="h-12 w-12 opacity-50"
                      style={{ color: isComplete ? "#22c55e" : "#3b82f6" }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600">Confirmed:</span>
                      <span className="ml-2 font-semibold text-green-700">{confirmedCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pending:</span>
                      <span className="ml-2 font-semibold text-blue-700">{pendingCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Timeline Events */}
          <div className="space-y-3">
            {events.map((event, idx) => (
              <Card key={event._id} className="relative">
                {/* Timeline connector */}
                {idx < events.length - 1 && (
                  <div className="absolute left-8 top-20 w-0.5 h-12 bg-gradient-to-b from-blue-300 to-blue-100" />
                )}

                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 mt-1">
                      {(() => {
                        const isConfirmed = event.confirmationStatus === "confirmed" || event.networkName === "local-only"
                        const dotColor = isConfirmed ? "bg-green-500" : "bg-yellow-500"
                        return (
                          <div className={`h-6 w-6 rounded-full ${dotColor} border-4 border-white shadow-md flex items-center justify-center`}>
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        )
                      })()}
                    </div>

                    {/* Event details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xl">
                          {eventIcons[formatEventType(event.eventType)] || "📋"}
                        </span>
                        <h3 className="font-semibold text-base">
                          {formatEventType(event.eventType).replace(/_/g, " ")}
                        </h3>
                        <Badge
                          variant={event.confirmationStatus === "confirmed" || event.networkName === "local-only" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {event.confirmationStatus === "confirmed" || event.networkName === "local-only"
                            ? "✓ Confirmed"
                            : event.confirmationStatus === "pending"
                              ? "⏳ Pending"
                              : event.confirmationStatus}
                        </Badge>
                        {event.networkName === "local-only" && (
                          <Badge variant="outline" className="text-xs bg-purple-50">
                            Local Only
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDate(event.createdAt || event.timestamp)}
                      </p>

                      <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Transaction Hash
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-background px-2 py-1 rounded flex-1 truncate font-mono">
                              {event.txHash || event.transactionHash || "N/A"}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyHash(event.txHash || event.transactionHash || "")}
                            >
                              {copied === (event.txHash || event.transactionHash) ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {event.blockNumber && (
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <div className="font-medium text-muted-foreground">Block Number</div>
                              <div className="font-mono text-sm font-semibold">#{event.blockNumber}</div>
                            </div>
                            <div>
                              <div className="font-medium text-muted-foreground">Contract Address</div>
                              <div className="font-mono text-sm truncate">{event.contractAddress || "—"}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {event.confirmationStatus === "confirmed" && event.txHash && !event.txHash.startsWith("0x000") && (
                        <div className="flex gap-2 mt-3">
                          <a
                            href={`https://sepolia.etherscan.io/tx/${event.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                              <ExternalLink className="h-3 w-3" />
                              View on Etherscan
                            </Button>
                          </a>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1"
                            onClick={() => copyHash(event.txHash || event.transactionHash || "")}
                          >
                            <Copy className="h-3 w-3" />
                            Copy Hash
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Information Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  About Blockchain Verification
                </p>
                <ul className="text-blue-800 space-y-1 text-xs list-disc list-inside">
                  <li>Each event is cryptographically hashed and stored on Ethereum Sepolia testnet</li>
                  <li>Transaction hashes are immutable and permanently recorded</li>
                  <li>Block numbers confirm the event's position in the blockchain</li>
                  <li>You can verify events anytime by clicking the Etherscan links above</li>
                  <li>Any modification to PO data would produce a different hash, invalidating the record</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
