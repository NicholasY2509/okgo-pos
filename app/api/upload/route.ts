import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { auth } from "@/modules/auth/auth"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB limit
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const S3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    })

    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }

    // 2. File Validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "File exceeds maximum size of 5MB" }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Invalid file type. Only images and PDFs are allowed." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const extension = file.name.split('.').pop()
    const uniqueFilename = `${randomBytes(16).toString('hex')}.${extension}`

    await S3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueFilename,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const publicUrl = `https://${process.env.R2_PUBLIC_URL}/${uniqueFilename}`

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 })
  }
}
