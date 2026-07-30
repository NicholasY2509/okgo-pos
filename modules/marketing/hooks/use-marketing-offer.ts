import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { marketingOfferSchema, type MarketingOfferInput } from "../schemas/marketing-offer"
import { createMarketingOfferAction, updateMarketingOfferAction } from "../actions/marketing-offer-action"

interface UseMarketingOfferProps {
  initialData?: MarketingOfferInput & { id: string }
  onSuccess?: () => void
}

export function useMarketingOffer({ initialData, onSuccess }: UseMarketingOfferProps = {}) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.input<typeof marketingOfferSchema>>({
    resolver: zodResolver(marketingOfferSchema),
    defaultValues: initialData ? {
      ...initialData,
      normalPrice: initialData.normalPrice ? Number(initialData.normalPrice) : undefined,
      discountPrice: Number(initialData.discountPrice)
    } : {
      title: "",
      description: "",
      features: "",
      isActive: true,
      order: 0
    },
  })

  async function onSubmit(values: z.input<typeof marketingOfferSchema>) {
    setError(null)
    
    let result
    if (initialData?.id) {
      result = await updateMarketingOfferAction(initialData.id, values as any)
    } else {
      result = await createMarketingOfferAction(values as any)
    }

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success(initialData ? "Penawaran berhasil diperbarui!" : "Penawaran berhasil dibuat!")
      if (!initialData) {
        form.reset()
      }
      onSuccess?.()
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  }
}
