import { z } from "zod"

export const expenseSchema = z.object({
  date: z.string().or(z.date()),
  description: z.string().min(1, "Description is required"),
  reference: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  assetAccountId: z.string().min(1, "Payment source account is required"),
  expenseAccountId: z.string().min(1, "Expense category account is required"),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
