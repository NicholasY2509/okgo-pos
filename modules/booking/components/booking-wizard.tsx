"use client";

import { useBookingWizard } from "../hooks/use-booking-wizard";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { StepIdentity } from "./steps/step-identity";
import { StepCart } from "./steps/step-cart";
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
    availableSlots,
    loading,
    loadingBranches,
    canProceed
  } = useBookingWizard();

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center space-y-6 bg-background rounded-[2rem] shadow-sm border border-border/50 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-4xl font-display font-light tracking-tight">Booking Berhasil!</h2>
        <p className="text-muted-foreground font-light max-w-md text-lg">
          Terima kasih {(form.watch as any)("customerName")}, jadwal Anda telah berhasil dipesan. Silakan datang ke cabang tepat waktu dan lakukan pembayaran di kasir.
        </p>
        <Button
          className="mt-8 bg-foreground text-background font-medium tracking-wide py-6 px-10 rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer hover:bg-primary hover:text-primary-foreground"
          onClick={() => window.location.reload()}
        >
          Buat Booking Baru
        </Button>
        <Button
          className="bg-transparent border-border/50 text-foreground font-medium tracking-wide py-6 px-10 rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer hover:bg-primary hover:text-primary-foreground"
          onClick={() => window.location.href = "/"}
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          Kembali ke Layar Utama
        </Button>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex items-center gap-4 mb-8">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={prevStep} className="rounded-full w-10 h-10 p-0 shrink-0 border-border/50 hover:bg-muted/30 z-10 bg-background shadow-sm cursor-pointer">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
        )}
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Langkah {step} dari 4
        </div>
      </div>

      {/* Progress Bar (Manual outside standard div)
      <div className="h-1 w-full bg-muted/30 flex mb-8 rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${(step / 4) * 100}%` }} />
      </div> */}

      <form onSubmit={onSubmit} className="space-y-12">
        {/* STEP 1: Branch & Identity */}
        {step === 1 && <StepIdentity form={form} branches={branches} loadingBranches={loadingBranches} />}

        {/* STEP 2: Cart (Services & Staff) */}
        {step === 2 && <StepCart form={form} services={services} staffList={staffList} loading={loading} />}

        {/* STEP 3: Date & Time */}
        {step === 3 && <StepTime form={form} availableSlots={availableSlots} loading={loading} />}

        {/* STEP 4: Summary */}
        {step === 4 && <StepSummary form={form} services={services} staffList={staffList} branches={branches} />}

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
      </form>

      {/* Navigation - Fixed at bottom of page */}
      <div className="fixed bottom-6 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-3xl relative h-14">
          <div className={`w-full transition-all duration-500 ease-out absolute inset-0 ${canProceed ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
            {step < 4 ? (
              <Button type="button" onClick={nextStep} className="rounded-full w-full h-14 bg-foreground text-background font-medium tracking-wide text-base hover:bg-primary transition-colors flex items-center justify-center gap-2 group cursor-pointer shadow-xl">
                Lanjut <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button type="button" onClick={onSubmit} disabled={isSubmitting} className="rounded-full w-full h-14 bg-foreground text-background font-medium tracking-wide text-base hover:bg-primary transition-colors flex items-center justify-center gap-2 group cursor-pointer shadow-xl">
                {isSubmitting ? "Memproses..." : "Konfirmasi Booking"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
