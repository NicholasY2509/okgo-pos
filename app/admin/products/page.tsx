import { CategoryService } from "@/modules/product/services/category-service"
import { ProductService } from "@/modules/product/services/product-service"
import { CategoryDialog } from "@/modules/product/components/category-dialog"
import { ProductDialog } from "@/modules/product/components/product-dialog"
import { ProductsTable } from "@/modules/product/components/products-table"
import { CategoriesTable } from "@/modules/product/components/categories-table"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export default async function ProductsPage() {
  const [categories, rawProducts] = await Promise.all([
    CategoryService.getAllCategories(),
    ProductService.getAllProducts()
  ])

  const products = rawProducts.map(p => ({
    ...p,
    price: Number(p.price)
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Services & Products"
        description="Manage your massage parlor services, products, and categories."
      />

      <Tabs defaultValue="services" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="services">Services / Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <CategoryDialog>
              <Button variant="outline">Add Category</Button>
            </CategoryDialog>
            <ProductDialog categories={categories}>
              <Button>Add Service</Button>
            </ProductDialog>
          </div>
        </div>

        <TabsContent value="services" className="space-y-6">
          <ProductsTable products={products} categories={categories} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoriesTable categories={categories} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
