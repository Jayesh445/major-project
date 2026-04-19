"use client"

import { ColumnDef } from "@tanstack/react-table"
import { InventoryItem } from "@/types/inventory.types"
import { DataTable } from "@/components/shared/data-table"
import { formatDate } from "@/lib/utils/format"
import { useRouter } from "next/navigation"

export const columns: ColumnDef<InventoryItem>[] = [
  {
    id: "product",
    accessorFn: (row) => {
      const product = row.product
      return typeof product === 'object' ? product.name : product
    },
    header: "Product",
    cell: ({ row }) => {
      const product = row.original.product
      return typeof product === 'object' ? product.name : product
    }
  },
  {
    id: "warehouse",
    accessorFn: (row) => {
      const warehouse = row.warehouse
      return typeof warehouse === 'object' ? warehouse.name : warehouse
    },
    header: "Warehouse",
    cell: ({ row }) => {
      const warehouse = row.original.warehouse
      return typeof warehouse === 'object' ? warehouse.name : warehouse
    }
  },
  {
    accessorKey: "currentStock",
    header: "Current Stock",
  },
  {
    accessorKey: "reorderPoint",
    header: "Reorder Point",
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
  onRowClick?: (item: InventoryItem) => void
}

export function InventoryTable({ data, isLoading, onRowClick }: InventoryTableProps) {
  const router = useRouter()

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="product"
      searchPlaceholder="Filter by product name..."
      onRowClick={onRowClick || ((row) => {
        // Navigate to product detail page if available
        const product = row.product
        const productId = typeof product === 'object' ? product._id : product
        if (productId) {
          router.push(`/dashboard/admin/products/${productId}`)
        }
      })}
    />
  )
}
