"use client"

import { ProductForm } from "@/components/features/products/product-form"
import { PageHeader } from "@/components/business/page-header"
import { useProduct } from "@/hooks/queries/use-products"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { useParams } from "next/navigation"

export default function EditProductPage() {
  const params = useParams()
  const id = params.id as string
  const { data: product, isLoading } = useProduct(id)

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Product"
        description={`Editing product: ${product?.name}`}
        backLink="/dashboard/admin/products"
      />
      
      <div className="max-w-2xl border rounded-lg p-6 bg-card">
        {product && <ProductForm initialData={product} />}
      </div>
    </div>
  )
}
