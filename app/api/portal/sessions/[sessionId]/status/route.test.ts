import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route"
import { TimetableService } from "@/modules/pos/services/timetable-service"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    serviceSession: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/modules/pos/services/timetable-service", () => ({
  TimetableService: {
    startSession: vi.fn(),
    completeSession: vi.fn(),
    updateSessionStaff: vi.fn(),
  },
}))

describe("POST /api/portal/sessions/[sessionId]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when payload is invalid", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/portal/sessions/sess_1/status",
      {
        method: "POST",
        body: JSON.stringify({ action: "INVALID" }),
      }
    )
    const res = await POST(req, {
      params: Promise.resolve({ sessionId: "sess_1" }),
    })
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBeDefined()
  })

  it("returns 403 when verified staffId does not match session assigned staffId", async () => {
    vi.mocked(prisma.serviceSession.findUnique).mockResolvedValueOnce({
      id: "sess_1",
      branchId: "br_juanda",
      staffId: "stf_budi",
    } as never)

    const req = new NextRequest(
      "http://localhost:3000/api/portal/sessions/sess_1/status",
      {
        method: "POST",
        body: JSON.stringify({
          branchId: "br_juanda",
          action: "START",
          staffId: "stf_other",
        }),
      }
    )
    const res = await POST(req, {
      params: Promise.resolve({ sessionId: "sess_1" }),
    })
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.error).toContain("Terapis yang terverifikasi tidak cocok")
  })

  it("starts the session successfully when staff is verified and matched", async () => {
    vi.mocked(prisma.serviceSession.findUnique)
      .mockResolvedValueOnce({
        id: "sess_1",
        branchId: "br_juanda",
        staffId: "stf_budi",
      } as never)
      .mockResolvedValueOnce({
        id: "sess_1",
        status: "IN_PROGRESS",
        roomId: "rm_101",
        branchId: "br_juanda",
      } as never)

    const req = new NextRequest(
      "http://localhost:3000/api/portal/sessions/sess_1/status",
      {
        method: "POST",
        body: JSON.stringify({
          branchId: "br_juanda",
          action: "START",
          staffId: "stf_budi",
        }),
      }
    )
    const res = await POST(req, {
      params: Promise.resolve({ sessionId: "sess_1" }),
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(TimetableService.startSession).toHaveBeenCalledWith("sess_1")
    expect(json.success).toBe(true)
    expect(json.data.status).toBe("IN_PROGRESS")
  })
})

