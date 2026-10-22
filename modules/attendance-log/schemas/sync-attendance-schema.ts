import { z } from "zod"

export const syncAttendanceSchema = z.object({
  ipAddress: z.string().min(1, "Alamat IP mesin wajib diisi"),
  username: z.string().min(1, "Username mesin wajib diisi"),
  password: z.string().min(1, "Password mesin wajib diisi"),
  count: z.number().int().positive(),
  ignoreUnrecognized: z.boolean()
})

export type SyncAttendanceInput = z.infer<typeof syncAttendanceSchema>

export interface RawAttendanceDeviceRecord {
  recNo: number
  sn: string
  userId: string | null
  cardName: string | null
  cardNo: string | null
  attendanceState: number
  method: number
  utcTime: Date | null
  rawUtcString: string
  url: string | null
  status: number
  similarity: number | null
  rawText: string
}

export interface SyncAttendanceResult {
  totalFound: number
  imported: number
  skipped: number
  unrecognizedSkipped: number
  deviceSn: string
  machineName?: string
}
