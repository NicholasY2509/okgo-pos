import { Store, Box, Users, Calculator, ReceiptText, CalendarClock, LogOut, ChevronDown } from "lucide-react";
import { PosStoreProvider } from "@/modules/pos/stores/pos-store";
import Link from "next/link";
import { TenantLogoutButton } from "@/components/tenant-logout-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-all active:scale-95 focus:outline-none">
                Transaksi <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href={`/bookings`} className="w-full cursor-pointer">Daftar Booking</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/transactions`} className="w-full cursor-pointer">Riwayat Transaksi</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-all active:scale-95 focus:outline-none">
                Fitur <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href={`/kiosk`} className="w-full cursor-pointer">Mode Kiosk</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/reviews`} className="w-full cursor-pointer">Buku Ulasan</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-all active:scale-95 focus:outline-none">
                Manajemen <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href={`/hris`} className="w-full cursor-pointer">HRIS</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/accounting`} className="w-full cursor-pointer">Accounting</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout Button */}
            <div className="ml-2 pl-2 border-l border-border">
              <TenantLogoutButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-6 w-full mx-auto max-w-[1600px]">
        <PosStoreProvider>
          {children}
        </PosStoreProvider>
      </main>
    </div>
  );
}
