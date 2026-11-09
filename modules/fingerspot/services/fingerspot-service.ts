import { FingerspotRepository } from "../repositories/fingerspot-repository"
import {
  type FingerspotAttlogInput,
  type FingerspotAttlogResponse,
  type FingerspotDeviceInput,
  type FingerspotDeviceResponse,
  type FingerspotUserIdListInput,
  type FingerspotUserInfoInput,
  type FingerspotSetUserInfoInput,
} from "../schemas/fingerspot-schema"
import { AttendanceService } from "@/modules/attendance/services/attendance-service"

const FINGERSPOT_BASE_URL = "https://developer.fingerspot.io"

const VERIFY_MAP: Record<number, string> = {
  1: "Sidik Jari",
  2: "Password",
  3: "Kartu RFID",
  4: "Wajah",
  6: "Telapak Tangan / Vena",
  7: "QR Code",
}

const STATUS_MAP: Record<number, { state: number; name: string }> = {
  0: { state: 1, name: "Masuk" },
  1: { state: 4, name: "Pulang" },
  2: { state: 2, name: "Mulai Istirahat" },
  3: { state: 3, name: "Selesai Istirahat" },
  4: { state: 5, name: "Mulai Lembur" },
  5: { state: 6, name: "Selesai Lembur" },
}

export class FingerspotService {
  private static resolveToken(providedToken?: string): string {
    const token = providedToken?.trim() || process.env.FINGERSPOT_API_TOKEN || ""
    if (!token) {
      throw new Error(
        "Fingerspot API Token belum diisi. Masukkan token di formulir atau atur FINGERSPOT_API_TOKEN di environment."
      )
    }
    return token
  }

  static async getDevice(input: FingerspotDeviceInput): Promise<FingerspotDeviceResponse> {
    const token = this.resolveToken(input.apiToken)

    const response = await fetch(`${FINGERSPOT_BASE_URL}/api/get_device`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        trans_id: `dev-${Date.now()}`,
        cloud_id: input.cloudId,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gagal menghubungi server Fingerspot (HTTP ${response.status}): ${errText}`)
    }

    return (await response.json()) as FingerspotDeviceResponse
  }

  static async getAttlog(input: FingerspotAttlogInput): Promise<{
    rawResponse: FingerspotAttlogResponse
    importedCount: number
    skippedCount: number
  }> {
    const token = this.resolveToken(input.apiToken)

    const transId = `att-${Date.now()}`
    const response = await fetch(`${FINGERSPOT_BASE_URL}/api/get_attlog`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        trans_id: transId,
        cloud_id: input.cloudId,
        start_date: input.startDate,
        end_date: input.endDate,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gagal mengambil log absensi (HTTP ${response.status}): ${errText}`)
    }

    const data = (await response.json()) as FingerspotAttlogResponse
    let importedCount = 0
    let skippedCount = 0

    if (input.importToDatabase && data.data && Array.isArray(data.data)) {
      const machine = await FingerspotRepository.findMachineBySn(input.cloudId)

      for (const item of data.data) {
        const pin = String(item.pin ?? "")
        const dateString = item.time || item.scan_date || ""
        const scanDate = dateString ? new Date(dateString.replace(" ", "T")) : null
        if (!scanDate) continue

        // Check if log already exists
        const existing = await FingerspotRepository.checkExistingLog(input.cloudId, pin, scanDate)
        if (existing) {
          skippedCount++
          continue
        }

        const rawStatus = Number(item.status ?? item.status_scan ?? 0)
        const rawVerify = Number(item.verif ?? item.verify ?? 1)
        const statusMeta = STATUS_MAP[rawStatus] || { state: 1, name: `Status (${rawStatus})` }
        const verifyName = VERIFY_MAP[rawVerify] || "Biometrik"

        let staffId: string | null = null
        if (machine && pin) {
          const staffMachine = await FingerspotRepository.findStaffMachine(machine.id, pin)
          if (staffMachine) {
            staffId = staffMachine.staffId
          }
        }

        await FingerspotRepository.createLog({
          machineUserId: pin,
          cardName: `${verifyName} (Sync API)`,
          attendanceState: statusMeta.state,
          punchType: statusMeta.name,
          deviceSn: input.cloudId,
          branchId: machine?.branchId,
          staffId,
          utcTime: scanDate,
          rawPayload: JSON.stringify(item),
        })

        if (staffId && machine) {
          await AttendanceService.processPunch(staffId, scanDate, String(statusMeta.state), machine.id)
        }

        importedCount++
      }
    }

    return {
      rawResponse: data,
      importedCount,
      skippedCount,
    }
  }

  static async requestUserIdList(input: FingerspotUserIdListInput) {
    const token = this.resolveToken(input.apiToken)
    const transId = `uid-${Date.now()}`

    const response = await fetch(`${FINGERSPOT_BASE_URL}/api/get_all_pin`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        trans_id: transId,
        cloud_id: input.cloudId,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gagal meminta daftar user (HTTP ${response.status}): ${errText}`)
    }

    const json = await response.json()
    return {
      transId,
      result: json,
    }
  }

  static async requestUserInfo(input: FingerspotUserInfoInput) {
    const token = this.resolveToken(input.apiToken)
    const transId = `uinfo-${Date.now()}`

    const response = await fetch(`${FINGERSPOT_BASE_URL}/api/get_userinfo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        trans_id: transId,
        cloud_id: input.cloudId,
        pin: input.pin,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gagal meminta info user (HTTP ${response.status}): ${errText}`)
    }

    const json = await response.json()
    return {
      transId,
      result: json,
    }
  }

  static async setUserInfo(input: FingerspotSetUserInfoInput) {
    const token = this.resolveToken(input.apiToken)
    const transId = `setu-${Date.now()}`

    const response = await fetch(`${FINGERSPOT_BASE_URL}/api/set_userinfo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        trans_id: transId,
        cloud_id: input.cloudId,
        data: input.data,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gagal mengirim data user (HTTP ${response.status}): ${errText}`)
    }

    const json = await response.json()
    return {
      transId,
      result: json,
    }
  }

  static async getRecentLogs(limit = 20, deviceSn?: string) {
    return await FingerspotRepository.getRecentLogs(limit, deviceSn)
  }

  static async getActiveMachines() {
    return await FingerspotRepository.getActiveMachines()
  }
}

