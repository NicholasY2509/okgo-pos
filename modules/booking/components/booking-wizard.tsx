"use client";

import { useBookingWizard } from "../hooks/use-booking-wizard";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { StepIdentity } from "./steps/step-identity";
import { StepServices } from "./steps/step-services";
import { StepTime } from "./steps/step-time";
import { StepSummary } from "./steps/step-summary";
import Link from "next/link";

export function BookingWizard() {
  const {
    form,
    onSubmit,
    isSubmitting,
    error,
    step,
    nextStep,
    prevStep,
    isSuccess,
    branches,
    services,
    staffList,
    dailySchedule,
    loading,
    loadingBranches,
    canProceed,
    brandSetting
  } = useBookingWizard();

  if (isSuccess) {
    return (
      <div className="w-full min-h-screen flex flex-col">
        {/* Minimal Navbar for Success Page */}
        <nav className="w-full z-50 bg-transparent py-6 border-b border-border/10">
          <div className="max-w-7xl mx-auto px-8 flex items-center justify-center h-12">
            <img src="/logo-long.webp" alt="Nyenyak Spa" className="h-10 md:h-12 object-contain" />
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center py-8 px-6 text-center animate-in fade-in duration-1000">
          <h2 className="text-3xl md:text-5xl font-light uppercase tracking-tight text-foreground mb-6">
            Booking Berhasil
          </h2>
          <p className="text-muted-foreground font-light max-w-sm text-sm leading-relaxed mb-12">
            Terima kasih, {(form.watch as any)("customerName")}. Jadwal Anda telah diamankan. Silakan datang tepat waktu dan selesaikan pembayaran di kasir.
          </p>
          <div className="flex flex-col items-center gap-4 w-full">
            <Button
              variant="outline"
              className="min-w-[240px] text-foreground font-light tracking-[0.2em] uppercase text-xs h-12 rounded-none border-foreground/30 hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-500"
              onClick={() => window.location.href = "/"}
            >
              Kembali Ke Halaman Utama
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* NAVBAR */}
      <nav className="w-full z-50 bg-transparent py-6 border-b border-border/10 mb-2">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-12">
          <div className="w-[100px] sm:w-[150px] flex items-center">
            {step > 1 ? (
              <button onClick={prevStep} type="button" className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Kembali</span>
              </button>
            ) : (
              <Link href="/" className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Kembali</span>
              </Link>
            )}
          </div>
          <div className="flex-1 flex justify-center">
            <Link href="/" className="flex items-center">
              <img src="/logo-long.webp" alt="Nyenyak Spa" className="h-10 md:h-12 object-contain" />
            </Link>
          </div>
          <div className="w-[100px] sm:w-[150px]" /> {/* Spacer to keep logo dead center */}
        </div>
      </nav>

      <div className="pb-12 pt-2 px-6">
        <div className="max-w-3xl mx-auto pb-32">
          <div className="mb-6 relative">
            <div className="flex flex-col items-center w-full">
              <div className="w-full">
                {/* Minimalist Goal Gradient Progress Bar */}
                <div className="h-[2px] w-full bg-border/30 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-foreground transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${(step / 4) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 px-1">
                  <span className={step >= 1 ? "text-foreground font-medium transition-colors" : ""}>Lokasi</span>
                  <span className={step >= 2 ? "text-foreground font-medium transition-colors" : ""}>Waktu</span>
                  <span className={step >= 3 ? "text-foreground font-medium transition-colors" : ""}>Layanan</span>
                  <span className={step >= 4 ? "text-foreground font-medium transition-colors" : ""}>Selesai</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-12">
            {/* STEP 1: Branch & Identity */}
            {step === 1 && <StepIdentity form={form} branches={branches} loadingBranches={loadingBranches} />}

            {/* STEP 2: Date & Time */}
            {step === 2 && <StepTime form={form} dailySchedule={dailySchedule} brandSetting={brandSetting} loading={loading} services={services} staffList={staffList} />}

            {/* STEP 3: Services & Staff */}
            {step === 3 && <StepServices form={form} services={services} staffList={staffList} dailySchedule={dailySchedule} loading={loading} />}

            {/* STEP 4: Summary */}
            {step === 4 && <StepSummary form={form} services={services} staffList={staffList} branches={branches} />}

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
          </form>

          {/* Navigation - Fixed at bottom of page */}
          <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none bg-linear-to-t from-background via-background/80 to-transparent pt-12 pb-6 px-6">
            <div className="w-full max-w-3xl relative h-12">
              <div className={`w-full transition-all duration-500 ease-out absolute inset-0 ${canProceed ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
                {step < 4 ? (
                  <Button type="button" onClick={nextStep} className="rounded-none w-full h-12 bg-foreground text-background font-medium tracking-[0.2em] uppercase text-xs hover:bg-background hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-3 group cursor-pointer">
                    Lanjut <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <Button type="button" onClick={onSubmit} disabled={isSubmitting} className="rounded-none w-full h-12 bg-foreground text-background font-medium tracking-[0.2em] uppercase text-xs hover:bg-background hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-3 group cursor-pointer">
                    {isSubmitting ? "Memproses..." : "Konfirmasi Booking"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
