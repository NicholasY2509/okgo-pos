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

export const updateBranchSettingsSchema = z.object({
  branchId: z.string().cuid(),
  maxDailyBookings: z
    .number({ error: "Batas booking harus berupa angka" })
    .int("Batas booking harus berupa bilangan bulat")
    .min(1, "Minimal 1 slot booking per hari")
    .nullable(),
})

export type UpdateBranchSettingsInput = z.infer<typeof updateBranchSettingsSchema>
export const assignStaffBranchSchema = z.object({
  branchId: z.string().min(1, "Cabang wajib dipilih"),
  staffId: z.string().min(1, "Staf wajib dipilih"),
  roleId: z.string().min(1, "Peran wajib dipilih"),
})

export type AssignStaffBranchInput = z.infer<typeof assignStaffBranchSchema>

export const bulkAssignStaffSchema = z.object({
  branchId: z.string().min(1, "Cabang tujuan wajib dipilih"),
  roleId: z.string().min(1, "Peran wajib dipilih"),
  staffIds: z.array(z.string().min(1)).min(1, "Pilih setidaknya satu staf"),
})

export type BulkAssignStaffInput = z.infer<typeof bulkAssignStaffSchema>

export const transferBranchStaffSchema = z.object({
  staffId: z.string().min(1, "Staf wajib dipilih"),
  currentBranchId: z.string().optional(),
  targetBranchId: z.string().min(1, "Cabang tujuan wajib dipilih"),
  roleId: z.string().min(1, "Peran wajib dipilih"),
})

export type TransferBranchStaffInput = z.infer<typeof transferBranchStaffSchema>

export const bulkTransferStaffSchema = z.object({
  staffIds: z.array(z.string().min(1)).min(1, "Pilih setidaknya satu staf"),
  targetBranchId: z.string().min(1, "Cabang tujuan wajib dipilih"),
  roleId: z.string().min(1, "Peran wajib dipilih"),
})

export type BulkTransferStaffInput = z.infer<typeof bulkTransferStaffSchema>
