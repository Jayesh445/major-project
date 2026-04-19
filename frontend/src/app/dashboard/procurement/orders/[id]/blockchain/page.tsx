"use client"

import { use, useEffect, useState } from "react"
import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import apiClient from "@/lib/api/client"
import { Loader2, ShieldCheck, ArrowRight, Copy, CheckCircle2, ExternalLink, FileText, Clock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useState as useStateTwo } from "react"

interface BlockchainEvent {
  _id: string
  eventType: string
  transactionHash: string
  blockNumber: number
  timestamp: string
  status: string
  contractAddress: string
}

function formatDate(iso: string | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString()
}

const eventIcons: Record<string, React.ReactNode> = {
  PO_CREATED: "📝",
  PO_SUBMITTED_FOR_APPROVAL: "✋",
  PO_APPROVED: "✅",
  PO_SENT_TO_SUPPLIER: "📤",
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
        const response = await apiClient.get(`/blockchain/logs?purchaseOrderId=${id}`)
        setEvents(response.data.data || [])
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
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Total Events Recorded</p>
                  <p className="text-3xl font-bold text-green-900">{events.length}</p>
                </div>
                <ShieldCheck className="h-12 w-12 text-green-500 opacity-50" />
              </div>
              <p className="text-xs text-green-700 mt-3">
                ✓ All PO workflow events are immutably recorded on the blockchain
              </p>
            </CardContent>
          </Card>

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
                      <div className="h-6 w-6 rounded-full bg-blue-500 border-4 border-white shadow-md flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    </div>

                    {/* Event details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">
                          {eventIcons[event.eventType] || "📋"}
                        </span>
                        <h3 className="font-semibold text-base">
                          {event.eventType?.replace(/_/g, " ")}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {event.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDate(event.timestamp)}
                      </p>

                      <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Transaction Hash
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-background px-2 py-1 rounded flex-1 truncate font-mono">
                              {event.transactionHash}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyHash(event.transactionHash)}
                            >
                              {copied === event.transactionHash ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="font-medium text-muted-foreground">Block Number</div>
                            <div className="font-mono text-sm font-semibold">#{event.blockNumber}</div>
                          </div>
                          <div>
                            <div className="font-medium text-muted-foreground">Contract Address</div>
                            <div className="font-mono text-sm truncate">{event.contractAddress}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`}
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
                          onClick={() => copyHash(event.transactionHash)}
                        >
                          <Copy className="h-3 w-3" />
                          Copy Hash
                        </Button>
                      </div>
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
