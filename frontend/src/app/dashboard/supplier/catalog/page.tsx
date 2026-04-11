"use client"

import { PageHeader } from "@/components/business/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Loader2 } from "lucide-react"
import { useSuppliers } from "@/hooks/queries/use-suppliers"
import { useAuthStore } from "@/stores/auth-store"

export default function SupplierCatalogPage() {
  const { user } = useAuthStore()
  const { data: suppliersData, isLoading } = useSuppliers()
  const suppliers = suppliersData?.data || []

  // For a supplier user, show only their own catalog
  // For now show all suppliers' catalogs
  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <PageHeader title="Supplier Catalog" description="Products available from suppliers with pricing and lead times." />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Catalog Products</h3>
            <p className="text-sm text-muted-foreground">No suppliers with catalog products found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suppliers.filter((s: any) => s.catalogProducts?.length > 0).map((supplier: any) => (
            <Card key={supplier._id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{supplier.companyName}</h3>
                    <p className="text-xs text-muted-foreground">{supplier.contactEmail}</p>
                  </div>
                  <Badge variant={supplier.isApproved ? "default" : "secondary"}>
                    {supplier.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium">Product</th>
                        <th className="text-right p-2 font-medium">Unit Price</th>
                        <th className="text-right p-2 font-medium">Lead Time</th>
                        <th className="text-right p-2 font-medium">MOQ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplier.catalogProducts.map((cp: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">
                            {typeof cp.product === "object" ? `${cp.product.name} (${cp.product.sku})` : cp.product}
                          </td>
                          <td className="p-2 text-right">{formatCurrency(cp.unitPrice)}</td>
                          <td className="p-2 text-right">{cp.leadTimeDays} days</td>
                          <td className="p-2 text-right">{cp.moq} units</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
          {suppliers.filter((s: any) => s.catalogProducts?.length > 0).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No suppliers have catalog products yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
