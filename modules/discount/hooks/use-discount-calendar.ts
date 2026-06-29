import { useState } from "react"
import { toast } from "sonner"
import { DiscountWithBranch } from "../types/discount"
import { updateDiscountAction } from "../actions/discount-action"
import { useDiscountForm } from "./use-discount"

export function useDiscountCalendar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<DiscountWithBranch | undefined>()
  const { onDelete } = useDiscountForm()

  const handleEdit = (discount: DiscountWithBranch) => {
    setEditingDiscount(discount)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus diskon ini?")) {
      await onDelete(id)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingDiscount(undefined)
    }
  }

  const toggleActive = async (discount: DiscountWithBranch, newActiveState: boolean) => {
    const values = {
      name: discount.name,
      dayOfWeek: discount.dayOfWeek as any,
      startTime: discount.startTime,
      endTime: discount.endTime,
      percentage: Number(discount.percentage),
      isActive: newActiveState,
      branchId: discount.branchId
    }

    toast.promise(updateDiscountAction(discount.id, values), {
      loading: "Memperbarui status diskon...",
      success: (res) => {
        if (res.error) throw new Error(res.error)
        return "Status berhasil diperbarui!"
      },
      error: "Gagal memperbarui status diskon"
    })
  }

  return {
    isDialogOpen,
    setIsDialogOpen,
    editingDiscount,
    handleEdit,
    handleDelete,
    handleOpenChange,
    toggleActive
  }
}
