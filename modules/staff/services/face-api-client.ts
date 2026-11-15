import { z } from "zod"

const faceApiExtractResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  face_detected: z.boolean().optional(),
  embedding: z.array(z.number().finite()).nullable().optional(),
})

export interface FaceImagePayload {
  bytes: Uint8Array
  filename: string
  contentType: string
}

export interface FaceApiConnectionStatus {
  ok: boolean
  envValid: boolean
  hasUrl: boolean
  hasToken: boolean
  configuredUrl: string | null
  healthReachable: boolean
  tokenValid: boolean
  latencyMs: number | null
  message: string
  checkedAt: string
}

const REQUEST_TIMEOUT_MS = 15000
const HEALTH_TIMEOUT_MS = 5000

/**
 * Server-side HTTP client for the Dockerized `face-hrms-api` InsightFace service.
 */
export class FaceApiClient {
  private static getConfig() {
    const baseUrl = process.env.FACE_API_URL?.trim().replace(/\/+$/, "")
    const apiToken = process.env.FACE_API_TOKEN?.trim()

    if (!baseUrl) {
      throw new Error("FACE_API_URL belum dikonfigurasi pada server.")
    }

    return { baseUrl, apiToken }
  }

  /**
   * Sends 1..10 cropped face images to `POST /face/extract` and returns the
   * L2-normalized 512D InsightFace embedding vector.
   */
  static async extractEmbedding(images: FaceImagePayload[]): Promise<number[]> {
    if (images.length === 0) {
      throw new Error("Minimal satu gambar wajah diperlukan.")
    }

    const { baseUrl, apiToken } = FaceApiClient.getConfig()
    const formData = new FormData()

    images.forEach((img, index) => {
      const copy = new Uint8Array(img.bytes.byteLength)
      copy.set(img.bytes)
      const blob = new Blob([copy.buffer], { type: img.contentType })
      formData.append("images", blob, img.filename || `face-${index + 1}.jpg`)
    })

    const headers: Record<string, string> = {}
    if (apiToken) {
      headers.Authorization = `Bearer ${apiToken}`
    }

    let response: Response
    try {
      response = await fetch(`${baseUrl}/face/extract`, {
        method: "POST",
        headers,
        body: formData,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Koneksi ke layanan face recognition gagal."
      throw new Error(`Gagal menghubungi layanan face recognition: ${message}`)
    }

    let rawJson: unknown
    try {
      rawJson = await response.json()
    } catch {
      throw new Error(`Respons layanan face recognition tidak valid (HTTP ${response.status}).`)
    }

    if (!response.ok) {
      const detail =
        typeof rawJson === "object" && rawJson !== null && "message" in rawJson
          ? String((rawJson as { message: unknown }).message)
          : `HTTP ${response.status}`
      throw new Error(`Ekstraksi wajah gagal: ${detail}`)
    }

    const parsed = faceApiExtractResponseSchema.safeParse(rawJson)
    if (!parsed.success) {
      throw new Error("Format respons layanan face recognition tidak sesuai.")
    }

    if (!parsed.data.success || !parsed.data.embedding || parsed.data.embedding.length === 0) {
      throw new Error(parsed.data.message || "Wajah tidak terdeteksi pada gambar.")
    }

    return parsed.data.embedding
  }

  /**
   * Validates `.env` configuration (`FACE_API_URL`, `FACE_API_TOKEN`), checks
   * `/health` reachability, and verifies the Bearer token against `/face/extract`.
   */
  static async checkConnection(): Promise<FaceApiConnectionStatus> {
    const rawUrl = process.env.FACE_API_URL?.trim().replace(/\/+$/, "") ?? ""
    const rawToken = process.env.FACE_API_TOKEN?.trim() ?? ""
    const hasUrl = rawUrl.length > 0
    const hasToken = rawToken.length > 0
    const checkedAt = new Date().toISOString()

    let parsedUrl: URL | null = null
    if (hasUrl) {
      try {
        const candidate = new URL(rawUrl)
        if (candidate.protocol === "http:" || candidate.protocol === "https:") {
          parsedUrl = candidate
        }
      } catch {
        parsedUrl = null
      }
    }

    const envValid = parsedUrl !== null && hasToken
    if (!hasUrl) {
      return {
        ok: false,
        envValid: false,
        hasUrl: false,
        hasToken,
        configuredUrl: null,
        healthReachable: false,
        tokenValid: false,
        latencyMs: null,
        message: "FACE_API_URL belum diisi di .env.",
        checkedAt,
      }
    }

    if (!parsedUrl) {
      return {
        ok: false,
        envValid: false,
        hasUrl: true,
        hasToken,
        configuredUrl: rawUrl,
        healthReachable: false,
        tokenValid: false,
        latencyMs: null,
        message: "Format FACE_API_URL tidak valid (harus diawali http:// atau https://).",
        checkedAt,
      }
    }

    const start = Date.now()
    let healthReachable = false
    try {
      const healthRes = await fetch(`${rawUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      })
      if (healthRes.ok) {
        const json = (await healthRes.json().catch(() => null)) as { status?: string } | null
        healthReachable = json?.status === "ok"
      }
    } catch {
      healthReachable = false
    }

    const latencyMs = Date.now() - start

    if (!healthReachable) {
      return {
        ok: false,
        envValid,
        hasUrl: true,
        hasToken,
        configuredUrl: rawUrl,
        healthReachable: false,
        tokenValid: false,
        latencyMs,
        message: `Tidak dapat menjangkau ${rawUrl}/health.`,
        checkedAt,
      }
    }

    if (!hasToken) {
      return {
        ok: false,
        envValid: false,
        hasUrl: true,
        hasToken: false,
        configuredUrl: rawUrl,
        healthReachable: true,
        tokenValid: false,
        latencyMs,
        message: "Server /health terhubung, tetapi FACE_API_TOKEN belum diisi di .env.",
        checkedAt,
      }
    }

    let tokenValid = false
    try {
      const authRes = await fetch(`${rawUrl}/face/extract`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${rawToken}`,
        },
        body: new FormData(),
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      })
      // Middleware returns 401 when token is wrong; 400/422 means token passed auth and hit input validation.
      tokenValid = authRes.status !== 401 && authRes.status !== 403
    } catch {
      tokenValid = false
    }

    const ok = envValid && healthReachable && tokenValid
    const message = ok
      ? `Koneksi ke ${rawUrl} berhasil dan FACE_API_TOKEN valid (${latencyMs} ms).`
      : "Server /health terhubung, tetapi FACE_API_TOKEN ditolak (401 Unauthorized)."

    return {
      ok,
      envValid,
      hasUrl: true,
      hasToken: true,
      configuredUrl: rawUrl,
      healthReachable: true,
      tokenValid,
      latencyMs,
      message,
      checkedAt,
    }
  }
}
