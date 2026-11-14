import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/modules/auth/services/auth-service"
import {
  portalBranchStaffFacesQuerySchema,
  registerStaffFaceSchema,
} from "@/modules/staff/schemas/staff-schema"
import { StaffService } from "@/modules/staff/services/staff-service"

export async function GET(req: NextRequest) {
  const branchIdParam = req.nextUrl.searchParams.get("branchId") ?? ""

  const validated = portalBranchStaffFacesQuerySchema.safeParse({
    branchId: branchIdParam.trim(),
  })

  if (!validated.success) {
    const firstError = validated.error.issues[0]?.message
    return NextResponse.json(
      { error: firstError || "Parameter cabang tidak valid." },
      { status: 400 }
    )
  }

  try {
    const profiles = await StaffService.getBranchStaffFaceProfiles(
      validated.data.branchId
    )
    return NextResponse.json(
      {
        success: true,
        data: profiles,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memuat daftar profil wajah staf."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "Format payload JSON tidak valid." },
      { status: 400 }
    )
  }

  const validated = registerStaffFaceSchema.safeParse(body)
  if (!validated.success) {
    const firstError = validated.error.issues[0]?.message
    return NextResponse.json(
      { error: firstError || "Data registrasi wajah tidak valid." },
      { status: 400 }
    )
  }

  try {
    await AuthService.verifyCredentials(
      validated.data.email,
      validated.data.password
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Kata sandi pengguna yang Anda masukkan salah."
    return NextResponse.json({ error: message }, { status: 401 })
  }

  try {
    const updatedProfile = await StaffService.registerStaffFace(validated.data)
    return NextResponse.json(
      {
        success: true,
        data: updatedProfile,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal menyimpan data wajah staf."
    const status = message.includes("tidak ditemukan") ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

