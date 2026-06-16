import { z } from "zod"

export const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  subdomain: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  address: z.string().optional(),
  phone: z.string().optional(),
})

export type CreateBranchInput = z.infer<typeof createBranchSchema>

export const updateBranchSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Branch name is required"),
  subdomain: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  address: z.string().optional(),
  phone: z.string().optional(),
})

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>
export const assignUserBranchSchema = z.object({
  branchId: z.string().cuid(),
  userId: z.string().cuid(),
  roleId: z.string().cuid(),
})

export type AssignUserBranchInput = z.infer<typeof assignUserBranchSchema>
