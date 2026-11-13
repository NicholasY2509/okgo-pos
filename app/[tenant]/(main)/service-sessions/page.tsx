import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getServiceSessionsAction } from "@/modules/service-session/actions/service-session-action"
import { ServiceSessionList } from "@/modules/service-session/components/service-session-list"
import type { ServiceSessionStatus } from "@/modules/service-session/schemas/service-session-query-schema"

export const dynamic = "force-dynamic"

export default async function TenantServiceSessionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tenant } = await params
  const resolvedSearchParams = await searchParams

  const branch = await prisma.branch.findUnique({
    where: { subdomain: tenant },
  })

  if (!branch) {
    notFound()
  }

  const search =
    typeof resolvedSearchParams.search === "string"
      ? resolvedSearchParams.search
      : undefined
  const status =
    typeof resolvedSearchParams.status === "string"
      ? (resolvedSearchParams.status as ServiceSessionStatus)
      : undefined
  const date =
    typeof resolvedSearchParams.date === "string"
      ? resolvedSearchParams.date
      : undefined
  const roomId =
    typeof resolvedSearchParams.roomId === "string"
      ? resolvedSearchParams.roomId
      : undefined
  const staffId =
    typeof resolvedSearchParams.staffId === "string"
      ? resolvedSearchParams.staffId
      : undefined

  const res = await getServiceSessionsAction(tenant, {
    search,
    status,
    date,
    roomId,
    staffId,
    page: 1,
    limit: 10,
  })

  return (
    <div className="max-w-7xl mx-auto w-full">
      <ServiceSessionList
        tenantSlug={tenant}
        initialData={res.success && res.data ? res.data : undefined}
      />
    </div>
  )
}
