"use client"

import { use } from "react"
import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Package,
  Building2,
  Truck,
  Calendar,
  ExternalLink,
  Download,
  Copy,
  CheckCircle2,
  Send,
  Check,
  X,
  Edit2,
  AlertCircle,
} from "lucide-react"
import { usePurchaseOrder, useSubmitPOForApproval, useApprovePO, useRejectPO, useSendPOToSupplier, useAcknowledgePO, useReceivePO } from "@/hooks/queries/use-purchase-orders"
import { useAuthStore } from "@/stores/auth-store"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import { toast } from "sonner"
import { useState } from "react"

function formatINR(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

function formatDate(iso: string | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString()
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending_approval: "secondary",
  approved: "secondary",
  sent_to_supplier: "secondary",
  acknowledged: "secondary",
  partially_received: "secondary",
  fully_received: "default",
  cancelled: "destructive",
}

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: po, isLoading, error } = usePurchaseOrder(id)
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)

  // Action mutations
  const submitForApproval = useSubmitPOForApproval()
  const approvePO = useApprovePO()
  const rejectPO = useRejectPO()
  const sendToSupplier = useSendPOToSupplier()
  const acknowledgePO = useAcknowledgePO()
  const receivePO = useReceivePO()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !po) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Purchase Order not found.
      </div>
    )
  }

  // Build QR code URL — points to the verify page that shows blockchain proof
  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${po._id}?type=po_created`

  const copyHash = () => {
    if (po.blockchainTxHash) {
      navigator.clipboard.writeText(po.blockchainTxHash)
      setCopied(true)
      toast.success("Transaction hash copied")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const supplier = typeof po.supplier === "object" ? po.supplier : null
  const warehouse = typeof po.warehouse === "object" ? po.warehouse : null
  const lineItems = po.lineItems || []

  // Determine available actions based on status and role
  const getAvailableActions = () => {
    const actions: Array<{
      label: string
      onClick: () => void
      variant: "default" | "outline" | "destructive"
      icon: React.ReactNode
      loading: boolean
    }> = []

    if (po.status === "draft" && user?.role === "procurement_officer") {
      actions.push({
        label: "Submit for Approval",
        onClick: () => submitForApproval.mutate(id),
        variant: "default",
        icon: <Send className="h-4 w-4" />,
        loading: submitForApproval.isPending,
      })
    }

    if (po.status === "pending_approval" && user?.role === "admin") {
      actions.push({
        label: "Approve",
        onClick: () => approvePO.mutate(id),
        variant: "default",
        icon: <Check className="h-4 w-4" />,
        loading: approvePO.isPending,
      })
      actions.push({
        label: "Reject",
        onClick: () => rejectPO.mutate({ id, reason: "Rejected by admin" }),
        variant: "destructive",
        icon: <X className="h-4 w-4" />,
        loading: rejectPO.isPending,
      })
    }

    if (po.status === "approved" && (user?.role === "admin" || user?.role === "procurement_officer")) {
      actions.push({
        label: "Send to Supplier",
        onClick: () => sendToSupplier.mutate(id),
        variant: "default",
        icon: <Send className="h-4 w-4" />,
        loading: sendToSupplier.isPending,
      })
    }

    if (po.status === "sent_to_supplier" && user?.role === "supplier") {
      actions.push({
        label: "Acknowledge",
        onClick: () => acknowledgePO.mutate(id),
        variant: "default",
        icon: <Check className="h-4 w-4" />,
        loading: acknowledgePO.isPending,
      })
    }

    if ((po.status === "acknowledged" || po.status === "partially_received") && user?.role === "warehouse_manager") {
      actions.push({
        label: "Mark as Received",
        onClick: () => receivePO.mutate({ id, po }),
        variant: "default",
        icon: <Package className="h-4 w-4" />,
        loading: receivePO.isPending,
      })
    }

    return actions
  }

  const availableActions = po ? getAvailableActions() : []

  return (
    <div className="space-y-6">
      <PageHeader
        title={po.poNumber}
        description={`Purchase Order created ${formatDate(po.createdAt)}`}
        backLink="/dashboard/procurement/orders"
        actions={
          <Badge variant={statusColors[po.status] || "outline"} className="text-sm px-3 py-1">
            {po.status?.replace(/_/g, " ")}
          </Badge>
        }
      />

      {/* Action Buttons */}
      {availableActions.length > 0 && (
        <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 mb-1">
                  Next Steps
                </p>
                <p className="text-xs text-blue-700 mb-4">
                  Choose an action to move this purchase order forward
                </p>
                <div className="flex flex-wrap gap-3">
                  {availableActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant={action.variant}
                      size="lg"
                      onClick={action.onClick}
                      disabled={action.loading}
                      className={`gap-2 font-semibold transition-all ${
                        action.variant === "destructive"
                          ? "hover:scale-105"
                          : "hover:shadow-lg hover:scale-105"
                      }`}
                    >
                      {action.loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {action.icon}
                          {action.label}
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: PO Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Building2 className="h-3 w-3" /> Supplier
                  </div>
                  <p className="font-medium">{supplier?.companyName || "—"}</p>
                  {supplier?.contactEmail && (
                    <p className="text-xs text-muted-foreground">{supplier.contactEmail}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Truck className="h-3 w-3" /> Warehouse
                  </div>
                  <p className="font-medium">{warehouse?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{warehouse?.code}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Package className="h-3 w-3" /> Triggered By
                  </div>
                  <p className="font-medium capitalize">{po.triggeredBy?.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" /> Expected Delivery
                  </div>
                  <p className="font-medium">{formatDate(po.expectedDeliveryDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items ({lineItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">SKU</th>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-right p-3 font-medium">Ordered</th>
                      <th className="text-right p-3 font-medium">Received</th>
                      <th className="text-right p-3 font-medium">Unit Price</th>
                      <th className="text-right p-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item: any, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3 font-mono text-xs">{item.sku}</td>
                        <td className="p-3">
                          {typeof item.product === "object" ? item.product?.name : "—"}
                        </td>
                        <td className="p-3 text-right">{item.orderedQty}</td>
                        <td className="p-3 text-right">
                          <span
                            className={
                              item.receivedQty >= item.orderedQty
                                ? "text-green-600 font-medium"
                                : ""
                            }
                          >
                            {item.receivedQty}
                          </span>
                        </td>
                        <td className="p-3 text-right">{formatINR(item.unitPrice)}</td>
                        <td className="p-3 text-right font-medium">
                          {formatINR(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30">
                    <tr className="border-t">
                      <td colSpan={5} className="p-3 text-right font-semibold">
                        Total Amount
                      </td>
                      <td className="p-3 text-right text-lg font-bold">
                        {formatINR(po.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {po.notes && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm">
                  <div className="text-xs text-muted-foreground mb-1">Notes</div>
                  {po.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Negotiation */}
          {po.negotiationSession && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Negotiation History</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/dashboard/dev-tools/negotiations/${po.negotiationSession}`}
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
                >
                  View full negotiation conversation <ExternalLink className="h-3 w-3" />
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  This PO was created from an autonomous negotiation between the Buyer and Supplier
                  agents.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Blockchain & QR */}
        <div className="space-y-6">
          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Verification QR
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-lg border-2">
                <QRCodeSVG
                  value={verifyUrl}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Scan this QR at the goods-receipt dock to cross-verify the physical shipment
                against the immutable blockchain record.
              </p>
              <Link
                href={`/verify/${po._id}?type=po_created`}
                target="_blank"
                className="mt-3"
              >
                <Button variant="outline" size="sm">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Open Verification Page
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Blockchain Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {po.blockchainLoggedAt ? (
                  <>
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    On-Chain Confirmed
                  </>
                ) : po.blockchainTxHash ? (
                  <>
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    Pending Confirmation
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4 text-yellow-500" />
                    Not Yet Logged
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {po.blockchainTxHash ? (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Transaction Hash</div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                          {po.blockchainTxHash}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={copyHash}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {po.blockchainLoggedAt ? (
                      <>
                        <div className="text-xs text-muted-foreground">
                          Confirmed: {formatDate(po.blockchainLoggedAt)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This PO is hashed (SHA-256) and recorded on Ethereum Sepolia. Any
                          modification will produce a hash mismatch detectable via the verify page.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                        ⏳ Transaction submitted to blockchain. Waiting for confirmation (typically 12-30 seconds on Sepolia testnet). Check the verify page for live updates.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This PO has not been logged to blockchain yet. It will be logged automatically
                    when goods are received via the Quality Control Agent.
                  </p>
                )}

                <div className="pt-3 border-t flex gap-2">
                  <Link
                    href={`/verify/${po._id}?type=po_created`}
                    target="_blank"
                  >
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      View Verification
                    </Button>
                  </Link>
                  <a
                    href={
                      po.blockchainTxHash
                        ? `https://sepolia.etherscan.io/tx/${po.blockchainTxHash}`
                        : `https://sepolia.etherscan.io`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                      <ExternalLink className="h-3 w-3" />
                      View on Etherscan
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Currency / Total */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-bold">{formatINR(po.totalAmount)}</div>
              <div className="text-xs text-muted-foreground mt-1">{po.currency}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
