"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User } from "@/types/user.types"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/business/status-badge"
import { formatDate } from "@/lib/utils/format"
import { useDeleteUser } from "@/hooks/queries/use-users"
import { Badge } from "@/components/ui/badge"

const roleColors: Record<string, string> = {
  admin: "bg-red-500",
  warehouse_manager: "bg-blue-500",
  procurement_officer: "bg-purple-500",
  supplier: "bg-green-500",
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge className={roleColors[role] || "bg-gray-500"}>
          {role.replace("_", " ")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean
      return <StatusBadge status={isActive ? "active" : "inactive"} />
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original
      const { mutate: deleteUser } = useDeleteUser()

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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user._id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => deleteUser(user._id)}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface UserTableProps {
  data: User[]
  isLoading?: boolean
}

export function UserTable({ data, isLoading }: UserTableProps) {
  return (
    <DataTable 
      columns={columns} 
      data={data} 
      isLoading={isLoading}
      searchKey="email"
      searchPlaceholder="Filter users..."
    />
  )
}
