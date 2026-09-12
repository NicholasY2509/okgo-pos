import { PromotionService } from "@/modules/discount/services/promotion-service"
import { BranchService } from "@/modules/branch/services/branch-service"
import { ProductService } from "@/modules/product/services/product-service"
import { PromotionDialog } from "@/modules/discount/components/promotion-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"

export const dynamic = "force-dynamic"

export default async function PromotionsPage() {
  const promotions = await PromotionService.getPromotions()
  const branches = await BranchService.getAllBranches()
  const productsRes = await ProductService.getAllProducts()
  const products = productsRes.products

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Promosi & Diskon"
        description="Kelola diskon, promo harga, dan penawaran layanan gratis."
      >
        <PromotionDialog branches={branches} products={products} />
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map(promo => {
          const reward = promo.reward as any
          const conditions = promo.conditions as any
          const schedules = promo.schedules as any[]

          return (
            <Card key={promo.id} className="flex flex-col hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-semibold">{promo.name}</CardTitle>
                    {promo.description && (
                      <CardDescription className="mt-1">
                        {promo.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={promo.isActive ? "default" : "secondary"} className="font-normal text-xs">
                    {promo.isActive ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pt-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Hadiah: </span>
                    {reward.type === "PERCENTAGE_TOTAL" ? `${reward.value}% Total` :
                      reward.type === "PERCENTAGE_ITEM" ? `${reward.value}% per Item` :
                        `Gratis Layanan Tambahan`}
                  </div>
                  <div>
                    <span className="font-medium">Syarat: </span>
                    {conditions?.minQuantity > 1 ? `Min. ${conditions.minQuantity} layanan. ` : "Tanpa minimal kuantitas. "}
                    {conditions?.requiredServiceIds?.length ? "Berlaku untuk layanan tertentu." : "Berlaku untuk semua layanan."}
                  </div>
                  <div>
                    <span className="font-medium">Jadwal: </span>
                    {schedules.length} Aturan Jadwal
                  </div>
                  <div>
                    <span className="font-medium">Cabang: </span>
                    {promo.branch ? promo.branch.name : "Universal (Semua Cabang)"}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t flex justify-end pt-4 gap-2">
                <PromotionDialog initialData={promo} branches={branches} products={products} />
              </CardFooter>
            </Card>
          )
        })}

        {promotions.length === 0 && (
          <div className="col-span-full p-12 text-center border border-dashed rounded-xl">
            <h3 className="text-lg font-medium ">Belum ada promo</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Buat promo pertama Anda untuk menarik pelanggan.</p>
            <PromotionDialog branches={branches} products={products} />
          </div>
        )}
      </div>
    </div>
  )
}
