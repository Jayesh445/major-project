"use client"

import { ProductTable } from "@/components/features/products/product-table"
import { useProducts } from "@/hooks/queries/use-products"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ProductsPage() {
  const { data, isLoading } = useProducts()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        actions={
          <Button asChild>
            <Link href="/dashboard/admin/products/new">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        }
      />
      
      <ProductTable data={data?.data || []} isLoading={isLoading} />
    </div>
  )
}
