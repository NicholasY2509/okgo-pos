import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { FaceApiClient } from "./face-api-client"

describe("FaceApiClient.checkConnection", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("reports missing FACE_API_URL", async () => {
    delete process.env.FACE_API_URL
    delete process.env.FACE_API_TOKEN

    const result = await FaceApiClient.checkConnection()

    expect(result.ok).toBe(false)
    expect(result.hasUrl).toBe(false)
    expect(result.envValid).toBe(false)
    expect(result.message).toContain("FACE_API_URL")
  })

  it("reports invalid FACE_API_URL format", async () => {
    process.env.FACE_API_URL = "not-a-valid-url"
    process.env.FACE_API_TOKEN = "secret"

    const result = await FaceApiClient.checkConnection()

    expect(result.ok).toBe(false)
    expect(result.hasUrl).toBe(true)
    expect(result.envValid).toBe(false)
    expect(result.message).toContain("Format FACE_API_URL")
  })

  it("reports 401 when FACE_API_TOKEN is rejected", async () => {
    process.env.FACE_API_URL = "http://hrms-face-api:8000"
    process.env.FACE_API_TOKEN = "wrong-token"

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "ok" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false }), { status: 401 })
      )

    const result = await FaceApiClient.checkConnection()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.ok).toBe(false)
    expect(result.healthReachable).toBe(true)
    expect(result.tokenValid).toBe(false)
    expect(result.message).toContain("401")
  })

  it("returns ok=true when health is ok and token passes auth middleware", async () => {
    process.env.FACE_API_URL = "http://hrms-face-api:8000/"
    process.env.FACE_API_TOKEN = "valid-token"

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "ok" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false, message: "Validation error" }), {
          status: 400,
        })
      )

    const result = await FaceApiClient.checkConnection()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.ok).toBe(true)
    expect(result.envValid).toBe(true)
    expect(result.healthReachable).toBe(true)
    expect(result.tokenValid).toBe(true)
    expect(result.configuredUrl).toBe("http://hrms-face-api:8000")
  })
})
