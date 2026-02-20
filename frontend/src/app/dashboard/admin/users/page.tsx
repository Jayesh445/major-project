"use client"

import { UserTable } from "@/components/features/users/user-table"
import { useUsers } from "@/hooks/queries/use-users"
import { PageHeader } from "@/components/business/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function UsersPage() {
  const { data, isLoading } = useUsers()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage system users and permissions"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        }
      />
      
      <UserTable data={data?.data || []} isLoading={isLoading} />
    </div>
  )
}
