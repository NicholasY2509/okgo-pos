import { BookingWizard } from "@/modules/booking/components/booking-wizard";
import { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Layanan | Okgo POS",
  description: "Buat jadwal layanan dengan cepat dan mudah.",
};

export default function BookingPage() {
  return (
    <div className="bg-background text-foreground font-sans min-h-screen selection:bg-primary/20">

      {/* NAVBAR MATCHING MARKETING PAGE */}
      <nav className="w-full z-50 bg-transparent py-6 border-b border-border/10">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-12">
          <div className="w-[100px] sm:w-[150px] flex items-center">
            <Link href="/" className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </div>
          <div className="flex-1 flex justify-center">
            <Link href="/" className="flex items-center">
              <img src="/logo-long.webp" alt="Nyenyak Spa" className="h-10 md:h-12 object-contain" />
            </Link>
          </div>
          <div className="w-[100px] sm:w-[150px]" /> {/* Spacer to keep logo dead center */}
        </div>
      </nav>

      <div className="pb-12 pt-6 px-6">
        <div className="max-w-3xl mx-auto">
          {/* <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-light text-foreground mb-4 tracking-tight">
              Booking Jadwal
            </h1>
            <p className="text-muted-foreground font-light text-lg">
              Amankan jadwal relaksasi Anda tanpa ribet antri.
            </p>
          </div> */}

          <div className="w-full pb-32">
            <BookingWizard />
          </div>
        </div>
      </div>
    </div>
  );
}
