import { UserService } from "@/modules/user/services/user-service"
import { UserDialog } from "@/modules/user/components/user-dialog"
import { UserTable } from "@/modules/user/components/user-table"

import { PageHeader } from "@/components/page-header"

export default async function UsersPage() {
  const users = await UserService.getAllUsers()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage all users across the system."
      >
        <UserDialog />
      </PageHeader>

      <UserTable data={users as any} />
    </div>
  )
}
