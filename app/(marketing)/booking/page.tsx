import { BookingWizard } from "@/modules/booking/components/booking-wizard";
import { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Layanan",
  description: "Buat jadwal layanan dengan cepat dan mudah.",
};

export default function BookingPage() {
  return (
    <div className="bg-background text-foreground font-sans min-h-screen selection:bg-primary/20">
      <BookingWizard />
    </div>
  );
}
