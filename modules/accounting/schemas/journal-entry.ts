import { z } from "zod"

export const journalLineSchema = z.object({
  ledgerAccountId: z.string().min(1, "Account is required"),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
}).refine(data => data.debit > 0 || data.credit > 0, {
  message: "Either debit or credit must be greater than 0",
  path: ["debit"], // You could attach it to a specific field
}).refine(data => !(data.debit > 0 && data.credit > 0), {
  message: "Cannot have both debit and credit on the same line",
  path: ["debit"],
})

export const journalEntrySchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  reference: z.string().optional(),
  branchId: z.string().min(1, "Branch ID is required"),
  lines: z.array(journalLineSchema).min(2, "At least two lines are required for double-entry bookkeeping")
    .refine(lines => {
      const totalDebits = lines.reduce((acc, line) => acc + line.debit, 0)
      const totalCredits = lines.reduce((acc, line) => acc + line.credit, 0)
      // Use a small epsilon to avoid floating point precision issues if using decimals, though these are converted to numbers.
      return Math.abs(totalDebits - totalCredits) < 0.001
    }, {
      message: "Total debits must equal total credits",
    }),
})

export type JournalLineInput = z.infer<typeof journalLineSchema>
export type JournalEntryInput = z.infer<typeof journalEntrySchema>
