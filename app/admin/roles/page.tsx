import { Metadata } from "next"
import { RoleService } from "@/modules/role/services/role-service"
import { RoleTable } from "@/modules/role/components/role-table"
import { RoleDialog } from "@/modules/role/components/role-dialog"
import { PageHeader } from "@/components/page-header"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
    title: "Manajemen Role | OKGO POS",
    description: "Kelola role dan akses di sistem.",
}

export default async function RolesPage() {
    const roles = await RoleService.getAllRoles()

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Manajemen Role"
                description="Kelola role dan akses di sistem."
            >
                <RoleDialog />
            </PageHeader>

            <div className="w-full">
                <RoleTable data={roles} />
            </div>
        </div>
    )
}