import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createLedgerAccountAction } from "../actions/ledger-account-action"
import { ledgerAccountSchema, type LedgerAccountInput } from "../schemas/ledger-account"

export function useLedgerAccountForm(onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LedgerAccountInput>({
    resolver: zodResolver(ledgerAccountSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "ASSET",
      description: "",
      branchId: "",
    },
  })

  async function onSubmit(values: LedgerAccountInput) {
    setError(null)
    const result = await createLedgerAccountAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Successfully created ledger account!")
      form.reset()
      if (onSuccess) onSuccess()
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  }
}
