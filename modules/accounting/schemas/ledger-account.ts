import { z } from "zod"

export const ledgerAccountSchema = z.object({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  description: z.string().optional(),
  branchId: z.string().optional(),
  isLocked: z.boolean().optional(),
})

export type LedgerAccountInput = z.infer<typeof ledgerAccountSchema>
