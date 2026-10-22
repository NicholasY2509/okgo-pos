"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  syncAttendanceFromMachineAction,
  purgeUnrecognizedLogsAction
} from "../actions/sync-attendance-action"
import {
  syncAttendanceSchema,
  type SyncAttendanceInput,
  type SyncAttendanceResult
} from "../schemas/sync-attendance-schema"

export function useSyncAttendance() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isPurging, setIsPurging] = useState(false)
  const [result, setResult] = useState<SyncAttendanceResult | null>(null)

  const form = useForm<SyncAttendanceInput>({
    resolver: zodResolver(syncAttendanceSchema),
    defaultValues: {
      ipAddress: "192.168.1.231",
      username: "admin",
      password: "Fingerspot",
      count: 1000,
      ignoreUnrecognized: true
    }
  })

  async function handleSync(data: SyncAttendanceInput) {
    setIsSyncing(true)
    setResult(null)

    try {
      const res = await syncAttendanceFromMachineAction(data)

      if (res.error) {
        toast.error(res.error)
      } else if (res.data) {
        setResult(res.data)
        const skippedMsg = res.data.unrecognizedSkipped > 0
          ? `${res.data.skipped} sudah ada, ${res.data.unrecognizedSkipped} tidak dikenal dilewati`
          : `${res.data.skipped} sudah ada di database`
        toast.success(
          `Berhasil menarik ${res.data.imported} log baru (${skippedMsg}).`
        )
      }
    } catch {
      toast.error("Gagal terhubung ke mesin absensi.")
    } finally {
      setIsSyncing(false)
    }
  }

  async function handlePurge(branchId?: string) {
    setIsPurging(true)
    try {
      const res = await purgeUnrecognizedLogsAction(branchId)
      if (res.error) {
        toast.error(res.error)
      } else if (res.data) {
        toast.success(
          `Berhasil membersihkan ${res.data.deletedCount} log scan tidak dikenal.`
        )
      }
    } catch {
      toast.error("Gagal membersihkan log tidak dikenal.")
    } finally {
      setIsPurging(false)
    }
  }

  return {
    form,
    isSyncing,
    isPurging,
    result,
    onSubmit: form.handleSubmit(handleSync),
    quickSync: () => handleSync(form.getValues()),
    purgeUnrecognized: handlePurge
  }
}
