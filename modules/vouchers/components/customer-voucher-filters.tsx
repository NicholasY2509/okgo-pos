"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function CustomerVoucherFilters({ products }: { products: { id: string, name: string }[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const status = searchParams.get("status") || "ALL"
  const type = searchParams.get("type") || "ALL"
  const productId = searchParams.get("productId") || "ALL"

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "ALL") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.set("page", "1") // reset page

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-lg">
      <div className="flex flex-col gap-2 flex-1">
        <Label>Status</Label>
        <Select value={status} onValueChange={(val) => updateParam("status", val)} disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="USED_UP">Habis / Terpakai</SelectItem>
            <SelectItem value="EXPIRED">Kedaluwarsa</SelectItem>
            <SelectItem value="VOID">Batal (Void)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        <Label>Jenis Voucher</Label>
        <Select value={type} onValueChange={(val) => updateParam("type", val)} disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Jenis</SelectItem>
            <SelectItem value="NOMINAL">Potongan Nominal (Rp)</SelectItem>
            <SelectItem value="VISIT">Kunjungan/Layanan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        <Label>Produk</Label>
        <Select value={productId} onValueChange={(val) => updateParam("productId", val)} disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Produk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Produk</SelectItem>
            <SelectItem value="NONE">Voucher Global (Tanpa Produk)</SelectItem>
            {products.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
