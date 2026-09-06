"use client"

import { useState } from "react"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateVouchersAction } from "../actions/voucher-packet-action"

interface GenerateVouchersDialogProps {
  packetId: string
  trigger: React.ReactNode
  onSuccess?: () => void
}

export function GenerateVouchersDialog({ packetId, trigger, onSuccess }: GenerateVouchersDialogProps) {
  const [open, setOpen] = useState(false)
  const [quantity, setQuantity] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  async function handleGenerate() {
    if (quantity < 1 || quantity > 1000) {
      toast.error("Jumlah voucher harus antara 1 dan 1000")
      return
    }

    setIsLoading(true)
    const result = await generateVouchersAction(packetId, quantity)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Berhasil membuat ${result.count} voucher!`)
      setOpen(false)
      if (onSuccess) onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Voucher (Kode Seri)</DialogTitle>
          <DialogDescription>
            Fitur ini akan membuat nomor seri voucher baru berdasarkan paket ini. Voucher yang digenerate belum terikat ke pelanggan manapun (unassigned) sehingga bisa bebas dibagikan atau dicetak.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Jumlah Voucher</Label>
            <Input 
              id="quantity" 
              type="number" 
              min={1} 
              max={1000} 
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))} 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? "Memproses..." : "Generate Sekarang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
