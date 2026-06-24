import { CategoryService } from "@/modules/product/services/category-service"
import { ProductService } from "@/modules/product/services/product-service"
import { CategoryDialog } from "@/modules/product/components/category-dialog"
import { ProductDialog } from "@/modules/product/components/product-dialog"
import { ProductsTable } from "@/modules/product/components/products-table"
import { CategoriesTable } from "@/modules/product/components/categories-table"
import { DiscountWeeklyCalendar } from "@/modules/discount/components/discount-weekly-calendar"
import { DiscountService } from "@/modules/discount/services/discount-service"
import { BranchService } from "@/modules/branch/services/branch-service"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export default async function ProductsPage() {
  const [categories, rawProducts, rawDiscounts, branches] = await Promise.all([
    CategoryService.getAllCategories(),
    ProductService.getAllProducts(),
    DiscountService.getDiscounts(),
    BranchService.getAllBranches()
  ])

  const products = rawProducts.map(p => ({
    ...p,
    price: Number(p.price)
  }))

  const discounts = rawDiscounts.map(d => ({
    id: d.id,
    name: d.name,
    dayOfWeek: d.dayOfWeek,
    startTime: d.startTime,
    endTime: d.endTime,
    percentage: Number(d.percentage),
    isActive: d.isActive,
    branchId: d.branchId,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    branch: d.branch ? { ...d.branch } : null
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Layanan & Produk"
        description="Kelola layanan, produk, dan kategori tempat pijat Anda."
      />

      <Tabs defaultValue="services" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="services">Layanan / Produk</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
            <TabsTrigger value="discounts">Diskon</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <CategoryDialog>
              <Button variant="outline">Tambah Kategori</Button>
            </CategoryDialog>
            <ProductDialog categories={categories}>
              <Button>Tambah Layanan</Button>
            </ProductDialog>
          </div>
        </div>

        <TabsContent value="services" className="space-y-6">
          <ProductsTable products={products} categories={categories} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoriesTable categories={categories} />
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6">
          <DiscountWeeklyCalendar data={discounts} branches={branches} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
