import { BookingWizard } from "@/modules/booking/components/booking-wizard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Layanan | Okgo POS",
  description: "Buat jadwal layanan dengan cepat dan mudah.",
};

export default function BookingPage() {
  return (
    <div className="bg-background text-foreground font-sans min-h-screen selection:bg-primary/20">

      {/* NAVBAR MATCHING MARKETING PAGE */}
      <nav className="w-full z-50 bg-transparent py-6 border-b border-border/10">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <a href="/" className="text-2xl font-display font-light tracking-widest text-foreground">
            NYENYAK<span className="text-primary font-sans font-light text-sm tracking-normal">.spa</span>
          </a>
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
