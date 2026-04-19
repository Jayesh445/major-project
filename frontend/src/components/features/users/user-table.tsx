"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User } from "@/types/user.types"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Trash, CheckCircle, XCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils/format"
import { useDeleteUser, useUpdateUser } from "@/hooks/queries/use-users"

const roleColors: Record<string, string> = {
  admin: "bg-red-500 hover:bg-red-600",
  warehouse_manager: "bg-blue-500 hover:bg-blue-600",
  procurement_officer: "bg-purple-500 hover:bg-purple-600",
  supplier: "bg-green-500 hover:bg-green-600",
}

function ActionsCell({ user }: { user: User }) {
  const { mutate: deleteUser } = useDeleteUser()
  const { mutate: updateUser } = useUpdateUser()

  const toggleActive = () => {
    updateUser({ id: user._id, data: { isActive: !user.isActive } })
  }

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
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user._id)}>
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleActive}>
          {user.isActive ? (
            <><XCircle className="mr-2 h-4 w-4" /> Deactivate</>
          ) : (
            <><CheckCircle className="mr-2 h-4 w-4" /> Activate</>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onClick={() => {
            if (confirm(`Delete user "${user.name}"?`)) {
              deleteUser(user._id)
            }
          }}
        >
          <Trash className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
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
          {role?.replace(/_/g, " ")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean
      return isActive ? (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" /> Active
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" /> Inactive
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell user={row.original} />,
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
