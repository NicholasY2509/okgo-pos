"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { VoucherPacketForm } from "./voucher-packet-form"
import { VoucherPacketInput } from "../schemas/voucher-packet"

interface VoucherPacketDialogProps {
  initialData?: VoucherPacketInput & { id: string }
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function VoucherPacketDialog({ initialData, onSuccess, trigger }: VoucherPacketDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    setOpen(false)
    if (onSuccess) {
      onSuccess()
    } else {
      router.refresh()
    }
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Paket Voucher
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Paket Voucher" : "Tambah Paket Voucher"}</DialogTitle>
          <DialogDescription>
            Konfigurasi detail paket voucher.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <VoucherPacketForm
            initialData={initialData}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
