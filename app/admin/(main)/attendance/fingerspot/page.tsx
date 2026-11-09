import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { FingerspotDashboard } from "@/modules/fingerspot/components/fingerspot-dashboard"
import { FingerspotService } from "@/modules/fingerspot/services/fingerspot-service"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Fingerspot Cloud | OKGO POS",
  description: "Uji coba dan integrasi mesin absensi Fingerspot Developer Cloud.",
}

export default async function FingerspotPage() {
  const machines = await FingerspotService.getActiveMachines()

  const defaultWebhookUrl = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/api/attendance/webhook`
    : "https://nyenyak.com/api/attendance/webhook"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fingerspot Cloud Integration"
        description="Monitor punch absensi realtime, uji coba webhook, dan sinkronisasi log serta user via developer.fingerspot.io"
        backHref="/admin/attendance/machines"
        backLabel="Kembali ke Master Mesin"
      />

      <FingerspotDashboard
        machines={machines}
        defaultWebhookUrl={defaultWebhookUrl}
      />
    </div>
  )
}

