"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Supplier } from "@/types/supplier.types"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash, CheckCircle, XCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useDeleteSupplier } from "@/hooks/queries/use-suppliers"
import { useRouter } from "next/navigation"

function ActionsCell({ supplier }: { supplier: Supplier }) {
  const { mutate: deleteSupplier } = useDeleteSupplier()
  const router = useRouter()

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
          onClick={() => navigator.clipboard.writeText(supplier._id)}
        >
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/suppliers/${supplier._id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600"
          onClick={() => {
            if (confirm(`Delete supplier "${supplier.companyName}"?`)) {
              deleteSupplier(supplier._id)
            }
          }}
        >
          <Trash className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "companyName",
    header: "Company Name",
  },
  {
    accessorKey: "contactEmail",
    header: "Email",
  },
  {
    accessorKey: "contactPhone",
    header: "Phone",
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number
      return (
        <div className="flex items-center">
          <span className="font-medium">{rating.toFixed(1)}</span>
          <span className="text-muted-foreground text-xs ml-1">/ 5</span>
        </div>
      )
    },
  },
  {
    accessorKey: "isApproved",
    header: "Status",
    cell: ({ row }) => {
      const isApproved = row.getValue("isApproved") as boolean
      return isApproved ? (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" /> Approved
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" /> Pending
        </Badge>
      )
    },
  },
  {
    accessorKey: "catalogProducts",
    header: "Products",
    cell: ({ row }) => {
      const catalog = row.getValue("catalogProducts") as any[]
      return <span className="text-sm">{catalog?.length ?? 0}</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell supplier={row.original} />,
  },
]

interface SupplierTableProps {
  data: Supplier[]
  isLoading?: boolean
}

export function SupplierTable({ data, isLoading }: SupplierTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="companyName"
      searchPlaceholder="Filter suppliers..."
    />
  )
}
