import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "./route"
import { TimetableService } from "@/modules/pos/services/timetable-service"

vi.mock("@/modules/pos/services/timetable-service", () => ({
  TimetableService: {
    getRoomSessions: vi.fn(),
  },
}))

describe("GET /api/portal/rooms/[roomId]/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when branchId query parameter is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/portal/rooms/rm_101/sessions"
    )
    const res = await GET(req, { params: Promise.resolve({ roomId: "rm_101" }) })
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe("ID cabang wajib diisi.")
    expect(TimetableService.getRoomSessions).not.toHaveBeenCalled()
  })

  it("returns 200 with room sessions when branchId and roomId are valid", async () => {
    vi.mocked(TimetableService.getRoomSessions).mockResolvedValueOnce([
      {
        id: "sess_1",
        roomId: "rm_101",
        branchId: "br_juanda",
        serviceId: "srv_1",
        itemName: "Balinese Massage 90 Menit",
        customerName: "Siti Aminah",
        staffId: "stf_dewi",
        staffName: "Dewi Lestari",
        status: "SCHEDULED",
        isVip: false,
        isBooking: true,
        bookingNumber: "BK-001",
        startTime: new Date("2026-10-28T13:00:00.000Z"),
        endTime: new Date("2026-10-28T14:30:00.000Z"),
        actualStartTime: null,
        actualEndTime: null,
      } as never,
    ])

    const req = new NextRequest(
      "http://localhost:3000/api/portal/rooms/rm_101/sessions?branchId=br_juanda"
    )
    const res = await GET(req, { params: Promise.resolve({ roomId: "rm_101" }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(TimetableService.getRoomSessions).toHaveBeenCalledWith(
      "br_juanda",
      "rm_101",
      undefined
    )
    expect(json.success).toBe(true)
    expect(json.data).toEqual([
      {
        id: "sess_1",
        roomId: "rm_101",
        branchId: "br_juanda",
        serviceId: "srv_1",
        itemName: "Balinese Massage 90 Menit",
        customerName: "Siti Aminah",
        staffId: "stf_dewi",
        staffName: "Dewi Lestari",
        status: "SCHEDULED",
        isVip: false,
        isBooking: true,
        bookingNumber: "BK-001",
        startTime: "2026-10-28T13:00:00.000Z",
        endTime: "2026-10-28T14:30:00.000Z",
        actualStartTime: null,
        actualEndTime: null,
      },
    ])
  })
})

