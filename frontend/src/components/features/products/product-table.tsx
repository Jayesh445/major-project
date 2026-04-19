"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@/types/product.types"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash, CheckCircle, XCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useDeleteProduct, useUpdateProduct } from "@/hooks/queries/use-products"
import { useRouter } from "next/navigation"

function formatINR(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

function ActionsCell({ product }: { product: Product }) {
  const router = useRouter()
  const { mutate: deleteProduct } = useDeleteProduct()
  const { mutate: updateProduct } = useUpdateProduct()

  const toggleActive = () => {
    updateProduct({ id: product._id, data: { isActive: !product.isActive } })
  }

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
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product._id)}>
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/products/${product._id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleActive}>
          {product.isActive ? (
            <><XCircle className="mr-2 h-4 w-4" /> Deactivate</>
          ) : (
            <><CheckCircle className="mr-2 h-4 w-4" /> Activate</>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onClick={() => {
            if (confirm(`Delete product "${product.name}"?`)) {
              deleteProduct(product._id)
            }
          }}
        >
          <Trash className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      return <span className="text-sm">{category?.replace(/_/g, " ")}</span>
    },
  },
  {
    accessorKey: "unitPrice",
    header: "Price",
    cell: ({ row }) => formatINR(row.getValue("unitPrice") as number),
  },
  {
    accessorKey: "reorderPoint",
    header: "ROP",
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
    cell: ({ row }) => <ActionsCell product={row.original} />,
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
