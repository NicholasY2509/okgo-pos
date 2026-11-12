import { PageHeader } from "@/components/page-header"
import { MarketingOfferService } from "@/modules/marketing/services/marketing-offer-service"
import { MarketingOffersClient } from "@/modules/marketing/components/marketing-offers-client"
import { ProductService } from "@/modules/product/services/product-service"
import { MarketingServicesClient } from "@/modules/marketing/components/marketing-services-client"
import { MarketingSettingService } from "@/modules/marketing/services/marketing-setting-service"
import { MarketingMaintenanceToggle } from "@/modules/marketing/components/marketing-maintenance-toggle"

export default async function MarketingOffersPage() {
  const [rawOffers, productsData, marketingSetting] = await Promise.all([
    MarketingOfferService.findAll(),
    ProductService.getAllProducts({ limit: 100 }),
    MarketingSettingService.get(),
  ])
  
  const rawOffersData = rawOffers;
  
  const offers = rawOffersData.map((offer: any) => ({
    ...offer,
    normalPrice: offer.normalPrice ? Number(offer.normalPrice) : null,
    discountPrice: Number(offer.discountPrice),
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Penawaran Pemasaran"
        description="Kelola penawaran eksklusif dan status ketersediaan halaman utama (Landing Page)."
      />

      <div className="max-w-2xl">
        <MarketingMaintenanceToggle initialIsMaintenance={marketingSetting?.isMaintenanceMode ?? false} />
      </div>

      <div className="mt-2">
        <MarketingOffersClient data={offers} />
      </div>
      
      <div className="mt-8">
        <MarketingServicesClient products={productsData.products} />
      </div>
    </div>
  )
}
