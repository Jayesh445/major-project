"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useQRCode } from "@/hooks/queries/use-blockchain"
import { Loader2, Download, ExternalLink, ShieldCheck } from "lucide-react"

interface QRModalProps {
  open: boolean
  onClose: () => void
  poId: string
  poNumber?: string
}

export function QRModal({ open, onClose, poId, poNumber }: QRModalProps) {
  const { data, isLoading } = useQRCode(poId)

  const handleDownload = () => {
    if (!data?.qrDataUrl) return
    const a = document.createElement("a")
    a.href = data.qrDataUrl
    a.download = `qr-${poNumber || poId}.png`
    a.click()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Blockchain Verification QR
          </DialogTitle>
          <DialogDescription>
            Print this QR code on the shipping label. Warehouse staff scan it at the dock to verify the PO against the blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {isLoading ? (
            <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
          ) : data ? (
            <>
              <img
                src={data.qrDataUrl}
                alt={`QR for ${poNumber || poId}`}
                className="border-2 border-gray-200 rounded-lg p-2 bg-white"
              />
              <div className="mt-4 text-center">
                <div className="text-sm font-medium">{poNumber || poId}</div>
                <div className="text-xs text-muted-foreground mt-1 break-all max-w-xs">
                  {data.verifyUrl}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to generate QR code</p>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {data && (
            <>
              <Button variant="outline" onClick={() => window.open(data.verifyUrl, "_blank")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
