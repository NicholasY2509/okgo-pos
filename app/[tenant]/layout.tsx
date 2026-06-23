import { Store, Box, Users, Calculator } from "lucide-react";
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
            <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              Nyenyak <span className="text-primary capitalize font-black">{tenant}</span>
            </h1>
          </div>
          <nav className="flex items-center gap-1 ml-auto">
            <Link href={`/pos`} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-all active:scale-95">
              <Box className="w-4 h-4" />
              POS
            </Link>
            <Link href={`/hris`} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-all active:scale-95">
              <Users className="w-4 h-4" />
              HRIS
            </Link>
            <Link href={`/accounting`} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-all active:scale-95">
              <Calculator className="w-4 h-4" />
              Accounting
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <PosStoreProvider>
          {children}
        </PosStoreProvider>
      </main>
    </div>
  );
}
