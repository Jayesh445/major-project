"use client"

import { use } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useVerifyReference, useLogsByReference } from "@/hooks/queries/use-blockchain"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, ExternalLink, ShieldCheck, Clock, ArrowRight } from "lucide-react"

export default function VerifyPage({
  params,
}: {
  params: Promise<{ referenceId: string }>
}) {
  const { referenceId } = use(params)
  const searchParams = useSearchParams()
  const eventType = searchParams.get("type") || "po_created"

  const { data: result, isLoading, error } = useVerifyReference(referenceId, eventType)
  const { data: logs } = useLogsByReference(referenceId)

  const formatCurrency = (n?: number) =>
    n != null ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Verifying on blockchain...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16">
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Reference Not Found</h2>
          <p className="text-sm text-muted-foreground text-center">
            Could not find this reference in the system. The QR code may be invalid or the record was deleted.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Check blockchain logs for actual confirmation status
  const confirmedLog = logs?.find((log) => log.confirmationStatus === "confirmed")
  const pendingLog = logs?.find((log) => log.confirmationStatus === "pending")
  const hasLogs = logs && logs.length > 0

  // Determine status based on logs (more reliable than chainHash)
  let isConfirmed = !!confirmedLog
  let isPending = !!pendingLog && !confirmedLog
  let isNotYetLogged = !hasLogs

  let matchClass = "border-gray-300 bg-gray-50"
  let statusIcon = null
  let statusTitle = "Pending"
  let statusMessage = "This document has not yet been logged to the blockchain. It will be recorded once the order is processed."
  let statusColor = "text-gray-800"
  let messageColor = "text-gray-700"

  if (isConfirmed) {
    matchClass = "border-green-500 bg-green-50"
    statusTitle = "Verified ✓"
    statusMessage = "This document is recorded on-chain and has been confirmed by the blockchain network."
    statusColor = "text-green-800"
    messageColor = "text-green-700"
  } else if (isPending) {
    matchClass = "border-blue-500 bg-blue-50"
    statusTitle = "Pending Confirmation"
    statusMessage = "Transaction submitted to blockchain. Waiting for network confirmation (typically 12-30 seconds)."
    statusColor = "text-blue-800"
    messageColor = "text-blue-700"
  } else if (isNotYetLogged) {
    matchClass = "border-yellow-500 bg-yellow-50"
    statusTitle = "Not Yet Logged"
    statusMessage = "This document has not yet been logged to the blockchain. It will be recorded once the order is processed."
    statusColor = "text-yellow-800"
    messageColor = "text-yellow-700"
  } else {
    matchClass = "border-red-500 bg-red-50"
    statusTitle = "Tamper Detected ✗"
    statusMessage = "WARNING: The document has been modified. Computed hash does not match the on-chain record. Halt payment settlement immediately."
    statusColor = "text-red-800"
    messageColor = "text-red-700"
  }

  return (
    <div className="space-y-4">
      {/* Verification result banner */}
      <Card className={`border-2 ${matchClass}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {isConfirmed ? (
              <CheckCircle className="h-16 w-16 text-green-500 shrink-0" />
            ) : isPending ? (
              <Loader2 className="h-16 w-16 text-blue-500 shrink-0 animate-spin" />
            ) : isNotYetLogged ? (
              <Clock className="h-16 w-16 text-yellow-600 shrink-0" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 shrink-0" />
            )}
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${statusColor}`}>
                {statusTitle}
              </h2>
              <p className={`text-sm ${messageColor}`}>
                {statusMessage}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Document Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Document</span>
              <span className="font-medium">{result.documentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference ID</span>
              <span className="font-mono text-xs">{result.referenceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Event Type</span>
              <span className="font-medium">{result.eventType}</span>
            </div>
            {result.amount != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatCurrency(result.amount)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View actual document */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">View Full Details</h3>
              <p className="text-sm text-blue-700">
                Check the complete {result.eventType === "po_created" ? "Purchase Order" : "Document"} details on the system.
              </p>
            </div>
            <Link
              href={
                result.eventType === "po_created"
                  ? `/dashboard/procurement/orders/${referenceId}`
                  : `/dashboard`
              }
            >
              <Button className="gap-2">
                View Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Explorer Link */}
      {confirmedLog ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-green-600" />
              Blockchain Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="text-muted-foreground mb-2">View this transaction on the Ethereum Sepolia testnet blockchain explorer:</p>
                <a
                  href={confirmedLog.etherscanUrl || `https://sepolia.etherscan.io/tx/${confirmedLog.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <span>View on Etherscan</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction Hash:</span>
                  <span className="font-mono text-xs truncate">{confirmedLog.txHash.slice(0, 20)}...{confirmedLog.txHash.slice(-8)}</span>
                </div>
                {confirmedLog.blockNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Block Number:</span>
                    <span className="font-medium">#{confirmedLog.blockNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Confirmed on Blockchain
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Waiting for Blockchain Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-yellow-800">
                This document has not yet been recorded on the blockchain. It will be logged automatically during the order processing and fulfillment workflow.
              </p>
              <div className="mt-3 p-3 bg-yellow-100 rounded text-xs text-yellow-900">
                <strong>⏱️ Timeline:</strong> Once logged, transaction confirmation typically takes 12-30 seconds on Ethereum Sepolia testnet. You'll receive the Etherscan link and block details automatically.
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-yellow-800 mb-2">Monitor the blockchain in real-time:</p>
                <a
                  href="https://sepolia.etherscan.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  <span>View Ethereum Sepolia Testnet</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hash comparison - Only show when logged to blockchain */}
      {result.txHash && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cryptographic Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xs font-mono">
              <div>
                <div className="text-muted-foreground mb-1">Computed hash (from current document)</div>
                <div className="break-all p-2 bg-muted rounded">{result.computedHash}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">On-chain hash (from blockchain)</div>
                <div className="break-all p-2 bg-muted rounded">{result.chainHash || "Not found on chain"}</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
              <div>
                <div className="text-muted-foreground">Transaction</div>
                <div className="font-mono text-xs">{result.txHash.slice(0, 20)}...</div>
                {result.blockNumber && (
                  <div className="text-xs text-muted-foreground">Block #{result.blockNumber}</div>
                )}
              </div>
              {result.etherscanUrl && (
                <a
                  href={result.etherscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  View on Etherscan <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit history */}
      {logs && logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audit History ({logs.length} events)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log._id} className="flex items-center gap-3 p-2 rounded border text-sm">
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      log.confirmationStatus === "confirmed"
                        ? "bg-green-500"
                        : log.confirmationStatus === "pending"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{log.eventType.replace(/_/g, " ")}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Badge
                    variant={
                      log.confirmationStatus === "confirmed"
                        ? "default"
                        : log.confirmationStatus === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    {log.confirmationStatus === "pending" && <Clock className="mr-1 h-3 w-3" />}
                    {log.confirmationStatus}
                  </Badge>
                  {log.etherscanUrl && (
                    <a
                      href={log.etherscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
