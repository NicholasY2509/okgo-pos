import { z } from "zod"

export const createStaffSchema = z.object({
  firstName: z.string().min(1, "Nama depan wajib diisi"),
  lastName: z.string().min(1, "Nama belakang wajib diisi"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")).nullable(),
  isActive: z.boolean().default(true),
  workPositionId: z.string().min(1, "Posisi kerja wajib diisi"),
  level: z.string().optional().nullable(),
  staffIdNumber: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  pin: z.string().min(4, "PIN minimal 4 digit").optional().nullable().or(z.literal("")),
})

export type CreateStaffInput = z.input<typeof createStaffSchema>

export const updateStaffSchema = createStaffSchema.extend({
  id: z.string().min(1, "ID wajib diisi"),
})

export type UpdateStaffInput = z.input<typeof updateStaffSchema>

export const portalBranchStaffFacesQuerySchema = z.object({
  branchId: z.string().min(1, "ID cabang wajib diisi."),
})

export type PortalBranchStaffFacesQuery = z.infer<typeof portalBranchStaffFacesQuerySchema>

export const registerStaffFaceSchema = z.object({
  staffId: z.string().min(1, "ID staf wajib diisi."),
  branchId: z.string().min(1, "ID cabang wajib diisi."),
  email: z.string().email("Email pengguna tidak valid."),
  password: z.string().min(1, "Kata sandi pengguna wajib diisi."),
  embedding: z
    .array(z.number().finite("Nilai vektor harus berupa angka valid."))
    .min(64, "Dimensi vektor wajah minimal 64.")
    .max(512, "Dimensi vektor wajah maksimal 512."),
})

export type RegisterStaffFaceInput = z.infer<typeof registerStaffFaceSchema>
