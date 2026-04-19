"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Warehouse } from "@/types/warehouse.types"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Trash, CheckCircle, XCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDeleteWarehouse } from "@/hooks/queries/use-warehouses"

function ActionsCell({ warehouse }: { warehouse: Warehouse }) {
  const { mutate: deleteWarehouse } = useDeleteWarehouse()
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
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(warehouse._id)}>
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onClick={() => {
            if (confirm(`Delete warehouse "${warehouse.name}"?`)) {
              deleteWarehouse(warehouse._id)
            }
          }}
        >
          <Trash className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns: ColumnDef<Warehouse>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }) => {
      const loc = row.original.location
      if (!loc) return "—"
      return `${loc.city || "—"}, ${loc.state || "—"}`
    },
  },
  {
    id: "capacity",
    header: "Capacity",
    cell: ({ row }) => {
      const total = row.original.totalCapacity || 0
      const used = row.original.usedCapacity || 0
      const percent = total > 0 ? Math.round((used / total) * 100) : 0
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm">{used.toLocaleString()} / {total.toLocaleString()}</span>
          <Badge variant={percent > 80 ? "destructive" : percent > 60 ? "secondary" : "default"}>
            {percent}%
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean
      return isActive ? (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" /> Active
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" /> Inactive
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell warehouse={row.original} />,
  },
]

interface WarehouseTableProps {
  data: Warehouse[]
  isLoading?: boolean
}

export function WarehouseTable({ data, isLoading }: WarehouseTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="Filter warehouses..."
    />
  )
}
