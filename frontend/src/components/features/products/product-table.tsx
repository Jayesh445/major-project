"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@/types/product.types"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/business/status-badge"
import { formatCurrency } from "@/lib/utils/format"
import Link from "next/link"
import { useDeleteProduct } from "@/hooks/queries/use-products"

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "unitPrice",
    header: "Price",
    cell: ({ row }) => formatCurrency(row.getValue("unitPrice")),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      // Map product status to allowed StatusBadge types
      const status = row.getValue("status") as string
      let badgeStatus: any = "inactive"
      if (status === "active") badgeStatus = "active"
      if (status === "archived") badgeStatus = "inactive"
      
      return <StatusBadge status={badgeStatus} />
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original
      const { mutate: deleteProduct } = useDeleteProduct()

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
              onClick={() => navigator.clipboard.writeText(product._id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/admin/products/${product._id}`}>
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/admin/products/${product._id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => deleteProduct(product._id)}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface ProductTableProps {
  data: Product[]
  isLoading?: boolean
}

export function ProductTable({ data, isLoading }: ProductTableProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="Filter products..."
    />
  )
}
