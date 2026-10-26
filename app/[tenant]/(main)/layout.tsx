import { ChevronDown } from "lucide-react"
import { PosStoreProvider } from "@/modules/pos/stores/pos-store"
import Link from "next/link"
import { TenantLogoutButton } from "@/components/tenant-logout-button"
import { BranchService } from "@/modules/branch/services/branch-service"
import { GlobalNotificationListener } from "@/components/global-notification-listener"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EnsureWindowedMode } from "@/components/ensure-windowed-mode"

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant } = await params
  const branch = await BranchService.getBranchBySubdomain(tenant)

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <EnsureWindowedMode />
      {branch && <GlobalNotificationListener branchId={branch.id} />}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 items-center gap-8 px-6">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-3xl tracking-widest text-foreground">
              NYENYAK
              <span className="font-sans text-base font-extralight tracking-widest text-primary capitalize">
                {" "}
                {tenant}
              </span>
            </h1>
          </div>
          <nav className="ml-auto flex items-center gap-1">
            <Link
              href={`/pos`}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary active:scale-95"
            >
              POS
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary focus:outline-none active:scale-95">
                Transaksi <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href={`/bookings`} className="w-full cursor-pointer">
                    Daftar Booking
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/transactions`}
                    className="w-full cursor-pointer"
                  >
                    Riwayat Transaksi
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary focus:outline-none active:scale-95">
                Fitur <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href={`/kiosk`} className="w-full cursor-pointer">
                    Mode Kiosk
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/reviews`} className="w-full cursor-pointer">
                    Buku Ulasan
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary focus:outline-none active:scale-95">
                Akuntansi <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href="/accounting" className="w-full cursor-pointer font-medium">
                    Ringkasan Akuntansi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/accounting/journal" className="w-full cursor-pointer">
                    Jurnal Umum
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/accounting/expenses" className="w-full cursor-pointer">
                    Pengeluaran
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/accounting/coa" className="w-full cursor-pointer">
                    Bagan Akun (COA)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/accounting/reports" className="w-full cursor-pointer">
                    Laporan Keuangan
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary focus:outline-none active:scale-95">
                Manajemen <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href="/hris" className="w-full cursor-pointer">
                    HRIS
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout Button */}
            <div className="ml-2 border-l border-border pl-2">
              <TenantLogoutButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 p-6">
        <PosStoreProvider>{children}</PosStoreProvider>
      </main>
    </div>
  )
}
