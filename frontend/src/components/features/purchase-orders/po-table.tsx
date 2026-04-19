"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { PurchaseOrder } from "@/types/purchase-order.types"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, QrCode, ShieldCheck } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { QRModal } from "@/components/features/blockchain/qr-modal"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

const formatCurrency = (n: number) =>
  `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

const formatDate = (d: string) => new Date(d).toLocaleDateString()

function POActionsCell({ po }: { po: PurchaseOrder }) {
  const [qrOpen, setQrOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(po.poNumber)}>
            Copy PO Number
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(`/dashboard/procurement/orders/${po._id}`)}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setQrOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" /> Show QR Code
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open(`/verify/${po._id}?type=po_created`, "_blank")}
          >
            <ShieldCheck className="mr-2 h-4 w-4" /> Verify on Chain
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {qrOpen && (
        <QRModal open={qrOpen} onClose={() => setQrOpen(false)} poId={po._id} poNumber={po.poNumber} />
      )}
    </>
  )
}

export const columns: ColumnDef<PurchaseOrder>[] = [
  {
    accessorKey: "poNumber",
    header: "PO Number",
  },
  {
    id: "supplier",
    header: "Supplier",
    cell: ({ row }) => {
      const supplier = row.original.supplier
      return typeof supplier === "object" && supplier !== null
        ? (supplier as any).companyName || (supplier as any).name || "—"
        : "—"
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.getValue("totalAmount")),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variant: "default" | "secondary" | "destructive" | "outline" =
        status === "fully_received" ? "default"
        : status === "cancelled" ? "destructive"
        : status?.startsWith("pending") || status === "draft" ? "outline"
        : "secondary"
      return <Badge variant={variant}>{status?.replace(/_/g, " ")}</Badge>
    },
  },
  {
    accessorKey: "blockchainTxHash",
    header: "On-Chain",
    cell: ({ row }) => {
      const tx = row.original.blockchainTxHash
      return tx ? (
        <Badge variant="default" className="gap-1">
          <ShieldCheck className="h-3 w-3" /> {tx.slice(0, 8)}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
  {
    id: "actions",
    cell: ({ row }) => <POActionsCell po={row.original} />,
  },
]

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface POTableProps {
  data: PurchaseOrder[]
  isLoading?: boolean
  pagination?: Pagination
  onPageChange?: (page: number) => void
}

export function POTable({ data, isLoading, pagination, onPageChange }: POTableProps) {
  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchKey="poNumber"
        searchPlaceholder="Filter POs..."
        disablePagination={!!pagination}
      />

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
