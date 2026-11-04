import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route"
import { AuthService } from "@/modules/auth/services/auth-service"

vi.mock("@/modules/auth/services/auth-service", () => ({
  AuthService: {
    verifyCredentials: vi.fn(),
  },
}))

function createJsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/portal/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/portal/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when payload fails loginSchema validation", async () => {
    const req = createJsonRequest({ email: "not-an-email", password: "" })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe("Harap masukkan alamat email yang valid.")
    expect(AuthService.verifyCredentials).not.toHaveBeenCalled()
  })

  it("returns 401 with service error message when credentials are invalid", async () => {
    vi.mocked(AuthService.verifyCredentials).mockRejectedValueOnce(
      new Error("Kata sandi yang Anda masukkan salah.")
    )

    const req = createJsonRequest({
      email: "staff@nyenyak.com",
      password: "wrong",
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe("Kata sandi yang Anda masukkan salah.")
  })

  it("returns 403 when user account is not bound to any branch", async () => {
    vi.mocked(AuthService.verifyCredentials).mockResolvedValueOnce({
      id: "usr_unbound",
      name: "Unbound User",
      email: "unbound@nyenyak.com",
      role: { name: "Guest" },
      branch: null,
    })

    const req = createJsonRequest({
      email: "unbound@nyenyak.com",
      password: "secret123",
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.error).toBe("Akun ini belum ditugaskan ke cabang mana pun.")
  })

  it("returns 200 with authenticated session and bound branch when credentials are valid", async () => {
    vi.mocked(AuthService.verifyCredentials).mockResolvedValueOnce({
      id: "usr_123",
      name: "Budi Santoso",
      email: "budi@nyenyak.com",
      role: { name: "Cashier" },
      branch: {
        id: "br_juanda",
        name: "Nyenyak Juanda",
        subdomain: "juanda",
      },
    })

    const req = createJsonRequest({
      email: "budi@nyenyak.com",
      password: "secret123",
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(AuthService.verifyCredentials).toHaveBeenCalledWith(
      "budi@nyenyak.com",
      "secret123",
      undefined
    )
    expect(json.success).toBe(true)
    expect(json.data).toMatchObject({
      id: "usr_123",
      name: "Budi Santoso",
      email: "budi@nyenyak.com",
      role: "Cashier",
      branch: {
        id: "br_juanda",
        name: "Nyenyak Juanda",
        subdomain: "juanda",
      },
    })
    expect(typeof json.data.authenticatedAt).toBe("string")
  })
})
