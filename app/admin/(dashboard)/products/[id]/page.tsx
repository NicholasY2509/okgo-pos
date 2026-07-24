import { ProductService } from "@/modules/product/services/product-service"
import { CategoryService } from "@/modules/product/services/category-service"
import { VoucherPacketService } from "@/modules/vouchers/services/voucher-packet-service"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { ProductDialog } from "@/modules/product/components/product-dialog"
import { VoucherPacketList } from "@/modules/vouchers/components/voucher-packet-list"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { ProductOverviewTab } from "@/modules/product/components/product-overview-tab"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { formatIDR } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [rawProduct, categories, voucherPackets] = await Promise.all([
    ProductService.getProductById(id),
    CategoryService.getAllCategories(),
    VoucherPacketService.getByProductId(id)
  ])

  if (!rawProduct) {
    notFound()
  }

  // Decimal conversion
  const product = {
    ...rawProduct,
    price: Number(rawProduct.price)
  }

  const formattedPackets = voucherPackets.map(vp => ({
    ...vp,
    price: Number(vp.price),
    totalCreditAmount: vp.totalCreditAmount ? Number(vp.totalCreditAmount) : null
  }))

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/products" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Kembali ke Layanan
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader
          title={product.name}
          description="Lihat detail produk dan lacak metrik kinerja."
        >
          <div className="flex gap-2">
            <ProductDialog initialData={product} categories={categories}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Detail
              </Button>
            </ProductDialog>
          </div>
        </PageHeader>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          {/* Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="aspect-video relative rounded-xl overflow-hidden bg-muted mb-6 border">
                {product.image ? (
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">
                    Gambar tidak tersedia
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Kategori</h3>
                  <p className="font-medium mt-1">{product.category?.name || "Belum Dikategorikan"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Harga</h3>
                  <p className="font-medium mt-1">{formatIDR(product.price)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Durasi</h3>
                  <p className="font-medium mt-1">{product.duration ? `${product.duration} min` : "N/A"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Tipe Layanan</h3>
                  <div className="mt-1">
                    {product.isVip ? (
                      <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
                        VIP
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Standar
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div className="mt-1">
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </div>
                </div>

                {product.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Deskripsi</h3>
                    <p className="text-sm mt-1 whitespace-pre-line">{product.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="overview">Ringkasan</TabsTrigger>
              <TabsTrigger value="vouchers">Paket Voucher</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pt-4">
              <ProductOverviewTab productId={id} />
            </TabsContent>

            <TabsContent value="vouchers" className="space-y-4 pt-4">
              <VoucherPacketList productId={id} packets={formattedPackets} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
