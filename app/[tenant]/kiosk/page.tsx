import { KioskLoginForm } from "@/modules/auth/components/kiosk-login-form"

export default async function KioskPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const resolvedParams = await params

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <KioskLoginForm tenantSlug={resolvedParams.tenant} />
    </div>
  )
}
