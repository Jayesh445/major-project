import { ProductForm } from "@/components/features/products/product-form"
import { PageHeader } from "@/components/business/page-header"

export const metadata = {
  title: "Add Product - AutoStock AI",
  description: "Add a new product to the catalog",
}

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Product"
        description="Fill in the details to create a new product"
        backLink="/dashboard/admin/products"
      />
      
      <div className="max-w-2xl border rounded-lg p-6 bg-card">
        <ProductForm />
      </div>
    </div>
  )
}
