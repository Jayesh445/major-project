"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/queries/use-suppliers"
import { useRouter } from "next/navigation"
import { Supplier } from "@/types/supplier.types"
import { Loader2 } from "lucide-react"

const supplierFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(200),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(5, "Phone number is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  rating: z.coerce.number().min(0).max(5).default(0),
  isApproved: z.boolean().default(false),
})

type SupplierFormValues = z.infer<typeof supplierFormSchema>

interface SupplierFormProps {
  initialData?: Supplier
}

export function SupplierForm({ initialData }: SupplierFormProps) {
  const router = useRouter()
  const isEditing = !!initialData
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      contactEmail: initialData?.contactEmail || "",
      contactPhone: initialData?.contactPhone || "",
      address: initialData?.address || "",
      rating: initialData?.rating ?? 0,
      isApproved: initialData?.isApproved ?? false,
    },
  })

  const isPending = createSupplier.isPending || updateSupplier.isPending

  const onSubmit = (data: SupplierFormValues) => {
    if (isEditing && initialData) {
      updateSupplier.mutate(
        { id: initialData._id, data },
        { onSuccess: () => router.push("/dashboard/admin/suppliers") }
      )
    } else {
      createSupplier.mutate(data, {
        onSuccess: () => router.push("/dashboard/admin/suppliers"),
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Supplies Pvt. Ltd." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@supplier.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+91-9876543210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating (0-5)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={5} step={0.1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Full business address..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isApproved"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 rounded-lg border p-4">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div>
                <FormLabel className="mb-0">Approved</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Approved suppliers can participate in procurement and negotiations
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Supplier" : "Create Supplier"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
