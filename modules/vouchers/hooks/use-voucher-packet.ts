import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createVoucherPacketAction, updateVoucherPacketAction, deleteVoucherPacketAction } from "../actions/voucher-packet-action"
import { voucherPacketSchema, type VoucherPacketInput } from "../schemas/voucher-packet"

interface UseVoucherPacketProps {
  productId?: string
  initialData?: VoucherPacketInput & { id: string }
  onSuccess?: () => void
}

export function useVoucherPacket({ productId, initialData, onSuccess }: UseVoucherPacketProps) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<VoucherPacketInput>({
    resolver: zodResolver(voucherPacketSchema) as any,
    defaultValues: initialData || {
      name: "",
      price: 0,
      codeSuffix: null,
      totalVisitCount: null,
      totalCreditAmount: null,
      validityDays: null,
      isActive: true,
      productId: productId || null
    },
  })

  async function onSubmit(values: VoucherPacketInput) {
    setError(null)

    // Ensure productId is always correctly set
    const submitValues = { ...values, productId: productId || null }

    let result;
    if (initialData?.id) {
      result = await updateVoucherPacketAction(initialData.id, submitValues)
    } else {
      result = await createVoucherPacketAction(submitValues)
    }

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(`Berhasil ${initialData?.id ? 'memperbarui' : 'membuat'} paket voucher!`)
      if (!initialData) {
        form.reset() // Only reset on create
      }
      onSuccess?.()
    }
  }

  async function onDelete(id: string) {
    try {
      setIsDeleting(true)
      const result = await deleteVoucherPacketAction(id, productId || "")
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Paket voucher berhasil dihapus")
        onSuccess?.()
      }
    } catch (e) {
      toast.error("Gagal menghapus paket voucher")
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    onDelete,
    isSubmitting: form.formState.isSubmitting,
    isDeleting,
    error,
  }
}
