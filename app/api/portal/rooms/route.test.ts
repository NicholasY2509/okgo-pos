import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "./route"
import { RoomService } from "@/modules/room/services/room-service"

vi.mock("@/modules/room/services/room-service", () => ({
  RoomService: {
    getByBranchId: vi.fn(),
  },
}))

describe("GET /api/portal/rooms", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when branchId query parameter is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/portal/rooms")
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe("ID cabang wajib diisi.")
    expect(RoomService.getByBranchId).not.toHaveBeenCalled()
  })

  it("returns 200 with branch rooms list when branchId is valid", async () => {
    vi.mocked(RoomService.getByBranchId).mockResolvedValueOnce([
      {
        id: "rm_1",
        name: "Kamar 101",
        capacity: 2,
        isVip: false,
        isActive: true,
        branchId: "br_juanda",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "rm_2",
        name: "Suite VIP 1",
        capacity: 4,
        isVip: true,
        isActive: true,
        branchId: "br_juanda",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    const req = new NextRequest(
      "http://localhost:3000/api/portal/rooms?branchId=br_juanda"
    )
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(RoomService.getByBranchId).toHaveBeenCalledWith("br_juanda")
    expect(json.success).toBe(true)
    expect(json.data).toEqual([
      {
        id: "rm_1",
        name: "Kamar 101",
        capacity: 2,
        isVip: false,
        isActive: true,
        branchId: "br_juanda",
      },
      {
        id: "rm_2",
        name: "Suite VIP 1",
        capacity: 4,
        isVip: true,
        isActive: true,
        branchId: "br_juanda",
      },
    ])
  })
})

