import { ProductService } from "@/modules/product/services/product-service"
import { CategoryService } from "@/modules/product/services/category-service"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { ProductDialog } from "@/modules/product/components/product-dialog"
import { Button } from "@/components/ui/button"
import { Edit, CalendarClock, DollarSign, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { formatIDR } from "@/lib/utils"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [rawProduct, categories] = await Promise.all([
    ProductService.getProductById(id),
    CategoryService.getAllCategories()
  ])

  if (!rawProduct) {
    notFound()
  }

  // Decimal conversion
  const product = {
    ...rawProduct,
    price: Number(rawProduct.price)
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/products" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Services
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader
          title={product.name}
          description="View product details and track performance metrics."
        >
          <div className="flex gap-2">
            <ProductDialog initialData={product} categories={categories}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
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
                    No image available
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                  <p className="font-medium mt-1">{product.category?.name || "Uncategorized"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                  <p className="font-medium mt-1">{formatIDR(product.price)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                  <p className="font-medium mt-1">{product.duration ? `${product.duration} min` : "N/A"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div className="mt-1">
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {product.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="text-sm mt-1 whitespace-pre-line">{product.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold tracking-tight">Performance Overview</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Generated</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp 0</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion & Analytics</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/20 mt-2 gap-2">
                  <Activity className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Analytics graph will appear here once bookings start.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
