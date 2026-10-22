import crypto from "crypto"
import { AttendanceSyncRepository } from "../repositories/attendance-sync-repository"
import {
  RawAttendanceDeviceRecord,
  SyncAttendanceInput,
  SyncAttendanceResult
} from "../schemas/sync-attendance-schema"
import { AttendanceService } from "@/modules/attendance/services/attendance-service"

const ATTENDANCE_STATES: Record<number, string> = {
  0: "Scan Normal",
  1: "Masuk",
  2: "Mulai Istirahat",
  3: "Selesai Istirahat",
  4: "Pulang",
  5: "Mulai Lembur",
  6: "Selesai Lembur"
}

function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex")
}

async function digestFetch(url: string, username: string, password: string): Promise<Response> {
  const parsed = new URL(url)
  const uri = parsed.pathname + parsed.search

  const initialResponse = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(8000)
  })
  if (initialResponse.status !== 401) {
    return initialResponse
  }

  const authHeader = initialResponse.headers.get("www-authenticate") || ""
  const parseField = (name: string): string => {
    const match = authHeader.match(new RegExp(`${name}="?([^",]+)"?`))
    return match ? match[1] : ""
  }

  const realm = parseField("realm")
  const nonce = parseField("nonce")
  const qop = parseField("qop")
  const opaque = parseField("opaque")
  const nc = "00000001"
  const cnonce = crypto.randomBytes(8).toString("hex")

  const ha1 = md5(`${username}:${realm}:${password}`)
  const ha2 = md5(`GET:${uri}`)

  let responseHash = ""
  if (qop === "auth") {
    responseHash = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
  } else {
    responseHash = md5(`${ha1}:${nonce}:${ha2}`)
  }

  let authString = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${responseHash}"`
  if (qop) {
    authString += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`
  }
  if (opaque) {
    authString += `, opaque="${opaque}"`
  }

  return await fetch(url, {
    method: "GET",
    headers: {
      Authorization: authString
    },
    signal: AbortSignal.timeout(15000)
  })
}

export class AttendanceSyncService {
  static parseRawRecords(rawText: string): RawAttendanceDeviceRecord[] {
    const map: Record<number, Record<string, string>> = {}

    for (const rawLine of rawText.split("\n")) {
      const line = rawLine.trim()
      const match = line.match(/^records\[(\d+)\]\.(\w+)=(.*)$/)
      if (!match) continue

      const index = parseInt(match[1], 10)
      const key = match[2]
      const value = match[3]

      if (!map[index]) {
        map[index] = {}
      }
      map[index][key] = value
    }

    const records: RawAttendanceDeviceRecord[] = []

    for (const rawIndex of Object.keys(map)) {
      const item = map[parseInt(rawIndex, 10)]
      const utcTimeStr = item.UTCTime || ""
      const parsedUtc = utcTimeStr ? new Date(utcTimeStr.replace(" ", "T") + "Z") : null

      records.push({
        recNo: item.RecNo ? parseInt(item.RecNo, 10) : 0,
        sn: item.SN || "",
        userId: item.UserID ? item.UserID.trim() : null,
        cardName: item.CardName ? item.CardName.trim() : null,
        cardNo: item.CardNo ? item.CardNo.trim() : null,
        attendanceState: item.AttendanceState ? parseInt(item.AttendanceState, 10) : 0,
        method: item.Method ? parseInt(item.Method, 10) : 0,
        utcTime: parsedUtc && !isNaN(parsedUtc.getTime()) ? parsedUtc : null,
        rawUtcString: utcTimeStr,
        url: item.URL || null,
        status: item.Status ? parseInt(item.Status, 10) : 0,
        similarity: item.Similarity ? parseInt(item.Similarity, 10) : null,
        rawText: JSON.stringify(item)
      })
    }

    return records
  }

  static async fetchRawRecordsFromDevice(input: SyncAttendanceInput): Promise<{
    deviceSn: string
    records: RawAttendanceDeviceRecord[]
  }> {
    const { ipAddress, username, password, count = 1000 } = input
    const url = `http://${ipAddress}/cgi-bin/recordFinder.cgi?action=find&name=AccessControlCardRec&count=${count}`

    const response = await digestFetch(url, username, password)
    if (!response.ok) {
      throw new Error(`Gagal menghubungi mesin (HTTP ${response.status}): ${response.statusText}`)
    }

    const rawText = await response.text()
    const records = this.parseRawRecords(rawText)

    let deviceSn = records.find((r) => r.sn)?.sn || ""
    if (!deviceSn) {
      const typeRes = await digestFetch(
        `http://${ipAddress}/cgi-bin/magicBox.cgi?action=getDeviceType`,
        username,
        password
      )
      if (typeRes.ok) {
        const typeText = await typeRes.text()
        deviceSn = typeText.match(/SN=([^\r\n]+)/)?.[1] || ""
      }
    }

    return {
      deviceSn,
      records
    }
  }

  static async syncAttendanceLogs(input: SyncAttendanceInput): Promise<SyncAttendanceResult> {
    const { deviceSn, records } = await this.fetchRawRecordsFromDevice(input)

    if (!deviceSn && records.length === 0) {
      return {
        totalFound: 0,
        imported: 0,
        skipped: 0,
        unrecognizedSkipped: 0,
        deviceSn: ""
      }
    }

    const machine = await AttendanceSyncRepository.findMachineBySn(deviceSn)
    const branchId = machine?.branchId || null

    let imported = 0
    let skipped = 0
    let unrecognizedSkipped = 0

    for (const record of records) {
      if (!record.utcTime) {
        skipped++
        continue
      }

      // Check if this record is an unrecognized detection (e.g. stranger / passerby)
      const isUnrecognized =
        !record.userId ||
        record.userId.trim() === "" ||
        record.status === 0 ||
        record.cardName === "Tidak Dikenal" ||
        record.cardName === ""

      if (input.ignoreUnrecognized && isUnrecognized) {
        unrecognizedSkipped++
        continue
      }

      const existing = await AttendanceSyncRepository.findExistingLog(
        record.sn || deviceSn,
        record.utcTime
      )

      if (existing) {
        skipped++
        continue
      }

      let staffId: string | null = null
      if (machine && record.userId) {
        const staffMachine = await AttendanceSyncRepository.findStaffMachine(
          machine.id,
          record.userId
        )
        if (staffMachine) {
          staffId = staffMachine.staffId
        }
      }

      const punchType =
        ATTENDANCE_STATES[record.attendanceState] || `Tidak Dikenal (${record.attendanceState})`

      const savedLog = await AttendanceSyncRepository.createLog({
        machineUserId: record.userId,
        cardName: record.cardName || (record.userId ? `User ${record.userId}` : "Tidak Dikenal"),
        attendanceState: record.attendanceState,
        punchType,
        deviceSn: record.sn || deviceSn,
        branchId,
        staffId,
        similarity: record.similarity,
        utcTime: record.utcTime,
        rawPayload: record.rawText
      })

      if (staffId && machine && record.utcTime) {
        try {
          await AttendanceService.processPunch(
            staffId,
            savedLog.createdAt,
            String(record.attendanceState),
            machine.id
          )
        } catch {
          // Keep import intact even if punch calculation encounters an edge case
        }
      }

      imported++
    }

    return {
      totalFound: records.length,
      imported,
      skipped,
      unrecognizedSkipped,
      deviceSn,
      machineName: machine?.name
    }
  }

  static async purgeUnrecognizedLogs(branchId?: string): Promise<{ deletedCount: number }> {
    const result = await AttendanceSyncRepository.purgeUnrecognizedLogs(branchId)
    return {
      deletedCount: result.count
    }
  }
}
