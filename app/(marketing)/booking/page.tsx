import { BookingWizard } from "@/modules/booking/components/booking-wizard";
import { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Layanan",
  description:
    "Reservasi jadwal pijat dan spa di Nyenyak Healing Point Medan secara online. Pilih cabang terdekat, layanan favorit, serta waktu kunjungan Anda dengan mudah.",
  alternates: {
    canonical: "/booking",
  },
  openGraph: {
    title: "Booking Layanan | Nyenyak Healing Point",
    description:
      "Reservasi jadwal pijat dan spa di Nyenyak Healing Point Medan secara online. Pilih cabang terdekat, layanan favorit, serta waktu kunjungan Anda dengan mudah.",
    url: "/booking",
  },
};

export default function BookingPage() {
  return (
    <div className="bg-background text-foreground font-sans min-h-screen selection:bg-primary/20">
      <BookingWizard />
    </div>
  );
}
