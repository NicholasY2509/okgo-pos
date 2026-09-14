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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { List } from "lucide-react"
import { KioskNotificationListener } from "@/modules/service-session/components/kiosk-notification-listener"

export default async function KioskDashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const resolvedParams = await params
  const cookieStore = await cookies()
  const staffId = cookieStore.get("staff_session")?.value

  if (!staffId) {
    redirect(`/${resolvedParams.tenant}/kiosk`)
  }

  const staff = await StaffService.getStaffById(staffId)
  const branch = await BranchService.getBranchBySubdomain(resolvedParams.tenant)

  if (!staff) {
    redirect(`/${resolvedParams.tenant}/kiosk`)
  }

  const sessionsResponse = await getStaffDailySessionsAction(staff.id)
  const sessions = sessionsResponse.success ? sessionsResponse.data || [] : []

  // Find if there is an in-progress session
  const inProgressSession = sessions.find((s: any) => s.status === "IN_PROGRESS")
  const scheduledSessions = sessions.filter((s: any) => s.status === "SCHEDULED")
  const completedSessions = sessions.filter((s: any) => s.status === "COMPLETED")

  return (
    <div className="w-full h-screen p-6 bg-muted/20 flex flex-col">
      <KioskNotificationListener staffId={staff.id} />
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <img src="/logo-only.png" alt="Logo" className="h-8 object-contain" />
          <div className="h-8 w-px bg-border"></div>
          <div>
            <h1 className="text-xl font-light tracking-tight">{branch?.name || "Kiosk"}</h1>
            <p className="text-sm text-muted-foreground">Terapis: {staff.firstName} {staff.lastName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">
                <List className="w-4 h-4 mr-2" />
                Antrean & Riwayat
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full overflow-hidden">
              <SheetHeader className="mb-4">
                <SheetTitle>Antrean & Riwayat</SheetTitle>
              </SheetHeader>
              <div className="px-4">
                <Tabs defaultValue="queue" className="flex flex-col flex-1 overflow-hidden">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="queue">Antrean ({scheduledSessions.length})</TabsTrigger>
                    <TabsTrigger value="history">Riwayat ({completedSessions.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="queue" className="flex-1 overflow-y-auto mt-0">
                    <SessionList sessions={scheduledSessions} tenantSlug={resolvedParams.tenant} />
                  </TabsContent>

                  <TabsContent value="history" className="flex-1 overflow-y-auto mt-0">
                    <HistoryList sessions={completedSessions} />
                  </TabsContent>
                </Tabs>
              </div>
            </SheetContent>
          </Sheet>

          <form action={async () => {
            "use server"
            const store = await cookies()
            store.delete("staff_session")
            redirect(`/${resolvedParams.tenant}/kiosk`)
          }}>
            <Button variant="outline" type="submit">
              Log Out Kiosk
            </Button>
          </form>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="h-full flex flex-col bg-background rounded-2xl shadow-sm border overflow-y-auto">
          {inProgressSession ? (
            <ActiveSessionView session={inProgressSession} tenantSlug={resolvedParams.tenant} />
          ) : scheduledSessions.length > 0 ? (
            <div className="flex flex-col h-full items-center justify-center space-y-8 p-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-light">Layanan Menunggu</h2>
                <p className="text-muted-foreground">Silakan mulai layanan untuk pelanggan Anda.</p>
              </div>
              <div className="w-full max-w-lg bg-card border rounded-2xl shadow-sm overflow-hidden p-4">
                <SessionList sessions={scheduledSessions} tenantSlug={resolvedParams.tenant} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full items-center justify-center text-muted-foreground space-y-4 p-6">
              <p className="text-xl">Tidak ada layanan yang sedang berjalan.</p>
              <p className="text-sm">Anda belum memiliki antrean layanan saat ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
