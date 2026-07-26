import { getLedgerAccountsWithBalancesAction } from "@/modules/accounting/actions/ledger-account-action"
import { CoaFormDialog } from "@/modules/accounting/components/coa-form-dialog"
import { Lock, FileText, Tag, Shield, TrendingUp, ShoppingCart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"

const typeConfig: Record<string, { label: string, Icon: any }> = {
  ALL: { label: "Semua Akun", Icon: null },
  ASSET: { label: "Aset", Icon: FileText },
  LIABILITY: { label: "Liabilitas", Icon: Tag },
  EQUITY: { label: "Ekuitas", Icon: Shield },
  REVENUE: { label: "Pendapatan", Icon: TrendingUp },
  EXPENSE: { label: "Beban", Icon: ShoppingCart },
}

export default async function AdminCoaPage() {
  const result = await getLedgerAccountsWithBalancesAction()
  const accounts = result.data || []

  const accountTypes = ["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]
  const basicTypes = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]

  const renderCardGrid = (typeAccounts: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {typeAccounts.map((acc: any) => (
        <Link key={acc.id} href={`/admin/accounting/coa/${acc.id}`} className="block group">
          <div className="relative flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-1 rounded-md">
                {acc.code}
              </div>
              <div className="font-semibold text-sm flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                {acc.name}
                {acc.isLocked && <Lock className="w-3.5 h-3.5 text-primary/60" />}
              </div>
            </div>
            <div className="font-bold text-sm">
              Rp {(acc.balance || 0).toLocaleString('id-ID')}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bagan Akun (COA)"
        description="Kelola akun buku besar secara global untuk semua cabang."
      >
        <CoaFormDialog branchId="" />
      </PageHeader>

      <Tabs defaultValue="ALL" className="w-full">
        <TabsList className="mb-8 h-auto flex-wrap justify-start bg-transparent p-0 gap-2">
          {accountTypes.map(type => {
            const { label, Icon } = typeConfig[type]
            return (
              <TabsTrigger
                key={type}
                value={type}
                className="px-4 py-2 rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
              >
                {Icon && <Icon className="w-4 h-4 mr-2" />}
                {label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="ALL" className="mt-0 outline-none space-y-10">
          {basicTypes.map(type => {
            const typeAccounts = accounts.filter((acc: any) => acc.type === type)
            if (typeAccounts.length === 0) return null
            const { label, Icon } = typeConfig[type]

            return (
              <div key={type} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <div className="p-1.5 bg-primary/10 text-primary rounded-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    {label}
                  </div>
                  <div className="flex-1 border-t"></div>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full font-medium">
                    {typeAccounts.length} Akun
                  </div>
                </div>
                {renderCardGrid(typeAccounts)}
              </div>
            )
          })}
        </TabsContent>

        {basicTypes.map((type) => {
          const typeAccounts = accounts.filter((acc: any) => acc.type === type)
          return (
            <TabsContent key={type} value={type} className="mt-0 outline-none">
              {typeAccounts.length > 0 ? renderCardGrid(typeAccounts) : (
                <div className="py-12 text-center text-muted-foreground">
                  Tidak ada akun ditemukan untuk {typeConfig[type].label}.
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

