"use client"

import { use } from "react"
import { useSearchParams } from "next/navigation"
import { useVerifyReference, useLogsByReference } from "@/hooks/queries/use-blockchain"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, ExternalLink, ShieldCheck, Clock } from "lucide-react"

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

  const matchClass = result.match
    ? "border-green-500 bg-green-50"
    : "border-red-500 bg-red-50"

  return (
    <div className="space-y-4">
      {/* Verification result banner */}
      <Card className={`border-2 ${matchClass}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {result.match ? (
              <CheckCircle className="h-16 w-16 text-green-500 shrink-0" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 shrink-0" />
            )}
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${result.match ? "text-green-800" : "text-red-800"}`}>
                {result.match ? "Verified ✓" : "Tamper Detected ✗"}
              </h2>
              <p className={`text-sm ${result.match ? "text-green-700" : "text-red-700"}`}>
                {result.match
                  ? "This document is unaltered since it was recorded on-chain."
                  : "WARNING: The document has been modified. Computed hash does not match the on-chain record. Halt payment settlement immediately."}
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

      {/* Hash comparison */}
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
          {result.txHash && (
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
          )}
        </CardContent>
      </Card>

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
