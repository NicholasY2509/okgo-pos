import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { kioskLoginSchema, type KioskLoginInput } from "../schemas/kiosk-schema"
import { verifyKioskPinAction } from "../actions/kiosk-action"

export function useKioskLogin(tenantSlug: string) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<KioskLoginInput>({
    resolver: zodResolver(kioskLoginSchema),
    defaultValues: { username: "", pin: "" },
  })

  async function onSubmit(values: KioskLoginInput) {
    setError(null)
    const result = await verifyKioskPinAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Successfully logged in!")
      form.reset()
      router.push(`/kiosk/dashboard`)
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  }
}
