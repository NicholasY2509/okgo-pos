import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  FaceApiClient,
  type FaceImagePayload,
} from "@/modules/staff/services/face-api-client"

const jsonExtractSchema = z.object({
  images: z
    .array(z.string().min(1, "Gambar base64 tidak boleh kosong."))
    .min(1, "Minimal satu gambar wajah wajib dikirim.")
    .max(10, "Maksimal 10 gambar wajah."),
})

function decodeBase64Image(raw: string, index: number): FaceImagePayload {
  const dataUrlMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(raw.trim())
  const contentType = dataUrlMatch?.[1] ?? "image/jpeg"
  const base64Payload = dataUrlMatch?.[2] ?? raw.trim()
  const buffer = Buffer.from(base64Payload, "base64")

  if (buffer.byteLength === 0) {
    throw new Error(`Gambar ke-${index + 1} kosong atau format base64 tidak valid.`)
  }

  return {
    bytes: new Uint8Array(buffer),
    filename: `face-${index + 1}.jpg`,
    contentType,
  }
}

async function parseRequestImages(req: NextRequest): Promise<FaceImagePayload[]> {
  const contentType = req.headers.get("content-type") ?? ""

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData()
    const entries = formData.getAll("images")
    const files = entries.filter((entry): entry is File => entry instanceof File)

    if (files.length === 0) {
      throw new Error("Minimal satu file gambar wajah wajib dikirim pada field 'images'.")
    }
    if (files.length > 10) {
      throw new Error("Maksimal 10 gambar wajah.")
    }

    return Promise.all(
      files.map(async (file, index) => ({
        bytes: new Uint8Array(await file.arrayBuffer()),
        filename: file.name || `face-${index + 1}.jpg`,
        contentType: file.type || "image/jpeg",
      }))
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw new Error("Format payload JSON tidak valid.")
  }

  const validated = jsonExtractSchema.safeParse(body)
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message || "Data gambar wajah tidak valid.")
  }

  return validated.data.images.map((raw, index) => decodeBase64Image(raw, index))
}

export async function POST(req: NextRequest) {
  let images: FaceImagePayload[]
  try {
    images = await parseRequestImages(req)
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Payload gambar wajah tidak valid."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    const embedding = await FaceApiClient.extractEmbedding(images)
    return NextResponse.json(
      {
        success: true,
        data: {
          embedding,
          dimension: embedding.length,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal mengekstrak fitur wajah."
    const isConfigOrUpstreamError =
      message.includes("FACE_API_URL") || message.includes("Gagal menghubungi")
    return NextResponse.json(
      { error: message },
      { status: isConfigOrUpstreamError ? 502 : 422 }
    )
  }
}
