"use client"

import { ColumnDef } from "@tanstack/react-table"
import { InventoryItem } from "@/types/inventory.types"
import { DataTable } from "@/components/shared/data-table"
import { formatDate } from "@/lib/utils/format"

export const columns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "product.name", // Assuming product is populated
    header: "Product",
    cell: ({ row }) => {
      const product = row.original.product
      return typeof product === 'object' ? product.name : product
    }
  },
  {
    accessorKey: "warehouse.name", // Assuming warehouse is populated
    header: "Warehouse",
    cell: ({ row }) => {
      const warehouse = row.original.warehouse
      return typeof warehouse === 'object' ? warehouse.name : warehouse
    }
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    accessorKey: "zone",
    header: "Zone",
  },
  {
    accessorKey: "lastUpdated",
    header: "Last Updated",
    cell: ({ row }) => formatDate(row.getValue("lastUpdated")),
  },
]

interface InventoryTableProps {
  data: InventoryItem[]
  isLoading?: boolean
}

export function InventoryTable({ data, isLoading }: InventoryTableProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      isLoading={isLoading}
      searchKey="product.name" // This might need custom filter function for nested
      searchPlaceholder="Filter inventory..."
    />
  )
}
