import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { kioskExitSchema, type KioskExitInput } from "../schemas/kiosk-schema"
import { exitToPosAction } from "../actions/kiosk-action"

export function useExitToPos(tenantSlug: string, onSuccess?: () => void) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<KioskExitInput>({
    resolver: zodResolver(kioskExitSchema),
    defaultValues: { email: "", password: "", subdomain: tenantSlug },
  })

  async function onSubmit(values: KioskExitInput) {
    setError(null)

    const result = await exitToPosAction({ ...values, subdomain: tenantSlug })

    if (result?.error) {
      setError(result.error)
      toast.error(result.error)
      return
    }

    toast.success("Otorisasi berhasil. Mengalihkan ke POS...")
    onSuccess?.()
    form.reset()
    router.push("/pos")
  }

  const reset = () => {
    form.reset()
    setError(null)
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
    reset,
  }
}
