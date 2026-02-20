import { format } from "date-fns"

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return "-"
  return format(new Date(date), "PPP")
}

export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return "-"
  return format(new Date(date), "PPP p")
}
