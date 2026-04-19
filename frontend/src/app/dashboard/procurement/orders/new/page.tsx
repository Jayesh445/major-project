"use client"

import { useState, useMemo } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/business/page-header"
import { Plus, X, Loader2 } from "lucide-react"
import { useCreatePO } from "@/hooks/queries/use-purchase-orders"
import { useProducts } from "@/hooks/queries/use-products"
import { useWarehouses } from "@/hooks/queries/use-warehouses"
import { useSuppliers } from "@/hooks/queries/use-suppliers"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

const createPOSchema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  warehouse: z.string().min(1, "Warehouse is required"),
  lineItems: z.array(
    z.object({
      product: z.string().min(1, "Product is required"),
      sku: z.string().min(1, "SKU is required"),
      orderedQty: z.coerce.number().min(1, "Quantity must be at least 1"),
      unitPrice: z.coerce.number().min(0, "Price must be non-negative"),
    })
  ).min(1, "At least one line item is required"),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
})

type CreatePOFormValues = z.infer<typeof createPOSchema>

export default function CreatePurchaseOrderPage() {
  const router = useRouter()
  const createPO = useCreatePO()
  const { data: products } = useProducts()
  const { data: warehouses } = useWarehouses()
  const { data: suppliers } = useSuppliers()

  const form = useForm<CreatePOFormValues>({
    resolver: zodResolver(createPOSchema),
    defaultValues: {
      supplier: "",
      warehouse: "",
      lineItems: [{ product: "", sku: "", orderedQty: 1, unitPrice: 0 }],
      expectedDeliveryDate: "",
      notes: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  })

  const productsList = (products as any)?.data || []
  const warehousesList = (warehouses as any)?.data || []
  const suppliersList = (suppliers as any)?.data || []

  const selectedProduct = (productId: string) => {
    if (!productsList || productsList.length === 0) return null
    return productsList.find((p: any) => p._id === productId)
  }

  const onSubmit = async (values: CreatePOFormValues) => {
    // Calculate totalPrice for each line item with proper number coercion
    const lineItemsWithTotals = values.lineItems.map(item => ({
      ...item,
      orderedQty: Number(item.orderedQty),
      unitPrice: Number(item.unitPrice),
      totalPrice: Math.round((Number(item.orderedQty) * Number(item.unitPrice)) * 100) / 100,
    }))

    // Format expectedDeliveryDate to ISO datetime if provided
    const formattedValues = {
      ...values,
      lineItems: lineItemsWithTotals,
      expectedDeliveryDate: values.expectedDeliveryDate 
        ? new Date(values.expectedDeliveryDate).toISOString()
        : undefined,
      currency: 'INR',
      triggeredBy: 'manual' as const,
    }

    console.log('Submitting PO with values:', formattedValues)
    createPO.mutate(formattedValues as any, {
      onSuccess: (data) => {
        console.log('PO created successfully:', data)
        router.push(`/dashboard/procurement/orders/${data._id}`)
      },
      onError: (error: any) => {
        console.error('PO creation error:', error)
      },
    })
  }

  const lineItems = useWatch({
    control: form.control,
    name: "lineItems",
  })

  const totalAmount = useMemo(() => {
    if (!lineItems || lineItems.length === 0) return 0
    return lineItems.reduce((sum, item) => {
      const qty = Number(item.orderedQty) || 0
      const price = Number(item.unitPrice) || 0
      return sum + (qty * price)
    }, 0)
  }, [lineItems])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Purchase Order"
        description="Create a new purchase order for procurement"
        backLink="/dashboard/procurement/orders"
      />

      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error('Form validation errors:', errors)
          })} 
          className="space-y-6"
        >
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Supplier */}
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliersList.map((supplier: any) => (
                            <SelectItem key={supplier._id} value={supplier._id}>
                              {supplier.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Warehouse */}
                <FormField
                  control={form.control}
                  name="warehouse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warehouse *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehousesList.map((warehouse: any) => (
                            <SelectItem key={warehouse._id} value={warehouse._id}>
                              {warehouse.name} ({warehouse.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expected Delivery Date */}
                <FormField
                  control={form.control}
                  name="expectedDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Delivery Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes or special instructions..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ product: "", sku: "", orderedQty: 1, unitPrice: 0 })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const product = selectedProduct(form.watch(`lineItems.${index}.product`))
                  return (
                    <div key={field.id} className="p-4 border rounded-lg space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        {/* Product */}
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.product`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product *</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value)
                                  const prod = productsList.find((p: any) => p._id === value)
                                  if (prod) {
                                    form.setValue(`lineItems.${index}.sku`, prod.sku)
                                  }
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {productsList.map((product: any) => (
                                    <SelectItem key={product._id} value={product._id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* SKU (auto-filled) */}
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.sku`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input {...field} disabled className="bg-muted" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {/* Quantity */}
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.orderedQty`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity *</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Unit Price */}
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price (₹) *</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Total */}
                        <FormItem>
                          <FormLabel>Total</FormLabel>
                          <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                            <span className="text-sm font-medium">
                              ₹{((Number(form.watch(`lineItems.${index}.orderedQty`)) || 0) * (Number(form.watch(`lineItems.${index}.unitPrice`)) || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </FormItem>
                      </div>

                      {/* Remove button */}
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4 mr-1" /> Remove Item
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-3xl font-bold">
                  ₹{totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createPO.isPending}>
              {createPO.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Purchase Order
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
