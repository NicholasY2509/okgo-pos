"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MarketingOfferForm } from "./marketing-offer-form"
import { MarketingOfferInput } from "../schemas/marketing-offer"
import { deleteMarketingOfferAction } from "../actions/marketing-offer-action"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface MarketingOffersClientProps {
  data: (MarketingOfferInput & { id: string })[]
}

export function MarketingOffersClient({ data }: MarketingOffersClientProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<(MarketingOfferInput & { id: string }) | null>(null)
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (offer: MarketingOfferInput & { id: string }) => {
    setSelectedOffer(offer)
    setIsOpen(true)
  }

  const handleCreate = () => {
    setSelectedOffer(null)
    setIsOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setOfferToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!offerToDelete) return
    
    setIsDeleting(true)
    const result = await deleteMarketingOfferAction(offerToDelete)
    setIsDeleting(false)
    setIsDeleteDialogOpen(false)
    setOfferToDelete(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Penawaran berhasil dihapus!")
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Penawaran
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg bg-card border-dashed">
            Belum ada penawaran pemasaran yang dibuat.
          </div>
        ) : (
          data.map((offer) => (
            <Card key={offer.id} className="flex flex-col relative overflow-hidden group">
              {offer.isActive ? (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">Aktif</Badge>
                </div>
              ) : (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="secondary">Tidak Aktif</Badge>
                </div>
              )}
              <CardHeader>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                  Urutan: {offer.order}
                </div>
                <CardTitle className="text-xl leading-tight pr-16">{offer.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">{offer.description || "Tanpa deskripsi"}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Harga Promo</p>
                  <p className="text-2xl font-bold text-foreground">
                    Rp {Number(offer.discountPrice).toLocaleString('id-ID')}
                  </p>
                  {offer.normalPrice && (
                    <p className="text-sm text-muted-foreground line-through">
                      Rp {Number(offer.normalPrice).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-4 border-t bg-muted/20">
                <Button variant="outline" size="sm" onClick={() => handleEdit(offer)}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => handleDeleteClick(offer.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Hapus
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOffer ? "Edit Penawaran Pemasaran" : "Tambah Penawaran Pemasaran"}
            </DialogTitle>
          </DialogHeader>
          <MarketingOfferForm
            initialData={selectedOffer || undefined}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Hapus Penawaran"
        description="Apakah Anda yakin ingin menghapus penawaran ini? Aksi ini tidak dapat dibatalkan."
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
