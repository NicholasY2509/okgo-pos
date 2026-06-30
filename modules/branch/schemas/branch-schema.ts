import { z } from "zod"

export const createBranchSchema = z.object({
  name: z.string().min(1, "Nama cabang wajib diisi"),
  subdomain: z.string().min(1, "Subdomain wajib diisi").regex(/^[a-z0-9-]+$/, "Subdomain hanya boleh berisi huruf kecil, angka, dan tanda hubung"),
  address: z.string().optional(),
  phone: z.string().optional(),
})

export type CreateBranchInput = z.infer<typeof createBranchSchema>

export const updateBranchSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Nama cabang wajib diisi"),
  subdomain: z.string().min(1, "Subdomain wajib diisi").regex(/^[a-z0-9-]+$/, "Subdomain hanya boleh berisi huruf kecil, angka, dan tanda hubung"),
  address: z.string().optional(),
  phone: z.string().optional(),
})

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>
export const assignStaffBranchSchema = z.object({
  branchId: z.string().cuid(),
  staffId: z.string().cuid(),
  roleId: z.string().cuid(),
})

export type AssignStaffBranchInput = z.infer<typeof assignStaffBranchSchema>
