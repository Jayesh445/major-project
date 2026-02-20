"use client"

import { ColumnDef } from "@tanstack/react-table"
import { PurchaseOrder } from "@/types/purchase-order.types"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/business/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils/format"

export const columns: ColumnDef<PurchaseOrder>[] = [
  {
    accessorKey: "poNumber",
    header: "PO Number",
  },
  {
    accessorKey: "supplier.name",
    header: "Supplier",
    cell: ({ row }) => {
      const supplier = row.original.supplier
      return typeof supplier === 'object' ? supplier.name : supplier
    }
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
      let badgeStatus: any = "pending"
      if (status === "approved") badgeStatus = "approved"
      if (status === "rejected" || status === "cancelled") badgeStatus = "rejected"
      if (status === "received") badgeStatus = "active"
      
      return <StatusBadge status={badgeStatus} />
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const po = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(po.poNumber)}
            >
              Copy PO Number
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface POTableProps {
  data: PurchaseOrder[]
  isLoading?: boolean
}

export function POTable({ data, isLoading }: POTableProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      isLoading={isLoading}
      searchKey="poNumber"
      searchPlaceholder="Filter POs..."
    />
  )
}
