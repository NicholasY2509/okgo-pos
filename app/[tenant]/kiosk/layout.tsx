import { ReactNode } from "react"
import { KioskExitModal } from "@/modules/auth/components/kiosk-exit-modal"
import { FullscreenSplash } from "@/components/fullscreen-splash"

export default async function KioskLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ tenant: string }>
}) {
  const resolvedParams = await params

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background">
      <FullscreenSplash title="Mode Kiosk" tenantSlug={resolvedParams.tenant} />
      {children}

      <KioskExitModal tenantSlug={resolvedParams.tenant} />
    </div>
  )
}
