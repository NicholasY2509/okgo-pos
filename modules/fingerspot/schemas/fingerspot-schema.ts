import { z } from "zod"

export const fingerspotAttlogSchema = z.object({
  apiToken: z.string().optional(),
  cloudId: z.string().min(1, "Cloud ID wajib diisi"),
  startDate: z.string().min(10, "Format tanggal YYYY-MM-DD wajib diisi"),
  endDate: z.string().min(10, "Format tanggal YYYY-MM-DD wajib diisi"),
  importToDatabase: z.boolean().default(true),
})

export type FingerspotAttlogInput = z.infer<typeof fingerspotAttlogSchema>

export const fingerspotDeviceSchema = z.object({
  apiToken: z.string().optional(),
  cloudId: z.string().min(1, "Cloud ID wajib diisi"),
})

export type FingerspotDeviceInput = z.infer<typeof fingerspotDeviceSchema>

export const fingerspotUserIdListSchema = z.object({
  apiToken: z.string().optional(),
  cloudId: z.string().min(1, "Cloud ID wajib diisi"),
})

export type FingerspotUserIdListInput = z.infer<typeof fingerspotUserIdListSchema>

export const fingerspotUserInfoSchema = z.object({
  apiToken: z.string().optional(),
  cloudId: z.string().min(1, "Cloud ID wajib diisi"),
  pin: z.string().min(1, "PIN user wajib diisi"),
})

export type FingerspotUserInfoInput = z.infer<typeof fingerspotUserInfoSchema>

export const fingerspotSetUserInfoSchema = z.object({
  apiToken: z.string().optional(),
  cloudId: z.string().min(1, "Cloud ID wajib diisi"),
  data: z.object({
    pin: z.string().min(1, "PIN wajib diisi"),
    name: z.string().min(1, "Nama wajib diisi"),
    privilege: z.union([z.string(), z.number()]).default("1"),
    password: z.string().optional().default(""),
    rfid: z.string().optional().default(""),
    template: z.string().optional().default(""),
  }),
})

export type FingerspotSetUserInfoInput = z.infer<typeof fingerspotSetUserInfoSchema>

export interface FingerspotAttlogItem {
  pin: string
  scan_date?: string
  time?: string
  verify?: number | string
  verif?: number | string
  status_scan?: number | string
  status?: number | string
  work_code?: string
  photo?: string
  photo_url?: string
}

export interface FingerspotAttlogResponse {
  success: boolean
  trans_id?: string
  data?: FingerspotAttlogItem[]
  message?: string
}

export interface FingerspotDeviceResponse {
  success: boolean
  trans_id?: string
  data?: {
    cloud_id?: string
    device_name?: string
    webhook_url?: string
    status?: string | number
    [key: string]: unknown
  }
  message?: string
}

