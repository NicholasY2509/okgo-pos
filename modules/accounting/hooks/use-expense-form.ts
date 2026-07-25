import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createJournalEntryAction } from "../actions/journal-entry-action"
import { expenseSchema, type ExpenseInput } from "../schemas/expense"

export function useExpenseForm(branchId: string, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: "",
      reference: "",
      amount: 0,
      assetAccountId: "",
      expenseAccountId: "",
    },
  })

  async function onSubmit(values: ExpenseInput) {
    setError(null)
    
    // Transform ExpenseInput into a standard double-entry JournalEntryInput
    const payload = {
      date: new Date(values.date),
      description: values.description,
      reference: values.reference || undefined,
      branchId,
      lines: [
        {
          ledgerAccountId: values.expenseAccountId,
          debit: values.amount,
          credit: 0
        },
        {
          ledgerAccountId: values.assetAccountId,
          debit: 0,
          credit: values.amount
        }
      ]
    }

    const result = await createJournalEntryAction(payload)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Expense recorded successfully!")
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
