import { ReactNode } from "react"
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
    <div className="relative min-h-screen w-full bg-background">
      <FullscreenSplash title="Mode Kiosk" tenantSlug={resolvedParams.tenant} />
      {children}
    </div>
  )
}
