"use client";

import { useBookingWizard } from "../hooks/use-booking-wizard";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { StepIdentity } from "./steps/step-identity";
import { StepServices } from "./steps/step-services";
import { StepTime } from "./steps/step-time";
import { StepSummary } from "./steps/step-summary";

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
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center animate-in fade-in duration-1000">
        <h2 className="text-3xl md:text-5xl font-display font-light tracking-tight text-foreground mb-6">
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
            Kembali Ke Utama
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex items-center gap-4 mb-6 border-b border-border/10">
        {step > 1 && (
          <Button type="button" variant="ghost" onClick={prevStep} size="icon-sm" className="rounded-none hover:bg-transparent hover:text-foreground transition-colors group">
            <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
          </Button>
        )}
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
          Langkah {step} dari 4
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
              <Button type="button" onClick={nextStep} className="rounded-none w-full h-12 bg-foreground text-background font-medium tracking-[0.2em] uppercase text-xs hover:bg-primary transition-colors flex items-center justify-center gap-3 group cursor-pointer">
                Lanjut <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button type="button" onClick={onSubmit} disabled={isSubmitting} className="rounded-none w-full h-12 bg-foreground text-background font-medium tracking-[0.2em] uppercase text-xs hover:bg-primary transition-colors flex items-center justify-center gap-3 group cursor-pointer">
                {isSubmitting ? "Memproses..." : "Konfirmasi Booking"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
