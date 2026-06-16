import { NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename to prevent overrides
    const extension = file.name.split('.').pop()
    const uniqueFilename = `${randomBytes(16).toString('hex')}.${extension}`
    
    // Save to public/uploads
    const path = join(process.cwd(), "public", "uploads", uniqueFilename)
    await writeFile(path, buffer)

    return NextResponse.json({ success: true, url: `/uploads/${uniqueFilename}` })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 })
  }
}
