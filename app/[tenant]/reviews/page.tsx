import { getDailyReviewableSessionsAction } from "@/modules/service-session/actions/service-session-action"
import { ReviewList } from "@/modules/service-session/components/review-list"
import { ExitReviewsModal } from "@/modules/service-session/components/exit-reviews-modal"
import { FullscreenSplash } from "@/components/fullscreen-splash"

export default async function CustomerReviewPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const resolvedParams = await params

  // Fetch sessions for the branch that need reviews
  const sessionsResponse = await getDailyReviewableSessionsAction(
    resolvedParams.tenant
  )
  const sessions = sessionsResponse.success ? sessionsResponse.data || [] : []

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background p-6 md:p-12">
      <FullscreenSplash
        title="Buku Ulasan"
        tenantSlug={resolvedParams.tenant}
      />
      <div className="absolute top-6 left-6 md:top-12 md:left-12">
        <ExitReviewsModal tenantSlug={resolvedParams.tenant} />
      </div>

      <div className="mt-8 w-full max-w-4xl md:mt-0">
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-display text-5xl font-light tracking-tight text-foreground">
            Bagaimana Layanan Kami?
          </h1>
          <p className="text-base font-light text-muted-foreground">
            Pilih sesi Anda di bawah ini dan berikan penilaian untuk terapis
            kami.
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-[2rem] border border-border/50 bg-background p-16 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/10 bg-primary/5 text-primary">
              <span className="text-3xl opacity-90">✨</span>
            </div>
            <h3 className="mb-3 font-display text-3xl font-light text-foreground">
              Semua Selesai!
            </h3>
            <p className="text-lg font-light text-muted-foreground">
              Saat ini tidak ada layanan yang menunggu ulasan.
            </p>
          </div>
        ) : (
          <ReviewList sessions={sessions} tenantSlug={resolvedParams.tenant} />
        )}
      </div>
    </div>
  )
}
