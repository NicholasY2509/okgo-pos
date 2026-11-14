import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { GET, POST } from "./route"
import { AuthService } from "@/modules/auth/services/auth-service"
import { StaffService } from "@/modules/staff/services/staff-service"

vi.mock("@/modules/auth/services/auth-service", () => ({
  AuthService: {
    verifyCredentials: vi.fn(),
  },
}))

vi.mock("@/modules/staff/services/staff-service", () => ({
  StaffService: {
    getBranchStaffFaceProfiles: vi.fn(),
    registerStaffFace: vi.fn(),
  },
}))

describe("/api/portal/staff/faces", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET", () => {
    it("returns 400 when branchId is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/portal/staff/faces")
      const res = await GET(req)
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toBe("ID cabang wajib diisi.")
      expect(StaffService.getBranchStaffFaceProfiles).not.toHaveBeenCalled()
    })

    it("returns 200 with staff face profiles for the branch", async () => {
      const mockEmbedding = Array.from({ length: 192 }, (_, i) => (i === 0 ? 1 : 0))
      vi.mocked(StaffService.getBranchStaffFaceProfiles).mockResolvedValueOnce([
        {
          id: "stf_1",
          name: "Dewi Lestari",
          firstName: "Dewi",
          lastName: "Lestari",
          staffIdNumber: "STF-001",
          position: "Therapist",
          imageUrl: null,
          hasFaceRegistered: true,
          faceEmbedding: mockEmbedding,
          faceRegisteredAt: "2026-11-01T10:00:00.000Z",
        },
      ])

      const req = new NextRequest(
        "http://localhost:3000/api/portal/staff/faces?branchId=br_juanda"
      )
      const res = await GET(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toHaveLength(1)
      expect(json.data[0].id).toBe("stf_1")
      expect(json.data[0].hasFaceRegistered).toBe(true)
      expect(StaffService.getBranchStaffFaceProfiles).toHaveBeenCalledWith(
        "br_juanda"
      )
    })
  })

  describe("POST", () => {
    it("returns 400 when password is missing", async () => {
      const mockEmbedding = Array.from({ length: 192 }, (_, i) => (i === 0 ? 1 : 0))
      const req = new NextRequest("http://localhost:3000/api/portal/staff/faces", {
        method: "POST",
        body: JSON.stringify({
          staffId: "stf_1",
          branchId: "br_juanda",
          email: "admin@nyenyak.com",
          password: "",
          embedding: mockEmbedding,
        }),
      })
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toBe("Kata sandi pengguna wajib diisi.")
      expect(AuthService.verifyCredentials).not.toHaveBeenCalled()
      expect(StaffService.registerStaffFace).not.toHaveBeenCalled()
    })

    it("returns 401 when user password verification fails", async () => {
      const mockEmbedding = Array.from({ length: 192 }, (_, i) => (i === 0 ? 1 : 0))
      vi.mocked(AuthService.verifyCredentials).mockRejectedValueOnce(
        new Error("Kata sandi yang Anda masukkan salah.")
      )

      const req = new NextRequest("http://localhost:3000/api/portal/staff/faces", {
        method: "POST",
        body: JSON.stringify({
          staffId: "stf_1",
          branchId: "br_juanda",
          email: "admin@nyenyak.com",
          password: "wrong-password",
          embedding: mockEmbedding,
        }),
      })
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(401)
      expect(json.error).toBe("Kata sandi yang Anda masukkan salah.")
      expect(AuthService.verifyCredentials).toHaveBeenCalledWith(
        "admin@nyenyak.com",
        "wrong-password"
      )
      expect(StaffService.registerStaffFace).not.toHaveBeenCalled()
    })

    it("returns 400 when embedding dimension is invalid (< 64)", async () => {
      const req = new NextRequest("http://localhost:3000/api/portal/staff/faces", {
        method: "POST",
        body: JSON.stringify({
          staffId: "stf_1",
          branchId: "br_juanda",
          email: "admin@nyenyak.com",
          password: "secret123",
          embedding: [0.5, 0.5],
        }),
      })
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toBe("Dimensi vektor wajah minimal 64.")
      expect(AuthService.verifyCredentials).not.toHaveBeenCalled()
      expect(StaffService.registerStaffFace).not.toHaveBeenCalled()
    })

    it("returns 200 and updated profile when valid credentials and face embedding are submitted", async () => {
      const mockEmbedding = Array.from({ length: 192 }, (_, i) => (i === 0 ? 1 : 0))
      vi.mocked(AuthService.verifyCredentials).mockResolvedValueOnce({
        id: "usr_1",
        name: "Admin Juanda",
        email: "admin@nyenyak.com",
        role: { name: "Admin Cabang" },
        branch: {
          id: "br_juanda",
          name: "Nyenyak Juanda",
          subdomain: "juanda",
        },
      })
      vi.mocked(StaffService.registerStaffFace).mockResolvedValueOnce({
        id: "stf_1",
        name: "Dewi Lestari",
        firstName: "Dewi",
        lastName: "Lestari",
        staffIdNumber: "STF-001",
        position: "Therapist",
        imageUrl: null,
        hasFaceRegistered: true,
        faceEmbedding: mockEmbedding,
        faceRegisteredAt: "2026-11-01T12:00:00.000Z",
      })

      const req = new NextRequest("http://localhost:3000/api/portal/staff/faces", {
        method: "POST",
        body: JSON.stringify({
          staffId: "stf_1",
          branchId: "br_juanda",
          email: "admin@nyenyak.com",
          password: "secret123",
          embedding: mockEmbedding,
        }),
      })
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.id).toBe("stf_1")
      expect(json.data.hasFaceRegistered).toBe(true)
      expect(AuthService.verifyCredentials).toHaveBeenCalledWith(
        "admin@nyenyak.com",
        "secret123"
      )
      expect(StaffService.registerStaffFace).toHaveBeenCalledWith({
        staffId: "stf_1",
        branchId: "br_juanda",
        email: "admin@nyenyak.com",
        password: "secret123",
        embedding: mockEmbedding,
      })
    })
  })
})

