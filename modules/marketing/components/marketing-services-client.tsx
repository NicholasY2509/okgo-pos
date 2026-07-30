"use client"

import { useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { toggleProductMarketingAction } from "@/modules/product/actions/product-action"

interface ProductForMarketing {
  id: string
  name: string
  price: any
  isActive: boolean
  showOnMarketing: boolean
}

interface MarketingServicesClientProps {
  products: ProductForMarketing[]
}

export function MarketingServicesClient({ products }: MarketingServicesClientProps) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await toggleProductMarketingAction(id, !currentStatus)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Layanan ${!currentStatus ? 'ditampilkan' : 'disembunyikan'} di Landing Page`)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Layanan Unggulan</CardTitle>
        <CardDescription>
          Pilih layanan mana saja yang ingin Anda tampilkan di bagian "Menu Layanan" pada Landing Page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
            Belum ada layanan yang tersedia.
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{product.name}</span>
                    {!product.isActive && <Badge variant="secondary" className="text-xs">Tidak Aktif</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Rp {Number(product.price).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor={`marketing-toggle-${product.id}`} className="text-sm cursor-pointer">
                    {product.showOnMarketing ? "Tampil" : "Sembunyi"}
                  </Label>
                  <Switch
                    id={`marketing-toggle-${product.id}`}
                    checked={product.showOnMarketing}
                    onCheckedChange={() => handleToggle(product.id, product.showOnMarketing)}
                    disabled={isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
