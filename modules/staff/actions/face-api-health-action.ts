"use server"

import {
  FaceApiClient,
  type FaceApiConnectionStatus,
} from "@/modules/staff/services/face-api-client"

export async function checkFaceApiConnectionAction(): Promise<
  | { success: true; data: FaceApiConnectionStatus }
  | { success: false; error: string }
> {
  try {
    const status = await FaceApiClient.checkConnection()
    return { success: true, data: status }
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memeriksa koneksi layanan Face Recognition."
    return { success: false, error: message }
  }
}
