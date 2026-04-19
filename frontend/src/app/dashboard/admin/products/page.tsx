"use client"

import { useMemo, useState } from "react"
import { ProductTable } from "@/components/features/products/product-table"
import { useProducts } from "@/hooks/queries/use-products"
import { useSuppliers } from "@/hooks/queries/use-suppliers"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Filter } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  { value: "writing_instruments", label: "Writing Instruments" },
  { value: "paper_products", label: "Paper Products" },
  { value: "office_supplies", label: "Office Supplies" },
  { value: "art_supplies", label: "Art Supplies" },
  { value: "filing_storage", label: "Filing & Storage" },
  { value: "desk_accessories", label: "Desk Accessories" },
  { value: "other", label: "Other" },
]

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest first" },
  { value: "createdAt-asc", label: "Oldest first" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "unitPrice-asc", label: "Price (low to high)" },
  { value: "unitPrice-desc", label: "Price (high to low)" },
  { value: "sku-asc", label: "SKU (A-Z)" },
  { value: "sku-desc", label: "SKU (Z-A)" },
]

export default function ProductsPage() {
  const [category, setCategory] = useState<string>("all")
  const [isActive, setIsActive] = useState<string>("all")
  const [primarySupplier, setPrimarySupplier] = useState<string>("all")
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [sort, setSort] = useState<string>("createdAt-desc")
  const [search, setSearch] = useState<string>("")

  const { data: suppliersData } = useSuppliers()
  const suppliers = suppliersData?.data || []

  const queryParams = useMemo(() => {
    const [sortBy, sortOrder] = sort.split("-")
    const params: any = { sortBy, sortOrder }
    if (category !== "all") params.category = category
    if (isActive !== "all") params.isActive = isActive
    if (primarySupplier !== "all") params.primarySupplier = primarySupplier
    if (minPrice) params.minPrice = minPrice
    if (maxPrice) params.maxPrice = maxPrice
    return params
  }, [category, isActive, primarySupplier, minPrice, maxPrice, sort])

  const { data, isLoading } = useProducts(queryParams)

  // Client-side search across fetched page (backend doesn't support `q`)
  const rawProducts = data?.data || []
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return rawProducts
    const q = search.toLowerCase()
    return rawProducts.filter(
      (p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    )
  }, [rawProducts, search])

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (isActive !== "all" ? 1 : 0) +
    (primarySupplier !== "all" ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (search ? 1 : 0)

  const clearFilters = () => {
    setCategory("all")
    setIsActive("all")
    setPrimarySupplier("all")
    setMinPrice("")
    setMaxPrice("")
    setSearch("")
    setSort("createdAt-desc")
  }

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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Filters</h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount} active
              </Badge>
            )}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs h-7">
                <X className="mr-1 h-3 w-3" /> Clear all
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label htmlFor="search" className="text-xs">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, SKU, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={isActive} onValueChange={setIsActive}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Supplier */}
            <div>
              <Label className="text-xs">Primary Supplier</Label>
              <Select value={primarySupplier} onValueChange={setPrimarySupplier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All suppliers</SelectItem>
                  {suppliers.map((s: any) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price range */}
            <div>
              <Label htmlFor="minPrice" className="text-xs">Min Price (₹)</Label>
              <Input
                id="minPrice"
                type="number"
                min="0"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maxPrice" className="text-xs">Max Price (₹)</Label>
              <Input
                id="maxPrice"
                type="number"
                min="0"
                placeholder="10000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            {/* Sort */}
            <div>
              <Label className="text-xs">Sort by</Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isLoading ? "Loading..." : `${filteredProducts.length} products`}
          {data?.pagination && ` (${data.pagination.total} total)`}
        </span>
      </div>

      <ProductTable data={filteredProducts} isLoading={isLoading} />
    </div>
  )
}
