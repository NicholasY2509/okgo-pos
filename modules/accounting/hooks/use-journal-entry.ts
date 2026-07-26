import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createJournalEntryAction } from "../actions/journal-entry-action"
import { journalEntrySchema, type JournalEntryInput } from "../schemas/journal-entry"

import { z } from "zod"

export const createJournalFormSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  branchId: z.string().min(1, "Branch ID is required"),
  lines: z.array(z.object({
    ledgerAccountId: z.string().min(1, "Account is required"),
    type: z.enum(["DEBIT", "CREDIT"]),
    amount: z.coerce.number().min(0, "Amount must be at least 0"),
  })).min(2, "At least two lines are required")
    .refine(lines => {
      const totalDebits = lines.filter(l => l.type === 'DEBIT').reduce((acc, line) => acc + line.amount, 0)
      const totalCredits = lines.filter(l => l.type === 'CREDIT').reduce((acc, line) => acc + line.amount, 0)
      return Math.abs(totalDebits - totalCredits) < 0.001
    }, {
      message: "Total debits must equal total credits",
    }),
})

export type CreateJournalFormInput = z.infer<typeof createJournalFormSchema>

export function useJournalEntryForm(branchId: string, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateJournalFormInput>({
    resolver: zodResolver(createJournalFormSchema) as any,
    defaultValues: {
      date: new Date(),
      description: "",
      branchId,
      lines: [
        { ledgerAccountId: "", type: "DEBIT", amount: 0 },
        { ledgerAccountId: "", type: "CREDIT", amount: 0 },
      ],
    },
  })

  const { fields: lineFields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  })

  async function onSubmit(values: CreateJournalFormInput) {
    setError(null)

    // Transform to JournalEntryInput expected by backend
    const transformedValues: JournalEntryInput = {
      date: values.date,
      description: values.description,
      branchId: values.branchId,
      lines: values.lines.map(line => ({
        ledgerAccountId: line.ledgerAccountId,
        debit: line.type === "DEBIT" ? line.amount : 0,
        credit: line.type === "CREDIT" ? line.amount : 0,
      }))
    }

    const result = await createJournalEntryAction(transformedValues)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Successfully posted journal entry!")
      form.reset({
        ...form.getValues(),
        description: "",
        lines: [
          { ledgerAccountId: "", type: "DEBIT", amount: 0 },
          { ledgerAccountId: "", type: "CREDIT", amount: 0 },
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
