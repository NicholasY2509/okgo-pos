import { NextResponse } from "next/server"
import { FaceApiClient } from "@/modules/staff/services/face-api-client"

export const dynamic = "force-dynamic"

export async function GET() {
  const status = await FaceApiClient.checkConnection()
  return NextResponse.json(
    {
      success: status.ok,
      data: status,
    },
    { status: status.ok ? 200 : 503 }
  )
}
