"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { blockchainService } from "@/lib/api/services/blockchain.service"
import { Loader2, ShieldCheck, TrendingUp, AlertCircle, CheckCircle, Clock, Eye } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface BlockchainStats {
  totalPOs: number
  loggedOnChain: number
  pendingLogging: number
  recentTransactions: Array<{
    _id: string
    poNumber: string
    eventType: string
    transactionHash: string
    timestamp: string
  }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

function formatEventType(eventType: string): string {
  // Convert lowercase underscore format to uppercase underscore format
  return eventType.toUpperCase()
}

export default function BlockchainMonitorPage() {
  const [stats, setStats] = useState<BlockchainStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const data = await blockchainService.getStatus()
        setStats(data)
      } catch (error) {
        console.error("Failed to fetch blockchain stats:", error)
        toast.error("Failed to load blockchain statistics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const loggingPercentage = stats
    ? Math.round((stats.loggedOnChain / stats.totalPOs) * 100)
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blockchain Monitoring"
        description="Real-time monitoring of blockchain logging status for all purchase orders"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !stats ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-1">Unable to Load Statistics</h3>
            <p className="text-sm text-muted-foreground">
              Please check your connection and try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* Total POs */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total POs</p>
                    <p className="text-2xl font-bold">{stats.totalPOs}</p>
                  </div>
                  <ShieldCheck className="h-8 w-8 opacity-30 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Logged On Chain */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Logged On Chain</p>
                    <p className="text-2xl font-bold text-green-900">
                      {stats.loggedOnChain}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500 opacity-70" />
                </div>
              </CardContent>
            </Card>

            {/* Pending */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {stats.pendingLogging}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500 opacity-70" />
                </div>
              </CardContent>
            </Card>

            {/* Success Rate */}
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">Success Rate</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {loggingPercentage}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Blockchain Logging Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="w-full h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 flex items-center justify-center"
                    style={{
                      width: `${loggingPercentage}%`,
                    }}
                  >
                    {loggingPercentage > 10 && (
                      <span className="text-xs font-bold text-white">
                        {loggingPercentage}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Successfully Logged</p>
                    <p className="font-semibold">
                      {stats.loggedOnChain}/{stats.totalPOs}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">In Progress</p>
                    <p className="font-semibold">{stats.pendingLogging}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={loggingPercentage === 100 ? "default" : "secondary"}>
                      {loggingPercentage === 100 ? "✓ Complete" : "⏳ In Progress"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Blockchain Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No recent blockchain events
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentTransactions.map((tx, idx) => (
                    <Link
                      key={tx._id}
                      href={`/dashboard/procurement/orders/${tx._id}/blockchain`}
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm">
                              {tx.poNumber}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {formatEventType(tx.eventType).replace(/_/g, " ")}
                            </Badge>
                            <Badge
                              variant={tx.status === "confirmed" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {tx.status === "confirmed" ? "✓ Confirmed" : "⏳ Pending"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(tx.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded hidden sm:block max-w-[200px] truncate">
                            {tx.transactionHash}
                          </code>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="font-semibold text-blue-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Blockchain System Status
                </p>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">Network</span>
                    <Badge variant="default">Ethereum Sepolia (Testnet)</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">Logging Status</span>
                    <Badge variant="default">
                      {loggingPercentage === 100 ? "✓ Fully Operational" : "⏳ Operational"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">Webhook Status</span>
                    <Badge variant="default">✓ Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800">Average Confirmation Time</span>
                    <Badge variant="outline">12-30 seconds</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Learn More</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Blockchain logging ensures immutable, transparent records of all PO state changes and events.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href="/docs/blockchain-verification"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Documentation
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://sepolia.etherscan.io`} target="_blank" rel="noopener noreferrer">
                      View on Etherscan
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
