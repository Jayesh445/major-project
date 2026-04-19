"use client"

import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Zap,
  Radio,
} from "lucide-react"
import { usePendingTransactions } from "@/hooks/queries/use-pending-transactions"
import Link from "next/link"

export default function PendingTransactionsPage() {
  const { data: pendingTxs, isLoading } = usePendingTransactions()

  const formatHash = (hash: string) => `${hash.slice(0, 10)}...${hash.slice(-8)}`

  const formatGasPrice = (gasPriceWei?: string) => {
    if (!gasPriceWei) return "—"
    const gwei = Number(gasPriceWei) / 1e9
    return `${gwei.toFixed(2)} Gwei`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffSeconds < 60) return `${diffSeconds}s ago`
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
    return date.toLocaleTimeString()
  }

  const transactions = pendingTxs || []
  const pendingCount = transactions.filter((tx) => tx.confirmationStatus === "pending").length
  const confirmedCount = transactions.filter((tx) => tx.confirmationStatus === "confirmed").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blockchain Monitor"
        description="Real-time view of all blockchain transactions with live confirmation tracking."
      />

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <div>
                <div className="text-xs text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold">{pendingCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-xs text-muted-foreground">Confirmed</div>
                <div className="text-2xl font-bold">{confirmedCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">{transactions.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Fetching transaction data...</p>
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-1">All Clear!</h3>
            <p className="text-sm text-muted-foreground">No pending transactions at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Pending Transactions */}
          {transactions.filter((tx) => tx.confirmationStatus === "pending").length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Radio className="h-4 w-4 text-blue-600 animate-pulse" />
                Pending Confirmation
              </h3>
              <div className="space-y-2">
                {transactions
                  .filter((tx) => tx.confirmationStatus === "pending")
                  .map((tx) => (
                    <Card key={tx._id} className="border-blue-200 bg-blue-50/50">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-sm">
                                {typeof tx.payload === "object"
                                  ? tx.payload?.poNumber || "Transaction"
                                  : "Transaction"}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Event: {tx.eventType.replace(/_/g, " ")}
                              </p>
                            </div>
                            <Badge className="bg-blue-600 gap-1 animate-pulse">
                              <Loader2 className="h-3 w-3" />
                              Confirming...
                            </Badge>
                          </div>

                          <div className="grid gap-2 grid-cols-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Hash:</span>
                              <p className="font-mono text-xs break-all">{formatHash(tx.txHash)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Submitted:</span>
                              <p className="font-medium">{formatDate(tx.createdAt)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t">
                            <div className="text-xs text-blue-700">
                              ⏱️ Typically confirms in 12-30 seconds on Ethereum Sepolia
                            </div>
                          </div>

                          <a
                            href={tx.etherscanUrl || `https://sepolia.etherscan.io/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 w-full">
                              <ExternalLink className="h-3 w-3" />
                              View on Etherscan
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Confirmed Transactions */}
          {transactions.filter((tx) => tx.confirmationStatus === "confirmed").length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Confirmed
              </h3>
              <div className="space-y-2">
                {transactions
                  .filter((tx) => tx.confirmationStatus === "confirmed")
                  .map((tx) => (
                    <Card key={tx._id} className="border-green-200 bg-green-50/50">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-sm">
                                {typeof tx.payload === "object"
                                  ? tx.payload?.poNumber || "Transaction"
                                  : "Transaction"}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Event: {tx.eventType.replace(/_/g, " ")}
                              </p>
                            </div>
                            <Badge className="bg-green-600 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Confirmed
                            </Badge>
                          </div>

                          <div className="grid gap-2 grid-cols-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Hash:</span>
                              <p className="font-mono text-xs break-all">{formatHash(tx.txHash)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Block:</span>
                              <p className="font-medium">#{tx.blockNumber}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Submitted:</span>
                              <p className="font-medium">{formatDate(tx.createdAt)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Confirmed:</span>
                              <p className="font-medium">
                                {tx.confirmedAt ? formatDate(tx.confirmedAt) : "—"}
                              </p>
                            </div>
                          </div>

                          <a
                            href={tx.etherscanUrl || `https://sepolia.etherscan.io/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 w-full">
                              <ExternalLink className="h-3 w-3" />
                              View on Etherscan
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-refresh info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Radio className="h-3 w-3 animate-pulse" />
            Auto-refreshing every 5 seconds • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
