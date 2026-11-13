import { NextRequest, NextResponse } from "next/server"
import { portalRoomSessionsQuerySchema } from "@/modules/room/schemas/room-schema"
import { TimetableService } from "@/modules/pos/services/timetable-service"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const resolvedParams = await context.params
  const branchIdParam = req.nextUrl.searchParams.get("branchId") ?? ""
  const dateParam = req.nextUrl.searchParams.get("date") ?? undefined

  const validated = portalRoomSessionsQuerySchema.safeParse({
    branchId: branchIdParam.trim(),
    roomId: (resolvedParams.roomId ?? "").trim(),
    date: dateParam ? dateParam.trim() : undefined,
  })

  if (!validated.success) {
    const firstError = validated.error.issues[0]?.message
    return NextResponse.json(
      { error: firstError || "Parameter ruangan atau cabang tidak valid." },
      { status: 400 }
    )
  }

  try {
    const sessions = await TimetableService.getRoomSessions(
      validated.data.branchId,
      validated.data.roomId,
      validated.data.date
    )

    return NextResponse.json(
      {
        success: true,
        data: sessions.map((session) => ({
          id: session.id,
          roomId: session.roomId,
          branchId: session.branchId,
          serviceId: session.serviceId,
          itemName: session.itemName,
          customerName: session.customerName,
          staffId: session.staffId ?? null,
          staffName: session.staffName ?? null,
          status: session.status,
          isVip: Boolean(session.isVip),
          isBooking: Boolean(session.isBooking),
          bookingNumber: session.bookingNumber ?? null,
          startTime: session.startTime
            ? new Date(session.startTime).toISOString()
            : null,
          endTime: session.endTime
            ? new Date(session.endTime).toISOString()
            : null,
          actualStartTime: session.actualStartTime
            ? new Date(session.actualStartTime).toISOString()
            : null,
          actualEndTime: session.actualEndTime
            ? new Date(session.actualEndTime).toISOString()
            : null,
        })),
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memuat daftar sesi ruangan."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

