import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createJournalEntryAction } from "../actions/journal-entry-action"
import { journalEntrySchema, type JournalEntryInput } from "../schemas/journal-entry"

export function useJournalEntryForm(branchId: string, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<JournalEntryInput>({
    resolver: zodResolver(journalEntrySchema) as any,
    defaultValues: {
      date: new Date(),
      description: "",
      reference: "",
      branchId,
      lines: [
        { ledgerAccountId: "", debit: 0, credit: 0 },
        { ledgerAccountId: "", debit: 0, credit: 0 },
      ],
    },
  })

  const { fields: lineFields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  })

  async function onSubmit(values: JournalEntryInput) {
    setError(null)
    const result = await createJournalEntryAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Successfully posted journal entry!")
      form.reset({
        ...form.getValues(),
        description: "",
        reference: "",
        lines: [
          { ledgerAccountId: "", debit: 0, credit: 0 },
          { ledgerAccountId: "", debit: 0, credit: 0 },
        ],
      })
      if (onSuccess) onSuccess()
    }
  }

  return {
    form,
    lineFields,
    append,
    remove,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  }
}
