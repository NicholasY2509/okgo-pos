import { describe, it, expect, vi, beforeEach } from "vitest"
import { exitToPosAction, exitKioskAction } from "./kiosk-action"
import { signIn } from "@/modules/auth/auth"
import { AuthService } from "../services/auth-service"
import { cookies } from "next/headers"

vi.mock("next/headers", () => {
  const deleteMock = vi.fn()
  const setMock = vi.fn()
  const getMock = vi.fn()
  const cookieStore = {
    delete: deleteMock,
    set: setMock,
    get: getMock,
  }
  return {
    cookies: vi.fn().mockResolvedValue(cookieStore),
  }
})

vi.mock("next-auth", () => {
  class AuthError extends Error {
    type?: string
  }
  class CredentialsSignin extends AuthError {
    code?: string
  }
  return {
    AuthError,
    CredentialsSignin,
  }
})

vi.mock("@/modules/auth/auth", () => {
  class CustomAuthError extends Error {
    code: string
    constructor(message: string) {
      super(message)
      this.code = message
    }
  }
  return {
    signIn: vi.fn(),
    CustomAuthError,
  }
})

vi.mock("../services/auth-service", () => ({
  AuthService: {
    verifyCredentials: vi.fn(),
  },
}))

describe("exitToPosAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return validation error if email is invalid", async () => {
    const result = await exitToPosAction({
      email: "invalid-email",
      password: "password123",
      subdomain: "juanda",
    })

    expect(result).toEqual({ error: "Harap masukkan alamat email yang valid." })
    expect(AuthService.verifyCredentials).not.toHaveBeenCalled()
    expect(signIn).not.toHaveBeenCalled()
  })

  it("should return validation error if password is empty", async () => {
    const result = await exitToPosAction({
      email: "valid@okgo.com",
      password: "",
      subdomain: "juanda",
    })

    expect(result).toEqual({ error: "Kata sandi wajib diisi." })
    expect(AuthService.verifyCredentials).not.toHaveBeenCalled()
    expect(signIn).not.toHaveBeenCalled()
  })

  it("should return error when AuthService.verifyCredentials fails", async () => {
    vi.mocked(AuthService.verifyCredentials).mockRejectedValue(
      new Error("Kata sandi yang Anda masukkan salah.")
    )

    const result = await exitToPosAction({
      email: "valid@okgo.com",
      password: "wrong-password",
      subdomain: "juanda",
    })

    expect(result).toEqual({ error: "Kata sandi yang Anda masukkan salah." })
    expect(signIn).not.toHaveBeenCalled()
  })

  it("should return error when user has no access to the branch", async () => {
    vi.mocked(AuthService.verifyCredentials).mockRejectedValue(
      new Error("Anda tidak mempunyai akses ke cabang ini.")
    )

    const result = await exitToPosAction({
      email: "valid@okgo.com",
      password: "password123",
      subdomain: "other-branch",
    })

    expect(result).toEqual({
      error: "Anda tidak mempunyai akses ke cabang ini.",
    })
    expect(signIn).not.toHaveBeenCalled()
  })

  it("should delete staff_session and call signIn with /pos on success", async () => {
    vi.mocked(AuthService.verifyCredentials).mockResolvedValue({
      id: "user-1",
      name: "Manager",
      email: "valid@okgo.com",
      role: { name: "Manager" },
    })
    vi.mocked(signIn).mockResolvedValue(undefined as never)

    const result = await exitToPosAction({
      email: "valid@okgo.com",
      password: "password123",
      subdomain: "juanda",
    })

    const cookieStore = await cookies()
    expect(cookieStore.delete).toHaveBeenCalledWith("staff_session")
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "valid@okgo.com",
      password: "password123",
      subdomain: "juanda",
      redirectTo: "/pos",
    })
    expect(result).toEqual({ success: true })
  })

  it("should re-throw NEXT_REDIRECT from signIn", async () => {
    vi.mocked(AuthService.verifyCredentials).mockResolvedValue({
      id: "user-1",
      name: "Manager",
      email: "valid@okgo.com",
      role: { name: "Manager" },
    })

    const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/pos",
    })
    vi.mocked(signIn).mockRejectedValue(redirectError)

    await expect(
      exitToPosAction({
        email: "valid@okgo.com",
        password: "password123",
        subdomain: "juanda",
      })
    ).rejects.toThrow("NEXT_REDIRECT")
  })
})

describe("exitKioskAction", () => {
  it("should delete staff_session cookie", async () => {
    const result = await exitKioskAction()
    const cookieStore = await cookies()
    expect(cookieStore.delete).toHaveBeenCalledWith("staff_session")
    expect(result).toEqual({ success: true })
  })
})
