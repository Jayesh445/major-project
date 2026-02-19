import { Badge } from "@/components/ui/badge"

export type Status = 
  | "active" 
  | "inactive" 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "low" 
  | "out"

interface StatusBadgeProps {
  status: Status
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-500 hover:bg-green-600" },
  inactive: { label: "Inactive", className: "bg-gray-500 hover:bg-gray-600" },
  pending: { label: "Pending", className: "bg-yellow-500 hover:bg-yellow-600" },
  approved: { label: "Approved", className: "bg-blue-500 hover:bg-blue-600" },
  rejected: { label: "Rejected", className: "bg-red-500 hover:bg-red-600" },
  low: { label: "Low Stock", className: "bg-orange-500 hover:bg-orange-600" },
  out: { label: "Out of Stock", className: "bg-red-500 hover:bg-red-600" },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  )
}
