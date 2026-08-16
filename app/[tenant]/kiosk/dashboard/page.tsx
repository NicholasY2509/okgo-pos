import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StaffService } from "@/modules/staff/services/staff-service"
import { getStaffDailySessionsAction } from "@/modules/service-session/actions/service-session-action"
import { SessionList } from "@/modules/service-session/components/session-list"
import { ActiveSessionView } from "@/modules/service-session/components/active-session-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HistoryList } from "@/modules/service-session/components/history-list"

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
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kiosk Dashboard</h1>
          <p className="text-muted-foreground">Terapis: {staff.firstName} {staff.lastName}</p>
        </div>
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
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Main Content Area */}
        <div className="lg:col-span-2 h-full flex flex-col bg-background rounded-xl shadow-sm border p-6 overflow-y-auto">
          {inProgressSession ? (
            <ActiveSessionView session={inProgressSession} tenantSlug={resolvedParams.tenant} />
          ) : (
            <div className="flex flex-col h-full items-center justify-center text-muted-foreground space-y-4">
              <p className="text-xl">Tidak ada layanan yang sedang berjalan.</p>
              <p className="text-sm">Pilih layanan dari antrean untuk memulai.</p>
            </div>
          )}
        </div>

        {/* Sidebar Queue & History */}
        <div className="h-full flex flex-col bg-background rounded-xl shadow-sm border p-4 overflow-hidden">
          <Tabs defaultValue="queue" className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="queue">Antrean ({scheduledSessions.length})</TabsTrigger>
              <TabsTrigger value="history">Riwayat ({completedSessions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="flex-1 overflow-hidden mt-0">
              <SessionList sessions={scheduledSessions} tenantSlug={resolvedParams.tenant} />
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden mt-0">
              <HistoryList sessions={completedSessions} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
