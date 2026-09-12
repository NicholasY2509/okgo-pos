import { PageHeader } from "@/components/page-header"
import { MarketingOfferService } from "@/modules/marketing/services/marketing-offer-service"
import { MarketingOffersClient } from "@/modules/marketing/components/marketing-offers-client"
import { ProductService } from "@/modules/product/services/product-service"
import { MarketingServicesClient } from "@/modules/marketing/components/marketing-services-client"

export default async function MarketingOffersPage() {
  const [rawOffers, productsData] = await Promise.all([
    MarketingOfferService.findAll(),
    ProductService.getAllProducts({ limit: 100 })
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
        description="Kelola penawaran eksklusif yang ditampilkan di halaman utama (Landing Page)."
      />

      <MarketingOffersClient data={offers} />
      
      <div className="mt-8">
        <MarketingServicesClient products={productsData.products} />
      </div>
    </div>
  )
}
