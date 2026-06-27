import { Store, Box, Users, Calculator, ReceiptText, CalendarClock } from "lucide-react";
import { PosStoreProvider } from "@/modules/pos/stores/pos-store";
import Link from "next/link";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b border-border w-full">
        <div className="flex h-16 items-center px-6 gap-8">
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-display tracking-widest text-foreground">
              NYENYAK<span className="text-primary font-sans tracking-widest text-base font-extralight capitalize"> {tenant}</span>
            </h1>
          </div>
          <nav className="flex items-center gap-1 ml-auto">
            <Link href={`/pos`} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-all active:scale-95">
              POS
            </Link>
            <Link href={`/bookings`} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-all active:scale-95">
              Daftar Booking
            </Link>
            <Link href={`/transactions`} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-all active:scale-95">
              Riwayat Transaksi
            </Link>
            <Link href={`/hris`} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-all active:scale-95">
              HRIS
            </Link>
            <Link href={`/accounting`} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-all active:scale-95">
              Accounting
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-6 container w-full mx-auto">
        <PosStoreProvider>
          {children}
        </PosStoreProvider>
      </main>
    </div>
  );
}
