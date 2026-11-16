import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { GET, POST } from "./route"
import { ServiceSessionService } from "@/modules/service-session/services/service-session-service"
import { prisma } from "@/lib/prisma"

vi.mock("@/modules/service-session/services/service-session-service", () => ({
  ServiceSessionService: {
    getDailyReviewableSessions: vi.fn(),
    submitReview: vi.fn(),
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    serviceSession: {
      findUnique: vi.fn(),
    },
  },
}))

describe("/api/portal/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("GET returns 400 when branchId is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/portal/reviews")
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe("ID cabang wajib diisi.")
    expect(
      ServiceSessionService.getDailyReviewableSessions
    ).not.toHaveBeenCalled()
  })

  it("GET returns 200 with mapped reviewable sessions", async () => {
    const endTime = new Date("2026-11-15T11:30:00.000Z")
    vi.mocked(
      ServiceSessionService.getDailyReviewableSessions
    ).mockResolvedValueOnce([
      {
        id: "sess_1",
        actualEndTime: endTime,
        staff: {
          firstName: "Siti",
          imageUrl: "https://example.com/siti.jpg",
        },
        transactionItem: {
          itemNameSnapshot: "Traditional Balinese Massage 90m",
          transaction: {
            customer: {
              name: "Budi Santoso",
            },
          },
        },
      } as never,
    ])

    const req = new NextRequest(
      "http://localhost:3000/api/portal/reviews?branchId=br_juanda"
    )
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toEqual([
      {
        id: "sess_1",
        customerName: "Budi Santoso",
        itemName: "Traditional Balinese Massage 90m",
        staffName: "Siti",
        staffImageUrl: "https://example.com/siti.jpg",
        actualEndTime: "2026-11-15T11:30:00.000Z",
      },
    ])
  })

  it("POST returns 400 for invalid rating", async () => {
    const req = new NextRequest("http://localhost:3000/api/portal/reviews", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "sess_1",
        branchId: "br_juanda",
        rating: 6,
      }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe("Rating maksimal 5 bintang.")
  })

  it("POST returns 404 when session is not found in branch", async () => {
    vi.mocked(prisma.serviceSession.findUnique).mockResolvedValueOnce(null)

    const req = new NextRequest("http://localhost:3000/api/portal/reviews", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "sess_1",
        branchId: "br_juanda",
        rating: 5,
        comment: "Mantap",
      }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toBe("Sesi layanan tidak ditemukan pada cabang ini.")
  })

  it("POST submits review and returns 200", async () => {
    vi.mocked(prisma.serviceSession.findUnique).mockResolvedValueOnce({
      id: "sess_1",
      branchId: "br_juanda",
      status: "COMPLETED",
      rating: null,
    } as never)

    vi.mocked(ServiceSessionService.submitReview).mockResolvedValueOnce({
      id: "sess_1",
      rating: 5,
      reviewComment: "Pelayanan sangat ramah",
    } as never)

    const req = new NextRequest("http://localhost:3000/api/portal/reviews", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "sess_1",
        branchId: "br_juanda",
        rating: 5,
        comment: "Pelayanan sangat ramah",
      }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(ServiceSessionService.submitReview).toHaveBeenCalledWith(
      "sess_1",
      5,
      "Pelayanan sangat ramah"
    )
    expect(json.success).toBe(true)
    expect(json.data).toEqual({
      id: "sess_1",
      rating: 5,
      reviewComment: "Pelayanan sangat ramah",
    })
  })
})
