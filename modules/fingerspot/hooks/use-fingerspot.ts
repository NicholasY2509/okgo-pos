"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  getDeviceAction,
  getAttlogAction,
  requestUserIdListAction,
  requestUserInfoAction,
  getRecentPunchLogsAction,
} from "../actions/fingerspot-action"
import {
  type FingerspotAttlogItem,
  type FingerspotDeviceResponse,
} from "../schemas/fingerspot-schema"

export interface MachineOption {
  id: string
  sn: string
  name: string
  branch?: {
    id: string
    name: string
  } | null
}

export function useFingerspot(initialMachines: MachineOption[] = []) {
  const [apiToken, setApiToken] = useState("")
  const [cloudId, setCloudId] = useState(initialMachines[0]?.sn || "")

  // Date defaults: today
  const todayStr = new Date().toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)

  // Loading states
  const [isCheckingDevice, setIsCheckingDevice] = useState(false)
  const [isPullingAttlog, setIsPullingAttlog] = useState(false)
  const [isRequestingUsers, setIsRequestingUsers] = useState(false)
  const [isRequestingUserInfo, setIsRequestingUserInfo] = useState(false)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  // Results
  const [deviceResult, setDeviceResult] = useState<FingerspotDeviceResponse | null>(null)
  const [attlogResults, setAttlogResults] = useState<FingerspotAttlogItem[]>([])
  const [syncSummary, setSyncSummary] = useState<{ imported: number; skipped: number } | null>(null)
  const [asyncCommandStatus, setAsyncCommandStatus] = useState<string | null>(null)
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  // User PIN query input
  const [userPin, setUserPin] = useState("1")
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load API token from localStorage if present
  useEffect(() => {
    const savedToken = localStorage.getItem("fingerspot_api_token")
    if (savedToken) {
      setApiToken(savedToken)
    }
  }, [])

  const saveApiToken = (token: string) => {
    setApiToken(token)
    localStorage.setItem("fingerspot_api_token", token)
    toast.success("API Token tersimpan secara lokal.")
  }

  const fetchRecentLogs = useCallback(async () => {
    setIsLoadingLogs(true)
    const res = await getRecentPunchLogsAction(cloudId || undefined)
    setIsLoadingLogs(false)
    if (res.success && res.data) {
      setRecentLogs(res.data)
    } else if (res.error) {
      toast.error(res.error)
    }
  }, [cloudId])

  useEffect(() => {
    fetchRecentLogs()
  }, [fetchRecentLogs])

  // Live Auto-Refresh polling every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      getRecentPunchLogsAction(cloudId || undefined).then((res) => {
        if (res.success && res.data) {
          setRecentLogs(res.data)
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [autoRefresh, cloudId])

  async function handleCheckDevice() {
    if (!cloudId) {
      toast.error("Pilih atau isi Cloud ID mesin terlebih dahulu.")
      return
    }

    setIsCheckingDevice(true)
    setDeviceResult(null)

    const res = await getDeviceAction({ apiToken, cloudId })
    setIsCheckingDevice(false)

    if (res.error) {
      toast.error(res.error)
    } else if (res.data) {
      setDeviceResult(res.data)
      toast.success("Berhasil memeriksa koneksi perangkat.")
    }
  }

  async function handlePullAttlog(importToDatabase = true) {
    if (!cloudId) {
      toast.error("Pilih atau isi Cloud ID mesin terlebih dahulu.")
      return
    }

    setIsPullingAttlog(true)
    setSyncSummary(null)

    const res = await getAttlogAction({
      apiToken,
      cloudId,
      startDate,
      endDate,
      importToDatabase,
    })

    setIsPullingAttlog(false)

    if (res.error) {
      toast.error(res.error)
    } else if (res.data) {
      const items = res.data.rawResponse.data || []
      setAttlogResults(items)
      setSyncSummary({
        imported: res.data.importedCount,
        skipped: res.data.skippedCount,
      })

      toast.success(
        `Berhasil menarik ${items.length} log dari Fingerspot (${res.data.importedCount} disimpan, ${res.data.skippedCount} dilewati).`
      )
      fetchRecentLogs()
    }
  }

  async function handleRequestUserIdList() {
    if (!cloudId) {
      toast.error("Pilih atau isi Cloud ID mesin terlebih dahulu.")
      return
    }

    setIsRequestingUsers(true)
    setAsyncCommandStatus(null)

    const res = await requestUserIdListAction({ apiToken, cloudId })
    setIsRequestingUsers(false)

    if (res.error) {
      toast.error(res.error)
    } else if (res.data) {
      setAsyncCommandStatus(
        `Perintah daftar user terkirim (Trans ID: ${res.data.transId}). Mesin akan mengirimkan hasil ke Webhook.`
      )
      toast.info("Perintah terkirim ke mesin. Hasil daftar user akan masuk via Webhook.")
    }
  }

  async function handleRequestUserInfo() {
    if (!cloudId || !userPin) {
      toast.error("Cloud ID dan PIN user wajib diisi.")
      return
    }

    setIsRequestingUserInfo(true)
    setAsyncCommandStatus(null)

    const res = await requestUserInfoAction({ apiToken, cloudId, pin: userPin })
    setIsRequestingUserInfo(false)

    if (res.error) {
      toast.error(res.error)
    } else if (res.data) {
      setAsyncCommandStatus(
        `Perintah ambil info user PIN ${userPin} terkirim (Trans ID: ${res.data.transId}). Hasil akan masuk via Webhook.`
      )
      toast.info(`Perintah info user PIN ${userPin} terkirim. Hasil akan masuk via Webhook.`)
    }
  }

  return {
    apiToken,
    saveApiToken,
    cloudId,
    setCloudId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    userPin,
    setUserPin,
    isCheckingDevice,
    isPullingAttlog,
    isRequestingUsers,
    isRequestingUserInfo,
    isLoadingLogs,
    deviceResult,
    attlogResults,
    syncSummary,
    asyncCommandStatus,
    recentLogs,
    autoRefresh,
    setAutoRefresh,
    handleCheckDevice,
    handlePullAttlog,
    handleRequestUserIdList,
    handleRequestUserInfo,
    refreshRecentLogs: fetchRecentLogs,
  }
}

