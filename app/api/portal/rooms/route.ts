import { NextRequest, NextResponse } from "next/server"
import { portalRoomsQuerySchema } from "@/modules/room/schemas/room-schema"
import { RoomService } from "@/modules/room/services/room-service"

export async function GET(req: NextRequest) {
  const branchIdParam = req.nextUrl.searchParams.get("branchId") ?? ""

  const validatedQuery = portalRoomsQuerySchema.safeParse({
    branchId: branchIdParam.trim(),
  })

  if (!validatedQuery.success) {
    const firstError = validatedQuery.error.issues[0]?.message
    return NextResponse.json(
      { error: firstError || "Parameter cabang tidak valid." },
      { status: 400 }
    )
  }

  try {
    const rooms = await RoomService.getByBranchId(validatedQuery.data.branchId)

    return NextResponse.json(
      {
        success: true,
        data: rooms.map((room) => ({
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          isVip: room.isVip,
          isActive: room.isActive,
          branchId: room.branchId,
        })),
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memuat daftar ruangan cabang."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

