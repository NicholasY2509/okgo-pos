import Image from "next/image"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StaffService } from "@/modules/staff/services/staff-service"
import { BranchService } from "@/modules/branch/services/branch-service"
import { getStaffDailySessionsAction } from "@/modules/service-session/actions/service-session-action"
import { SessionList } from "@/modules/service-session/components/session-list"
import { ActiveSessionView } from "@/modules/service-session/components/active-session-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HistoryList } from "@/modules/service-session/components/history-list"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { List, Lock } from "lucide-react"
import { KioskNotificationListener } from "@/modules/service-session/components/kiosk-notification-listener"
import { KioskExitModal } from "@/modules/auth/components/kiosk-exit-modal"

export default async function KioskDashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const resolvedParams = await params
  const cookieStore = await cookies()
  const staffId = cookieStore.get("staff_session")?.value

  if (!staffId) {
    redirect("/kiosk")
  }

  const staff = await StaffService.getStaffById(staffId)
  const branch = await BranchService.getBranchBySubdomain(resolvedParams.tenant)

  if (!staff) {
    redirect("/kiosk")
  }

  const sessionsResponse = await getStaffDailySessionsAction(staff.id)
  const sessions = sessionsResponse.success ? sessionsResponse.data || [] : []

  // Find if there is an in-progress session
  const inProgressSession = sessions.find(
    (s: { status: string }) => s.status === "IN_PROGRESS"
  )
  const scheduledSessions = sessions.filter(
    (s: { status: string }) => s.status === "SCHEDULED"
  )
  const completedSessions = sessions.filter(
    (s: { status: string }) => s.status === "COMPLETED"
  )

  return (
    <div className="flex h-screen w-full flex-col bg-muted/20 p-6">
      <KioskNotificationListener staffId={staff.id} />
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/logo-only.png"
            alt="Logo"
            width={32}
            height={32}
            className="h-8 w-auto object-contain"
          />
          <div className="h-8 w-px bg-border"></div>
          <div>
            <h1 className="text-xl font-light tracking-tight">
              {branch?.name || "Kiosk"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Terapis: {staff.firstName} {staff.lastName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">
                <List className="mr-2 h-4 w-4" />
                Antrean & Riwayat
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full w-full flex-col overflow-hidden sm:max-w-md"
            >
              <SheetHeader className="mb-4">
                <SheetTitle>Antrean & Riwayat</SheetTitle>
              </SheetHeader>
              <div className="px-4">
                <Tabs
                  defaultValue="queue"
                  className="flex flex-1 flex-col overflow-hidden"
                >
                  <TabsList className="mb-4 grid w-full grid-cols-2">
                    <TabsTrigger value="queue">
                      Antrean ({scheduledSessions.length})
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      Riwayat ({completedSessions.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="queue"
                    className="mt-0 flex-1 overflow-y-auto"
                  >
                    <SessionList
                      sessions={scheduledSessions}
                      tenantSlug={resolvedParams.tenant}
                    />
                  </TabsContent>

                  <TabsContent
                    value="history"
                    className="mt-0 flex-1 overflow-y-auto"
                  >
                    <HistoryList sessions={completedSessions} />
                  </TabsContent>
                </Tabs>
              </div>
            </SheetContent>
          </Sheet>

          <form
            action={async () => {
              "use server"
              const store = await cookies()
              store.delete("staff_session")
              redirect("/kiosk")
            }}
          >
            <Button variant="outline" type="submit">
              Log Out Terapis
            </Button>
          </form>

          <KioskExitModal
            tenantSlug={resolvedParams.tenant}
            trigger={
              <Button variant="outline" className="gap-2">
                <Lock className="h-4 w-4" />
                Keluar Kiosk (ke POS)
              </Button>
            }
          />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex h-full flex-col overflow-y-auto rounded-2xl border bg-background shadow-sm">
          {inProgressSession ? (
            <ActiveSessionView
              session={inProgressSession}
              tenantSlug={resolvedParams.tenant}
            />
          ) : scheduledSessions.length > 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-8 p-6">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-light">Layanan Menunggu</h2>
                <p className="text-muted-foreground">
                  Silakan mulai layanan untuk pelanggan Anda.
                </p>
              </div>
              <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card p-4 shadow-sm">
                <SessionList
                  sessions={scheduledSessions}
                  tenantSlug={resolvedParams.tenant}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-muted-foreground">
              <p className="text-xl">Tidak ada layanan yang sedang berjalan.</p>
              <p className="text-sm">
                Anda belum memiliki antrean layanan saat ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
