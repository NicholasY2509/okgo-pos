import { KioskLoginForm } from "@/modules/auth/components/kiosk-login-form"
import { KioskExitModal } from "@/modules/auth/components/kiosk-exit-modal"
import { ChevronLeft } from "lucide-react"

export default async function KioskPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const resolvedParams = await params

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center p-4">
      <div className="fixed top-6 left-6 z-20 md:top-8 md:left-8">
        <KioskExitModal
          tenantSlug={resolvedParams.tenant}
          trigger={
            <button
              type="button"
              className="group flex items-center gap-2 rounded-full border border-border/50 bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:border-border hover:bg-card hover:text-foreground focus:outline-none"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Keluar Kiosk (ke POS)</span>
            </button>
          }
        />
      </div>

      <KioskLoginForm tenantSlug={resolvedParams.tenant} />
    </main>
  )
}
