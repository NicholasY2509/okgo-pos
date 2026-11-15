import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route"
import { FaceApiClient } from "@/modules/staff/services/face-api-client"

vi.mock("@/modules/staff/services/face-api-client", () => ({
  FaceApiClient: {
    extractEmbedding: vi.fn(),
  },
}))

describe("/api/portal/staff/faces/extract", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when JSON payload is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/portal/staff/faces/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ images: [] }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBeTruthy()
    expect(FaceApiClient.extractEmbedding).not.toHaveBeenCalled()
  })

  it("returns 200 with 512D embedding from JSON base64 images", async () => {
    const mockEmbedding = Array.from({ length: 512 }, (_, i) => (i === 0 ? 1 : 0))
    vi.mocked(FaceApiClient.extractEmbedding).mockResolvedValueOnce(mockEmbedding)

    const sampleBase64 = Buffer.from("fake-jpeg-bytes").toString("base64")
    const req = new NextRequest("http://localhost:3000/api/portal/staff/faces/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        images: [`data:image/jpeg;base64,${sampleBase64}`],
      }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.dimension).toBe(512)
    expect(json.data.embedding).toHaveLength(512)
    expect(FaceApiClient.extractEmbedding).toHaveBeenCalledTimes(1)
  })

  it("returns 502 when FACE_API_URL is not configured", async () => {
    vi.mocked(FaceApiClient.extractEmbedding).mockRejectedValueOnce(
      new Error("FACE_API_URL belum dikonfigurasi pada server.")
    )

    const sampleBase64 = Buffer.from("fake-jpeg-bytes").toString("base64")
    const req = new NextRequest("http://localhost:3000/api/portal/staff/faces/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ images: [sampleBase64] }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(502)
    expect(json.error).toContain("FACE_API_URL")
  })
})
