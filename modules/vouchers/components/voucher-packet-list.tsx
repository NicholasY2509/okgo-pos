"use client"

import { useState } from "react"
import { VoucherPacketInput } from "../schemas/voucher-packet"
import { VoucherPacketForm } from "./voucher-packet-form"
import { useVoucherPacket } from "../hooks/use-voucher-packet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Trash2, Plus } from "lucide-react"
import { NumericFormat } from "react-number-format"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type VoucherPacketData = VoucherPacketInput & { id: string, createdAt?: Date }

interface VoucherPacketListProps {
  productId: string
  packets: VoucherPacketData[]
}

export function VoucherPacketList({ productId, packets }: VoucherPacketListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Need to pass a dummy initialData or use a bare hook just for delete? 
  // Let's create a specialized hook instance for deletion or handle it per card.

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Paket Voucher</h3>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Tambah Paket
          </Button>
        )}
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Paket Baru</DialogTitle>
          </DialogHeader>
          <VoucherPacketForm
            productId={productId}
            onCancel={() => setIsCreating(false)}
            onSuccess={() => setIsCreating(false)}
          />
        </DialogContent>
      </Dialog>

      {packets.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Tidak ada paket voucher yang dikonfigurasi untuk produk ini.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packets.map((packet) => (
            <PacketCard
              key={packet.id}
              packet={packet}
              productId={productId}
              isEditing={editingId === packet.id}
              onEdit={() => setEditingId(packet.id)}
              onCancelEdit={() => setEditingId(null)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PacketCard({
  packet,
  productId,
  isEditing,
  onEdit,
  onCancelEdit
}: {
  packet: VoucherPacketData
  productId: string
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
}) {
  const { onDelete, isDeleting } = useVoucherPacket({ productId, initialData: packet })

  return (
    <>
      <Dialog open={isEditing} onOpenChange={(open) => !open && onCancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Paket</DialogTitle>
          </DialogHeader>
          <VoucherPacketForm
            productId={productId}
            initialData={packet}
            onCancel={onCancelEdit}
            onSuccess={onCancelEdit}
          />
        </DialogContent>
      </Dialog>

      <Card className={packet.isActive ? "" : "opacity-60 bg-muted"}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex justify-between items-center">
            <span>{packet.name}</span>
            {packet.codeSuffix && (
              <span className="text-sm font-normal px-2 py-1 bg-secondary rounded-md">
                {packet.codeSuffix}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="text-2xl font-bold">
            <NumericFormat
              value={Number(packet.price)}
              displayType="text"
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Masa Berlaku: {packet.validityDays ? `${packet.validityDays} Hari` : "Tanpa Kadaluarsa"}
          </p>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 pt-4">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm("Apakah Anda yakin ingin menghapus paket ini?")) {
                onDelete(packet.id)
              }
            }}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
