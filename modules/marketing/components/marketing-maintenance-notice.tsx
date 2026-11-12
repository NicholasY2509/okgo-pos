import Link from "next/link";

export function MarketingMaintenanceNotice() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between bg-background text-foreground overflow-hidden px-4 py-8 md:py-12 selection:bg-primary/20">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div
          className="absolute top-[15%] left-[25%] w-[380px] h-[380px] bg-primary/20 dark:bg-primary/15 rounded-full blur-[140px] mix-blend-multiply dark:mix-blend-screen"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[20%] right-[25%] w-[360px] h-[360px] bg-primary/15 dark:bg-primary/10 rounded-full blur-[130px] mix-blend-multiply dark:mix-blend-screen"
          aria-hidden="true"
        />
      </div>

      {/* Frosted overlay */}
      <div className="absolute inset-0 backdrop-blur-[40px] pointer-events-none" aria-hidden="true" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-4xl flex justify-center py-4">
        <img
          src="/logo-long.webp"
          alt="Nyenyak Healing Point"
          className="h-14 md:h-16 w-auto object-contain"
        />
      </header>

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-xl my-auto text-center flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-light text-foreground tracking-tight mb-4">
          Sedang Dalam Pembaruan
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mb-8">
          Kami sedang melakukan peningkatan untuk menghadirkan pengalaman yang lebih baik bagi Anda. Terima kasih atas kesabaran dan pengertian Anda.
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-4xl text-center py-4 border-t border-border/40">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-muted-foreground font-light">
          <span>Nyenyak Healing Point • Medan</span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span>&copy; {new Date().getFullYear()} Seluruh hak cipta dilindungi</span>
        </div>
      </footer>
    </main>
  );
}
