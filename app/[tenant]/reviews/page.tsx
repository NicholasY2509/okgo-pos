import { getDailyReviewableSessionsAction } from "@/modules/service-session/actions/service-session-action"
import { ReviewList } from "@/modules/service-session/components/review-list"
import { ExitReviewsModal } from "@/modules/service-session/components/exit-reviews-modal"
import { headers } from "next/headers"

export default async function CustomerReviewPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const resolvedParams = await params

  // Fetch sessions for the branch that need reviews
  const sessionsResponse = await getDailyReviewableSessionsAction(resolvedParams.tenant)
  const sessions = sessionsResponse.success ? sessionsResponse.data || [] : []

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 md:p-12 relative">
      <div className="absolute top-6 left-6 md:top-12 md:left-12">
        <ExitReviewsModal tenantSlug={resolvedParams.tenant} />
      </div>

      <div className="max-w-4xl w-full mt-8 md:mt-0">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-display font-light text-foreground tracking-tight mb-3">Bagaimana Layanan Kami?</h1>
          <p className="text-base text-muted-foreground font-light">Pilih sesi Anda di bawah ini dan berikan penilaian untuk terapis kami.</p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-background rounded-[2rem] shadow-sm border border-border/50 p-16 text-center">
            <div className="w-20 h-20 bg-primary/5 border border-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
              <span className="text-3xl opacity-90">✨</span>
            </div>
            <h3 className="text-3xl font-display font-light text-foreground mb-3">Semua Selesai!</h3>
            <p className="text-muted-foreground font-light text-lg">Saat ini tidak ada layanan yang menunggu ulasan.</p>
          </div>
        ) : (
          <ReviewList sessions={sessions} tenantSlug={resolvedParams.tenant} />
        )}
      </div>
    </div>
  )
}
